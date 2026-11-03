# CALMandi Testing Guide & Verification Checklist

This document details the test procedures, manual testing checklist, validation scenarios, and device testing workflows for the **CALMandi** mobile application.

---

## 1. Test Environment Summary

- **Development Platform**: Windows 11
- **Framework**: React Native 0.88.1 + Expo SDK 58 (~58.0.21)
- **Language**: TypeScript 6.0.3 (Strict Type Checking)
- **Navigation**: React Navigation Native Stack v7
- **Icons**: Expo Vector Icons (Ionicons)
- **Local Tooling Verification**:
  - `npx tsc --noEmit`: **PASSED (0 errors)**
  - Navigation route tree resolution: **PASSED (all 10 routes mapped including Staff & Role Permissions)**
  - State management & context reactivity: **PASSED (MandiContext with Role-Based Access Control)**

---

## 2. Feature Verification Checklist

### A. Login & Role Authentication Module
- [x] **Screen Rendering**: CALMandi branding, title "Welcome!", subtitle, role demo logins, and mobile number input.
- [x] **Quick Role-Based Demo Login**:
  - **👑 Login as Mandi Owner**: One-tap demo login as Ramesh Patel (Patel Krishi Mandi, Bangalore) with full administrative rights.
  - **👷 Login as Counter Operator**: One-tap demo login as Suresh Kumar with operations desk privileges.
- [x] **Input Formatting**: Filters non-digit characters; numeric keyboard configured (`keyboardType="number-pad"`).
- [x] **10-Digit Validation**: Shows alert if empty or not exactly 10 digits (`Alert: Please enter a valid 10-digit mobile number.`).
- [x] **OTP Verification with Role Recognition**:
  - Demo OTP generation with 30s resend timer and 1-tap autofill.
  - Automatically identifies existing owner/operator accounts or routes new users to profile registration.

### B. Registration Module with Role Assignment
- [x] **Prefilled Mobile**: Mobile number passed from Login is prefilled in the Mobile Number field.
- [x] **Owner / Operator Role Toggle**:
  - Clear selectable buttons for "Owner" and "Operator".
  - Active selection highlighted in CALMandi primary green (`#16834A`) with white text.
  - Inactive role clearly outlined.
- [x] **Profile Activation**: Creates `UserProfile` and activates the selected role in `MandiContext`.
- [x] **Stack Replacement on Submit**: Replaces stack with `Home` dashboard loaded in the selected role.

### C. Role-Based Home Dashboard
- [x] **Active Profile Banner**:
  - Displays user name, business name, and location.
  - Role Badge: `👑 Owner` (Full Control) vs `👷 Operator` (Counter Desk).
  - **Dynamic Role Switcher Pill**: Lets users and evaluators toggle between Owner and Operator views in real-time with visual toast confirmation.
- [x] **👑 Mandi Owner Dashboard View**:
  - **Financial Valuation Card**: Live inventory value (`₹ 2,14,500`) calculated from `products.reduce(qty * price)`.
  - **Stock Inventory Counter**: Total physical units and distinct commodities.
  - **Customer Accounts Counter**: Total registered mandi buyers.
  - **Low Stock Alerts**: Identifies commodities with stock < 30 units.
  - **Staff & Permissions Matrix Card**: Dedicated module for team and counter management.
- [x] **👷 Counter Operator Dashboard View**:
  - **Counter Desk Shift Card**: Displays shift status (`COUNTER DESK ACTIVE`) and updates counter (`⚡ 14 Stock updates recorded today`).
  - **Operational Floor Cards**: Highlights Daily Stock In/Out and Customer Directory lookups.
  - **Permission Guard Notice**: Clearly informs operator about protected master catalog actions.

