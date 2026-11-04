# CALMandi Testing Guide & Verification Checklist

This document details the test procedures, manual testing checklist, validation scenarios, and mobile testing workflows for all features of the **CALMandi** mobile application.

---

## 1. Test Environment Summary

- **Development Platform**: Windows 11
- **Framework**: React Native 0.88.1 + Expo SDK 58 (~58.0.22)
- **Language**: TypeScript 6.0.3 (Strict Type Checking)
- **Navigation**: React Navigation Native Stack v7 (21 routes)
- **Local Database**: Expo SQLite (`expo-sqlite`) with robust in-memory fallback
- **Network Monitor**: `@react-native-community/netinfo`
- **Icons**: Expo Vector Icons (Ionicons)
- **Quality Verification**:
  - `npx tsc --noEmit`: **PASSED (0 errors)**
  - `npx expo lint`: **PASSED (0 errors, 0 warnings)**

---

## 2. Implemented Features Overview

### Feature 1: Customer-Wise Cash & Debt Management (रोकड़ एवं उधारी प्रबंधन)
- **Individual Financial Ledgers**: Farmers, Buyers, Traders, Other customers.
- **Double-Entry Accounting Model**:
  - `DEBIT`: Increases what customer owes Mandi (credit sales, cash paid out to farmers/customers).
  - `CREDIT`: Decreases what customer owes Mandi / increases what Mandi owes farmer (cash received, farmer produce credits).
- **Balance Invariants**:
  - `Net Balance = Opening Balance + Total Debits - Total Credits`
  - Balance indicator badges: `CUSTOMER OWES MANDI (लेने)` vs `MANDI OWES CUSTOMER (देने)` vs `ALL DUES SETTLED`.
- **Payment Recording**:
  - Record Cash Received (जमा) & Make Payment (निकासी).
  - Payment methods: Cash, UPI / Online, Bank Transfer, Cheque.
  - Partial payments, advance payments, and outstanding adjustments supported.
  - Duplicate submission prevention locks.
- **Summary Cards**: Total Receivables, Total Payables, Cash Inflow, Cash Outflow, Net Market Position.
- **Filters**: By Date Range (Today, Last 7D, Last 30D, All Time), Customer Type (Farmers, Buyers, Traders), Search by name/shop/mobile.

### Feature 2: Product Grading and Wastage Management (उत्पाद ग्रेडिंग एवं खराबी प्रबंधन)
- **Configurable Product Grades**:
  - Multiple quality grades per commodity (e.g. Grade A, Grade B, Grade C, Grade D).
  - Configurable grade name, quality description, default unit rate, and active/inactive toggle.
  - Independent grade inventory tracking.
- **Sorting & Wastage Processing**:
  - Original Quantity input (produce received for grading).
  - Grade-wise quantity allotment fields.
  - Wastage quantity input with categorized reason chips (Transportation Damage, Spoiled/Rotten, Pest/Disease, Under-sized, Sorting Residue).
  - **Strict Conservation Math Invariant**:
    $$\text{Total Processed} = \sum(\text{Grade Quantities}) + \text{Wastage} \le \text{Original Quantity}$$
    $$\text{Remaining Ungraded} = \text{Original Quantity} - \text{Total Processed}$$
    $$\text{Wastage } \% = \left(\frac{\text{Wastage Quantity}}{\text{Original Quantity}}\right) \times 100$$
  - Real-time validation warning prevents submission if processed exceeds original.
  - Immediate grade inventory increment and separate wastage tracking.

### Feature 3: Customer-Wise and Product-Wise Pricing (ग्राहक दर सूची)
- **Pricing Rule Engine**:
  - Match hierarchy: Customer + Product + Grade.
  - Configurable agreed price, effective date, optional expiry, and active status.
- **Automated Sale Workflow**:
  - In `RecordSaleScreen`, selecting Customer + Product + Grade automatically queries the pricing engine.
  - If a rule matches: applies the custom rate with a **"★ Agreed Customer Rate"** badge.
  - If no rule matches: falls back to the grade's default price with a **"✓ Default Grade Rate"** badge.
  - Prevents selling more than available grade stock.
  - Deducts stock specifically from the chosen grade.
  - Automatically posts debit or credit entries to the customer's financial ledger.
  - Generates sale bill and invoice slip (`PattiReceipt`).

### Feature 4: Farmer Patti & Buyer Invoices (किसान पर्ची एवं बिल)
- Official Mandi APMC slip generation.
- Farmer Patti: Gross value, 5% Mandi commission deduction, Hamali / labor charges, weighment cess, Net Payable to farmer.
- Buyer Invoice: Commodity, grade, applied custom rate, total amount, payment terms.
- Print and WhatsApp share simulation.

