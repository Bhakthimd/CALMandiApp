import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddCustomerScreen from '../screens/AddCustomerScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import StaffScreen from '../screens/StaffScreen';
import RecordArrivalScreen from '../screens/RecordArrivalScreen';
import RecordSaleScreen from '../screens/RecordSaleScreen';
import SyncCenterScreen from '../screens/SyncCenterScreen';

// Feature 1, 2, 3 & Analytics Screens
import CashDebtScreen from '../screens/CashDebtScreen';
import CustomerLedgerScreen from '../screens/CustomerLedgerScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import ProductGradesScreen from '../screens/ProductGradesScreen';
import GradingWastageScreen from '../screens/GradingWastageScreen';
import CustomerPricingScreen from '../screens/CustomerPricingScreen';
import ReportsScreen from '../screens/ReportsScreen';
import PattiReceiptScreen from '../screens/PattiReceiptScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="Staff" component={StaffScreen} />
      <Stack.Screen name="RecordArrival" component={RecordArrivalScreen} />
      <Stack.Screen name="RecordSale" component={RecordSaleScreen} />
      <Stack.Screen name="SyncCenter" component={SyncCenterScreen} />

      {/* Feature 1: Cash & Debt Screens */}
      <Stack.Screen name="CashDebt" component={CashDebtScreen} />
      <Stack.Screen name="CustomerLedger" component={CustomerLedgerScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />

      {/* Feature 2: Product Grades & Wastage Screens */}
      <Stack.Screen name="ProductGrades" component={ProductGradesScreen} />
      <Stack.Screen name="GradingWastage" component={GradingWastageScreen} />

      {/* Feature 3: Customer-Wise Pricing Screen */}
      <Stack.Screen name="CustomerPricing" component={CustomerPricingScreen} />

      {/* Reports & Analytics Hub */}
      <Stack.Screen name="Reports" component={ReportsScreen} />

      {/* Farmer Patti & Bills */}
      <Stack.Screen name="PattiReceipt" component={PattiReceiptScreen} />
    </Stack.Navigator>
  );
}