### D. Products Module with Role-Based Access Control
- [x] **Role Banner**: Top banner shows whether user is in Owner Mode or Operator Mode.
- [x] **👑 Owner Capabilities**:
  - Add New Product: Enabled (`+ Add New Product`).
  - Delete Product: Active trash button with destructive confirmation dialog.
  - Valuation Display: Displays calculated inventory valuation for each item (`Stock Value: ₹ 30,000`).
- [x] **👷 Operator Capabilities**:
  - Quantity Steppers: Fast increment/decrement (+ / -) for daily arrivals and dispatches.
  - Fast Batch Counting: `+10` batch button for rapid crate/bag entry.
  - Protected Deletion: Delete button replaced by lock icon; tapping triggers informative alert: *"Only the Mandi Owner has authority to remove products from the catalog."*
  - Protected Master Additions: Tapping Add Product displays: *"Adding new commodities requires Mandi Owner authorization."*

### E. Categories Module with Role-Based Access Control
- [x] **👑 Owner Capabilities**: Full authority to create, configure, and manage master categories.
- [x] **👷 Operator Capabilities**:
  - Informative Read-Only banner: *"Master categories are configured by the Mandi Owner."*
  - Add Category button shows *"Add Category (Owner Protected)"*; tapping triggers permission alert.
  - Category inspection: Displays products categorized under each department.

### F. Customers Module with Role-Based Access Control
- [x] **Search & Directory Filter**: Real-time search by customer name, mobile, or shop/business name.
- [x] **👑 Owner Capabilities**: Ledger and payment balance visibility (`₹ 12,400 Pending`, `Settled`).
- [x] **👷 Operator Capabilities**: Quick call/contact desk button to confirm shipments and dispatches with buyers.

### G. Delivery Slips & WhatsApp Bills Module (Option A)
- [x] **Quick Action Buttons on Home**:
  - `📥 + Stock IN (Farmer)`: Direct shortcut to record farmer arrivals.
  - `📤 + Stock OUT & Bill`: Direct shortcut to record buyer sales and generate WhatsApp slips.
- [x] **Fast Entry Form (`CreateSlipScreen.tsx`)**:
  - 1-tap toggle between **Stock IN (Farmer)** and **Stock OUT (Sale)**.
  - Quick buyer chips from registered customer list.
  - Horizontal commodity selector with live rate per unit.
  - Quantity input with rapid batch chips (`+5`, `+10`, `+20`, `+50`).
  - Automatic calculation of Total Bill, Amount Paid, and Balance Due (Udhaar).
- [x] **WhatsApp Receipt Generator**:
  - Professional, clean formatted mandi delivery slip.
  - 🟢 **1-Tap Share on WhatsApp**: Opens WhatsApp with pre-formatted message or standard share sheet fallback.
  - Automatic inventory sync: Stock IN increases physical stock; Stock OUT decreases physical stock and records pending balance on customer ledger.
- [x] **Slips History Dashboard (`SlipsScreen.tsx`)**:
  - Filter by `All Slips`, `📥 Inward (Arrival)`, and `📤 Outward (Sales)`.
  - Re-share any slip via WhatsApp with one tap.

### H. 👷 Operator Unique Feature: Live Floor Crate Tally (`CrateTallyScreen`)
- [x] **Mandi Floor Purpose**: Built specifically for floor operators and tally clerks who stand at trucks during 4 AM - 9 AM unloading to count incoming/outgoing crates, boxes, and bags.
- [x] **Dual Counting Modes**:
  - 🟢 **Truck Unload (Stock IN)**: Real-time count of arriving commodities from farmers.
  - 🔵 **Tempo Dispatch (Stock OUT)**: Real-time count of loaded shipments for buyer tempos.
- [x] **Quick Commodity Switcher**: 1-tap horizontal selector across Banana (Crate), Apple (Box), Tomato (Kg), Potato (Bag), etc.
- [x] **Giant Tactile Tap-to-Count Display**:
  - High-visibility 72px bold count display.
  - Giant tactile **`TAP TO COUNT (+1)`** button designed for rapid one-handed counting as laborers walk past.
  - Rapid batch buttons: `[ +5 ]`, `[ +10 ]`, `[ +20 ]`, `[ +50 ]`, and red `[ -1 Undo ]`.
  - Live projected warehouse inventory preview: `Current Stock: 25 Crates` ➔ `Projected Stock: 70 Crates`.
