import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getProductImage } from '../utils/productImages';
import {
  Customer,
  Category,
  Product,
  ProductGrade,
  UnitType,
  UserProfile,
  UserRole,
  StaffMember,
  ArrivalRecord,
  SaleRecord,
  LedgerTransaction,
  CustomerPricingRule,
  WastageRecord,
  FarmerPatti,
  MandiSlip,
  TallyRecord,
} from '../types';
import {
  initialCustomers,
  initialCategories,
  initialProducts,
  initialProductGrades,
  initialStaffMembers,
  initialArrivals,
  initialSales,
  initialCustomerPricingRules,
  initialLedgerTransactions,
  initialWastageRecords,
  initialFarmerPattis,
  initialSlips,
  initialTallyRecords,
  availableUnits,
  demoOwnerProfile,
} from '../data/mockData';
import {
  initOfflineStorage,
  saveArrivalToStorage,
  saveSaleToStorage,
  loadArrivalsFromStorage,
  loadSalesFromStorage,
  markArrivalsAsSyncedInStorage,
  markSalesAsSyncedInStorage,
  saveLedgerTransactionToStorage,
  loadLedgerTransactionsFromStorage,
  saveProductGradesToStorage,
  loadProductGradesFromStorage,
  saveWastageRecordToStorage,
  loadWastageRecordsFromStorage,
  savePricingRuleToStorage,
  loadPricingRulesFromStorage,
  saveFarmerPattiToStorage,
  loadFarmerPattisFromStorage,
  setMetaValue,
  getMetaValue,
} from '../services/offlineStorage';

export interface FinancialSummary {
  totalCashReceived: number;
  totalCashPaid: number;
  totalReceivable: number;
  totalPayable: number;
  netOutstanding: number;
}