### Feature 5: Reports & Analytics Hub (मंडी रिपोर्ट एवं विश्लेषण)
- **Financial Reports Tab**:
  - Customer-wise outstanding balance table.
  - Total cash received, cash paid, receivables, payables.
  - Filters by date range and customer type.
- **Product Reports Tab**:
  - Grade-wise available stock and valuations.
  - Grade-wise sales volumes and revenue earned.
  - Product-wise wastage quantities and loss percentages.
  - Export/download summary report simulation.

### Feature 6: Offline Mode & Data Sync Integration
- SQLite persistent storage for arrivals, sales, ledger entries, product grades, wastage records, pricing rules, and pattis.
- Zero network interruption: saves locally and updates stock immediately.
- Automatic background synchronization when network returns.

---

## 3. Step-by-Step Testing Instructions

### Test Scenario 1: Cash & Debt Management
1. Open the app and log in (e.g. Owner Login).
2. On the **HomeScreen**, observe the new **Dashboard Shortcuts**:
   - `Cash & Debt (रोकड़ एवं उधारी)`
   - `Product Grades (गुणवत्ता ग्रेडिंग)`
   - `Customer Pricing (ग्राहक दर सूची)`
   - `Reports & Analytics (व्यापार रिपोर्ट)`
3. Tap **"Cash & Debt"**.
4. **Verify Summary Tiles**: Check Total Receivables, Total Payables, Cash Inflow, Cash Outflow.
5. In the directory, filter by **"Farmers"** or **"Buyers"**.
6. Tap on a customer card (e.g. **Ravi Kumar**):
   - Notice the badge: `OWES MANDI (लेने)` with ₹12,400.
7. Tap **"View Full Ledger"**:
   - Verify opening balance (₹6,400), credit sales, running balance.
   - Filter by `Today`, `Last 7D`, `Last 30D`, `All Time`.
8. Tap **"Record Payment Received"**:
   - Direction defaults to "Payment Received (जमा)".
   - Select quick chip `+₹2000` or enter custom amount.
   - Choose method: `Cash` or `UPI / Online`.
   - Observe the real-time **Balance Calculation Preview**.
   - Tap **"Confirm & Receive"**.
   - Observe success alert and verify ledger immediately reflects the reduction in balance.

### Test Scenario 2: Paying a Farmer (Disbursement)
1. On the Cash & Debt screen, filter by **"Farmers"**.
2. Select **Rameshwar Reddy**:
   - Notice the badge: `MANDI OWES (देने)` with ₹8,500.
3. Tap **"Pay Farmer (भुगतान)"**.
4. Enter amount `₹5000` via Cash or Bank Transfer.
5. Tap **"Confirm & Pay"**.
6. **Result**: Mandi owes reduces to ₹3,500. A `CASH_PAID` debit entry is appended to the farmer's ledger.

### Test Scenario 3: Product Grades & Quality Configuration
1. On HomeScreen, tap **"Product Grades"**.
2. Select commodity **"Tomato"**.
3. Observe configured grades:
   - Grade A (Prime salad quality): Rate ₹35/kg, Stock 60 kg.
   - Grade B (Kitchen cooking): Rate ₹28/kg, Stock 70 kg.
   - Grade C (Soft/small): Rate ₹18/kg, Stock 20 kg.
   - Grade D (Culled): Rate ₹5/kg, Stock 0 kg.
4. Tap **"+ Grade"** at the top right to create a new custom grade:
   - Enter Grade Name: `Grade Export`
   - Description: `Uniform 80mm greenhouse tomatoes`
   - Rate: `45`
   - Stock: `25`
   - Tap **"Create Grade"**.
5. **Result**: The new grade appears immediately under Tomato with rate ₹45/kg and stock 25 kg.

### Test Scenario 4: Recording a Grading & Wastage Batch
1. From Product Grades (or HomeScreen shortcut), tap **"Record Grading & Wastage"**.
2. Select **Tomato**.
3. Set **Original Quantity Received**: `100` Kg.
4. In Step 2 (Grade Allotment):
   - Grade A: `40`
   - Grade B: `35`
   - Grade C: `15`
5. In Step 3 (Wastage Tracking):
   - Wastage Quantity: `10`
   - Reason: Select chip **"Transportation Damage / Overripe"**.
