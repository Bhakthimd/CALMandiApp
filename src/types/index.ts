export type UserRole = 'Owner' | 'Operator';

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'mr' | 'te' | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  subText: string;
  flagEmoji: string;
}

export type UserProfile = {
  id: string;
  name: string;
  mobile: string;
  business: string;
  location: string;
  role: UserRole;
};

export type StaffMember = {
  id: string;
  name: string;
  role: UserRole;
  mobile: string;
  assignedDesk: string;
  status: 'Active' | 'On Leave';
};

export type CustomerType = 'Farmer' | 'Buyer' | 'Trader' | 'Other';

export interface CustomerPricingRule {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  gradeId?: string;
  gradeName?: string;
  price: number;
  effectiveDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (optional)
  isActive?: boolean;
  notes?: string;
  updatedAt?: string;
  createdBy?: string;
}

// Alias for convenience
export type CustomerPriceRule = CustomerPricingRule;

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  business: string;
  customerType?: CustomerType;
  openingBalance?: number; // Positive = Customer owes Mandi; Negative = Mandi owes Customer
  totalPayable?: number; // Amount Mandi owes customer (e.g. farmer arrivals)
  totalReceivable?: number; // Amount customer owes Mandi (e.g. credit sales)
  currentBalance?: number; // Net balance = totalReceivable - totalPayable + (openingBalance || 0)
  balance?: string; // Text representation for backward compatibility (e.g. '₹ 12,400 Pending')
  pendingAmount?: number; // Total outstanding debt across all dispatches
  customPrices?: CustomerPricingRule[]; // Special custom rates per product for this customer
  notes?: string;
  address?: string;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type UnitType =
  | 'Kg'
  | 'Crate'
  | 'Box'
  | 'Bag'
  | 'Bunch'
  | 'Piece'
  | 'Dozen';

export interface ProductGrade {
  id: string;
  productId?: string;
  name: string; // e.g. 'Grade A', 'Grade B', 'Grade C', 'Grade D'
  description?: string; // e.g. 'Premium quality export grade'
  defaultPrice: number; // Default base price per unit
  price?: number; // alias for defaultPrice
  stockQuantity: number; // Current available stock for this grade
  isActive?: boolean;
}

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: UnitType | string;
  quantity?: string; // Total stock across all grades (or ungraded)
  price?: string; // Base/reference price
  costPrice?: string; // Owner-only: purchase cost to calculate profit margin
  grades?: ProductGrade[]; // Multiple quality grades
  ungradedStock?: number; // Stock waiting to be sorted/graded
  wastageQuantity?: number; // Total wastage recorded
  wastageReason?: string;
  image?: string;
};

export type StockMovementType = 'IN' | 'OUT'; // IN: Farmer Arrival, OUT: Buyer Dispatch

export type TallyRecord = {
  id: string;
  time: string;
  productName: string;
  productId: string;
  unit: string;
  count: number;
  mode: StockMovementType;
  vehicleNo?: string;
  partyName?: string;
};

export type SyncStatusType = 'synced' | 'pending' | 'failed';

export type PaymentMethod =
  | 'Cash'
  | 'Credit'
  | 'UPI / Online'
  | 'Bank Transfer'
  | 'Cheque';

export type MandiSlip = {
  id: string;
  slipNumber: string;
  date: string;
  type: StockMovementType; // IN: Arrival, OUT: Dispatch
  customerId?: string; // Attached Customer ID
  partyName: string;
  partyMobile: string;
  productId: string;
  productName: string;
  category: string;
  gradeName?: string; // Specific Grade for this transaction
  quantity: number;
  unit: string;
  ratePerUnit: number; // Price per unit
  totalAmount: number; // quantity * ratePerUnit
  upfrontPayment?: number; // Upfront cash/UPI payment given by customer
  paymentMethod?: PaymentMethod | string;
  paidAmount: number; // Upfront amount paid
  balanceAmount: number; // Remaining amount added to customer's debt
  notes?: string;
};

export type LedgerTransactionType =
  | 'CASH_RECEIVED' // Cash payment received from customer (Credits customer account, lowers receivable)
  | 'CASH_PAID' // Cash payment given to customer (Debits customer account, lowers payable)
  | 'CREDIT_SALE' // Credit sale dispatched to buyer (Debits customer account, raises receivable)
  | 'PURCHASE_CREDIT' // Produce arrival credited to farmer (Credits customer account, raises payable)
  | 'ADVANCE_PAYMENT' // Advance payment
  | 'PARTIAL_PAYMENT' // Partial settlement
  | 'ADJUSTMENT'; // Manual balance adjustment