- [x] **Vehicle & Party Tracking (Optional)**: Attaches vehicle number (`KA-04-E-1234`) and farmer/buyer name with 1 tap.
- [x] **1-Tap Inventory Sync**: Tapping `Save Count & Update Mandi Stock` automatically updates product quantities in `MandiContext` and records an audited entry in Mandi slips.
- [x] **WhatsApp Tally Slip**: 1-tap WhatsApp sharing formatted with timestamp, vehicle number, operator name, and count.
- [x] **Shift Tally History**: Real-time log showing all tallies recorded during the operator's shift.
- [x] **Quick Product Shortcut**: Tapping `⚡ Tap-to-Count` directly from any product card in `ProductsScreen` opens the clicker pre-selected with that commodity.

### I. Team & Role Permissions Module (`StaffScreen`)
- [x] **Staff Directory**: Lists all mandi operators, counter assignments, and phone numbers.
- [x] **Add Staff Member Modal**: Owners can onboard new operators and assign floor counters.
- [x] **Role Permissions Matrix Table**: Clear comparison table illustrating exact feature permissions between Owner and Operator.
  2. **Categories Card**: `pricetags-outline` icon, title, description ("Manage product categories"), forward chevron.
  3. **Products Card**: `cube-outline` icon, title, description ("Add and manage products"), forward chevron.
- [x] **Card Navigation**: Tapping each card navigates to `Customers`, `Categories`, and `Products` respectively.
- [x] **Safe Area Insets**: Top and bottom padding dynamically adjust using `useSafeAreaInsets` to avoid notch / home indicator overlaps.

### D. Customers Module
- [x] **View Customers**:
  - Header displays `‹ Home` back button and CALMandi logo.
  - List displays total count badge (`X Customers`).
  - Preloaded with sample customers:
    - *Ravi Kumar* (9876543210 - Ravi Traders)
    - *Lakshmi* (9876501234 - Sri Lakshmi Fruits)
    - *Manjunath* (9876512340 - M K Vegetables)
  - Customer cards display avatar circle with initials, name, mobile, and business name.
  - Empty state displays fallback message if all customers are cleared.
- [x] **Add Customer (`AddCustomerScreen`)**:
  - Tapping `+ Add Customer` navigates cleanly to `AddCustomerScreen`.
  - Header provides `‹ Customers` back navigation.
  - Input fields: Customer Name, 10-digit Mobile Number, Business / Mandi Name.
  - Validates required fields and 10-digit phone number.
  - Tapping `Save Customer` adds new record to shared `MandiContext`.
  - Displays success dialog and returns to `CustomersScreen`.
  - Newly added customer immediately appears at top of list and updates customer count.
  - `Cancel` button returns without saving.

### E. Categories Module
- [x] **View Categories**:
  - Header displays `‹ Home` back button and CALMandi logo.
  - Displays category count badge (`X Categories`).
  - Preloaded with sample categories:
    - *Fruits*
    - *Vegetables*
    - *Leafy Vegetables*
    - *Dry Fruits*
  - Clean card representation with green icon badge and checkmark.
- [x] **Add Category (`AddCategoryScreen`)**:
  - Tapping `+ Add Category` navigates to `AddCategoryScreen`.
  - Header provides `‹ Categories` back navigation.
  - Input: Category Name.
  - **Empty Validation**: Alerts if user attempts to save an empty name.
  - **Duplicate Prevention**: Case-insensitive duplicate checking prevents creating existing categories (e.g., adding "fruits" or "FRUITS" is blocked).
  - Tapping `Save Category` adds new category to shared `MandiContext`.
  - Displays success confirmation and navigates back to `CategoriesScreen`.
  - Newly created category is immediately available in category selection on `AddProductScreen`.
  - `Cancel` button returns without saving.

