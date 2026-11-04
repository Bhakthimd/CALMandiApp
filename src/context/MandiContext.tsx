import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Customer,
  Category,
  Product,
  UnitType,
  UserProfile,
  UserRole,
  StaffMember,
  MandiSlip,
  TallyRecord,
  CustomerPayment,
  PaymentMode,
} from '../types';
import {
  initialCustomers,
  initialCategories,
  initialProducts,
  availableUnits,
  demoOwnerProfile,
  initialStaffMembers,
  initialSlips,
  initialTallyRecords,
  initialCustomerPayments,
} from '../data/mockData';

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
  settleCustomerBalance: (
    customerId: string,
    amountToSettle: number,
    paymentMode?: PaymentMode,
    notes?: string
  ) => void;
  recordCustomerPayment: (
    customerId: string,
    amount: number,
    paymentMode: PaymentMode,
    notes?: string
  ) => void;
  customerPayments: CustomerPayment[];
  getCustomerHistory: (customerId: string) => {
    dispatches: MandiSlip[];
    payments: CustomerPayment[];
    totalDebt: number;
  };

  categories: Category[];
  addCategory: (name: string) => { success: boolean; error?: string };
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => boolean;
  deleteProduct: (productId: string) => boolean;
  updateProductQuantity: (productId: string, quantity: string) => void;
  units: UnitType[];

  // Delivery Slips & Stock Movement
  slips: MandiSlip[];
  recordSlip: (slipData: Omit<MandiSlip, 'id' | 'slipNumber' | 'date'>) => MandiSlip;

  // Operator-Specific Live Floor Crate Tally (Signature Unique Feature)
  tallyRecords: TallyRecord[];
  recordTally: (tallyData: Omit<TallyRecord, 'id' | 'time'>) => TallyRecord;

  // Operator-Specific Shift & Floor Features
  operatorCashDrawer: number;
  shiftSubmitted: boolean;
  submitShiftHandover: () => void;

  // Owner-Specific Financials
  todaySales: number;
  todayProfit: number;
  totalUdhaar: number;

  // Operational Metrics
  totalInventoryValue: number;
  totalStockUnits: number;
  lowStockCount: number;
  shiftUpdatesCount: number;
}

const MandiContext = createContext<MandiContextType | undefined>(undefined);