export interface LedgerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  date: string; // ISO timestamp or YYYY-MM-DD
  type: LedgerTransactionType;
  category: 'DEBIT' | 'CREDIT'; // DEBIT = customer owes more / received money from us; CREDIT = customer paid us / supplied produce
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string; // UTR, Cheque No, or Bill No
  notes?: string;
  balanceAfter?: number; // Running net balance after this entry
  saleId?: string;
  arrivalId?: string;
  pattiId?: string;
  createdAt: string;
  createdBy?: string;
}

export interface WastageRecord {
  id: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  gradeQuantities: Record<string, number>; // gradeId -> quantity assigned
  wastageQuantity: number;
  wastageReason: string; // e.g. 'Spoiled/Rotten', 'Pest Damage', etc.
  wastagePercentage: number;
  remainingUngradedQuantity: number;
  timestamp: string;
  recordedBy?: string;
  notes?: string;
}

export interface FarmerPatti {
  id: string;
  pattiNumber: string;
  arrivalId?: string;
  farmerId: string;
  farmerName: string;
  farmerMobile?: string;
  productName: string;
  gradeName?: string;
  quantity: number;
  unit: string;
  rate: number;
  grossAmount: number;
  commissionRate: number; // e.g. 5%
  commissionAmount: number; // calculated commission
  laborCharges: number; // Hamali / coolie charges
  otherCharges?: number; // Weighment / APMC cess
  netPayable: number; // grossAmount - commissionAmount - laborCharges - otherCharges
  paymentStatus: 'Pending' | 'Paid' | 'Partially Paid';
  date: string;
  notes?: string;
}

export interface ArrivalRecord {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  farmerName: string;
  farmerMobile?: string;
  vehicleNumber?: string;
  lotNumber?: string;
  notes?: string;
  timestamp: string; // ISO string
  syncStatus: SyncStatusType;
  recordedOffline: boolean;
  syncedAt?: string;
  syncError?: string;
  farmerId?: string;
  isGraded?: boolean;
}

export interface SaleRecord {
  id: string;
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  timestamp: string; // ISO string
  syncStatus: SyncStatusType;
  recordedOffline: boolean;
  syncedAt?: string;
  syncError?: string;
  // Grade and Pricing extensions
  gradeId?: string;
  gradeName?: string;
  appliedPriceType?: 'Customer-Specific' | 'Default Grade Price' | 'Manual Override';
  commissionRate?: number;
  commissionAmount?: number;
  otherCharges?: number;
  netTotal?: number;
}

export interface OfflineSyncStats {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isEffectiveOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingArrivalsCount: number;
  pendingSalesCount: number;
  syncedRecordsCount: number;
  failedRecordsCount: number;
  totalPendingCount: number;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: { role?: UserRole } | undefined;
  Otp: { mobile: string; demoOtp?: string; detectedRole?: UserRole };
  Registration: { mobile?: string; role?: UserRole } | undefined;
  Home: undefined;
  Customers: undefined;
  AddCustomer: undefined;
  Categories: undefined;
  AddCategory: undefined;
  Products: { category?: string } | undefined;
  AddProduct: { initialCategory?: string } | undefined;
  Staff: undefined;
  RecordArrival: { productId?: string; farmerId?: string } | undefined;
  RecordSale: { productId?: string; customerId?: string; gradeId?: string } | undefined;
  SyncCenter: undefined;

  // Cash & Debt Screens
  CashDebt: undefined;
  CustomerLedger: { customerId: string };
  AddPayment: { customerId?: string; defaultType?: 'RECEIVE' | 'PAY' } | undefined;

  // Product Grades & Wastage Screens
  ProductGrades: { productId?: string } | undefined;
  GradingWastage: { productId?: string; arrivalId?: string } | undefined;

  // Customer Pricing Screens
  CustomerPricing: { customerId?: string; productId?: string } | undefined;
  AddPricingRule: { ruleId?: string; customerId?: string; productId?: string } | undefined;

  // Reports & Analytics Hub
  Reports: { initialTab?: 'financial' | 'product' } | undefined;

  // Settings & Preferences
  Settings: undefined;

  // Patti & Invoices
  PattiReceipt: { pattiId?: string; saleId?: string; type: 'PATTI' | 'INVOICE' };

  // Slips, Khata & Crate Tally
  CreateSlip: { type?: StockMovementType; productId?: string; customerId?: string } | undefined;
  Slips: undefined;
  Khata: { customerId?: string } | undefined; // Owner only: Buyer Credit & Ledger
  CrateTally: { productId?: string; initialMode?: StockMovementType } | undefined; // Operator only: Live Floor Crate Clicker
};