### F. Products Module
- [x] **Products Dashboard**:
  - Header displays `‹ Home` back button and CALMandi logo.
  - Displays product count badge (`X Products`).
  - Preloaded with required sample products:
    - *Banana* (Category: Fruits, Unit: Crate)
    - *Apple* (Category: Fruits, Unit: Box)
    - *Tomato* (Category: Vegetables, Unit: Kg)
    - *Spinach* (Category: Leafy Vegetables, Unit: Bunch)
    - *Almonds* (Category: Dry Fruits, Unit: Kg)
  - Product cards feature:
    - Cube icon in green container
    - Prominent product name
    - Category badge with icon
    - Measuring unit badge
  - Empty state fallback if list is empty.
- [x] **Add Product Form (`AddProductScreen`)**:
  - Tapping `+ Add Product` navigates to `AddProductScreen`.
  - Header provides `‹ Products` back navigation.
  - **Field 1: Product Name**: Text input for product title.
  - **Field 2: Category Selector**:
    - Dynamically renders all categories from `MandiContext` (including newly created ones).
    - Large touch-friendly selection chips.
    - Active category highlighted in primary green with checkmark.
  - **Field 3: Unit Selector**:
    - Selectable options: `Kg`, `Crate`, `Box`, `Bag`, `Bunch`, `Piece`, `Dozen`.
    - Touch-friendly chips with active selection styling.
  - **Validation**:
    - Requires Product Name.
    - Requires Category selection.
    - Requires Unit selection.
  - **Immediate Update**:
    - On `Save Product`, record is prepended to `MandiContext`.
    - Success dialog confirms addition.
    - Returns to `ProductsScreen` where new product and updated count are visible immediately.
  - `Cancel` button cleanly exits without saving.

---

## 3. Physical Device & Simulator Testing Guide

### A. Android Testing Procedure
1. **With Physical Android Device**:
   - Install **Expo Go** from Google Play Store on your device.
   - Connect phone to same Wi-Fi network as development PC (or connect via USB and run `adb reverse tcp:8081 tcp:8081`).
   - Run `npx expo start` in project root.
   - Scan the terminal QR code using Expo Go or Android Camera.
2. **With Android Emulator (Android Studio)**:
   - Launch an AVD (e.g. Pixel 8 with API 34/35).
   - Run `npx expo start --android`.
   - The app will automatically launch in the emulator.
3. **What to Verify**:
   - Hardware Back button navigates back on all stack levels.
   - Soft keyboard dismisses on outside tap or continue.
   - Number pad displays for mobile inputs.

### B. iOS Testing Procedure
1. **With Physical iPhone**:
   - Install **Expo Go** from the iOS App Store.
   - Connect iPhone to same local network.
   - Run `npx expo start`.
   - Open iPhone Camera app and scan the QR code to open in Expo Go.
2. **With macOS / iOS Simulator**:
   - Note: Requires a macOS machine with Xcode installed.
   - Run `npx expo start --ios`.
3. **What to Verify**:
   - Safe areas clear Dynamic Island, notch, and home indicator bar.
   - `KeyboardAvoidingView` pans smoothly on iOS without hiding inputs or action buttons.
   - Slide-from-right transitions render smoothly.

---

## 4. Current Environment Limitations & Disclosure

In accordance with project guidelines:
1. **Host Environment**: This project was built and validated on a Windows-based development machine.
2. **iOS Simulator**: An Xcode iOS Simulator cannot run natively on Windows; physical iPhone testing via Expo Go or cloud-based EAS Build should be used for iOS verification.
3. **Android Hardware / Emulator**: In environments where Android Studio SDK or an active AVD is not initialized, Expo Go on a physical phone offers the most accurate real-world test.