6. Check Step 4 (Calculations):
   - Total Graded: `90` Kg
   - Wastage: `10` Kg (10.0%)
   - Total Processed: `100` / `100` Kg
   - Remaining Ungraded: `0` Kg
7. **Validation Check**: Temporarily change Wastage to `20` Kg:
   - Notice the Red Error Banner: `Allocated quantity (110) exceeds original (100)!`
   - The submit button is automatically disabled.
8. Revert Wastage to `10` Kg and tap **"Confirm & Update Grade Stocks"**.
9. **Result**: Grade A stock increases by 40 kg, Grade B by 35 kg, Grade C by 15 kg, and the batch is recorded in the Wastage History log.

### Test Scenario 5: Customer-Specific Pricing & Sale Workflow
1. On HomeScreen, tap **"Customer Pricing"**.
2. Notice existing configured rates:
   - Ravi Kumar -> Tomato Grade A @ ₹32/kg (₹3 discount vs ₹35 standard).
   - Ravi Kumar -> Tomato Grade B @ ₹25/kg (₹3 discount vs ₹28 standard).
   - Lakshmi -> Apple Grade A @ ₹1,750/box.
3. Tap **"+ Add Rate"**:
   - Customer: `Manjunath`
   - Product: `Banana`
   - Grade: `Grade A`
   - Custom Price: `1300` (vs standard ₹1400)
   - Tap **"Confirm & Set Custom Rate"**.
4. Go to **Record Sale** (from HomeScreen or ProductsScreen):
   - Select Buyer: **Ravi Kumar**.
   - Select Commodity: **Tomato**.
   - Select Grade: **Grade A**.
   - **Verify**: The unit price auto-populates as **₹32** with the badge **`★ Agreed Customer Rate`**!
   - Now switch Grade to **Grade B**:
     - The unit price auto-populates as **₹25**!
   - Now switch Buyer to **Lakshmi** or **Walk-In / Other**:
     - The unit price switches to the standard default grade price **₹28** with the badge **`✓ Default Grade Rate`**!
5. Select Buyer: **Ravi Kumar**, Commodity: **Tomato**, Grade: **Grade A**, Quantity: `20` kg, Terms: **Credit**.
6. Tap **"Confirm Sale"**:
   - Grade A stock decreases by 20 kg.
   - Ravi Kumar's ledger receives a `CREDIT_SALE` debit entry of ₹640 (20 × ₹32).
   - Tap **"View Receipt / Bill"** to view the Tax Invoice & Dispatch Memo.

### Test Scenario 6: Inward Arrival to Farmer Patti Workflow
1. On HomeScreen, tap **"Record Arrival"**.
2. Select Commodity: **Tomato**, Quantity: `50` Kg.
3. Tap quick farmer chip: **🌾 Rameshwar Reddy**.
4. Enter vehicle KA-04-E-4512 and tap **"Confirm Arrival & Add to Stock"**.
5. In the confirmation dialog, tap **"Generate Patti"**:
   - The app navigates to **PattiReceiptScreen** showing the official APMC Farmer Settlement Patti:
   - Gross Value: ₹1,750
   - Less 5% Commission: -₹87.50
   - Less Hamali: -₹30
   - **Net Payable to Farmer: ₹1,632.50**
   - Automatically posts ₹1,632.50 to Rameshwar Reddy's ledger.

### Test Scenario 7: Reports & Analytics Hub
1. On HomeScreen, tap **"Reports & Analytics"**.
2. In the **Financial Reports** tab:
   - Review Customer-Wise Balances table.
   - Check Net Market Position.
   - Filter by `Today`, `This Week`, `This Month`, `All Time`.
3. Switch to the **Product & Grades** tab:
   - Filter by commodity (e.g. `Tomato` or `All Products`).
   - Observe **Grade-Wise Available Stock** with estimated values.
   - Observe **Grade-Wise Sales & Revenue**.
   - Observe **Product Wastage Summary** with loss percentages.
4. Tap the **Download / Export** button in the top right to verify export generation.

### Test Scenario 8: Offline-to-Online Synchronization
1. Tap **"Test Offline"** on HomeScreen banner. Banner switches to amber `⚡ OFFLINE MODE`.
2. Record an Arrival of 20 crates of Bananas.
3. Record a Sale of 10 kg Tomatoes.
4. Verify both transactions save locally, stocks update immediately, and Pending Sync counts increment.
5. Tap **"Go Online"** (or toggle simulated offline off).
6. **Result**: Background synchronization automatically uploads the pending arrival and sale records idempotently to Mandi Cloud without duplicates.
