import type { SQLiteDatabase } from 'expo-sqlite';
import {
  ArrivalRecord,
  ArrivalLot,
  SaleRecord,
  LedgerTransaction,
  ProductGrade,
  WastageRecord,
  CustomerPricingRule,
  FarmerPatti,
  Customer,
  Product,
  Category,
  UserProfile,
  MandiWorkspace,
  StaffMember,
  MandiSlip,
  TallyRecord,
  StockLedgerEntry,
  DispatchInvoice,
  PaymentReminderMeta,
} from '../types';

let SQLite: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SQLite = require('expo-sqlite');
} catch {
  // SQLite native driver not available in test/Node environments, in-memory fallback will be used
}

let dbInstance: SQLiteDatabase | null = null;
let isStorageReady = false;

// Resilient in-memory fallback stores
let memoryUsers: UserProfile[] = [];
let memoryWorkspaces: MandiWorkspace[] = [];
let memoryCustomers: Customer[] = [];
let memoryCategories: Category[] = [];
let memoryProducts: Product[] = [];
let memoryArrivals: ArrivalRecord[] = [];
let memoryArrivalLots: ArrivalLot[] = [];
let memorySales: SaleRecord[] = [];
let memoryDispatchInvoices: DispatchInvoice[] = [];
let memoryStockLedger: StockLedgerEntry[] = [];
let memoryLedger: LedgerTransaction[] = [];
let memoryGrades: ProductGrade[] = [];
let memoryWastage: WastageRecord[] = [];
let memoryPricingRules: CustomerPricingRule[] = [];
let memoryPattis: FarmerPatti[] = [];
let memorySlips: MandiSlip[] = [];
let memoryTallyRecords: TallyRecord[] = [];
let memoryStaff: StaffMember[] = [];
let memoryReminderMeta: PaymentReminderMeta[] = [];
let memoryMeta: Record<string, string> = {};

export function getDb(): SQLiteDatabase | null {
  if (dbInstance) {
    return dbInstance;
  }
  try {
    if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
      dbInstance = SQLite.openDatabaseSync('mandi_offline_v2.db');
      return dbInstance;
    }
  } catch (err) {
    console.warn('[OfflineStorage] SQLite native driver not available, using in-memory storage fallback:', err);
  }
  return null;
}

