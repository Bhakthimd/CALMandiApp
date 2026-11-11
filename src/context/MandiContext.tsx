import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getProductImage, isGenericFallbackImageUrl } from '../utils/productImages';
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
  ArrivalLot,
  SaleRecord,
  LedgerTransaction,
  CustomerPricingRule,
  WastageRecord,
  FarmerPatti,
  MandiSlip,
  TallyRecord,
  DispatchInvoice,
  StockLedgerEntry,
  MandiWorkspace,
  PaymentReminder,
  PaymentReminderMeta,
  PaymentReminderSummary,
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
  demoOperatorProfile,
} from '../data/mockData';
import {
  initOfflineStorage,
  saveArrivalToStorage,
  loadArrivalLotsFromStorage,
  saveSaleToStorage,
  loadArrivalsFromStorage,
  loadSalesFromStorage,
  markArrivalsAsSyncedInStorage,
  markSalesAsSyncedInStorage,
  saveLedgerTransactionToStorage,
  loadLedgerTransactionsFromStorage,
  saveProductGradesToStorage,
  loadProductGradesFromStorage,
  deleteProductGradeFromStorage,
  saveWastageRecordToStorage,
  loadWastageRecordsFromStorage,
  savePricingRuleToStorage,
  loadPricingRulesFromStorage,
  deletePricingRuleFromStorage,
  saveFarmerPattiToStorage,
  loadFarmerPattisFromStorage,
  saveCustomerToStorage,
  loadCustomersFromStorage,
  deleteCustomerFromStorage,
  saveProductToStorage,
  loadProductsFromStorage,
  deleteProductFromStorage,
  saveCategoryToStorage,
  loadCategoriesFromStorage,
  deleteCategoryFromStorage,
  saveUserToStorage,
  loadUsersFromStorage,
  saveWorkspaceToStorage,
  loadWorkspacesFromStorage,
  saveStaffMemberToStorage,
  loadStaffMembersFromStorage,
  saveSlipToStorage,
  loadSlipsFromStorage,
  saveTallyRecordToStorage,
  loadTallyRecordsFromStorage,
  loadDispatchInvoicesFromStorage,
  loadStockLedgerFromStorage,
  savePaymentReminderMetaToStorage,
  loadPaymentReminderMetaFromStorage,
  deletePaymentReminderMetaFromStorage,
  setMetaValue,
  getMetaValue,
} from '../services/offlineStorage';
import {
  processArrivalInventory,
  processGradingAndWastage,
  calculateTotalGradedStock,
  GradingAllocationInput,
} from '../services/inventoryService';
import {
  calculateCustomerFinancials,
  executeDispatchTransaction,
  collectCustomerPayment,
  cancelDispatchInvoice,
  DispatchInvoiceInput,
  PaymentCollectionInput,
} from '../services/financeService';
import {
  computePaymentReminders,
  getReminderSummary,
  addDaysToIsoDate,
  toIsoDate,
} from '../services/reminderService';

export interface FinancialSummary {
  totalCashReceived: number;
  totalCashPaid: number;
  totalReceivable: number;
  totalPayable: number;
  netOutstanding: number;
}

const DEFAULT_WORKSPACE: MandiWorkspace = {
  id: 'ws_patel_mandi',
  name: 'MDessentials',
  location: 'Mysuru',
  ownerId: demoOwnerProfile.id,
  joinCode: 'MYSURU101',
  createdAt: new Date().toISOString(),
};

