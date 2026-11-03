export type UserRole = 'Owner' | 'Operator';

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

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  business: string;
  balance?: string;
  pendingAmount?: number;
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

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: UnitType | string;
  quantity?: string;
  price?: string;
  costPrice?: string; // Owner-only: purchase cost to calculate profit margin
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

export type MandiSlip = {
  id: string;
  slipNumber: string;
  date: string;
  type: StockMovementType;
  partyName: string;
  partyMobile: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  ratePerUnit: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
};

export type RootStackParamList = {
  Login: undefined;
  Otp: { mobile: string; demoOtp?: string };
  Registration: { mobile?: string } | undefined;
  Home: undefined;
  Customers: undefined;
  AddCustomer: undefined;
  Categories: undefined;
  AddCategory: undefined;
  Products: undefined;
  AddProduct: undefined;
  Staff: undefined;
  CreateSlip: { type?: StockMovementType; productId?: string } | undefined;
  Slips: undefined;
  Khata: undefined; // Owner only: Buyer Credit & Ledger
  CrateTally: { productId?: string; initialMode?: StockMovementType } | undefined; // Operator only: Live Floor Crate Clicker
};
