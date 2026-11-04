# CALMandi Application Test Plan & Verification Checklist

This document details the test procedures, feature checklist, and verification guidelines for the CALMandi application across all modules.

---

## 1. Environment & Pre-requisites
- **Framework**: React Native with Expo SDK 58
- **TypeScript**: Strict mode typechecking (`npx tsc --noEmit`)
- **Linting**: ESLint configured (`npx eslint .`)
- **State Management**: React Context (`MandiContext.tsx`, `ThemeContext.tsx`)
- **Offline Storage**: SQLite & NetInfo (`offlineStorage.ts`)

---

## 2. Implemented Features Checklist

### A. Branding, Logo & Theme System
- [x] **CALMandi Logo**: Professional brand logo component (`CALMandiLogo.tsx`) with high-resolution asset (`calmandi_logo.png`).
- [x] **Mandi Background**: Atmospheric high-resolution mandi backdrop (`mandi_bg.jpg`) with translucent contrast overlay.
- [x] **Theme Switcher**: Complete Light & Dark themes (`ThemeContext.tsx`, `theme.ts`) with harvest greens (`#16834A`) and mustard accents (`#D97706`).

### B. Welcome Screen & Role Selection
- [x] **Role Selection**: Toggle between `Owner / Vyapari` (मंडी आढ़ती) and `Counter Operator` (काउंटर ऑपरेटर).
- [x] **Tagline**: Prominently displays *"Mandi operations made easy"*.
- [x] **Quick Options**: `Login` and `Register` navigation buttons, with instant demo login for each role.

### C. Cash & Debt Management per Customer
- [x] **Customer Ledgers**: Individual accounting records for each customer (`CustomerLedgerScreen.tsx`).
- [x] **Debt Tracking**: Outstanding debt tracked per customer (`pendingAmount` / `currentBalance`), not per commodity.
- [x] **Add Payment**: Fast cash/UPI payment recording (`AddPaymentScreen.tsx`, `CashDebtScreen.tsx`) to settle debt or record advance.

### D. Product Grades & Wastage
- [x] **Quality Grades**: Each commodity supports multiple grades (Grade A, Grade B, Grade C) with individual grade pricing.
- [x] **Wastage Recording**: Track wastage count and reasons (`GradingWastageScreen.tsx`) with automatic inventory adjustments.
- [x] **Grade-based Transactions**: Dispatches and arrivals specify grade, quantity, and grade rate.

### E. Customer-Specific Pricing Rules
- [x] **Agreed Customer Prices**: Configure custom prices per customer per product/grade (`CustomerPricingScreen.tsx`).
- [x] **Automatic Rate Application**: When a customer is selected during sale/dispatch, agreed price autofills automatically.

### F. Arrival & Dispatch Linked to Customers
- [x] **Arrivals (Stock IN)**: Attached to farmers with vehicle details, gross amounts, and patti generation (`RecordArrivalScreen.tsx`).
- [x] **Dispatches (Stock OUT)**: Attached to buyers with customer balance lookup and live inventory check (`RecordSaleScreen.tsx`, `CreateSlipScreen.tsx`).

### G. Dispatch Confirmation Dialog
- [x] **Confirmation Alert**: Detailed modal summary before completing dispatch (Customer, Product, Grade, Quantity, Total Bill, Upfront Payment, Balance Debt).
- [x] **Upfront Payment**: Cash or UPI collected upfront; remaining balance automatically added to customer's outstanding debt.

### H. Floor Operations & Team
- [x] **Crate Tally Clicker**: Fast tactile counter for arrivals and dispatches on the mandi floor (`CrateTallyScreen.tsx`).
- [x] **Staff Management**: Team directory and role permission matrix (`StaffScreen.tsx`).
- [x] **Offline Synchronization**: Automatic offline queue and SQLite persistence (`SyncCenterScreen.tsx`).

---

## 3. Manual Testing Workflow

1. **Launch & Welcome Screen**:
   - Verify logo, background image, and tagline: *"Mandi operations made easy"*.
   - Toggle Light / Dark mode to ensure readable contrast.
   - Select "Owner" and tap "Instant Demo: Owner" to enter dashboard.

2. **Customer Finance & Debt**:
   - Navigate to Khata / Cash & Debt from the dashboard.
   - Verify each customer shows their total outstanding debt.
   - Record a partial payment (Cash or UPI) and verify debt decreases.

3. **Product Grading & Wastage**:
   - Open Products -> Grades for Banana or Tomato.
   - Verify Grade A, Grade B, Grade C prices.
   - Record wastage of 2 units due to transit damage; verify stock updates.

4. **Customer-Specific Pricing & Dispatch**:
   - Check customer pricing rules for Ravi Traders.
   - Start a Dispatch / Sale for Ravi Traders.
   - Select commodity and Grade A: verify agreed price is auto-applied.
   - Enter Upfront payment of ₹ 500 via UPI.
   - Tap "Confirm & Dispatch": verify confirmation dialog with transaction breakdown.
   - Confirm transaction: verify remaining balance is added to customer's debt.
