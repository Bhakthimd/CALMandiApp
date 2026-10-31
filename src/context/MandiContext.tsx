import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Customer,
  Category,
  Product,
  UnitType,
  UserProfile,
  UserRole,
  StaffMember,
} from '../types';
import {
  initialCustomers,
  initialCategories,
  initialProducts,
  availableUnits,
  demoOwnerProfile,
  initialStaffMembers,
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
}

const MandiContext = createContext<MandiContextType | undefined>(undefined);

export const MandiProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(demoOwnerProfile);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [shiftUpdatesCount, setShiftUpdatesCount] = useState<number>(14);

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
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setShiftUpdatesCount((prev) => prev + 1);
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

    const newProduct: Product = {
      id: Date.now().toString(),
      name: cleanName,
      category,
      unit,
      quantity,
      price,
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
