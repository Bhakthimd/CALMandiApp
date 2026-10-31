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
};