function safeAddColumn(db: SQLiteDatabase, table: string, column: string, columnDef: string) {
  try {
    const tableInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
    const exists = tableInfo.some((col) => col.name === column);
    if (!exists) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef};`);
    }
  } catch {
    // Column might already exist or table doesn't support pragma in mock
  }
}

export function runInTransaction<T>(callback: (db: SQLiteDatabase) => T): T {
  const db = getDb();
  if (db) {
    if (typeof db.withTransactionSync === 'function') {
      let result!: T;
      db.withTransactionSync(() => {
        result = callback(db);
      });
      return result;
    }
    try {
      db.execSync('BEGIN TRANSACTION;');
      const result = callback(db);
      db.execSync('COMMIT;');
      return result;
    } catch (e) {
      db.execSync('ROLLBACK;');
      throw e;
    }
  }
  // Memory fallback
  return callback({} as SQLiteDatabase);
}

export async function initOfflineStorage(): Promise<boolean> {
  if (isStorageReady) return true;

  const db = getDb();
  if (db) {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT,
          location TEXT,
          ownerId TEXT,
          joinCode TEXT,
          createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          mobile TEXT UNIQUE,
          business TEXT,
          location TEXT,
          role TEXT,
          workspaceId TEXT,
          password TEXT
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT,
          mobile TEXT,
          business TEXT,
          customerType TEXT,
          openingBalance REAL,
          totalPayable REAL,
          totalReceivable REAL,
          currentBalance REAL,
          balance TEXT,
          pendingAmount REAL,
          notes TEXT,
          address TEXT,
          createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          unit TEXT,
          quantity TEXT,
          price TEXT,
          costPrice TEXT,
          ungradedStock REAL,
          wastageQuantity REAL,
          wastageReason TEXT,
          image TEXT
        );

        CREATE TABLE IF NOT EXISTS product_grades (
          id TEXT PRIMARY KEY,
          productId TEXT,
          name TEXT,
          description TEXT,
          defaultPrice REAL,
          stockQuantity REAL,
          isActive INTEGER
        );

        CREATE TABLE IF NOT EXISTS arrivals (
          id TEXT PRIMARY KEY,
          productId TEXT,
          productName TEXT,
          category TEXT,
          quantity REAL,
          unit TEXT,
          farmerName TEXT,
          farmerMobile TEXT,
          vehicleNumber TEXT,
          lotNumber TEXT,
          notes TEXT,
          timestamp TEXT,
          syncStatus TEXT,
          recordedOffline INTEGER,
          syncedAt TEXT,
          syncError TEXT,
          farmerId TEXT,
          isGraded INTEGER
        );

        CREATE TABLE IF NOT EXISTS arrival_lots (
          id TEXT PRIMARY KEY,
          arrivalId TEXT,
          lotNumber TEXT,
          productId TEXT,
          productName TEXT,
          supplierId TEXT,
          supplierName TEXT,
          initialQuantity REAL,
          ungradedQuantity REAL,
          unit TEXT,
          timestamp TEXT,
          isFullyGraded INTEGER,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          customerMobile TEXT,
          productId TEXT,
          productName TEXT,
          category TEXT,
          quantity REAL,
          unit TEXT,
          unitPrice REAL,
          totalAmount REAL,
          paymentMethod TEXT,
          notes TEXT,
          timestamp TEXT,
          syncStatus TEXT,
          recordedOffline INTEGER,
          syncedAt TEXT,
          syncError TEXT,
          gradeId TEXT,
          gradeName TEXT,
          appliedPriceType TEXT,
          commissionRate REAL,
          commissionAmount REAL,
          otherCharges REAL,
          netTotal REAL
        );

        CREATE TABLE IF NOT EXISTS dispatch_invoices (
          id TEXT PRIMARY KEY,
          invoiceNumber TEXT,
          customerId TEXT,
          customerName TEXT,
          customerMobile TEXT,
          itemsJson TEXT,
          subtotal REAL,
          commissionRate REAL,
          commissionAmount REAL,
          otherCharges REAL,
          totalAmount REAL,
          cashPaid REAL,
          upiPaid REAL,
          totalPaid REAL,
          outstandingDebt REAL,
          paymentMethod TEXT,
          notes TEXT,
          timestamp TEXT,
          syncStatus TEXT,
          isReversed INTEGER,
          reversedAt TEXT,
          reversalReason TEXT,
          createdBy TEXT
        );

        CREATE TABLE IF NOT EXISTS dispatch_items (
          id TEXT PRIMARY KEY,
          invoiceId TEXT,
          productId TEXT,
          productName TEXT,
          category TEXT,
          gradeId TEXT,
          gradeName TEXT,
          quantity REAL,
          unit TEXT,
          unitPrice REAL,
          totalAmount REAL,
          appliedPriceType TEXT
        );

        CREATE TABLE IF NOT EXISTS stock_ledger (
          id TEXT PRIMARY KEY,
          productId TEXT,
          productName TEXT,
          gradeId TEXT,
          gradeName TEXT,
          action TEXT,
          quantityDelta REAL,
          unit TEXT,
          sourceReferenceType TEXT,
          sourceReferenceId TEXT,
          stockAfter REAL,
          timestamp TEXT,
          notes TEXT,
          createdBy TEXT
        );

        CREATE TABLE IF NOT EXISTS ledger_transactions (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          customerType TEXT,
          date TEXT,
          type TEXT,
          category TEXT,
          amount REAL,
          paymentMethod TEXT,
          referenceNo TEXT,
          notes TEXT,
          balanceAfter REAL,
          saleId TEXT,
          arrivalId TEXT,
          pattiId TEXT,
          createdAt TEXT,
          createdBy TEXT
        );

        CREATE TABLE IF NOT EXISTS wastage_records (
          id TEXT PRIMARY KEY,
          productId TEXT,
          productName TEXT,
          originalQuantity REAL,
          gradeQuantitiesJson TEXT,
          wastageQuantity REAL,
          wastageReason TEXT,
          wastagePercentage REAL,
          remainingUngradedQuantity REAL,
          timestamp TEXT,
          recordedBy TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS customer_pricing_rules (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          productId TEXT,
          productName TEXT,
          gradeId TEXT,
          gradeName TEXT,
          price REAL,
          effectiveDate TEXT,
          expiryDate TEXT,
          isActive INTEGER,
          notes TEXT,
          updatedAt TEXT,
          createdBy TEXT
        );

        CREATE TABLE IF NOT EXISTS patti_records (
          id TEXT PRIMARY KEY,
          pattiNumber TEXT,
          arrivalId TEXT,
          farmerId TEXT,
          farmerName TEXT,
          farmerMobile TEXT,
          productName TEXT,
          gradeName TEXT,
          quantity REAL,
          unit TEXT,
          rate REAL,
          grossAmount REAL,
          commissionRate REAL,
          commissionAmount REAL,
          laborCharges REAL,
          otherCharges REAL,
          netPayable REAL,
          paymentStatus TEXT,
          date TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS mandi_slips (
          id TEXT PRIMARY KEY,
          slipNumber TEXT,
          date TEXT,
          type TEXT,
          customerId TEXT,
          partyName TEXT,
          partyMobile TEXT,
          productId TEXT,
          productName TEXT,
          category TEXT,
          gradeName TEXT,
          quantity REAL,
          unit TEXT,
          ratePerUnit REAL,
          totalAmount REAL,
          upfrontPayment REAL,
          paymentMethod TEXT,
          paidAmount REAL,
          balanceAmount REAL,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS tally_records (
          id TEXT PRIMARY KEY,
          time TEXT,
          productName TEXT,
          productId TEXT,
          unit TEXT,
          count REAL,
          mode TEXT,
          vehicleNo TEXT,
          partyName TEXT
        );

        CREATE TABLE IF NOT EXISTS staff_members (
          id TEXT PRIMARY KEY,
          name TEXT,
          role TEXT,
          mobile TEXT,
          assignedDesk TEXT,
          status TEXT
        );

        CREATE TABLE IF NOT EXISTS payment_reminder_meta (
          customerId TEXT PRIMARY KEY,
          customDueDate TEXT,
          snoozedUntil TEXT,
          lastRemindedAt TEXT,
          reminderCount INTEGER,
          notes TEXT,
          updatedAt TEXT
        );

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_arrivals_product ON arrivals(productId);
        CREATE INDEX IF NOT EXISTS idx_arrival_lots_product ON arrival_lots(productId);
        CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customerId);
        CREATE INDEX IF NOT EXISTS idx_dispatch_customer ON dispatch_invoices(customerId);
        CREATE INDEX IF NOT EXISTS idx_dispatch_items_inv ON dispatch_items(invoiceId);
        CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger_transactions(customerId);
        CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_ledger(productId);
        CREATE INDEX IF NOT EXISTS idx_pricing_cust_prod ON customer_pricing_rules(customerId, productId);
      `);

      // Safe schema migrations for any existing columns
      safeAddColumn(db, 'categories', 'image', 'TEXT');
      safeAddColumn(db, 'arrivals', 'farmerId', 'TEXT');
      safeAddColumn(db, 'arrivals', 'isGraded', 'INTEGER');
      safeAddColumn(db, 'products', 'ungradedStock', 'REAL');
      safeAddColumn(db, 'products', 'costPrice', 'TEXT');
      safeAddColumn(db, 'products', 'wastageQuantity', 'REAL');
      safeAddColumn(db, 'products', 'wastageReason', 'TEXT');
      safeAddColumn(db, 'users', 'workspaceId', 'TEXT');
      safeAddColumn(db, 'users', 'password', 'TEXT');
      safeAddColumn(db, 'customers', 'openingBalance', 'REAL');
      safeAddColumn(db, 'customers', 'currentBalance', 'REAL');

      isStorageReady = true;
      return true;
    } catch (err) {
      console.warn('[OfflineStorage] Error running schema creation:', err);
    }
  }

  isStorageReady = true;
  return true;
}

