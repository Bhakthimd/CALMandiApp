import { Customer, Category, Product, UnitType, UserProfile, StaffMember } from '../types';

export const demoOwnerProfile: UserProfile = {
  id: 'usr_owner_1',
  name: 'Ramesh Patel',
  mobile: '9876543210',
  business: 'Patel Krishi Mandi',
  location: 'APMC Market Yard, Bangalore',
  role: 'Owner',
};

export const demoOperatorProfile: UserProfile = {
  id: 'usr_operator_1',
  name: 'Suresh Kumar',
  mobile: '9876509876',
  business: 'Patel Krishi Mandi',
  location: 'APMC Market Yard, Bangalore',
  role: 'Operator',
};

export const initialStaffMembers: StaffMember[] = [
  {
    id: 'staff_1',
    name: 'Ramesh Patel',
    role: 'Owner',
    mobile: '9876543210',
    assignedDesk: 'Executive Mandi Office',
    status: 'Active',
  },
  {
    id: 'staff_2',
    name: 'Suresh Kumar',
    role: 'Operator',
    mobile: '9876509876',
    assignedDesk: 'Arrival Counter #1',
    status: 'Active',
  },
  {
    id: 'staff_3',
    name: 'Anil Gowda',
    role: 'Operator',
    mobile: '9876512399',
    assignedDesk: 'Weighbridge & Dispatch Desk',
    status: 'Active',
  },
  {
    id: 'staff_4',
    name: 'Priya Sharma',
    role: 'Operator',
    mobile: '9876534567',
    assignedDesk: 'Daily Tally & Cash Counter',
    status: 'Active',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ravi Kumar',
    mobile: '9876543210',
    business: 'Ravi Traders',
    balance: '₹ 12,400 Pending',
  },
  {
    id: '2',
    name: 'Lakshmi',
    mobile: '9876501234',
    business: 'Sri Lakshmi Fruits',
    balance: 'Settled',
  },
  {
    id: '3',
    name: 'Manjunath',
    mobile: '9876512340',
    business: 'M K Vegetables',
    balance: '₹ 4,800 Pending',
  },
];

export const initialCategories: Category[] = [
  { id: '1', name: 'Fruits' },
  { id: '2', name: 'Vegetables' },
  { id: '3', name: 'Leafy Vegetables' },
  { id: '4', name: 'Dry Fruits' },
];

export const availableUnits: UnitType[] = [
  'Kg',
  'Crate',
  'Box',
  'Bag',
  'Bunch',
  'Piece',
  'Dozen',
];

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Banana',
    category: 'Fruits',
    unit: 'Crate',
    quantity: '25',
    price: '1200',
  },
  {
    id: '2',
    name: 'Apple',
    category: 'Fruits',
    unit: 'Box',
    quantity: '40',
    price: '1500',
  },
  {
    id: '3',
    name: 'Tomato',
    category: 'Vegetables',
    unit: 'Kg',
    quantity: '150',
    price: '30',
  },
  {
    id: '4',
    name: 'Spinach',
    category: 'Leafy Vegetables',
    unit: 'Bunch',
    quantity: '80',
    price: '15',
  },
  {
    id: '5',
    name: 'Almonds',
    category: 'Dry Fruits',
    unit: 'Kg',
    quantity: '50',
    price: '850',
  },
];