interface MandiContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  loginUser: (user: UserProfile) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isOwner: boolean;
  isOperator: boolean;

  // Permission flags
  canDeleteProduct: boolean;
  canAddCategory: boolean;
  canManageStaff: boolean;
  canViewFinancials: boolean;

  // Staff management (Owner feature)
  staffMembers: StaffMember[];
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => boolean;

  // Core Mandi entities
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => boolean;
  updateCustomer: (id: string, updates: Partial<Customer>) => boolean;
  categories: Category[];
  addCategory: (name: string) => { success: boolean; error?: string };
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => boolean;
  deleteProduct: (productId: string) => boolean;
  updateProductQuantity: (productId: string, quantity: string) => void;
  units: UnitType[];

  // Real-time Analytics & Operational Metrics
  totalInventoryValue: number;
  totalStockUnits: number;
  lowStockCount: number;
  shiftUpdatesCount: number;

  // FEATURE 1: Cash & Debt Management
  ledgerTransactions: LedgerTransaction[];
  addLedgerTransaction: (
    txData: Omit<LedgerTransaction, 'id' | 'createdAt' | 'balanceAfter'>
  ) => Promise<LedgerTransaction>;
  getCustomerTransactions: (customerId: string) => LedgerTransaction[];
  getCustomerBalance: (customerId: string) => {
    currentBalance: number;
    totalReceivable: number;
    totalPayable: number;
    openingBalance: number;
  };
  financialSummary: FinancialSummary;

  // FEATURE 2: Product Grading and Wastage Management
  productGrades: ProductGrade[];
  wastageRecords: WastageRecord[];
  addProductGrade: (gradeData: Omit<ProductGrade, 'id'>) => Promise<ProductGrade>;
  updateProductGrade: (id: string, updates: Partial<ProductGrade>) => Promise<boolean>;
  deleteProductGrade: (id: string) => Promise<boolean>;
  toggleGradeActive: (id: string) => Promise<boolean>;
  getProductGrades: (productId: string) => ProductGrade[];
  recordWastageAndSorting: (params: {
    productId: string;
    productName: string;
    originalQuantity: number;
    gradeQuantities: Record<string, number>;
    wastageQuantity: number;
    wastageReason: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; wastageRecord?: WastageRecord }>;

  // FEATURE 3: Customer-Wise and Product-Wise Pricing
  pricingRules: CustomerPricingRule[];
  addPricingRule: (ruleData: Omit<CustomerPricingRule, 'id' | 'updatedAt'>) => Promise<CustomerPricingRule>;
  updatePricingRule: (id: string, updates: Partial<CustomerPricingRule>) => Promise<boolean>;
  deletePricingRule: (id: string) => Promise<boolean>;
  togglePricingRule: (id: string) => Promise<boolean>;
  getCustomerPrice: (
    customerId: string,
    productId: string,
    gradeId?: string
  ) => {
    price: number;
    isCustom: boolean;
    rule?: CustomerPricingRule;
    defaultPrice: number;
  };

  // FEATURE 4: Farmer Patti Records
  pattis: FarmerPatti[];
  generatePatti: (
    params: Omit<FarmerPatti, 'id' | 'pattiNumber'>
  ) => Promise<FarmerPatti>;

  // Offline Mode & Data Sync
  arrivals: ArrivalRecord[];
  sales: SaleRecord[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isEffectiveOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingSyncCount: number;
  pendingArrivalsCount: number;
  pendingSalesCount: number;
  syncedRecordsCount: number;
  failedRecordsCount: number;
  recordArrival: (
    data: Omit<ArrivalRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ) => Promise<ArrivalRecord>;
  recordSale: (
    data: Omit<SaleRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ) => Promise<SaleRecord>;
  syncPendingRecords: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  toggleOfflineSimulation: (forced?: boolean) => void;
  deleteArrival: (id: string) => void;
  deleteSale: (id: string) => void;

  // Slips and Floor Crate Tally
  slips: MandiSlip[];
  recordSlip: (slipData: Omit<MandiSlip, 'id' | 'slipNumber' | 'date'>) => MandiSlip;
  tallyRecords: TallyRecord[];
  recordTally: (tallyData: Omit<TallyRecord, 'id' | 'time'>) => TallyRecord;

  // Shift & Drawer
  operatorCashDrawer: number;
  shiftSubmitted: boolean;
  submitShiftHandover: () => void;

  // Owner Financials & Metrics
  todaySales: number;
  todayProfit: number;
  totalUdhaar: number;

  // Debt & Balance Settlement
  settleCustomerBalance: (customerId: string, amountToSettle: number) => void;

  // Customer Product Pricing Shortcuts
  getCustomerProductPrice: (customerId: string, productId: string, gradeName?: string) => number | null;
  setCustomerProductPrice: (customerId: string, productId: string, price: number, gradeName?: string) => Promise<void>;
}

const MandiContext = createContext<MandiContextType | undefined>(undefined);

export const MandiProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(demoOwnerProfile);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [shiftUpdatesCount, setShiftUpdatesCount] = useState<number>(14);

  // Feature 1 State
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>(initialLedgerTransactions);

  // Feature 2 State
  const [productGrades, setProductGrades] = useState<ProductGrade[]>(initialProductGrades);
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>(initialWastageRecords);

  // Feature 3 State
  const [pricingRules, setPricingRules] = useState<CustomerPricingRule[]>(initialCustomerPricingRules);

  // Feature 4 State
  const [pattis, setPattis] = useState<FarmerPatti[]>(initialFarmerPattis);
  const [slips, setSlips] = useState<MandiSlip[]>(initialSlips);
  const [tallyRecords, setTallyRecords] = useState<TallyRecord[]>(initialTallyRecords);
  const [shiftSubmitted, setShiftSubmitted] = useState<boolean>(false);


  // Offline Mode & Sync State
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>(initialArrivals);
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isSyncingLockRef = useRef<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const isOwner = currentUser?.role === 'Owner';
  const isOperator = currentUser?.role === 'Operator';

  const canDeleteProduct = isOwner;
  const canAddCategory = isOwner;
  const canManageStaff = isOwner;
  const canViewFinancials = isOwner;

  // Effective online status
  const isEffectiveOnline = isOnline && !isSimulatedOffline;

  // Offline sync counters
  const pendingArrivalsCount = arrivals.filter((a) => a.syncStatus === 'pending').length;
  const pendingSalesCount = sales.filter((s) => s.syncStatus === 'pending').length;
  const syncedRecordsCount =
    arrivals.filter((a) => a.syncStatus === 'synced').length +
    sales.filter((s) => s.syncStatus === 'synced').length;
  const failedRecordsCount =
    arrivals.filter((a) => a.syncStatus === 'failed').length +
    sales.filter((s) => s.syncStatus === 'failed').length;
  const pendingSyncCount = pendingArrivalsCount + pendingSalesCount;

  // Initialize offline SQLite storage & load cached records
  useEffect(() => {
    let isMounted = true;
    async function initStorage() {
      await initOfflineStorage();

      // Load arrivals & sales
      const storedArrivals = await loadArrivalsFromStorage();
      const storedSales = await loadSalesFromStorage();
      const storedLastSync = await getMetaValue('lastSyncedAt');

      // Load feature records
      const storedLedger = await loadLedgerTransactionsFromStorage();
      const storedGrades = await loadProductGradesFromStorage();
      const storedWastage = await loadWastageRecordsFromStorage();
      const storedRules = await loadPricingRulesFromStorage();
      const storedPattis = await loadFarmerPattisFromStorage();

      if (!isMounted) return;

      if (storedArrivals && storedArrivals.length > 0) {
        setArrivals(storedArrivals);
      } else {
        for (const arr of initialArrivals) {
          await saveArrivalToStorage(arr);
        }
      }

      if (storedSales && storedSales.length > 0) {
        setSales(storedSales);
      } else {
        for (const s of initialSales) {
          await saveSaleToStorage(s);
        }
      }

      if (storedLedger && storedLedger.length > 0) {
        setLedgerTransactions(storedLedger);
      } else {
        for (const tx of initialLedgerTransactions) {
          await saveLedgerTransactionToStorage(tx);
        }
      }

      if (storedGrades && storedGrades.length > 0) {
        setProductGrades(storedGrades);
      } else {
        await saveProductGradesToStorage(initialProductGrades);
      }

      if (storedWastage && storedWastage.length > 0) {
        setWastageRecords(storedWastage);
      } else {
        for (const w of initialWastageRecords) {
          await saveWastageRecordToStorage(w);
        }
      }

      if (storedRules && storedRules.length > 0) {
        setPricingRules(storedRules);
      } else {
        for (const r of initialCustomerPricingRules) {
          await savePricingRuleToStorage(r);
        }
      }

      if (storedPattis && storedPattis.length > 0) {
        setPattis(storedPattis);
      } else {
        for (const p of initialFarmerPattis) {
          await saveFarmerPattiToStorage(p);
        }
      }

      if (storedLastSync) {
        setLastSyncedAt(storedLastSync);
      } else {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncedAt(nowStr);
        await setMetaValue('lastSyncedAt', nowStr);
      }
    }

    initStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to network changes via NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
    });

    NetInfo.fetch().then((state: any) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- SYNCHRONIZE PENDING RECORDS ---
  const syncPendingRecords = useCallback(async (): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
  }> => {
    if (!isEffectiveOnline) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Cannot synchronize while in Offline Mode. Please connect to internet or turn off "Test Offline".',
      };
    }

    if (isSyncingLockRef.current) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Synchronization is already in progress.',
      };
    }

    const pendingArrivalIds = arrivals
      .filter((a) => a.syncStatus === 'pending' || a.syncStatus === 'failed')
      .map((a) => a.id);
    const pendingSaleIds = sales
      .filter((s) => s.syncStatus === 'pending' || s.syncStatus === 'failed')
      .map((s) => s.id);
    const totalToSync = pendingArrivalIds.length + pendingSaleIds.length;

    if (totalToSync === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'All arrival and sale records are already synchronized with Mandi Cloud.',
      };
    }

    isSyncingLockRef.current = true;
    setIsSyncing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const nowIso = new Date().toISOString();
      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setArrivals((prev) =>
        prev.map((a) =>
          pendingArrivalIds.includes(a.id)
            ? { ...a, syncStatus: 'synced', syncedAt: nowIso, syncError: undefined }
            : a
        )
      );

      setSales((prev) =>
        prev.map((s) =>
          pendingSaleIds.includes(s.id)
            ? { ...s, syncStatus: 'synced', syncedAt: nowIso, syncError: undefined }
            : s
        )
      );

      await markArrivalsAsSyncedInStorage(pendingArrivalIds, nowIso);
      await markSalesAsSyncedInStorage(pendingSaleIds, nowIso);

      setLastSyncedAt(nowTimeStr);
      await setMetaValue('lastSyncedAt', nowTimeStr);

      isSyncingLockRef.current = false;
      setIsSyncing(false);

      return {
        success: true,
        syncedCount: totalToSync,
        message: `Successfully synchronized ${totalToSync} records (${pendingArrivalIds.length} arrivals, ${pendingSaleIds.length} sales) to Mandi Cloud!`,
      };
    } catch {
      isSyncingLockRef.current = false;
      setIsSyncing(false);
      return {
        success: false,
        syncedCount: 0,
        message: 'Synchronization failed due to a network interruption. Records remain safely stored offline.',
      };
    }
  }, [isEffectiveOnline, arrivals, sales]);

  // Automatic sync when connectivity returns
  const prevEffectiveOnlineRef = useRef(isEffectiveOnline);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!prevEffectiveOnlineRef.current && isEffectiveOnline) {
      const hasPending =
        arrivals.some((a) => a.syncStatus === 'pending' || a.syncStatus === 'failed') ||
        sales.some((s) => s.syncStatus === 'pending' || s.syncStatus === 'failed');
      if (hasPending) {
        timer = setTimeout(() => {
          syncPendingRecords();
        }, 150);
      }
    }
    prevEffectiveOnlineRef.current = isEffectiveOnline;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isEffectiveOnline, arrivals, sales, syncPendingRecords]);

  const toggleOfflineSimulation = () => {};

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role,
      });
    } else {
      setCurrentUser({
        id: Date.now().toString(),
        name: role === 'Owner' ? 'Ramesh Patel' : 'Suresh Kumar',
        mobile: role === 'Owner' ? '9876543210' : '9876509876',
        business: 'Patel Krishi Mandi',
        location: 'APMC Market Yard, Bangalore',
        role,
      });
    }
  };

  const addStaffMember = (staffData: Omit<StaffMember, 'id'>): boolean => {
    if (!staffData.name.trim() || !staffData.mobile.trim()) {
      return false;
    }
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}`,
      name: staffData.name.trim(),
      role: staffData.role,
      mobile: staffData.mobile.replace(/\D/g, ''),
      assignedDesk: staffData.assignedDesk.trim() || 'Floor Operations',
      status: staffData.status || 'Active',
    };
    setStaffMembers((prev) => [...prev, newStaff]);
    return true;
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>): boolean => {
    const cleanName = customerData.name.trim();
    const cleanMobile = customerData.mobile.replace(/\D/g, '');
    const cleanBusiness = customerData.business.trim();

    if (!cleanName || cleanMobile.length !== 10 || !cleanBusiness) {
      return false;
    }

    const openingBalance = customerData.openingBalance || 0;
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
      customerType: customerData.customerType || 'Buyer',
      openingBalance,
      totalReceivable: openingBalance > 0 ? openingBalance : 0,
      totalPayable: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      currentBalance: openingBalance,
      balance:
        openingBalance > 0
          ? `₹ ${openingBalance.toLocaleString()} Pending`
          : openingBalance < 0
          ? `₹ ${Math.abs(openingBalance).toLocaleString()} Mandi Owes`
          : 'Settled',
      address: customerData.address || '',
      notes: customerData.notes || '',
      createdAt: new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>): boolean => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    return true;
  };

  const addCategory = (
    name: string
  ): { success: boolean; error?: string } => {
    const cleanName = name.trim();

    if (!cleanName) {
      return {
        success: false,
        error: 'Please enter a category name.',
      };
    }

    const alreadyExists = categories.some(
      (cat) => cat.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (alreadyExists) {
      return {
        success: false,
        error: `Category "${cleanName}" already exists.`,
      };
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: cleanName,
    };

    setCategories((prev) => [...prev, newCategory]);
    return { success: true };
  };

  const addProduct = (productData: Omit<Product, 'id'>): boolean => {
    const cleanName = productData.name.trim();
    const category = productData.category.trim();
    const unit = productData.unit.trim();
    const quantity = productData.quantity ? productData.quantity.toString().trim() : '0';
    const price = productData.price ? productData.price.toString().trim() : '';

    if (!cleanName || !category || !unit) {
      return false;
    }

    const newId = `prod_${Date.now()}`;

    // Create 4 standard default grades (A, B, C, D) for every new product
    const basePriceNum = parseFloat(price) || 20;
    const initialGrades: ProductGrade[] = [
      {
        id: `grd_${newId}_a`,
        productId: newId,
        name: 'Grade A',
        description: 'Premium export quality',
        defaultPrice: Math.round(basePriceNum * 1.2),
        stockQuantity: 0,
        isActive: true,
      },
      {
        id: `grd_${newId}_b`,
        productId: newId,
        name: 'Grade B',
        description: 'Standard market quality',
        defaultPrice: basePriceNum,
        stockQuantity: parseFloat(quantity) || 0,
        isActive: true,
      },
      {
        id: `grd_${newId}_c`,
        productId: newId,
        name: 'Grade C',
        description: 'Economic grade / quick sale',
        defaultPrice: Math.round(basePriceNum * 0.7),
        stockQuantity: 0,
        isActive: true,
      },
      {
        id: `grd_${newId}_d`,
        productId: newId,
        name: 'Grade D (Culled)',
        description: 'Damaged or sorting rejects',
        defaultPrice: Math.round(basePriceNum * 0.2),
        stockQuantity: 0,
        isActive: true,
      },
    ];

    const newProduct: Product = {
      id: newId,
      name: cleanName,
      category,
      unit,
      quantity,
      price,
      grades: initialGrades,
      ungradedStock: 0,
      image: productData.image || getProductImage({ name: cleanName, category }),
    };

    setProducts((prev) => [newProduct, ...prev]);
    setProductGrades((prev) => [...prev, ...initialGrades]);
    saveProductGradesToStorage(initialGrades);

    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const deleteProduct = (productId: string): boolean => {
    if (!canDeleteProduct) {
      return false;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setProductGrades((prev) => prev.filter((g) => g.productId !== productId));
    return true;
  };

  const updateProductQuantity = (productId: string, quantity: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantity } : p))
    );
    setShiftUpdatesCount((prev) => prev + 1);
  };

  // =========================================================================
  // FEATURE 1: CUSTOMER-WISE CASH AND DEBT MANAGEMENT
  // =========================================================================

  // Calculate customer financial metrics dynamically from ledger & opening balance
  const getCustomerBalance = useCallback(
    (customerId: string) => {
      const cust = customers.find((c) => c.id === customerId);
      const opening = cust?.openingBalance || 0;

      const custTxs = ledgerTransactions.filter((tx) => tx.customerId === customerId);

      let debits = 0; // Increases what customer owes
      let credits = 0; // Decreases what customer owes / increases what Mandi owes farmer

      custTxs.forEach((tx) => {
        if (tx.category === 'DEBIT') debits += tx.amount;
        else if (tx.category === 'CREDIT') credits += tx.amount;
      });

      // Net balance convention:
      // Positive = Customer owes Mandi (Receivable)
      // Negative = Mandi owes Customer (Payable)
      const currentBalance = opening + debits - credits;
      const totalReceivable = currentBalance > 0 ? currentBalance : 0;
      const totalPayable = currentBalance < 0 ? Math.abs(currentBalance) : 0;

      return {
        currentBalance,
        totalReceivable,
        totalPayable,
        openingBalance: opening,
      };
    },
    [customers, ledgerTransactions]
  );

  const getCustomerTransactions = useCallback(
    (customerId: string) => {
      return ledgerTransactions.filter((tx) => tx.customerId === customerId);
    },
    [ledgerTransactions]
  );

  const addLedgerTransaction = async (
    txData: Omit<LedgerTransaction, 'id' | 'createdAt' | 'balanceAfter'>
  ): Promise<LedgerTransaction> => {
    const custBal = getCustomerBalance(txData.customerId);
    const change = txData.category === 'DEBIT' ? txData.amount : -txData.amount;
    const balanceAfter = custBal.currentBalance + change;

    const newTx: LedgerTransaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      balanceAfter,
      createdBy: currentUser?.name || 'Mandi Staff',
    };

    setLedgerTransactions((prev) => [newTx, ...prev]);

    // Update customer cached balances
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === txData.customerId) {
          const nextBal = balanceAfter;
          return {
            ...c,
            currentBalance: nextBal,
            totalReceivable: nextBal > 0 ? nextBal : 0,
            totalPayable: nextBal < 0 ? Math.abs(nextBal) : 0,
            balance:
              nextBal > 0
                ? `₹ ${nextBal.toLocaleString()} Pending`
                : nextBal < 0
                ? `₹ ${Math.abs(nextBal).toLocaleString()} Mandi Owes`
                : 'Settled (₹ 0)',
          };
        }
        return c;
      })
    );

    await saveLedgerTransactionToStorage(newTx);
    setShiftUpdatesCount((prev) => prev + 1);

    return newTx;
  };

  // Financial Summaries for Cash & Debt Dashboard
  const financialSummary: FinancialSummary = React.useMemo(() => {
    let totalCashReceived = 0;
    let totalCashPaid = 0;

    ledgerTransactions.forEach((tx) => {
      if (
        tx.type === 'CASH_RECEIVED' ||
        (tx.paymentMethod === 'Cash' && tx.category === 'CREDIT')
      ) {
        totalCashReceived += tx.amount;
      }
      if (
        tx.type === 'CASH_PAID' ||
        (tx.paymentMethod === 'Cash' && tx.category === 'DEBIT')
      ) {
        totalCashPaid += tx.amount;
      }
    });

    // Also include cash sales in totalCashReceived if not in ledger
    sales.forEach((s) => {
      if (s.paymentMethod === 'Cash' && !s.customerId) {
        totalCashReceived += s.totalAmount;
      }
    });

    let totalReceivable = 0;
    let totalPayable = 0;

    customers.forEach((c) => {
      const bal = getCustomerBalance(c.id);
      if (bal.currentBalance > 0) {
        totalReceivable += bal.currentBalance;
      } else if (bal.currentBalance < 0) {
        totalPayable += Math.abs(bal.currentBalance);
      }
    });

    return {
      totalCashReceived,
      totalCashPaid,
      totalReceivable,
      totalPayable,
      netOutstanding: totalReceivable - totalPayable,
    };
  }, [ledgerTransactions, sales, customers, getCustomerBalance]);

  // =========================================================================
  // FEATURE 2: PRODUCT GRADING AND WASTAGE MANAGEMENT
  // =========================================================================

  const getProductGrades = useCallback(
    (productId: string) => {
      return productGrades.filter((g) => g.productId === productId);
    },
    [productGrades]
  );

  const addProductGrade = async (gradeData: Omit<ProductGrade, 'id'>): Promise<ProductGrade> => {
    const newGrade: ProductGrade = {
      ...gradeData,
      id: `grd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    setProductGrades((prev) => [...prev, newGrade]);

    // Update parent product's grades
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === gradeData.productId) {
          const updated = [...(p.grades || []), newGrade];
          const totalStock = updated.reduce((sum, g) => sum + (g.isActive ? g.stockQuantity : 0), 0);
          return {
            ...p,
            grades: updated,
            quantity: String(totalStock),
          };
        }
        return p;
      })
    );

    await saveProductGradesToStorage([...productGrades, newGrade]);
    return newGrade;
  };

  const updateProductGrade = async (id: string, updates: Partial<ProductGrade>): Promise<boolean> => {
    let updatedGrade: ProductGrade | null = null;
    const nextGrades = productGrades.map((g) => {
      if (g.id === id) {
        updatedGrade = { ...g, ...updates };
        return updatedGrade;
      }
      return g;
    });

    if (!updatedGrade) return false;

    setProductGrades(nextGrades);

    const targetProductId = (updatedGrade as ProductGrade).productId;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === targetProductId) {
          const proGrades = nextGrades.filter((g) => g.productId === targetProductId);
          const totalStock = proGrades.reduce((sum, g) => sum + (g.isActive ? g.stockQuantity : 0), 0);
          return {
            ...p,
            grades: proGrades,
            quantity: String(totalStock),
          };
        }
        return p;
      })
    );

    await saveProductGradesToStorage(nextGrades);
    return true;
  };

  const toggleGradeActive = async (id: string): Promise<boolean> => {
    const target = productGrades.find((g) => g.id === id);
    if (!target) return false;
    return updateProductGrade(id, { isActive: !target.isActive });
  };

  const deleteProductGrade = async (id: string): Promise<boolean> => {
    const target = productGrades.find((g) => g.id === id);
    if (!target) return false;
    const nextGrades = productGrades.filter((g) => g.id !== id);
    setProductGrades(nextGrades);

    const targetProductId = target.productId;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === targetProductId) {
          const proGrades = nextGrades.filter((g) => g.productId === targetProductId);
          const totalStock = proGrades.reduce((sum, g) => sum + (g.isActive ? g.stockQuantity : 0), 0);
          return {
            ...p,
            grades: proGrades,
            quantity: String(totalStock),
          };
        }
        return p;
      })
    );

    await saveProductGradesToStorage(nextGrades);
    return true;
  };

  // Record sorting batch and wastage with strict balance verification
  const recordWastageAndSorting = async (params: {
    productId: string;
    productName: string;
    originalQuantity: number;
    gradeQuantities: Record<string, number>;
    wastageQuantity: number;
    wastageReason: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; wastageRecord?: WastageRecord }> => {
    const { productId, productName, originalQuantity, gradeQuantities, wastageQuantity, wastageReason, notes } = params;

    // Strict validation
    let totalGraded = 0;
    Object.values(gradeQuantities).forEach((qty) => {
      totalGraded += Math.max(0, qty || 0);
    });

    const totalProcessed = totalGraded + Math.max(0, wastageQuantity);

    if (totalProcessed > originalQuantity) {
      return {
        success: false,
        error: `Total processed quantity (${totalProcessed}) exceeds original available quantity (${originalQuantity}).`,
      };
    }

    const remainingUngraded = Math.max(0, originalQuantity - totalProcessed);
    const wastagePercentage = originalQuantity > 0 ? (wastageQuantity / originalQuantity) * 100 : 0;

    const newWastageRecord: WastageRecord = {
      id: `wst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId,
      productName,
      originalQuantity,
      gradeQuantities,
      wastageQuantity,
      wastageReason: wastageReason || 'Sorting Residue / Culled Produce',
      wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
      remainingUngradedQuantity: remainingUngraded,
      timestamp: new Date().toISOString(),
      recordedBy: currentUser?.name || 'Mandi Staff',
      notes,
    };

    // Update grade stocks
    const nextGrades = productGrades.map((g) => {
      if (g.productId === productId && gradeQuantities[g.id] !== undefined) {
        return {
          ...g,
          stockQuantity: g.stockQuantity + (gradeQuantities[g.id] || 0),
        };
      }
      return g;
    });

    setProductGrades(nextGrades);
    setWastageRecords((prev) => [newWastageRecord, ...prev]);

    // Update main product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const proGrades = nextGrades.filter((g) => g.productId === productId);
          const totalStock = proGrades.reduce((sum, g) => sum + (g.isActive ? g.stockQuantity : 0), 0);
          return {
            ...p,
            grades: proGrades,
            quantity: String(totalStock),
            ungradedStock: remainingUngraded,
          };
        }
        return p;
      })
    );

    await saveProductGradesToStorage(nextGrades);
    await saveWastageRecordToStorage(newWastageRecord);
    setShiftUpdatesCount((prev) => prev + 1);

    return { success: true, wastageRecord: newWastageRecord };
  };

  // =========================================================================
  // FEATURE 3: CUSTOMER-WISE AND PRODUCT-WISE PRICING
  // =========================================================================

  const getCustomerPrice = useCallback(
    (
      customerId: string,
      productId: string,
      gradeId?: string
    ): {
      price: number;
      isCustom: boolean;
      rule?: CustomerPricingRule;
      defaultPrice: number;
    } => {
      // Find matching product & grade default price
      const product = products.find((p) => p.id === productId);
      const grade = gradeId ? productGrades.find((g) => g.id === gradeId) : undefined;
      const defaultPrice = grade
        ? grade.defaultPrice
        : parseFloat(product?.price || '0') || 20;

      if (!customerId) {
        return { price: defaultPrice, isCustom: false, defaultPrice };
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Look for custom rule matching Customer + Product + Grade
      const matchingRule = pricingRules.find((rule) => {
        if (!rule.isActive) return false;
        if (rule.customerId !== customerId) return false;
        if (rule.productId !== productId) return false;

        // If grade is specified, rule must match grade (or be product-wide)
        if (gradeId && rule.gradeId && rule.gradeId !== gradeId) {
          return false;
        }

        // Check effective & expiry date
        if (rule.effectiveDate && rule.effectiveDate > todayStr) return false;
        if (rule.expiryDate && rule.expiryDate < todayStr) return false;

        return true;
      });

      if (matchingRule) {
        return {
          price: matchingRule.price,
          isCustom: true,
          rule: matchingRule,
          defaultPrice,
        };
      }

      return {
        price: defaultPrice,
        isCustom: false,
        defaultPrice,
      };
    },
    [products, productGrades, pricingRules]
  );

  const addPricingRule = async (
    ruleData: Omit<CustomerPricingRule, 'id' | 'updatedAt'>
  ): Promise<CustomerPricingRule> => {
    const newRule: CustomerPricingRule = {
      ...ruleData,
      id: `prc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Mandi Owner',
    };

    setPricingRules((prev) => [newRule, ...prev]);
    await savePricingRuleToStorage(newRule);
    return newRule;
  };

  const updatePricingRule = async (
    id: string,
    updates: Partial<CustomerPricingRule>
  ): Promise<boolean> => {
    let updatedRule: CustomerPricingRule | null = null;
    const nextRules = pricingRules.map((r) => {
      if (r.id === id) {
        updatedRule = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return updatedRule;
      }
      return r;
    });

    if (!updatedRule) return false;

    setPricingRules(nextRules);
    await savePricingRuleToStorage(updatedRule);
    return true;
  };

  const deletePricingRule = async (id: string): Promise<boolean> => {
    setPricingRules((prev) => prev.filter((r) => r.id !== id));
    return true;
  };

  const togglePricingRule = async (id: string): Promise<boolean> => {
    const rule = pricingRules.find((r) => r.id === id);
    if (!rule) return false;
    return updatePricingRule(id, { isActive: !rule.isActive });
  };

  // =========================================================================
  // FEATURE 4: FARMER PATTI GENERATION
  // =========================================================================

  const generatePatti = async (
    params: Omit<FarmerPatti, 'id' | 'pattiNumber'>
  ): Promise<FarmerPatti> => {
    const count = pattis.length + 1;
    const pattiNumber = `PATTI-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newPatti: FarmerPatti = {
      ...params,
      id: `patti_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pattiNumber,
    };

    setPattis((prev) => [newPatti, ...prev]);

    // Record credit transaction in Farmer's Ledger (Mandi owes farmer netPayable)
    if (params.farmerId) {
      await addLedgerTransaction({
        customerId: params.farmerId,
        customerName: params.farmerName,
        customerType: 'Farmer',
        date: params.date || new Date().toISOString().split('T')[0],
        type: 'PURCHASE_CREDIT',
        category: 'CREDIT', // Mandi owes farmer
        amount: params.netPayable,
        paymentMethod: 'Credit',
        referenceNo: pattiNumber,
        notes: `Farmer Patti for ${params.quantity} ${params.unit} ${params.productName} (${params.gradeName || 'Standard'})`,
        arrivalId: params.arrivalId,
        pattiId: newPatti.id,
      });
    }

    await saveFarmerPattiToStorage(newPatti);
    return newPatti;
  };

  // =========================================================================
  // INTEGRATED RECORD ARRIVAL (WORKS OFFLINE & ONLINE)
  // =========================================================================
  const recordArrival = async (
    data: Omit<ArrivalRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ): Promise<ArrivalRecord> => {
    const nowIso = new Date().toISOString();

    const newArrival: ArrivalRecord = {
      ...data,
      id: `arr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      syncStatus: 'synced',
      recordedOffline: false,
      syncedAt: nowIso,
    };

    // UPDATE PRODUCT & GRADE STOCK
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === data.productId || p.name.toLowerCase() === data.productName.toLowerCase()) {
          const currentQty = parseFloat(p.quantity || '0') || 0;
          return {
            ...p,
            quantity: String(currentQty + data.quantity),
          };
        }
        return p;
      })
    );

    // If product has Grade A or Grade B, add to Grade B as default standard incoming stock
    setProductGrades((prev) =>
      prev.map((g) => {
        if (g.productId === data.productId && g.name.includes('Grade B')) {
          return {
            ...g,
            stockQuantity: g.stockQuantity + data.quantity,
          };
        }
        return g;
      })
    );

    setArrivals((prev) => [newArrival, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);

    await saveArrivalToStorage(newArrival);
    return newArrival;
  };

  // =========================================================================
  // INTEGRATED RECORD SALE (WORKS OFFLINE & ONLINE, GRADE-AWARE, POSTS TO LEDGER)
  // =========================================================================
  const recordSale = async (
    data: Omit<SaleRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ): Promise<SaleRecord> => {
    const nowIso = new Date().toISOString();

    const newSale: SaleRecord = {
      ...data,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      syncStatus: 'synced',
      recordedOffline: false,
      syncedAt: nowIso,
    };

    // 1. UPDATE GRADE-SPECIFIC STOCK
    if (data.gradeId) {
      setProductGrades((prev) =>
        prev.map((g) => {
          if (g.id === data.gradeId) {
            return {
              ...g,
              stockQuantity: Math.max(0, g.stockQuantity - data.quantity),
            };
          }
          return g;
        })
      );
    }

    // 2. UPDATE TOTAL PRODUCT QUANTITY
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === data.productId || p.name.toLowerCase() === data.productName.toLowerCase()) {
          const currentQty = parseFloat(p.quantity || '0') || 0;
          const nextQty = Math.max(0, currentQty - data.quantity);
          return {
            ...p,
            quantity: String(nextQty),
          };
        }
        return p;
      })
    );

    // 3. POST TO CUSTOMER FINANCIAL LEDGER IF CUSTOMER IS REGISTERED
    if (data.customerId) {
      const finalAmount = data.netTotal || data.totalAmount;
      const targetCust = customers.find((c) => c.id === data.customerId);

      if (data.paymentMethod === 'Credit') {
        // Credit sale: DEBIT customer account (increases what customer owes Mandi)
        await addLedgerTransaction({
          customerId: data.customerId,
          customerName: data.customerName,
          customerType: targetCust?.customerType || 'Buyer',
          date: nowIso.split('T')[0],
          type: 'CREDIT_SALE',
          category: 'DEBIT',
          amount: finalAmount,
          paymentMethod: 'Credit',
          referenceNo: newSale.id,
          notes: `Credit Sale: ${data.quantity} ${data.unit} ${data.productName} (${data.gradeName || 'Standard'}) @ ₹${data.unitPrice}`,
          saleId: newSale.id,
        });
      } else {
        // Cash or UPI sale: record both debit bill and credit payment
        await addLedgerTransaction({
          customerId: data.customerId,
          customerName: data.customerName,
          customerType: targetCust?.customerType || 'Buyer',
          date: nowIso.split('T')[0],
          type: 'CASH_RECEIVED',
          category: 'CREDIT',
          amount: finalAmount,
          paymentMethod: data.paymentMethod,
          referenceNo: `BILL-${newSale.id.slice(-6).toUpperCase()}`,
          notes: `Payment for ${data.quantity} ${data.unit} ${data.productName} (${data.paymentMethod})`,
          saleId: newSale.id,
        });
      }
    }

    setSales((prev) => [newSale, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);

    await saveSaleToStorage(newSale);
    return newSale;
  };

  const deleteArrival = (id: string) => {
    setArrivals((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  // =========================================================================
  // MANDI SLIPS, FLOOR CRATE TALLY & SHIFT HANDOVER
  // =========================================================================

  const settleCustomerBalance = (customerId: string, amountToSettle: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const currentPending = c.pendingAmount || 0;
          const updated = Math.max(0, currentPending - amountToSettle);
          return {
            ...c,
            pendingAmount: updated,
            balance: updated > 0 ? `₹ ${updated.toLocaleString('en-IN')} Pending` : 'Settled',
          };
        }
        return c;
      })
    );
  };

  const recordSlip = (
    slipData: Omit<MandiSlip, 'id' | 'slipNumber' | 'date'>
  ): MandiSlip => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = `Today, ${timeStr}`;

    const newSlip: MandiSlip = {
      id: `slip_${Date.now()}`,
      slipNumber: `SLIP-${100 + slips.length + 1}`,
      date: dateFormatted,
      ...slipData,
    };

    // 1. Update physical product inventory in context
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === slipData.productId) {
          const current = parseFloat(p.quantity || '0') || 0;
          const delta = slipData.quantity;
          const updated =
            slipData.type === 'IN'
              ? current + delta
              : Math.max(0, current - delta);
          return { ...p, quantity: updated.toString() };
        }
        return p;
      })
    );

    // 2. If Outward dispatch with balance due, add directly to customer debt
    if (slipData.type === 'OUT') {
      const balanceDue = slipData.balanceAmount || 0;
      if (slipData.customerId || slipData.partyMobile) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (
              (slipData.customerId && c.id === slipData.customerId) ||
              c.mobile === slipData.partyMobile ||
              c.name === slipData.partyName
            ) {
              const currentPending = c.pendingAmount || 0;
              const updatedPending = currentPending + balanceDue;
              return {
                ...c,
                pendingAmount: updatedPending,
                balance: `₹ ${updatedPending.toLocaleString('en-IN')} Pending`,
              };
            }
            return c;
          })
        );
      }
    }

    setSlips((prev) => [newSlip, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
    return newSlip;
  };

  const recordTally = (
    tallyData: Omit<TallyRecord, 'id' | 'time'>
  ): TallyRecord => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeFormatted = `Today, ${timeStr}`;

    const newRecord: TallyRecord = {
      id: `tally_${Date.now()}`,
      time: timeFormatted,
      ...tallyData,
    };

    // Update physical product inventory in context
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === tallyData.productId) {
          const current = parseFloat(p.quantity || '0') || 0;
          const delta = tallyData.count;
          const updated =
            tallyData.mode === 'IN'
              ? current + delta
              : Math.max(0, current - delta);
          return { ...p, quantity: updated.toString() };
        }
        return p;
      })
    );

    // Auto-record corresponding MandiSlip for paperless audit
    const matchingProduct = products.find((p) => p.id === tallyData.productId);
    const rate = matchingProduct ? parseFloat(matchingProduct.price || '0') || 50 : 50;
    const totalAmount = tallyData.count * rate;

    const newSlip: MandiSlip = {
      id: `slip_${Date.now()}`,
      slipNumber: `TALLY-${100 + slips.length + 1}`,
      date: timeFormatted,
      type: tallyData.mode,
      partyName:
        tallyData.partyName?.trim() ||
        (tallyData.mode === 'IN' ? 'Farmer Truck Unload' : 'Market Tempo Dispatch'),
      partyMobile: '9876500000',
      productId: tallyData.productId,
      productName: tallyData.productName,
      category: matchingProduct?.category || 'General',
      quantity: tallyData.count,
      unit: tallyData.unit,
      ratePerUnit: rate,
      totalAmount,
      paidAmount: totalAmount,
      balanceAmount: 0,
      notes: `Counted via Floor Crate Tally. Vehicle: ${tallyData.vehicleNo || 'Floor Direct'}`,
    };

    setSlips((prev) => [newSlip, ...prev]);
    setTallyRecords((prev) => [newRecord, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);

    return newRecord;
  };

  const submitShiftHandover = () => {
    setShiftSubmitted(true);
  };

  // Helper shortcuts for customer product pricing
  const getCustomerProductPrice = useCallback(
    (customerId: string, productId: string, gradeName?: string): number | null => {
      if (!customerId || !productId) return null;
      const matchingRule = pricingRules.find(
        (r) =>
          r.isActive &&
          r.customerId === customerId &&
          r.productId === productId &&
          (!gradeName || !r.gradeName || r.gradeName.toLowerCase() === gradeName.toLowerCase())
      );
      if (matchingRule) return matchingRule.price;

      const cust = customers.find((c) => c.id === customerId);
      if (cust && cust.customPrices) {
        const rule = cust.customPrices.find(
          (cp) =>
            cp.productId === productId &&
            (!gradeName || !cp.gradeName || cp.gradeName.toLowerCase() === gradeName.toLowerCase())
        );
        if (rule) return rule.price;
      }
      return null;
    },
    [pricingRules, customers]
  );

  const setCustomerProductPrice = async (
    customerId: string,
    productId: string,
    price: number,
    gradeName?: string
  ): Promise<void> => {
    const cust = customers.find((c) => c.id === customerId);
    const prod = products.find((p) => p.id === productId);
    const grade = gradeName
      ? productGrades.find(
          (g) => g.productId === productId && g.name.toLowerCase() === gradeName.toLowerCase()
        )
      : undefined;

    await addPricingRule({
      customerId,
      customerName: cust?.name || 'Customer',
      productId,
      productName: prod?.name || 'Product',
      gradeId: grade?.id,
      gradeName: grade?.name || gradeName,
      price,
      effectiveDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });
  };

  // Operator Cash in Drawer: sum of payments collected on sales today + base float
  const operatorCashDrawer =
    slips
      .filter((s) => s.type === 'OUT')
      .reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) + 15000;

  // Owner Financials
  const todaySales =
    slips
      .filter((s) => s.type === 'OUT')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) + 30000;

  const todayProfit = Math.round(todaySales * 0.18);

  const totalUdhaar = customers.reduce(
    (acc, curr) => acc + (curr.pendingAmount || (curr.currentBalance && curr.currentBalance > 0 ? curr.currentBalance : 0)),
    0
  );

  // Metrics calculation
  const totalStockUnits = products.reduce((acc, curr) => {
    const val = parseFloat(curr.quantity || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalInventoryValue = products.reduce((acc, curr) => {
    const qty = parseFloat(curr.quantity || '0');
    const price = parseFloat(curr.price || '0');
    return acc + (isNaN(qty) || isNaN(price) ? 0 : qty * price);
  }, 0);

  const lowStockCount = products.filter((p) => {
    const qty = parseFloat(p.quantity || '0');
    return !isNaN(qty) && qty < 30;
  }).length;

  return (
    <MandiContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loginUser,
        logout,
        switchRole,
        isOwner,
        isOperator,

        canDeleteProduct,
        canAddCategory,
        canManageStaff,
        canViewFinancials,

        staffMembers,
        addStaffMember,

        customers,
        addCustomer,
        updateCustomer,
        categories,
        addCategory,
        products,
        addProduct,
        deleteProduct,
        updateProductQuantity,
        units: availableUnits,

        totalInventoryValue,
        totalStockUnits,
        lowStockCount,
        shiftUpdatesCount,

        // Feature 1: Cash & Debt
        ledgerTransactions,
        addLedgerTransaction,
        getCustomerTransactions,
        getCustomerBalance,
        financialSummary,

        // Feature 2: Product Grades & Wastage
        productGrades,
        wastageRecords,
        addProductGrade,
        updateProductGrade,
        deleteProductGrade,
        toggleGradeActive,
        getProductGrades,
        recordWastageAndSorting,

        // Feature 3: Customer Pricing
        pricingRules,
        addPricingRule,
        updatePricingRule,
        deletePricingRule,
        togglePricingRule,
        getCustomerPrice,

        // Feature 4: Farmer Patti
        pattis,
        generatePatti,

        // Offline Mode & Data Sync
        arrivals,
        sales,
        isOnline,
        isSimulatedOffline,
        isEffectiveOnline,
        isSyncing,
        lastSyncedAt,
        pendingSyncCount,
        pendingArrivalsCount,
        pendingSalesCount,
        syncedRecordsCount,
        failedRecordsCount,
        recordArrival,
        recordSale,
        syncPendingRecords,
        toggleOfflineSimulation,
        deleteArrival,
        deleteSale,

        // Slips and Floor Crate Tally
        slips,
        recordSlip,
        tallyRecords,
        recordTally,

        // Shift & Drawer
        operatorCashDrawer,
        shiftSubmitted,
        submitShiftHandover,

        // Owner Financials & Metrics
        todaySales,
        todayProfit,
        totalUdhaar,

        // Debt & Balance Settlement
        settleCustomerBalance,

        // Customer Pricing Shortcuts
        getCustomerProductPrice,
        setCustomerProductPrice,
      }}
    >
      {children}
    </MandiContext.Provider>
  );
};

export const useMandi = (): MandiContextType => {
  const context = useContext(MandiContext);
  if (!context) {
    throw new Error('useMandi must be used within a MandiProvider');
  }
  return context;
};