export const MandiProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(demoOwnerProfile);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(initialCustomerPayments);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [slips, setSlips] = useState<MandiSlip[]>(initialSlips);
  const [tallyRecords, setTallyRecords] = useState<TallyRecord[]>(initialTallyRecords);
  const [shiftUpdatesCount, setShiftUpdatesCount] = useState<number>(14);
  const [shiftSubmitted, setShiftSubmitted] = useState<boolean>(false);

  const isOwner = currentUser?.role === 'Owner';
  const isOperator = currentUser?.role === 'Operator';

  const canDeleteProduct = isOwner;
  const canAddCategory = isOwner;
  const canManageStaff = isOwner;
  const canViewFinancials = isOwner;

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

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
      balance: customerData.balance || 'Active Customer',
      pendingAmount: customerData.pendingAmount || 0,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMode: PaymentMode,
    notes?: string
  ) => {
    const targetCust = customers.find((c) => c.id === customerId);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const paymentRecord: CustomerPayment = {
      id: `pay_${Date.now()}`,
      customerId,
      customerName: targetCust?.name || 'Customer',
      amount,
      date: `Today, ${timeStr}`,
      timestamp: Date.now(),
      paymentMode,
      notes: notes?.trim() || `Balance settlement via ${paymentMode}`,
    };

    setCustomerPayments((prev) => [paymentRecord, ...prev]);

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const currentPending = c.pendingAmount || 0;
          const updated = Math.max(0, currentPending - amount);
          return {
            ...c,
            pendingAmount: updated,
            balance: updated > 0 ? `₹ ${updated.toLocaleString('en-IN')} Pending` : 'Settled',
          };
        }
        return c;
      })
    );
    setShiftUpdatesCount((prev) => prev + 1);
  };

  const settleCustomerBalance = (
    customerId: string,
    amountToSettle: number,
    paymentMode?: PaymentMode,
    notes?: string
  ) => {
    recordCustomerPayment(customerId, amountToSettle, paymentMode || 'Cash', notes);
  };

  const getCustomerHistory = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer?.name.toLowerCase() || '';
    const customerMobile = customer?.mobile || '';

    const dispatches = slips.filter(
      (s) =>
        s.type === 'OUT' &&
        (s.customerId === customerId ||
          s.partyMobile === customerMobile ||
          s.partyName.toLowerCase() === customerName)
    );

    const payments = customerPayments.filter(
      (p) => p.customerId === customerId || p.customerName.toLowerCase() === customerName
    );

    return {
      dispatches,
      payments,
      totalDebt: customer?.pendingAmount || 0,
    };
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

    const newProduct: Product = {
      id: Date.now().toString(),
      name: cleanName,
      category,
      unit,
      quantity,
      price,
      costPrice: (parseFloat(price || '0') * 0.85).toFixed(0),
    };

    setProducts((prev) => [newProduct, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
    return true;
  };

  const deleteProduct = (productId: string): boolean => {
    if (!canDeleteProduct) {
      return false;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    return true;
  };

  const updateProductQuantity = (productId: string, quantity: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantity } : p))
    );
    setShiftUpdatesCount((prev) => prev + 1);
  };

  // Record Stock Inward / Outward & Generate Mandi Slip
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
      timestamp: Date.now(),
      commissionAmount:
        slipData.commissionAmount ?? Math.round(slipData.totalAmount * 0.05),
      ...slipData,
    };

    // Update physical product inventory automatically
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

    // Debt management per customer (NOT product):
    // If Outward sale with balance pending, update customer debt ledger
    if (slipData.type === 'OUT') {
      setCustomers((prev) => {
        const cleanPartyMobile = slipData.partyMobile.replace(/\D/g, '');
        const cleanPartyName = slipData.partyName.trim().toLowerCase();

        const existingIndex = prev.findIndex(
          (c) =>
            (slipData.customerId && c.id === slipData.customerId) ||
            c.mobile === cleanPartyMobile ||
            c.name.trim().toLowerCase() === cleanPartyName
        );

        if (existingIndex >= 0) {
          return prev.map((c, idx) => {
            if (idx === existingIndex) {
              const currentPending = c.pendingAmount || 0;
              const updatedPending = currentPending + (slipData.balanceAmount || 0);
              return {
                ...c,
                pendingAmount: updatedPending,
                balance:
                  updatedPending > 0
                    ? `₹ ${updatedPending.toLocaleString('en-IN')} Pending`
                    : 'Settled',
              };
            }
            return c;
          });
        } else if (slipData.balanceAmount > 0) {
          // If customer not yet in list, automatically register them with this debt
          const newCust: Customer = {
            id: `cust_${Date.now()}`,
            name: slipData.partyName.trim(),
            mobile: cleanPartyMobile || '9876543210',
            business: `${slipData.partyName.trim()} Shop`,
            pendingAmount: slipData.balanceAmount,
            balance: `₹ ${slipData.balanceAmount.toLocaleString('en-IN')} Pending`,
          };
          return [newCust, ...prev];
        }
        return prev;
      });
    }

    setSlips((prev) => [newSlip, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
    return newSlip;
  };

  // Record Operator Floor Crate Tally (Count Clicker)
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
      timestamp: Date.now(),
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
      paymentMode: 'Cash',
      commissionAmount: Math.round(totalAmount * 0.05),
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

  const todayProfit = Math.round(todaySales * 0.18); // ~18% mandi commission & markup

  const totalUdhaar = customers.reduce(
    (acc, curr) => acc + (curr.pendingAmount || 0),
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
        settleCustomerBalance,
        recordCustomerPayment,
        customerPayments,
        getCustomerHistory,

        categories,
        addCategory,
        products,
        addProduct,
        deleteProduct,
        updateProductQuantity,
        units: availableUnits,

        slips,
        recordSlip,

        tallyRecords,
        recordTally,

        operatorCashDrawer,
        shiftSubmitted,
        submitShiftHandover,

        todaySales,
        todayProfit,
        totalUdhaar,

        totalInventoryValue,
        totalStockUnits,
        lowStockCount,
        shiftUpdatesCount,
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