interface MandiContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  loginUser: (user: UserProfile) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isOwner: boolean;
  isOperator: boolean;

  // Workspace
  currentWorkspace: MandiWorkspace | null;
  workspaces: MandiWorkspace[];
  registerOwner: (params: {
    name: string;
    mobile: string;
    business: string;
    location: string;
    password?: string;
  }) => Promise<UserProfile>;
  registerOperator: (params: {
    name: string;
    mobile: string;
    business?: string;
    location?: string;
    workspaceCode?: string;
    password?: string;
  }) => Promise<UserProfile>;

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
  deleteCustomer: (id: string) => boolean;
  categories: Category[];
  addCategory: (name: string, image?: string) => { success: boolean; error?: string };
  updateCategory: (id: string, updates: Partial<Category>) => { success: boolean; error?: string };
  deleteCategory: (id: string) => { success: boolean; error?: string };
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => boolean;
  deleteProduct: (productId: string) => boolean;
  updateProductQuantity: (productId: string, quantity: string) => void;
  batchAddSelectedProducts: (
    items: { productId: string; quantity: number; unit?: string; mode?: 'ADD' | 'SET' }[]
  ) => { success: boolean; count: number };
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
  collectPayment: (input: PaymentCollectionInput) => Promise<LedgerTransaction>;

  // FEATURE 2: Product Grading and Wastage Management
  productGrades: ProductGrade[];
  wastageRecords: WastageRecord[];
  arrivalLots: ArrivalLot[];
  stockLedger: StockLedgerEntry[];
  addProductGrade: (gradeData: Omit<ProductGrade, 'id'>) => Promise<ProductGrade>;
  updateProductGrade: (id: string, updates: Partial<ProductGrade>) => Promise<boolean>;
  deleteProductGrade: (id: string) => Promise<boolean>;
  toggleGradeActive: (id: string) => Promise<boolean>;
  getProductGrades: (productId: string) => ProductGrade[];
  recordWastageAndSorting: (params: GradingAllocationInput) => Promise<{
    success: boolean;
    error?: string;
    wastageRecord?: WastageRecord;
  }>;

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
  generatePatti: (params: Omit<FarmerPatti, 'id' | 'pattiNumber'>) => Promise<FarmerPatti>;

  // Payment Reminders
  paymentReminders: PaymentReminder[];
  reminderSummary: PaymentReminderSummary;
  markReminderSent: (customerId: string) => Promise<void>;
  updateReminderDueDate: (customerId: string, dueDate: string, notes?: string) => Promise<void>;
  snoozeReminder: (customerId: string, days: number) => Promise<void>;
  clearReminderSnooze: (customerId: string) => Promise<void>;

  // Offline Mode & Data Sync
  arrivals: ArrivalRecord[];
  sales: SaleRecord[];
  dispatchInvoices: DispatchInvoice[];
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
  recordDispatchInvoice: (input: DispatchInvoiceInput) => Promise<DispatchInvoice>;
  cancelDispatch: (invoiceId: string, reason: string) => Promise<boolean>;
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<MandiWorkspace | null>(DEFAULT_WORKSPACE);
  const [workspaces, setWorkspaces] = useState<MandiWorkspace[]>([DEFAULT_WORKSPACE]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shiftUpdatesCount, setShiftUpdatesCount] = useState<number>(0);

  // Financial & Inventory Ledger State
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([]);
  const [productGrades, setProductGrades] = useState<ProductGrade[]>([]);
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>([]);
  const [pricingRules, setPricingRules] = useState<CustomerPricingRule[]>([]);
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [reminderMetas, setReminderMetas] = useState<PaymentReminderMeta[]>([]);
  const [slips, setSlips] = useState<MandiSlip[]>([]);
  const [tallyRecords, setTallyRecords] = useState<TallyRecord[]>([]);
  const [shiftSubmitted, setShiftSubmitted] = useState<boolean>(false);

  // Arrivals & Lots
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [arrivalLots, setArrivalLots] = useState<ArrivalLot[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [dispatchInvoices, setDispatchInvoices] = useState<DispatchInvoice[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>([]);

  // Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isSyncingLockRef = useRef<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const isOwner = currentUser?.role === 'Owner';
  const isOperator = currentUser?.role === 'Operator';

  const canDeleteProduct = isOwner;
  const canAddCategory = isOwner;
  const canManageStaff = isOwner;
  const canViewFinancials = isOwner;

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

  // =========================================================================
  // INITIALIZE OFFLINE STORAGE & LOAD FROM SQLITE
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    async function initStorage() {
      await initOfflineStorage();

      // Load Workspaces & Users
      let storedWorkspaces = await loadWorkspacesFromStorage();
      if (!storedWorkspaces || storedWorkspaces.length === 0) {
        await saveWorkspaceToStorage(DEFAULT_WORKSPACE);
        storedWorkspaces = [DEFAULT_WORKSPACE];
      }
      let storedUsers = await loadUsersFromStorage();
      if (!storedUsers || storedUsers.length === 0) {
        await saveUserToStorage({ ...demoOwnerProfile, workspaceId: DEFAULT_WORKSPACE.id });
        await saveUserToStorage({ ...demoOperatorProfile, workspaceId: DEFAULT_WORKSPACE.id });
        storedUsers = [
          { ...demoOwnerProfile, workspaceId: DEFAULT_WORKSPACE.id },
          { ...demoOperatorProfile, workspaceId: DEFAULT_WORKSPACE.id },
        ];
      }

      // Check for saved session
      const savedSessionMobile = await getMetaValue('current_user_session');
      let activeUser: UserProfile | null = null;
      if (savedSessionMobile) {
        activeUser = storedUsers.find((u) => u.mobile === savedSessionMobile) || null;
      }
      setCurrentUser(activeUser);

      // Load Customers
      let storedCustomers = await loadCustomersFromStorage();
      if (!storedCustomers || storedCustomers.length === 0) {
        for (const c of initialCustomers) {
          await saveCustomerToStorage(c);
        }
        storedCustomers = initialCustomers;
      }

      // Load Categories
      let storedCategories = await loadCategoriesFromStorage();
      if (!storedCategories || storedCategories.length === 0) {
        for (const cat of initialCategories) {
          await saveCategoryToStorage(cat);
        }
        storedCategories = initialCategories;
      }

      // Load Products
      let storedProducts = await loadProductsFromStorage();
      if (!storedProducts || storedProducts.length === 0) {
        for (const p of initialProducts) {
          await saveProductToStorage(p);
        }
        storedProducts = initialProducts;
      }

      // Load Product Grades
      let storedGrades = await loadProductGradesFromStorage();
      if (!storedGrades || storedGrades.length === 0) {
        await saveProductGradesToStorage(initialProductGrades);
        storedGrades = initialProductGrades;
      }

      // Load Arrivals & Lots
      let storedArrivals = await loadArrivalsFromStorage();
      if (!storedArrivals || storedArrivals.length === 0) {
        for (const arr of initialArrivals) {
          await saveArrivalToStorage(arr);
        }
        storedArrivals = initialArrivals;
      }
      const storedLots = await loadArrivalLotsFromStorage();

      // Load Sales & Invoices
      let storedSales = await loadSalesFromStorage();
      if (!storedSales || storedSales.length === 0) {
        for (const s of initialSales) {
          await saveSaleToStorage(s);
        }
        storedSales = initialSales;
      }
      const storedInvoices = await loadDispatchInvoicesFromStorage();

      // Load Financial Ledger
      let storedLedger = await loadLedgerTransactionsFromStorage();
      if (!storedLedger || storedLedger.length === 0) {
        for (const tx of initialLedgerTransactions) {
          await saveLedgerTransactionToStorage(tx);
        }
        storedLedger = initialLedgerTransactions;
      }

      // Load Stock Ledger
      const storedStockLedger = await loadStockLedgerFromStorage();

      // Load Wastage
      let storedWastage = await loadWastageRecordsFromStorage();
      if (!storedWastage || storedWastage.length === 0) {
        for (const w of initialWastageRecords) {
          await saveWastageRecordToStorage(w);
        }
        storedWastage = initialWastageRecords;
      }

      // Load Pricing Rules
      let storedRules = await loadPricingRulesFromStorage();
      if (!storedRules || storedRules.length === 0) {
        for (const r of initialCustomerPricingRules) {
          await savePricingRuleToStorage(r);
        }
        storedRules = initialCustomerPricingRules;
      }

      // Load Pattis
      let storedPattis = await loadFarmerPattisFromStorage();
      if (!storedPattis || storedPattis.length === 0) {
        for (const p of initialFarmerPattis) {
          await saveFarmerPattiToStorage(p);
        }
        storedPattis = initialFarmerPattis;
      }

      // Load Slips & Tally
      let storedSlips = await loadSlipsFromStorage();
      if (!storedSlips || storedSlips.length === 0) {
        for (const sl of initialSlips) {
          await saveSlipToStorage(sl);
        }
        storedSlips = initialSlips;
      }

      let storedTally = await loadTallyRecordsFromStorage();
      if (!storedTally || storedTally.length === 0) {
        for (const t of initialTallyRecords) {
          await saveTallyRecordToStorage(t);
        }
        storedTally = initialTallyRecords;
      }

      // Load Staff
      let storedStaff = await loadStaffMembersFromStorage();
      if (!storedStaff || storedStaff.length === 0) {
        for (const sm of initialStaffMembers) {
          await saveStaffMemberToStorage(sm);
        }
        storedStaff = initialStaffMembers;
      }

      const storedLastSync = await getMetaValue('lastSyncedAt');
      const storedReminderMetas = await loadPaymentReminderMetaFromStorage();

      if (!isMounted) return;

      setCurrentUser(activeUser);
      setWorkspaces(storedWorkspaces);
      setCurrentWorkspace(storedWorkspaces[0] || DEFAULT_WORKSPACE);
      setCustomers(storedCustomers);
      setCategories(storedCategories);
      setProducts(storedProducts);
      setProductGrades(storedGrades);
      setArrivals(storedArrivals);
      setArrivalLots(storedLots || []);
      setSales(storedSales);
      setDispatchInvoices(storedInvoices || []);
      setStockLedger(storedStockLedger || []);
      setLedgerTransactions(storedLedger);
      setWastageRecords(storedWastage);
      setPricingRules(storedRules);
      setPattis(storedPattis);
      setSlips(storedSlips);
      setTallyRecords(storedTally);
      setStaffMembers(storedStaff);
      setReminderMetas(storedReminderMetas || []);

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

  // =========================================================================
  // USER & WORKSPACE REGISTRATION / AUTHENTICATION
  // =========================================================================
  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setMetaValue('current_user_session', user.mobile).catch(() => {});
  };

  const logout = () => {
    setCurrentUser(null);
    setMetaValue('current_user_session', '').catch(() => {});
  };

  const switchRole = (role: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      saveUserToStorage(updated).catch(() => {});
    }
  };

  const registerOwner = async (params: {
    name: string;
    mobile: string;
    business: string;
    location: string;
    password?: string;
  }): Promise<UserProfile> => {
    const cleanedMobile = params.mobile.replace(/\D/g, '');
    const wsId = `ws_${Date.now()}`;
    const code = params.business
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 5)
      .toUpperCase() + Math.floor(100 + Math.random() * 900);

    const newWorkspace: MandiWorkspace = {
      id: wsId,
      name: params.business.trim(),
      location: params.location.trim(),
      ownerId: `usr_${Date.now()}`,
      joinCode: code,
      createdAt: new Date().toISOString(),
    };

    const newOwner: UserProfile = {
      id: newWorkspace.ownerId,
      name: params.name.trim(),
      mobile: cleanedMobile,
      business: params.business.trim(),
      location: params.location.trim(),
      role: 'Owner',
      workspaceId: wsId,
      password: params.password,
    };

    await saveWorkspaceToStorage(newWorkspace);
    await saveUserToStorage(newOwner);

    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setCurrentWorkspace(newWorkspace);
    loginUser(newOwner);

    return newOwner;
  };

  const registerOperator = async (params: {
    name: string;
    mobile: string;
    business?: string;
    location?: string;
    workspaceCode?: string;
    password?: string;
  }): Promise<UserProfile> => {
    const cleanedMobile = params.mobile.replace(/\D/g, '');
    let matchedWs = currentWorkspace;

    if (params.workspaceCode) {
      const found = workspaces.find(
        (w) => w.joinCode.toUpperCase() === params.workspaceCode?.trim().toUpperCase()
      );
      if (found) matchedWs = found;
    }

    const newOperator: UserProfile = {
      id: `usr_op_${Date.now()}`,
      name: params.name.trim(),
      mobile: cleanedMobile,
      business: matchedWs?.name || params.business || 'Mandi Yard',
      location: matchedWs?.location || params.location || 'APMC Yard',
      role: 'Operator',
      workspaceId: matchedWs?.id,
      password: params.password,
    };

    await saveUserToStorage(newOperator);
    loginUser(newOperator);

    return newOperator;
  };

  // Staff management
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
    saveStaffMemberToStorage(newStaff).catch(() => {});
    return true;
  };

  // =========================================================================
  // MASTER ENTITIES: CUSTOMERS, CATEGORIES, PRODUCTS
  // =========================================================================
  const addCustomer = (customerData: Omit<Customer, 'id'>): boolean => {
    const cleanName = customerData.name.trim();
    const cleanMobile = customerData.mobile.replace(/\D/g, '');
    const cleanBusiness = (customerData.business || '').trim() || cleanName;

    if (!cleanName || cleanMobile.length !== 10) {
      return false;
    }

    const openingBalance = customerData.openingBalance || 0;
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
      customerType: customerData.customerType || 'Buyer',
      customerRoles: customerData.customerRoles || (customerData.customerType ? [customerData.customerType] : ['Buyer']),
      openingBalance,
      totalReceivable: openingBalance > 0 ? openingBalance : 0,
      totalPayable: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      currentBalance: openingBalance,
      pendingAmount: openingBalance > 0 ? openingBalance : 0,
      balance:
        openingBalance > 0
          ? `₹ ${openingBalance.toLocaleString()} Pending`
          : openingBalance < 0
          ? `₹ ${Math.abs(openingBalance).toLocaleString()} Mandi Owes`
          : 'Settled (₹ 0)',
      address: customerData.address || '',
      notes: customerData.notes || '',
      createdAt: new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    saveCustomerToStorage(newCustomer).catch(() => {});
    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>): boolean => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          saveCustomerToStorage(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
    return true;
  };

  const deleteCustomer = (id: string): boolean => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    deleteCustomerFromStorage(id).catch(() => {});
    return true;
  };

  const addCategory = (name: string, image?: string): { success: boolean; error?: string } => {
    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, error: 'Please enter a category name.' };
    }
    const alreadyExists = categories.some(
      (cat) => cat.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (alreadyExists) {
      return { success: false, error: `Category "${cleanName}" already exists.` };
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: cleanName,
      image: image || undefined,
    };
    setCategories((prev) => [...prev, newCategory]);
    saveCategoryToStorage(newCategory).catch(() => {});
    return { success: true };
  };

  const updateCategory = (
    id: string,
    updates: Partial<Category>
  ): { success: boolean; error?: string } => {
    let found = false;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          found = true;
          const updated = { ...c, ...updates };
          saveCategoryToStorage(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
    return found ? { success: true } : { success: false, error: 'Category not found' };
  };

  const deleteCategory = (id: string): { success: boolean; error?: string } => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    deleteCategoryFromStorage(id).catch(() => {});
    return { success: true };
  };

  const addProduct = (productData: Omit<Product, 'id'>): boolean => {
    const cleanName = productData.name.trim();
    const category = productData.category.trim();
    const unit = productData.unit.trim();
    const price = productData.price ? productData.price.toString().trim() : '';

    if (!cleanName || !category || !unit) {
      return false;
    }

    const newId = `prod_${Date.now()}`;
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
        stockQuantity: 0,
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
    ];

    const newProduct: Product = {
      id: newId,
      name: cleanName,
      category,
      unit,
      quantity: productData.quantity || '0',
      price,
      costPrice: productData.costPrice || '',
      grades: initialGrades,
      ungradedStock: 0,
      image:
        productData.image && !isGenericFallbackImageUrl(productData.image)
          ? productData.image
          : (() => {
              const resolved = getProductImage({ name: cleanName, category });
              return isGenericFallbackImageUrl(resolved) ? undefined : resolved;
            })(),
    };

    setProducts((prev) => [newProduct, ...prev]);
    setProductGrades((prev) => [...prev, ...initialGrades]);
    saveProductToStorage(newProduct).catch(() => {});
    saveProductGradesToStorage(initialGrades).catch(() => {});

    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const deleteProduct = (productId: string): boolean => {
    if (!canDeleteProduct) return false;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setProductGrades((prev) => prev.filter((g) => g.productId !== productId));
    deleteProductFromStorage(productId).catch(() => {});
    return true;
  };

  const updateProductQuantity = (productId: string, quantity: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, quantity };
          saveProductToStorage(updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );
    setShiftUpdatesCount((prev) => prev + 1);
  };

  const batchAddSelectedProducts = (
    items: { productId: string; quantity: number; unit?: string; mode?: 'ADD' | 'SET' }[]
  ): { success: boolean; count: number } => {
    if (!items || items.length === 0) return { success: false, count: 0 };
    setProducts((prev) => {
      return prev.map((prod) => {
        const match = items.find((it) => it.productId === prod.id);
        if (!match) return prod;
        const currentNum = parseFloat(prod.quantity || '0') || 0;
        const newQty =
          match.mode === 'SET'
            ? Math.max(0, match.quantity)
            : Math.max(0, currentNum + match.quantity);
        const updated: Product = {
          ...prod,
          quantity: String(newQty),
          unit: match.unit || prod.unit,
        };
        saveProductToStorage(updated).catch(() => {});
        return updated;
      });
    });
    setShiftUpdatesCount((prev) => prev + items.length);
    return { success: true, count: items.length };
  };

  // =========================================================================
  // FINANCIAL LEDGER & BALANCES (SINGLE SOURCE OF TRUTH)
  // =========================================================================
  const getCustomerBalance = useCallback(
    (customerId: string) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) {
        return { currentBalance: 0, totalReceivable: 0, totalPayable: 0, openingBalance: 0 };
      }
      return calculateCustomerFinancials(cust, ledgerTransactions);
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

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === txData.customerId) {
          const nextBal = balanceAfter;
          const updated: Customer = {
            ...c,
            currentBalance: nextBal,
            totalReceivable: nextBal > 0 ? nextBal : 0,
            totalPayable: nextBal < 0 ? Math.abs(nextBal) : 0,
            pendingAmount: nextBal > 0 ? nextBal : 0,
            balance:
              nextBal > 0
                ? `₹ ${nextBal.toLocaleString()} Pending`
                : nextBal < 0
                ? `₹ ${Math.abs(nextBal).toLocaleString()} Mandi Owes`
                : 'Settled (₹ 0)',
          };
          saveCustomerToStorage(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );

    await saveLedgerTransactionToStorage(newTx);
    setShiftUpdatesCount((prev) => prev + 1);
    return newTx;
  };

  const collectPayment = async (input: PaymentCollectionInput): Promise<LedgerTransaction> => {
    const cust = customers.find((c) => c.id === input.customerId);
    if (!cust) throw new Error('Customer not found');

    const result = await collectCustomerPayment({
      input: { ...input, createdBy: currentUser?.name },
      customer: cust,
      allTransactions: ledgerTransactions,
    });

    setLedgerTransactions((prev) => [result.transaction, ...prev]);
    setCustomers((prev) =>
      prev.map((c) => (c.id === input.customerId ? result.updatedCustomer : c))
    );
    setShiftUpdatesCount((prev) => prev + 1);
    return result.transaction;
  };

  // Replaces arbitrary pendingAmount modification with unified payment recording
  const settleCustomerBalance = (customerId: string, amountToSettle: number) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    collectPayment({
      customerId,
      customerName: cust.name,
      amount: amountToSettle,
      paymentMethod: 'Cash',
      notes: 'Balance settlement via Buyer Khata',
    }).catch((err) => {
      console.warn('[settleCustomerBalance] Error collecting payment:', err);
    });
  };

  // Financial Summaries
  const financialSummary: FinancialSummary = useMemo(() => {
    let totalCashReceived = 0;
    let totalCashPaid = 0;

    for (const tx of ledgerTransactions) {
      if (tx.type === 'CASH_RECEIVED' || (tx.paymentMethod === 'Cash' && tx.category === 'CREDIT')) {
        totalCashReceived += tx.amount;
      }
      if (tx.type === 'CASH_PAID' || (tx.paymentMethod === 'Cash' && tx.category === 'DEBIT')) {
        totalCashPaid += tx.amount;
      }
    }

    let totalReceivable = 0;
    let totalPayable = 0;

    for (const c of customers) {
      const bal = calculateCustomerFinancials(c, ledgerTransactions);
      if (bal.currentBalance > 0) {
        totalReceivable += bal.currentBalance;
      } else if (bal.currentBalance < 0) {
        totalPayable += Math.abs(bal.currentBalance);
      }
    }

    return {
      totalCashReceived,
      totalCashPaid,
      totalReceivable,
      totalPayable,
      netOutstanding: totalReceivable - totalPayable,
    };
  }, [ledgerTransactions, customers]);

  // =========================================================================
  // PAYMENT REMINDERS (OVERDUE BUYER RECEIVABLES & FARMER SETTLEMENTS)
  // =========================================================================
  const paymentReminders = useMemo(() => {
    return computePaymentReminders({
      customers,
      ledgerTransactions,
      pattis,
      dispatchInvoices,
      reminderMetas,
    });
  }, [customers, ledgerTransactions, pattis, dispatchInvoices, reminderMetas]);

  const reminderSummary = useMemo(() => {
    return getReminderSummary(paymentReminders);
  }, [paymentReminders]);

  const upsertReminderMeta = useCallback(
    async (customerId: string, updater: (existing?: PaymentReminderMeta) => PaymentReminderMeta) => {
      const nowIso = new Date().toISOString();
      let savedMeta!: PaymentReminderMeta;
      setReminderMetas((prev) => {
        const existing = prev.find((m) => m.customerId === customerId);
        savedMeta = updater(existing);
        if (!savedMeta.updatedAt) savedMeta.updatedAt = nowIso;
        const idx = prev.findIndex((m) => m.customerId === customerId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedMeta;
          return next;
        }
        return [...prev, savedMeta];
      });
      await savePaymentReminderMetaToStorage(savedMeta);
    },
    []
  );

  const markReminderSent = useCallback(
    async (customerId: string) => {
      const nowIso = new Date().toISOString();
      await upsertReminderMeta(customerId, (existing) => ({
        customerId,
        customDueDate: existing?.customDueDate,
        snoozedUntil: existing?.snoozedUntil,
        lastRemindedAt: nowIso,
        reminderCount: (existing?.reminderCount || 0) + 1,
        notes: existing?.notes,
        updatedAt: nowIso,
      }));
    },
    [upsertReminderMeta]
  );

  const updateReminderDueDate = useCallback(
    async (customerId: string, dueDate: string, notes?: string) => {
      const nowIso = new Date().toISOString();
      const normalizedDue = toIsoDate(dueDate);
      await upsertReminderMeta(customerId, (existing) => ({
        customerId,
        customDueDate: normalizedDue,
        snoozedUntil: undefined,
        lastRemindedAt: existing?.lastRemindedAt,
        reminderCount: existing?.reminderCount || 0,
        notes: notes !== undefined ? notes : existing?.notes,
        updatedAt: nowIso,
      }));
    },
    [upsertReminderMeta]
  );

  const snoozeReminder = useCallback(
    async (customerId: string, days: number) => {
      const nowIso = new Date().toISOString();
      const todayIso = toIsoDate(nowIso);
      const snoozedUntil = addDaysToIsoDate(todayIso, Math.max(1, days));
      await upsertReminderMeta(customerId, (existing) => ({
        customerId,
        customDueDate: existing?.customDueDate,
        snoozedUntil,
        lastRemindedAt: existing?.lastRemindedAt,
        reminderCount: existing?.reminderCount || 0,
        notes: existing?.notes,
        updatedAt: nowIso,
      }));
    },
    [upsertReminderMeta]
  );

  const clearReminderSnooze = useCallback(async (customerId: string) => {
    const nowIso = new Date().toISOString();
    let shouldDelete = false;
    let updatedMeta: PaymentReminderMeta | null = null;
    setReminderMetas((prev) => {
      const existing = prev.find((m) => m.customerId === customerId);
      if (!existing) return prev;
      if (!existing.customDueDate && !existing.lastRemindedAt && !existing.notes) {
        shouldDelete = true;
        return prev.filter((m) => m.customerId !== customerId);
      }
      updatedMeta = {
        ...existing,
        snoozedUntil: undefined,
        updatedAt: nowIso,
      };
      return prev.map((m) => (m.customerId === customerId ? updatedMeta! : m));
    });
    if (shouldDelete) {
      await deletePaymentReminderMetaFromStorage(customerId);
    } else if (updatedMeta) {
      await savePaymentReminderMetaToStorage(updatedMeta);
    }
  }, []);

  // =========================================================================
  // PRODUCT GRADES & PRICING RULES
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

    const nextGrades = [...productGrades, newGrade];
    setProductGrades(nextGrades);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === gradeData.productId) {
          const proGrades = nextGrades.filter((g) => g.productId === p.id);
          const gradedTotal = calculateTotalGradedStock(proGrades);
          const ungraded = p.ungradedStock || 0;
          const updated = {
            ...p,
            grades: proGrades,
            quantity: String(gradedTotal + ungraded),
          };
          saveProductToStorage(updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );

    await saveProductGradesToStorage(nextGrades);
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
          const gradedTotal = calculateTotalGradedStock(proGrades);
          const ungraded = p.ungradedStock || 0;
          const updated = {
            ...p,
            grades: proGrades,
            quantity: String(gradedTotal + ungraded),
          };
          saveProductToStorage(updated).catch(() => {});
          return updated;
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
          const gradedTotal = calculateTotalGradedStock(proGrades);
          const ungraded = p.ungradedStock || 0;
          const updated = {
            ...p,
            grades: proGrades,
            quantity: String(gradedTotal + ungraded),
          };
          saveProductToStorage(updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );

    await deleteProductGradeFromStorage(id);
    return true;
  };

  // Pricing rules
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
      const product = products.find((p) => p.id === productId);
      const grade = gradeId ? productGrades.find((g) => g.id === gradeId) : undefined;
      const defaultPrice = grade
        ? grade.defaultPrice
        : parseFloat(product?.price || '0') || 20;

      if (!customerId) {
        return { price: defaultPrice, isCustom: false, defaultPrice };
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const matchingRule = pricingRules.find((rule) => {
        if (!rule.isActive) return false;
        if (rule.customerId !== customerId) return false;
        if (rule.productId !== productId) return false;
        if (gradeId && rule.gradeId && rule.gradeId !== gradeId) return false;
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

      return { price: defaultPrice, isCustom: false, defaultPrice };
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
    await deletePricingRuleFromStorage(id);
    return true;
  };

  const togglePricingRule = async (id: string): Promise<boolean> => {
    const rule = pricingRules.find((r) => r.id === id);
    if (!rule) return false;
    return updatePricingRule(id, { isActive: !rule.isActive });
  };

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
      return matchingRule ? matchingRule.price : null;
    },
    [pricingRules]
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

  // =========================================================================
  // ARRIVAL & LOT-BASED GRADING
  // =========================================================================
  const recordArrival = async (
    data: Omit<ArrivalRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ): Promise<ArrivalRecord> => {
    const nowIso = new Date().toISOString();
    const arrivalId = `arr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newArrival: ArrivalRecord = {
      ...data,
      id: arrivalId,
      timestamp: nowIso,
      syncStatus: 'synced',
      recordedOffline: false,
      syncedAt: nowIso,
    };

    let targetProduct = products.find(
      (p) => p.id === data.productId || p.name.toLowerCase() === data.productName.toLowerCase()
    );

    if (!targetProduct) {
      targetProduct = {
        id: data.productId,
        name: data.productName,
        category: data.category,
        unit: data.unit,
        quantity: '0',
        ungradedStock: 0,
      };
    }

    const { arrivalLot, updatedProduct, ledgerEntry } = await processArrivalInventory({
      arrival: newArrival,
      product: targetProduct,
      currentProductGrades: productGrades.filter((g) => g.productId === targetProduct!.id),
    });

    setArrivals((prev) => [newArrival, ...prev]);
    setArrivalLots((prev) => [arrivalLot, ...prev]);
    setStockLedger((prev) => [ledgerEntry, ...prev]);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedProduct.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedProduct;
        return copy;
      }
      return [updatedProduct, ...prev];
    });

    setShiftUpdatesCount((prev) => prev + 1);
    return newArrival;
  };

  const recordWastageAndSorting = async (
    params: GradingAllocationInput
  ): Promise<{ success: boolean; error?: string; wastageRecord?: WastageRecord }> => {
    try {
      const targetProduct = products.find((p) => p.id === params.productId);
      if (!targetProduct) {
        return { success: false, error: 'Product not found.' };
      }

      const lot = params.lotId ? arrivalLots.find((l) => l.id === params.lotId) : undefined;

      const result = await processGradingAndWastage({
        input: { ...params, recordedBy: currentUser?.name },
        product: targetProduct,
        productGrades,
        lot,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === result.updatedProduct.id ? result.updatedProduct : p))
      );
      setProductGrades(result.updatedGrades);
      setWastageRecords((prev) => [result.wastageRecord, ...prev]);
      setStockLedger((prev) => [...result.ledgerEntries, ...prev]);

      if (result.updatedLot) {
        setArrivalLots((prev) =>
          prev.map((l) => (l.id === result.updatedLot!.id ? result.updatedLot! : l))
        );
      }

      setShiftUpdatesCount((prev) => prev + 1);
      return { success: true, wastageRecord: result.wastageRecord };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error processing grading allocation.' };
    }
  };

  // =========================================================================
  // SALES & MULTI-ITEM DISPATCH INVOICES
  // =========================================================================
  const recordDispatchInvoice = async (input: DispatchInvoiceInput): Promise<DispatchInvoice> => {
    const cust = input.customerId ? customers.find((c) => c.id === input.customerId) : undefined;

    const result = await executeDispatchTransaction({
      input: { ...input, createdBy: currentUser?.name },
      customer: cust,
      allCustomers: customers,
      allTransactions: ledgerTransactions,
      products,
      productGrades,
    });

    setDispatchInvoices((prev) => [result.invoice, ...prev]);
    setProducts(result.updatedProducts);
    setProductGrades(result.updatedGrades);

    if (result.updatedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === result.updatedCustomer!.id ? result.updatedCustomer! : c))
      );
    }
    if (result.newTransactions.length > 0) {
      setLedgerTransactions((prev) => [...result.newTransactions, ...prev]);
    }

    setShiftUpdatesCount((prev) => prev + 1);
    return result.invoice;
  };

  // Legacy single-item sales adapter: delegates cleanly to dispatch invoice service
  const recordSale = async (
    data: Omit<SaleRecord, 'id' | 'timestamp' | 'syncStatus' | 'recordedOffline' | 'syncedAt' | 'syncError'>
  ): Promise<SaleRecord> => {
    const nowIso = new Date().toISOString();
    const finalAmount = data.netTotal || data.totalAmount;

    const invoice = await recordDispatchInvoice({
      customerId: data.customerId,
      customerName: data.customerName,
      customerMobile: data.customerMobile,
      items: [
        {
          productId: data.productId,
          productName: data.productName,
          category: data.category,
          gradeId: data.gradeId,
          gradeName: data.gradeName,
          quantity: data.quantity,
          unit: data.unit,
          unitPrice: data.unitPrice,
          totalAmount: data.totalAmount,
          appliedPriceType: data.appliedPriceType,
        },
      ],
      commissionRate: data.commissionRate,
      commissionAmount: data.commissionAmount,
      otherCharges: data.otherCharges,
      cashPaid: data.paymentMethod === 'Cash' ? finalAmount : 0,
      upiPaid: data.paymentMethod === 'UPI / Online' ? finalAmount : 0,
      notes: data.notes,
      createdBy: currentUser?.name,
    });

    const legacySale: SaleRecord = {
      ...data,
      id: invoice.id,
      timestamp: nowIso,
      syncStatus: 'synced',
      recordedOffline: false,
      syncedAt: nowIso,
    };

    setSales((prev) => [legacySale, ...prev]);
    await saveSaleToStorage(legacySale);
    return legacySale;
  };

  const cancelDispatch = async (invoiceId: string, reason: string): Promise<boolean> => {
    const targetInvoice = dispatchInvoices.find((i) => i.id === invoiceId);
    if (!targetInvoice) {
      throw new Error(`Dispatch invoice #${invoiceId} not found.`);
    }
    if (targetInvoice.isReversed) {
      throw new Error('This dispatch invoice has already been cancelled.');
    }

    const cust = targetInvoice.customerId
      ? customers.find((c) => c.id === targetInvoice.customerId)
      : undefined;

    const result = await cancelDispatchInvoice({
      invoice: targetInvoice,
      customer: cust,
      allTransactions: ledgerTransactions,
      products,
      productGrades,
      reason,
      cancelledBy: currentUser?.name,
    });

    setDispatchInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? result.reversedInvoice : i))
    );
    setProducts(result.updatedProducts);
    setProductGrades(result.updatedGrades);

    if (result.updatedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === result.updatedCustomer!.id ? result.updatedCustomer! : c))
      );
    }
    if (result.reversalTransactions.length > 0) {
      setLedgerTransactions((prev) => [...result.reversalTransactions, ...prev]);
    }

    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const deleteArrival = (id: string) => {
    setArrivals((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  // Farmer Patti
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

    if (params.farmerId) {
      await addLedgerTransaction({
        customerId: params.farmerId,
        customerName: params.farmerName,
        customerType: 'Farmer',
        date: params.date || new Date().toISOString().split('T')[0],
        type: 'PURCHASE_CREDIT',
        category: 'CREDIT',
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
  // MANDI SLIPS, FLOOR CRATE TALLY & SHIFT HANDOVER
  // =========================================================================
  const recordSlip = (slipData: Omit<MandiSlip, 'id' | 'slipNumber' | 'date'>): MandiSlip => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = `Today, ${timeStr}`;

    const newSlip: MandiSlip = {
      id: `slip_${Date.now()}`,
      slipNumber: `SLIP-${100 + slips.length + 1}`,
      date: dateFormatted,
      ...slipData,
    };

    // Update physical product inventory in context
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === slipData.productId) {
          const current = parseFloat(p.quantity || '0') || 0;
          const delta = slipData.quantity;
          const updated = slipData.type === 'IN' ? current + delta : Math.max(0, current - delta);
          const next = { ...p, quantity: updated.toString() };
          saveProductToStorage(next).catch(() => {});
          return next;
        }
        return p;
      })
    );

    // If outward dispatch with balance due, post to unified customer ledger
    if (slipData.type === 'OUT' && (slipData.balanceAmount || 0) > 0) {
      const targetCustomer = customers.find(
        (c) =>
          (slipData.customerId && c.id === slipData.customerId) ||
          c.mobile === slipData.partyMobile ||
          c.name === slipData.partyName
      );

      if (targetCustomer) {
        addLedgerTransaction({
          customerId: targetCustomer.id,
          customerName: targetCustomer.name,
          customerType: targetCustomer.customerType || 'Buyer',
          date: new Date().toISOString().split('T')[0],
          type: 'CREDIT_SALE',
          category: 'DEBIT',
          amount: slipData.balanceAmount,
          paymentMethod: slipData.paymentMethod as any || 'Credit',
          referenceNo: newSlip.slipNumber,
          notes: `Slip #${newSlip.slipNumber} for ${slipData.quantity} ${slipData.unit} ${slipData.productName}`,
        }).catch(() => {});
      }
    }

    setSlips((prev) => [newSlip, ...prev]);
    saveSlipToStorage(newSlip).catch(() => {});
    setShiftUpdatesCount((prev) => prev + 1);
    return newSlip;
  };

  const recordTally = (tallyData: Omit<TallyRecord, 'id' | 'time'>): TallyRecord => {
    const matchingProduct = products.find((p) => p.id === tallyData.productId);
    if (!matchingProduct) {
      throw new Error(`Product not found for tally: ${tallyData.productName}`);
    }

    const currentStock = parseFloat(matchingProduct.quantity || '0') || 0;
    const delta = tallyData.count;

    if (tallyData.mode === 'OUT' && delta > currentStock) {
      throw new Error(
        `Insufficient stock: Cannot dispatch ${delta} ${matchingProduct.unit || 'units'}. Current available physical stock is only ${currentStock} ${matchingProduct.unit || 'units'}.`
      );
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeFormatted = `Today, ${timeStr}`;

    const newRecord: TallyRecord = {
      id: `tally_${Date.now()}`,
      time: timeFormatted,
      ...tallyData,
    };

    const updatedQty = tallyData.mode === 'IN' ? currentStock + delta : currentStock - delta;

    // Update physical product inventory in context
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === tallyData.productId) {
          const next = { ...p, quantity: updatedQty.toString() };
          saveProductToStorage(next).catch(() => {});
          return next;
        }
        return p;
      })
    );

    // Auto-record MandiSlip
    const rate = matchingProduct ? parseFloat(matchingProduct.price || '0') || 50 : 50;
    const totalAmount = tallyData.count * rate;

    const newSlip: MandiSlip = {
      id: `slip_${Date.now()}`,
      slipNumber: `TALLY-${100 + slips.length + 1}`,
      date: timeFormatted,
      type: tallyData.mode,
      partyName:
        tallyData.partyName?.trim() ||
        (tallyData.mode === 'IN' ? 'Farmer Floor Unload' : 'Market Tempo Dispatch'),
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
    saveSlipToStorage(newSlip).catch(() => {});
    setTallyRecords((prev) => [newRecord, ...prev]);
    saveTallyRecordToStorage(newRecord).catch(() => {});
    setShiftUpdatesCount((prev) => prev + 1);
    return newRecord;
  };

  const submitShiftHandover = () => {
    setShiftSubmitted(true);
  };

  // =========================================================================
  // REAL OPERATIONAL FINANCIALS (NO HARDCODED OPERATIONAL ARTIFACTS)
  // =========================================================================
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Dispatches today from dispatch invoices
  const todayInvoices = dispatchInvoices.filter(
    (i) => i.timestamp.startsWith(todayDateStr) && !i.isReversed
  );

  // Sales revenue today: calculated from actual dispatch records
  const todaySales =
    todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) +
    sales.filter((s) => s.timestamp.startsWith(todayDateStr)).reduce((sum, s) => sum + s.totalAmount, 0);

  // Actual cash collected today
  const cashCollectedToday =
    todayInvoices.reduce((sum, inv) => sum + (inv.cashPaid || 0), 0) +
    ledgerTransactions
      .filter((tx) => tx.date === todayDateStr && (tx.type === 'CASH_RECEIVED' || (tx.paymentMethod === 'Cash' && tx.category === 'CREDIT')))
      .reduce((sum, tx) => sum + tx.amount, 0);

  // Cash in drawer = actual cash collections today
  const operatorCashDrawer = cashCollectedToday;

  // Real gross profit: only calculated where costPrice is explicitly defined
  const todayProfit = useMemo(() => {
    let profit = 0;
    for (const inv of todayInvoices) {
      for (const item of inv.items) {
        const prod = products.find((p) => p.id === item.productId);
        const costPriceNum = parseFloat(prod?.costPrice || '0') || 0;
        if (costPriceNum > 0) {
          profit += (item.unitPrice - costPriceNum) * item.quantity;
        }
      }
    }
    return Math.round(profit);
  }, [todayInvoices, products]);

  // Total Udhaar: sum of actual outstanding receivables from customer ledger
  const totalUdhaar = useMemo(() => {
    let total = 0;
    for (const c of customers) {
      const bal = calculateCustomerFinancials(c, ledgerTransactions);
      if (bal.currentBalance > 0) {
        total += bal.currentBalance;
      }
    }
    return total;
  }, [customers, ledgerTransactions]);

  // Inventory metrics
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, curr) => {
      const val = parseFloat(curr.quantity || '0');
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, curr) => {
      const qty = parseFloat(curr.quantity || '0');
      const price = parseFloat(curr.price || '0');
      return acc + (isNaN(qty) || isNaN(price) ? 0 : qty * price);
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const qty = parseFloat(p.quantity || '0');
      return !isNaN(qty) && qty < 30;
    }).length;
  }, [products]);

  // Sync simulation
  const toggleOfflineSimulation = (forced?: boolean) => {
    setIsSimulatedOffline((prev) => (forced !== undefined ? forced : !prev));
  };

  const syncPendingRecords = useCallback(async (): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
  }> => {
    if (!isEffectiveOnline) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Cannot synchronize while in Offline Mode.',
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
        message: 'All records are up to date locally.',
      };
    }

    isSyncingLockRef.current = true;
    setIsSyncing(true);

    try {
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
        message: `Successfully synchronized ${totalToSync} records locally!`,
      };
    } catch {
      isSyncingLockRef.current = false;
      setIsSyncing(false);
      return {
        success: false,
        syncedCount: 0,
        message: 'Synchronization failed. Records remain safely stored offline.',
      };
    }
  }, [isEffectiveOnline, arrivals, sales]);

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

        currentWorkspace,
        workspaces,
        registerOwner,
        registerOperator,

        canDeleteProduct,
        canAddCategory,
        canManageStaff,
        canViewFinancials,

        staffMembers,
        addStaffMember,

        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        deleteProduct,
        updateProductQuantity,
        batchAddSelectedProducts,
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
        collectPayment,

        // Feature 2: Product Grades, Wastage & Lots
        productGrades,
        wastageRecords,
        arrivalLots,
        stockLedger,
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

        // Payment Reminders
        paymentReminders,
        reminderSummary,
        markReminderSent,
        updateReminderDueDate,
        snoozeReminder,
        clearReminderSnooze,

        // Offline Mode & Data Sync
        arrivals,
        sales,
        dispatchInvoices,
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
        recordDispatchInvoice,
        cancelDispatch,
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