// ================= WORKSPACES & USERS =================
export async function saveWorkspaceToStorage(workspace: MandiWorkspace): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO workspaces (id, name, location, ownerId, joinCode, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [workspace.id, workspace.name, workspace.location, workspace.ownerId, workspace.joinCode, workspace.createdAt]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving workspace:', err);
    }
  }
  const idx = memoryWorkspaces.findIndex((w) => w.id === workspace.id);
  if (idx >= 0) memoryWorkspaces[idx] = workspace;
  else memoryWorkspaces.push(workspace);
}

export async function loadWorkspacesFromStorage(): Promise<MandiWorkspace[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM workspaces');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          ownerId: r.ownerId,
          joinCode: r.joinCode,
          createdAt: r.createdAt,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading workspaces:', err);
    }
  }
  return memoryWorkspaces;
}

export async function saveUserToStorage(user: UserProfile): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO users (id, name, mobile, business, location, role, workspaceId, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.mobile, user.business, user.location, user.role, user.workspaceId || '', user.password || '']
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving user:', err);
    }
  }
  const idx = memoryUsers.findIndex((u) => u.mobile === user.mobile || u.id === user.id);
  if (idx >= 0) memoryUsers[idx] = user;
  else memoryUsers.push(user);
}

export async function loadUsersFromStorage(): Promise<UserProfile[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM users');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          mobile: r.mobile,
          business: r.business,
          location: r.location,
          role: r.role as any,
          workspaceId: r.workspaceId || undefined,
          password: r.password || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading users:', err);
    }
  }
  return memoryUsers;
}

export async function getUserByMobile(mobile: string): Promise<UserProfile | null> {
  const cleaned = mobile.replace(/\D/g, '');
  const db = getDb();
  if (db) {
    try {
      const row = db.getFirstSync<any>('SELECT * FROM users WHERE mobile = ?', [cleaned]);
      if (row) {
        return {
          id: row.id,
          name: row.name,
          mobile: row.mobile,
          business: row.business,
          location: row.location,
          role: row.role as any,
          workspaceId: row.workspaceId || undefined,
          password: row.password || undefined,
        };
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error fetching user by mobile:', err);
    }
  }
  return memoryUsers.find((u) => u.mobile === cleaned) || null;
}

// ================= CUSTOMERS =================
export async function saveCustomerToStorage(customer: Customer): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO customers (
          id, name, mobile, business, customerType, openingBalance,
          totalPayable, totalReceivable, currentBalance, balance,
          pendingAmount, notes, address, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.mobile,
          customer.business,
          customer.customerType || 'Buyer',
          customer.openingBalance || 0,
          customer.totalPayable || 0,
          customer.totalReceivable || 0,
          customer.currentBalance || 0,
          customer.balance || '',
          customer.pendingAmount || 0,
          customer.notes || '',
          customer.address || '',
          customer.createdAt || new Date().toISOString(),
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving customer:', err);
    }
  }
  const idx = memoryCustomers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) memoryCustomers[idx] = customer;
  else memoryCustomers.unshift(customer);
}

export async function loadCustomersFromStorage(): Promise<Customer[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM customers ORDER BY name ASC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          mobile: r.mobile,
          business: r.business,
          customerType: r.customerType || 'Buyer',
          openingBalance: Number(r.openingBalance || 0),
          totalPayable: Number(r.totalPayable || 0),
          totalReceivable: Number(r.totalReceivable || 0),
          currentBalance: Number(r.currentBalance || 0),
          balance: r.balance || '',
          pendingAmount: Number(r.pendingAmount || 0),
          notes: r.notes || undefined,
          address: r.address || undefined,
          createdAt: r.createdAt || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading customers:', err);
    }
  }
  return memoryCustomers;
}

export async function deleteCustomerFromStorage(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM customers WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting customer:', err);
    }
  }
  memoryCustomers = memoryCustomers.filter((c) => c.id !== id);
}

// ================= CATEGORIES =================
export async function saveCategoryToStorage(cat: Category): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        'INSERT OR REPLACE INTO categories (id, name, image) VALUES (?, ?, ?)',
        [cat.id, cat.name, cat.image || '']
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving category:', err);
    }
  }
  const idx = memoryCategories.findIndex((c) => c.id === cat.id);
  if (idx >= 0) memoryCategories[idx] = cat;
  else memoryCategories.push(cat);
}

export async function loadCategoriesFromStorage(): Promise<Category[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM categories ORDER BY name ASC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          image: r.image || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading categories:', err);
    }
  }
  return memoryCategories;
}

export async function deleteCategoryFromStorage(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM categories WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting category:', err);
    }
  }
  memoryCategories = memoryCategories.filter((c) => c.id !== id);
}

// ================= PRODUCTS & GRADES =================
export async function saveProductToStorage(product: Product): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO products (
          id, name, category, unit, quantity, price, costPrice,
          ungradedStock, wastageQuantity, wastageReason, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.category,
          product.unit,
          product.quantity || '0',
          product.price || '',
          product.costPrice || '',
          product.ungradedStock || 0,
          product.wastageQuantity || 0,
          product.wastageReason || '',
          product.image || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving product:', err);
    }
  }
  const idx = memoryProducts.findIndex((p) => p.id === product.id);
  if (idx >= 0) memoryProducts[idx] = product;
  else memoryProducts.unshift(product);
}

