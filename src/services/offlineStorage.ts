import * as SQLite from 'expo-sqlite';
import {
  ArrivalRecord,
  SaleRecord,
  LedgerTransaction,
  ProductGrade,
  WastageRecord,
  CustomerPricingRule,
  FarmerPatti,
} from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isStorageReady = false;

// In-memory fallback in case SQLite native driver is unavailable in specific environment
let memoryArrivals: ArrivalRecord[] = [];
let memorySales: SaleRecord[] = [];
let memoryLedger: LedgerTransaction[] = [];
let memoryGrades: ProductGrade[] = [];
let memoryWastage: WastageRecord[] = [];
let memoryPricingRules: CustomerPricingRule[] = [];
let memoryPattis: FarmerPatti[] = [];
let memoryMeta: Record<string, string> = {};

function getDb(): SQLite.SQLiteDatabase | null {
  if (dbInstance) {
    return dbInstance;
  }
  try {
    if (typeof SQLite.openDatabaseSync === 'function') {
      dbInstance = SQLite.openDatabaseSync('mandi_offline_v2.db');
      dbInstance.execSync(`
        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      return dbInstance;
    }
  } catch (err) {
    console.warn('[OfflineStorage] SQLite native driver not available, using resilient in-memory storage fallback:', err);
  }
  return null;
}

export async function initOfflineStorage(): Promise<boolean> {
  if (isStorageReady) return true;

  const db = getDb();
  if (db) {
    try {
      db.execSync(`
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
          syncError TEXT
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

        CREATE TABLE IF NOT EXISTS product_grades (
          id TEXT PRIMARY KEY,
          productId TEXT,
          name TEXT,
          description TEXT,
          defaultPrice REAL,
          stockQuantity REAL,
          isActive INTEGER
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

        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      isStorageReady = true;
      return true;
    } catch (err) {
      console.warn('[OfflineStorage] Error running schema creation:', err);
    }
  }

  isStorageReady = true;
  return true;
}

// ----------------- ARRIVALS -----------------
export async function saveArrivalToStorage(arrival: ArrivalRecord): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO arrivals (
          id, productId, productName, category, quantity, unit,
          farmerName, farmerMobile, vehicleNumber, lotNumber, notes,
          timestamp, syncStatus, recordedOffline, syncedAt, syncError
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ]
      );
      return;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving arrival to SQLite:', err);
    }
  }

  const idx = memoryArrivals.findIndex((a) => a.id === arrival.id);
  if (idx >= 0) {
    memoryArrivals[idx] = arrival;
  } else {
    memoryArrivals.unshift(arrival);
  }
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
          syncStatus: r.syncStatus as 'synced' | 'pending' | 'failed',
          recordedOffline: Boolean(r.recordedOffline),
          syncedAt: r.syncedAt || undefined,
          syncError: r.syncError || undefined,
        }));
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error loading arrivals from SQLite:', err);
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
      console.warn('[OfflineStorage] Error marking arrivals as synced in SQLite:', err);
    }
  }

  memoryArrivals = memoryArrivals.map((arr) =>
    ids.includes(arr.id) ? { ...arr, syncStatus: 'synced', syncedAt, syncError: undefined } : arr
  );
}

// ----------------- SALES -----------------
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
  if (idx >= 0) {
    memorySales[idx] = sale;
  } else {
    memorySales.unshift(sale);
  }
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
          syncStatus: r.syncStatus as 'synced' | 'pending' | 'failed',
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
      console.warn('[OfflineStorage] Error loading sales from SQLite:', err);
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
      console.warn('[OfflineStorage] Error marking sales as synced in SQLite:', err);
    }
  }

  memorySales = memorySales.map((sale) =>
    ids.includes(sale.id) ? { ...sale, syncStatus: 'synced', syncedAt, syncError: undefined } : sale
  );
}

// ----------------- LEDGER TRANSACTIONS -----------------
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
      console.warn('[OfflineStorage] Error saving ledger transaction to SQLite:', err);
    }
  }

  const idx = memoryLedger.findIndex((t) => t.id === tx.id);
  if (idx >= 0) {
    memoryLedger[idx] = tx;
  } else {
    memoryLedger.unshift(tx);
  }
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
      console.warn('[OfflineStorage] Error loading ledger transactions from SQLite:', err);
    }
  }

  return memoryLedger;
}

// ----------------- PRODUCT GRADES -----------------
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
      console.warn('[OfflineStorage] Error saving product grades to SQLite:', err);
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
      console.warn('[OfflineStorage] Error loading product grades from SQLite:', err);
    }
  }

  return memoryGrades;
}

// ----------------- WASTAGE RECORDS -----------------
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
          JSON.stringify(record.gradeQuantities),
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
      console.warn('[OfflineStorage] Error saving wastage record to SQLite:', err);
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
      console.warn('[OfflineStorage] Error loading wastage records from SQLite:', err);
    }
  }

  return memoryWastage;
}

// ----------------- CUSTOMER PRICING RULES -----------------
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
      console.warn('[OfflineStorage] Error saving pricing rule to SQLite:', err);
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
      console.warn('[OfflineStorage] Error loading pricing rules from SQLite:', err);
    }
  }

  return memoryPricingRules;
}

// ----------------- FARMER PATTI RECORDS -----------------
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
      console.warn('[OfflineStorage] Error saving patti to SQLite:', err);
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
      console.warn('[OfflineStorage] Error loading pattis from SQLite:', err);
    }
  }

  return memoryPattis;
}

// ----------------- SYNC META -----------------
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