export async function loadProductsFromStorage(): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM products ORDER BY name ASC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          unit: r.unit,
          quantity: r.quantity || '0',
          price: r.price || '',
          costPrice: r.costPrice || '',
          ungradedStock: Number(r.ungradedStock || 0),
          wastageQuantity: Number(r.wastageQuantity || 0),
          wastageReason: r.wastageReason || undefined,
          image: r.image || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading products:', err);
    }
  }
  return memoryProducts;
}

export async function deleteProductFromStorage(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM products WHERE id = ?', [id]);
      db.runSync('DELETE FROM product_grades WHERE productId = ?', [id]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting product:', err);
    }
  }
  memoryProducts = memoryProducts.filter((p) => p.id !== id);
  memoryGrades = memoryGrades.filter((g) => g.productId !== id);
}

export async function saveProductGradesToStorage(grades: ProductGrade[]): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      for (const g of grades) {
        db.runSync(
          `INSERT OR REPLACE INTO product_grades (
            id, productId, name, description, defaultPrice, stockQuantity, isActive
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [g.id, g.productId || '', g.name, g.description || '', g.defaultPrice, g.stockQuantity, g.isActive ? 1 : 0]
        );
      }
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving product grades:', err);
    }
  }

  grades.forEach((g) => {
    const idx = memoryGrades.findIndex((m) => m.id === g.id);
    if (idx >= 0) memoryGrades[idx] = g;
    else memoryGrades.push(g);
  });
}

export async function loadProductGradesFromStorage(): Promise<ProductGrade[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM product_grades');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          productId: r.productId,
          name: r.name,
          description: r.description || undefined,
          defaultPrice: Number(r.defaultPrice),
          stockQuantity: Number(r.stockQuantity),
          isActive: Boolean(r.isActive),
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading product grades:', err);
    }
  }
  return memoryGrades;
}

export async function deleteProductGradeFromStorage(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM product_grades WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting grade:', err);
    }
  }
  memoryGrades = memoryGrades.filter((g) => g.id !== id);
}

// ================= ARRIVALS & ARRIVAL LOTS =================
export async function saveArrivalToStorage(arrival: ArrivalRecord): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO arrivals (
          id, productId, productName, category, quantity, unit,
          farmerName, farmerMobile, vehicleNumber, lotNumber, notes,
          timestamp, syncStatus, recordedOffline, syncedAt, syncError,
          farmerId, isGraded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          arrival.id,
          arrival.productId,
          arrival.productName,
          arrival.category,
          arrival.quantity,
          arrival.unit,
          arrival.farmerName,
          arrival.farmerMobile || '',
          arrival.vehicleNumber || '',
          arrival.lotNumber || '',
          arrival.notes || '',
          arrival.timestamp,
          arrival.syncStatus,
          arrival.recordedOffline ? 1 : 0,
          arrival.syncedAt || '',
          arrival.syncError || '',
          arrival.farmerId || '',
          arrival.isGraded ? 1 : 0,
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving arrival:', err);
    }
  }

  const idx = memoryArrivals.findIndex((a) => a.id === arrival.id);
  if (idx >= 0) memoryArrivals[idx] = arrival;
  else memoryArrivals.unshift(arrival);
}

export async function loadArrivalsFromStorage(): Promise<ArrivalRecord[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM arrivals ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          productId: r.productId,
          productName: r.productName,
          category: r.category,
          quantity: Number(r.quantity),
          unit: r.unit,
          farmerName: r.farmerName,
          farmerMobile: r.farmerMobile || undefined,
          vehicleNumber: r.vehicleNumber || undefined,
          lotNumber: r.lotNumber || undefined,
          notes: r.notes || undefined,
          timestamp: r.timestamp,
          syncStatus: r.syncStatus as any,
          recordedOffline: Boolean(r.recordedOffline),
          syncedAt: r.syncedAt || undefined,
          syncError: r.syncError || undefined,
          farmerId: r.farmerId || undefined,
          isGraded: Boolean(r.isGraded),
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading arrivals:', err);
    }
  }
  return memoryArrivals;
}

export async function markArrivalsAsSyncedInStorage(ids: string[], syncedAt: string): Promise<void> {
  const db = getDb();
  if (db && ids.length > 0) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      db.runSync(
        `UPDATE arrivals SET syncStatus = 'synced', syncedAt = ?, syncError = '' WHERE id IN (${placeholders})`,
        [syncedAt, ...ids]
      );
    } catch (err) {
      console.warn('[OfflineStorage] Error updating arrival sync:', err);
    }
  }
  memoryArrivals = memoryArrivals.map((arr) =>
    ids.includes(arr.id) ? { ...arr, syncStatus: 'synced', syncedAt, syncError: undefined } : arr
  );
}

export async function saveArrivalLotToStorage(lot: ArrivalLot): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO arrival_lots (
          id, arrivalId, lotNumber, productId, productName, supplierId,
          supplierName, initialQuantity, ungradedQuantity, unit,
          timestamp, isFullyGraded, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lot.id,
          lot.arrivalId,
          lot.lotNumber,
          lot.productId,
          lot.productName,
          lot.supplierId || '',
          lot.supplierName,
          lot.initialQuantity,
          lot.ungradedQuantity,
          lot.unit,
          lot.timestamp,
          lot.isFullyGraded ? 1 : 0,
          lot.notes || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving arrival lot:', err);
    }
  }

  const idx = memoryArrivalLots.findIndex((l) => l.id === lot.id);
  if (idx >= 0) memoryArrivalLots[idx] = lot;
  else memoryArrivalLots.unshift(lot);
}

export async function loadArrivalLotsFromStorage(): Promise<ArrivalLot[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM arrival_lots ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          arrivalId: r.arrivalId,
          lotNumber: r.lotNumber,
          productId: r.productId,
          productName: r.productName,
          supplierId: r.supplierId || undefined,
          supplierName: r.supplierName,
          initialQuantity: Number(r.initialQuantity),
          ungradedQuantity: Number(r.ungradedQuantity),
          unit: r.unit,
          timestamp: r.timestamp,
          isFullyGraded: Boolean(r.isFullyGraded),
          notes: r.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading arrival lots:', err);
    }
  }
  return memoryArrivalLots;
}

// ================= WASTAGE & SORTING =================
export async function saveWastageRecordToStorage(record: WastageRecord): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO wastage_records (
          id, productId, productName, originalQuantity, gradeQuantitiesJson,
          wastageQuantity, wastageReason, wastagePercentage, remainingUngradedQuantity,
          timestamp, recordedBy, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.productId,
          record.productName,
          record.originalQuantity,
          JSON.stringify(record.gradeQuantities || {}),
          record.wastageQuantity,
          record.wastageReason,
          record.wastagePercentage,
          record.remainingUngradedQuantity,
          record.timestamp,
          record.recordedBy || '',
          record.notes || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving wastage record:', err);
    }
  }

  const idx = memoryWastage.findIndex((w) => w.id === record.id);
  if (idx >= 0) memoryWastage[idx] = record;
  else memoryWastage.unshift(record);
}

export async function loadWastageRecordsFromStorage(): Promise<WastageRecord[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM wastage_records ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          productId: r.productId,
          productName: r.productName,
          originalQuantity: Number(r.originalQuantity),
          gradeQuantities: r.gradeQuantitiesJson ? JSON.parse(r.gradeQuantitiesJson) : {},
          wastageQuantity: Number(r.wastageQuantity),
          wastageReason: r.wastageReason,
          wastagePercentage: Number(r.wastagePercentage),
          remainingUngradedQuantity: Number(r.remainingUngradedQuantity || 0),
          timestamp: r.timestamp,
          recordedBy: r.recordedBy || undefined,
          notes: r.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading wastage records:', err);
    }
  }
  return memoryWastage;
}

// ================= STOCK LEDGER =================
export async function saveStockLedgerEntryToStorage(entry: StockLedgerEntry): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO stock_ledger (
          id, productId, productName, gradeId, gradeName, action,
          quantityDelta, unit, sourceReferenceType, sourceReferenceId,
          stockAfter, timestamp, notes, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.productId,
          entry.productName,
          entry.gradeId || '',
          entry.gradeName || '',
          entry.action,
          entry.quantityDelta,
          entry.unit,
          entry.sourceReferenceType,
          entry.sourceReferenceId,
          entry.stockAfter,
          entry.timestamp,
          entry.notes || '',
          entry.createdBy || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving stock ledger entry:', err);
    }
  }

  const idx = memoryStockLedger.findIndex((e) => e.id === entry.id);
  if (idx >= 0) memoryStockLedger[idx] = entry;
  else memoryStockLedger.unshift(entry);
}

export async function loadStockLedgerFromStorage(): Promise<StockLedgerEntry[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM stock_ledger ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          productId: r.productId,
          productName: r.productName,
          gradeId: r.gradeId || undefined,
          gradeName: r.gradeName || undefined,
          action: r.action as any,
          quantityDelta: Number(r.quantityDelta),
          unit: r.unit,
          sourceReferenceType: r.sourceReferenceType as any,
          sourceReferenceId: r.sourceReferenceId,
          stockAfter: Number(r.stockAfter),
          timestamp: r.timestamp,
          notes: r.notes || undefined,
          createdBy: r.createdBy || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading stock ledger:', err);
    }
  }
  return memoryStockLedger;
}

// ================= DISPATCH INVOICES & SALES =================
export async function saveDispatchInvoiceToStorage(invoice: DispatchInvoice): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      runInTransaction((transDb) => {
        transDb.runSync(
          `INSERT OR REPLACE INTO dispatch_invoices (
            id, invoiceNumber, customerId, customerName, customerMobile,
            itemsJson, subtotal, commissionRate, commissionAmount, otherCharges,
            totalAmount, cashPaid, upiPaid, totalPaid, outstandingDebt,
            paymentMethod, notes, timestamp, syncStatus, isReversed,
            reversedAt, reversalReason, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoice.id,
            invoice.invoiceNumber,
            invoice.customerId || '',
            invoice.customerName,
            invoice.customerMobile || '',
            JSON.stringify(invoice.items || []),
            invoice.subtotal,
            invoice.commissionRate || 0,
            invoice.commissionAmount || 0,
            invoice.otherCharges || 0,
            invoice.totalAmount,
            invoice.cashPaid,
            invoice.upiPaid,
            invoice.totalPaid,
            invoice.outstandingDebt,
            invoice.paymentMethod,
            invoice.notes || '',
            invoice.timestamp,
            invoice.syncStatus,
            invoice.isReversed ? 1 : 0,
            invoice.reversedAt || '',
            invoice.reversalReason || '',
            invoice.createdBy || '',
          ]
        );

        // Save individual line items
        if (invoice.items && invoice.items.length > 0) {
          transDb.runSync('DELETE FROM dispatch_items WHERE invoiceId = ?', [invoice.id]);
          for (const item of invoice.items) {
            transDb.runSync(
              `INSERT INTO dispatch_items (
                id, invoiceId, productId, productName, category,
                gradeId, gradeName, quantity, unit, unitPrice,
                totalAmount, appliedPriceType
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.id,
                invoice.id,
                item.productId,
                item.productName,
                item.category,
                item.gradeId || '',
                item.gradeName || '',
                item.quantity,
                item.unit,
                item.unitPrice,
                item.totalAmount,
                item.appliedPriceType || '',
              ]
            );
          }
        }
      });
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving dispatch invoice:', err);
    }
  }

  const idx = memoryDispatchInvoices.findIndex((inv) => inv.id === invoice.id);
  if (idx >= 0) memoryDispatchInvoices[idx] = invoice;
  else memoryDispatchInvoices.unshift(invoice);
}

export async function loadDispatchInvoicesFromStorage(): Promise<DispatchInvoice[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM dispatch_invoices ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          customerId: r.customerId || undefined,
          customerName: r.customerName,
          customerMobile: r.customerMobile || undefined,
          items: r.itemsJson ? JSON.parse(r.itemsJson) : [],
          subtotal: Number(r.subtotal),
          commissionRate: r.commissionRate ? Number(r.commissionRate) : undefined,
          commissionAmount: r.commissionAmount ? Number(r.commissionAmount) : undefined,
          otherCharges: r.otherCharges ? Number(r.otherCharges) : undefined,
          totalAmount: Number(r.totalAmount),
          cashPaid: Number(r.cashPaid || 0),
          upiPaid: Number(r.upiPaid || 0),
          totalPaid: Number(r.totalPaid || 0),
          outstandingDebt: Number(r.outstandingDebt || 0),
          paymentMethod: r.paymentMethod,
          notes: r.notes || undefined,
          timestamp: r.timestamp,
          syncStatus: r.syncStatus as any,
          isReversed: Boolean(r.isReversed),
          reversedAt: r.reversedAt || undefined,
          reversalReason: r.reversalReason || undefined,
          createdBy: r.createdBy || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading dispatch invoices:', err);
    }
  }
  return memoryDispatchInvoices;
}

export async function saveSaleToStorage(sale: SaleRecord): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO sales (
          id, customerId, customerName, customerMobile, productId, productName, category,
          quantity, unit, unitPrice, totalAmount, paymentMethod, notes,
          timestamp, syncStatus, recordedOffline, syncedAt, syncError,
          gradeId, gradeName, appliedPriceType, commissionRate, commissionAmount, otherCharges, netTotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale.id,
          sale.customerId || '',
          sale.customerName,
          sale.customerMobile || '',
          sale.productId,
          sale.productName,
          sale.category,
          sale.quantity,
          sale.unit,
          sale.unitPrice,
          sale.totalAmount,
          sale.paymentMethod,
          sale.notes || '',
          sale.timestamp,
          sale.syncStatus,
          sale.recordedOffline ? 1 : 0,
          sale.syncedAt || '',
          sale.syncError || '',
          sale.gradeId || '',
          sale.gradeName || '',
          sale.appliedPriceType || '',
          sale.commissionRate || 0,
          sale.commissionAmount || 0,
          sale.otherCharges || 0,
          sale.netTotal || sale.totalAmount,
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving sale to SQLite:', err);
    }
  }

  const idx = memorySales.findIndex((s) => s.id === sale.id);
  if (idx >= 0) memorySales[idx] = sale;
  else memorySales.unshift(sale);
}

export async function loadSalesFromStorage(): Promise<SaleRecord[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM sales ORDER BY timestamp DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          customerId: r.customerId || undefined,
          customerName: r.customerName,
          customerMobile: r.customerMobile || undefined,
          productId: r.productId,
          productName: r.productName,
          category: r.category,
          quantity: Number(r.quantity),
          unit: r.unit,
          unitPrice: Number(r.unitPrice),
          totalAmount: Number(r.totalAmount),
          paymentMethod: r.paymentMethod as any,
          notes: r.notes || undefined,
          timestamp: r.timestamp,
          syncStatus: r.syncStatus as any,
          recordedOffline: Boolean(r.recordedOffline),
          syncedAt: r.syncedAt || undefined,
          syncError: r.syncError || undefined,
          gradeId: r.gradeId || undefined,
          gradeName: r.gradeName || undefined,
          appliedPriceType: r.appliedPriceType || undefined,
          commissionRate: r.commissionRate ? Number(r.commissionRate) : undefined,
          commissionAmount: r.commissionAmount ? Number(r.commissionAmount) : undefined,
          otherCharges: r.otherCharges ? Number(r.otherCharges) : undefined,
          netTotal: r.netTotal ? Number(r.netTotal) : undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading sales:', err);
    }
  }
  return memorySales;
}

export async function markSalesAsSyncedInStorage(ids: string[], syncedAt: string): Promise<void> {
  const db = getDb();
  if (db && ids.length > 0) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      db.runSync(
        `UPDATE sales SET syncStatus = 'synced', syncedAt = ?, syncError = '' WHERE id IN (${placeholders})`,
        [syncedAt, ...ids]
      );
    } catch (err) {
      console.warn('[OfflineStorage] Error marking sales synced:', err);
    }
  }

  memorySales = memorySales.map((sale) =>
    ids.includes(sale.id) ? { ...sale, syncStatus: 'synced', syncedAt, syncError: undefined } : sale
  );
}

// ================= FINANCIAL LEDGER =================
export async function saveLedgerTransactionToStorage(tx: LedgerTransaction): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO ledger_transactions (
          id, customerId, customerName, customerType, date, type, category,
          amount, paymentMethod, referenceNo, notes, balanceAfter,
          saleId, arrivalId, pattiId, createdAt, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.customerId,
          tx.customerName,
          tx.customerType,
          tx.date,
          tx.type,
          tx.category,
          tx.amount,
          tx.paymentMethod,
          tx.referenceNo || '',
          tx.notes || '',
          tx.balanceAfter || 0,
          tx.saleId || '',
          tx.arrivalId || '',
          tx.pattiId || '',
          tx.createdAt,
          tx.createdBy || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving ledger transaction:', err);
    }
  }

  const idx = memoryLedger.findIndex((t) => t.id === tx.id);
  if (idx >= 0) memoryLedger[idx] = tx;
  else memoryLedger.unshift(tx);
}

export async function loadLedgerTransactionsFromStorage(): Promise<LedgerTransaction[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM ledger_transactions ORDER BY createdAt DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          customerId: r.customerId,
          customerName: r.customerName,
          customerType: r.customerType as any,
          date: r.date,
          type: r.type as any,
          category: r.category as 'DEBIT' | 'CREDIT',
          amount: Number(r.amount),
          paymentMethod: r.paymentMethod as any,
          referenceNo: r.referenceNo || undefined,
          notes: r.notes || undefined,
          balanceAfter: Number(r.balanceAfter || 0),
          saleId: r.saleId || undefined,
          arrivalId: r.arrivalId || undefined,
          pattiId: r.pattiId || undefined,
          createdAt: r.createdAt,
          createdBy: r.createdBy || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading ledger:', err);
    }
  }
  return memoryLedger;
}

// ================= CUSTOMER PRICING RULES =================
export async function savePricingRuleToStorage(rule: CustomerPricingRule): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO customer_pricing_rules (
          id, customerId, customerName, productId, productName, gradeId, gradeName,
          price, effectiveDate, expiryDate, isActive, notes, updatedAt, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rule.id,
          rule.customerId,
          rule.customerName,
          rule.productId,
          rule.productName,
          rule.gradeId || '',
          rule.gradeName || '',
          rule.price,
          rule.effectiveDate || '',
          rule.expiryDate || '',
          rule.isActive ? 1 : 0,
          rule.notes || '',
          rule.updatedAt || '',
          rule.createdBy || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving pricing rule:', err);
    }
  }

  const idx = memoryPricingRules.findIndex((p) => p.id === rule.id);
  if (idx >= 0) memoryPricingRules[idx] = rule;
  else memoryPricingRules.unshift(rule);
}

export async function loadPricingRulesFromStorage(): Promise<CustomerPricingRule[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM customer_pricing_rules');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          customerId: r.customerId,
          customerName: r.customerName,
          productId: r.productId,
          productName: r.productName,
          gradeId: r.gradeId || undefined,
          gradeName: r.gradeName || undefined,
          price: Number(r.price),
          effectiveDate: r.effectiveDate,
          expiryDate: r.expiryDate || undefined,
          isActive: Boolean(r.isActive),
          notes: r.notes || undefined,
          updatedAt: r.updatedAt || undefined,
          createdBy: r.createdBy || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading pricing rules:', err);
    }
  }
  return memoryPricingRules;
}

export async function deletePricingRuleFromStorage(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM customer_pricing_rules WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting pricing rule:', err);
    }
  }
  memoryPricingRules = memoryPricingRules.filter((r) => r.id !== id);
}

// ================= FARMER PATTI RECORDS =================
export async function saveFarmerPattiToStorage(patti: FarmerPatti): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO patti_records (
          id, pattiNumber, arrivalId, farmerId, farmerName, farmerMobile,
          productName, gradeName, quantity, unit, rate, grossAmount,
          commissionRate, commissionAmount, laborCharges, otherCharges,
          netPayable, paymentStatus, date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patti.id,
          patti.pattiNumber,
          patti.arrivalId || '',
          patti.farmerId,
          patti.farmerName,
          patti.farmerMobile || '',
          patti.productName,
          patti.gradeName || '',
          patti.quantity,
          patti.unit,
          patti.rate,
          patti.grossAmount,
          patti.commissionRate,
          patti.commissionAmount,
          patti.laborCharges,
          patti.otherCharges || 0,
          patti.netPayable,
          patti.paymentStatus,
          patti.date,
          patti.notes || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving patti:', err);
    }
  }

  const idx = memoryPattis.findIndex((p) => p.id === patti.id);
  if (idx >= 0) memoryPattis[idx] = patti;
  else memoryPattis.unshift(patti);
}

export async function loadFarmerPattisFromStorage(): Promise<FarmerPatti[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM patti_records ORDER BY date DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          pattiNumber: r.pattiNumber,
          arrivalId: r.arrivalId || undefined,
          farmerId: r.farmerId,
          farmerName: r.farmerName,
          farmerMobile: r.farmerMobile || undefined,
          productName: r.productName,
          gradeName: r.gradeName || undefined,
          quantity: Number(r.quantity),
          unit: r.unit,
          rate: Number(r.rate),
          grossAmount: Number(r.grossAmount),
          commissionRate: Number(r.commissionRate),
          commissionAmount: Number(r.commissionAmount),
          laborCharges: Number(r.laborCharges),
          otherCharges: Number(r.otherCharges || 0),
          netPayable: Number(r.netPayable),
          paymentStatus: r.paymentStatus as any,
          date: r.date,
          notes: r.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading pattis:', err);
    }
  }
  return memoryPattis;
}

// ================= SLIPS & TALLY RECORDS =================
export async function saveSlipToStorage(slip: MandiSlip): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO mandi_slips (
          id, slipNumber, date, type, customerId, partyName, partyMobile,
          productId, productName, category, gradeName, quantity, unit,
          ratePerUnit, totalAmount, upfrontPayment, paymentMethod, paidAmount,
          balanceAmount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slip.id,
          slip.slipNumber,
          slip.date,
          slip.type,
          slip.customerId || '',
          slip.partyName,
          slip.partyMobile,
          slip.productId,
          slip.productName,
          slip.category,
          slip.gradeName || '',
          slip.quantity,
          slip.unit,
          slip.ratePerUnit,
          slip.totalAmount,
          slip.upfrontPayment || 0,
          slip.paymentMethod || '',
          slip.paidAmount,
          slip.balanceAmount,
          slip.notes || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving slip:', err);
    }
  }
  const idx = memorySlips.findIndex((s) => s.id === slip.id);
  if (idx >= 0) memorySlips[idx] = slip;
  else memorySlips.unshift(slip);
}

export async function loadSlipsFromStorage(): Promise<MandiSlip[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM mandi_slips ORDER BY id DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          slipNumber: r.slipNumber,
          date: r.date,
          type: r.type as any,
          customerId: r.customerId || undefined,
          partyName: r.partyName,
          partyMobile: r.partyMobile,
          productId: r.productId,
          productName: r.productName,
          category: r.category,
          gradeName: r.gradeName || undefined,
          quantity: Number(r.quantity),
          unit: r.unit,
          ratePerUnit: Number(r.ratePerUnit),
          totalAmount: Number(r.totalAmount),
          upfrontPayment: Number(r.upfrontPayment || 0),
          paymentMethod: r.paymentMethod || undefined,
          paidAmount: Number(r.paidAmount),
          balanceAmount: Number(r.balanceAmount),
          notes: r.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading slips:', err);
    }
  }
  return memorySlips;
}

export async function saveTallyRecordToStorage(tally: TallyRecord): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO tally_records (
          id, time, productName, productId, unit, count, mode, vehicleNo, partyName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tally.id,
          tally.time,
          tally.productName,
          tally.productId,
          tally.unit,
          tally.count,
          tally.mode,
          tally.vehicleNo || '',
          tally.partyName || '',
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving tally record:', err);
    }
  }
  const idx = memoryTallyRecords.findIndex((t) => t.id === tally.id);
  if (idx >= 0) memoryTallyRecords[idx] = tally;
  else memoryTallyRecords.unshift(tally);
}

export async function loadTallyRecordsFromStorage(): Promise<TallyRecord[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM tally_records ORDER BY id DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          time: r.time,
          productName: r.productName,
          productId: r.productId,
          unit: r.unit,
          count: Number(r.count),
          mode: r.mode as any,
          vehicleNo: r.vehicleNo || undefined,
          partyName: r.partyName || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading tally records:', err);
    }
  }
  return memoryTallyRecords;
}

// ================= STAFF MEMBERS =================
export async function saveStaffMemberToStorage(staff: StaffMember): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO staff_members (id, name, role, mobile, assignedDesk, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [staff.id, staff.name, staff.role, staff.mobile, staff.assignedDesk, staff.status]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving staff member:', err);
    }
  }
  const idx = memoryStaff.findIndex((s) => s.id === staff.id);
  if (idx >= 0) memoryStaff[idx] = staff;
  else memoryStaff.push(staff);
}

export async function loadStaffMembersFromStorage(): Promise<StaffMember[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM staff_members');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.role as any,
          mobile: r.mobile,
          assignedDesk: r.assignedDesk,
          status: r.status as any,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading staff members:', err);
    }
  }
  return memoryStaff;
}

// ================= PAYMENT REMINDER META =================
export async function savePaymentReminderMetaToStorage(meta: PaymentReminderMeta): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO payment_reminder_meta (
          customerId, customDueDate, snoozedUntil, lastRemindedAt, reminderCount, notes, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          meta.customerId,
          meta.customDueDate || '',
          meta.snoozedUntil || '',
          meta.lastRemindedAt || '',
          meta.reminderCount || 0,
          meta.notes || '',
          meta.updatedAt,
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving payment reminder meta:', err);
    }
  }
  const idx = memoryReminderMeta.findIndex((m) => m.customerId === meta.customerId);
  if (idx >= 0) memoryReminderMeta[idx] = meta;
  else memoryReminderMeta.push(meta);
}

export async function loadPaymentReminderMetaFromStorage(): Promise<PaymentReminderMeta[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM payment_reminder_meta');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          customerId: r.customerId,
          customDueDate: r.customDueDate || undefined,
          snoozedUntil: r.snoozedUntil || undefined,
          lastRemindedAt: r.lastRemindedAt || undefined,
          reminderCount: Number(r.reminderCount || 0),
          notes: r.notes || undefined,
          updatedAt: r.updatedAt,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading payment reminder meta:', err);
    }
  }
  return memoryReminderMeta;
}

export async function deletePaymentReminderMetaFromStorage(customerId: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('DELETE FROM payment_reminder_meta WHERE customerId = ?', [customerId]);
    } catch (err) {
      console.warn('[OfflineStorage] Error deleting payment reminder meta:', err);
    }
  }
  memoryReminderMeta = memoryReminderMeta.filter((m) => m.customerId !== customerId);
}

// ================= SYNC META =================
export async function setMetaValue(key: string, value: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', [key, value]);
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error setting meta:', err);
    }
  }
  memoryMeta[key] = value;
}

export async function getMetaValue(key: string): Promise<string | null> {
  const db = getDb();
  if (db) {
    try {
      const row = db.getFirstSync<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', [key]);
      if (row) return row.value;
    } catch (err) {
      console.warn('[OfflineStorage] Error reading meta:', err);
    }
  }
  return memoryMeta[key] || null;
}

export function resetStorageForTesting(): void {
  memoryUsers = [];
  memoryWorkspaces = [];
  memoryCustomers = [];
  memoryCategories = [];
  memoryProducts = [];
  memoryArrivals = [];
  memoryArrivalLots = [];
  memorySales = [];
  memoryDispatchInvoices = [];
  memoryStockLedger = [];
  memoryLedger = [];
  memoryGrades = [];
  memoryWastage = [];
  memoryPricingRules = [];
  memoryPattis = [];
  memorySlips = [];
  memoryTallyRecords = [];
  memoryStaff = [];
  memoryReminderMeta = [];
  memoryMeta = {};

  const db = getDb();
  if (db) {
    try {
      db.execSync(`
        DELETE FROM users;
        DELETE FROM workspaces;
        DELETE FROM customers;
        DELETE FROM categories;
        DELETE FROM products;
        DELETE FROM product_grades;
        DELETE FROM arrivals;
        DELETE FROM arrival_lots;
        DELETE FROM sales;
        DELETE FROM dispatch_invoices;
        DELETE FROM dispatch_items;
        DELETE FROM stock_ledger;
        DELETE FROM ledger_transactions;
        DELETE FROM wastage_records;
        DELETE FROM customer_pricing_rules;
        DELETE FROM patti_records;
        DELETE FROM mandi_slips;
        DELETE FROM tally_records;
        DELETE FROM staff_members;
        DELETE FROM payment_reminder_meta;
        DELETE FROM sync_meta;
      `);
    } catch {
      // In-memory or fallback
    }
  }
}
