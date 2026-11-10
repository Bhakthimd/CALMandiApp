import {
  Customer,
  DispatchInvoice,
  DispatchLineItem,
  LedgerTransaction,
  Product,
  ProductGrade,
  PaymentMethod,
} from '../types';
import {
  saveDispatchInvoiceToStorage,
  saveLedgerTransactionToStorage,
  saveCustomerToStorage,
  runInTransaction,
} from './offlineStorage';
import { deductDispatchStock, reverseDispatchStock } from './inventoryService';

export interface DispatchInvoiceInput {
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  items: Omit<DispatchLineItem, 'id' | 'invoiceId'>[];
  commissionRate?: number;
  commissionAmount?: number;
  otherCharges?: number;
  cashPaid: number;
  upiPaid: number;
  notes?: string;
  createdBy?: string;
}

export interface PaymentCollectionInput {
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  createdBy?: string;
}

/**
 * Calculates a customer's exact financial position from their opening balance and financial ledger
 * Convention:
 * Positive currentBalance = Customer owes Mandi (Receivable / Debt)
 * Negative currentBalance = Mandi owes Customer (Payable, e.g. for farmer arrivals)
 */
export function calculateCustomerFinancials(
  customer: Customer,
  transactions: LedgerTransaction[]
): {
  currentBalance: number;
  totalReceivable: number;
  totalPayable: number;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
} {
  const opening = customer.openingBalance || 0;
  const customerTxs = transactions.filter((tx) => tx.customerId === customer.id);

  let totalDebits = 0; // Increases what customer owes Mandi
  let totalCredits = 0; // Decreases customer debt / payments made / farmer produce supplied

  for (const tx of customerTxs) {
    if (tx.category === 'DEBIT') {
      totalDebits += tx.amount;
    } else if (tx.category === 'CREDIT') {
      totalCredits += tx.amount;
    }
  }

  const currentBalance = opening + totalDebits - totalCredits;
  const totalReceivable = currentBalance > 0 ? currentBalance : 0;
  const totalPayable = currentBalance < 0 ? Math.abs(currentBalance) : 0;

  return {
    currentBalance,
    totalReceivable,
    totalPayable,
    openingBalance: opening,
    totalDebits,
    totalCredits,
  };
}

/**
 * Executes a complete, atomic Dispatch Invoice transaction:
 * 1. Validates all inputs, line items, and stock
 * 2. Deducts grade-specific inventory
 * 3. Saves invoice and line items
 * 4. Posts invoice DEBIT to customer financial ledger
 * 5. Posts Cash and/or UPI CREDIT payments to financial ledger
 * 6. Updates customer balance atomically
 */
export async function executeDispatchTransaction(params: {
  input: DispatchInvoiceInput;
  customer?: Customer;
  allCustomers: Customer[];
  allTransactions: LedgerTransaction[];
  products: Product[];
  productGrades: ProductGrade[];
}): Promise<{
  invoice: DispatchInvoice;
  updatedProducts: Product[];
  updatedGrades: ProductGrade[];
  updatedCustomer?: Customer;
  newTransactions: LedgerTransaction[];
}> {
  const { input, customer, allTransactions, products, productGrades } = params;

  if (!input.items || input.items.length === 0) {
    throw new Error('Dispatch invoice must contain at least one product line item.');
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of input.items) {
    if (item.quantity <= 0) {
      throw new Error(`Quantity for ${item.productName} must be greater than zero.`);
    }
    if (item.unitPrice < 0) {
      throw new Error(`Price for ${item.productName} cannot be negative.`);
    }
    subtotal += item.quantity * item.unitPrice;
  }

  const commRate = input.commissionRate || 0;
  const commAmount = input.commissionAmount !== undefined ? input.commissionAmount : (subtotal * commRate) / 100;
  const otherCharges = input.otherCharges || 0;
  const totalAmount = subtotal + commAmount + otherCharges;

  const cashPaid = Math.max(0, input.cashPaid || 0);
  const upiPaid = Math.max(0, input.upiPaid || 0);
  const totalPaid = cashPaid + upiPaid;

  if (totalPaid > totalAmount) {
    throw new Error(
      `Total upfront payment (₹${totalPaid.toLocaleString()}) cannot exceed total invoice amount (₹${totalAmount.toLocaleString()}).`
    );
  }

  const outstandingDebt = totalAmount - totalPaid;
  const nowIso = new Date().toISOString();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const lineItems: DispatchLineItem[] = input.items.map((item, idx) => ({
    ...item,
    id: `item_${invoiceId}_${idx + 1}`,
    invoiceId,
    totalAmount: item.quantity * item.unitPrice,
  }));

  const paymentMethodLabel =
    cashPaid > 0 && upiPaid > 0
      ? 'Cash + UPI'
      : cashPaid > 0
      ? 'Cash'
      : upiPaid > 0
      ? 'UPI / Online'
      : 'Credit';

  const invoice: DispatchInvoice = {
    id: invoiceId,
    invoiceNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    customerMobile: input.customerMobile,
    items: lineItems,
    subtotal,
    commissionRate: commRate,
    commissionAmount: commAmount,
    otherCharges,
    totalAmount,
    cashPaid,
    upiPaid,
    totalPaid,
    outstandingDebt,
    paymentMethod: paymentMethodLabel,
    notes: input.notes,
    timestamp: nowIso,
    syncStatus: 'synced',
    createdBy: input.createdBy,
  };

  // 1. Deduct Stock atomically
  const stockResult = await deductDispatchStock({
    items: lineItems.map((li) => ({
      productId: li.productId,
      productName: li.productName,
      gradeId: li.gradeId,
      gradeName: li.gradeName,
      quantity: li.quantity,
      unit: li.unit,
    })),
    products,
    productGrades,
    invoiceId,
    recordedBy: input.createdBy,
  });

  const newTransactions: LedgerTransaction[] = [];
  let updatedCustomer: Customer | undefined;

  // 2. Post to Customer Financial Ledger if registered customer
  if (input.customerId && customer) {
    let runningBalance = calculateCustomerFinancials(customer, allTransactions).currentBalance;

    // A. Invoice Bill: DEBIT customer account (adds to debt)
    runningBalance += totalAmount;
    const debitTx: LedgerTransaction = {
      id: `tx_${Date.now()}_bill_${Math.random().toString(36).substring(2, 6)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.customerType || 'Buyer',
      date: nowIso.split('T')[0],
      type: 'CREDIT_SALE',
      category: 'DEBIT',
      amount: totalAmount,
      paymentMethod: paymentMethodLabel as any,
      referenceNo: invoiceNumber,
      notes: `Dispatch Bill ${invoiceNumber} (${lineItems.length} items): ${lineItems
        .map((li) => `${li.quantity} ${li.unit} ${li.productName} ${li.gradeName || ''}`)
        .join(', ')}`,
      balanceAfter: runningBalance,
      saleId: invoiceId,
      createdAt: nowIso,
      createdBy: input.createdBy,
    };
    newTransactions.push(debitTx);

    // B. Upfront Cash Payment: CREDIT customer account
    if (cashPaid > 0) {
      runningBalance -= cashPaid;
      const cashTx: LedgerTransaction = {
        id: `tx_${Date.now()}_cash_${Math.random().toString(36).substring(2, 6)}`,
        customerId: customer.id,
        customerName: customer.name,
        customerType: customer.customerType || 'Buyer',
        date: nowIso.split('T')[0],
        type: 'CASH_RECEIVED',
        category: 'CREDIT',
        amount: cashPaid,
        paymentMethod: 'Cash',
        referenceNo: `${invoiceNumber}-CASH`,
        notes: `Upfront Cash payment for Bill ${invoiceNumber}`,
        balanceAfter: runningBalance,
        saleId: invoiceId,
        createdAt: nowIso,
        createdBy: input.createdBy,
      };
      newTransactions.push(cashTx);
    }

    // C. Upfront UPI Payment: CREDIT customer account
    if (upiPaid > 0) {
      runningBalance -= upiPaid;
      const upiTx: LedgerTransaction = {
        id: `tx_${Date.now()}_upi_${Math.random().toString(36).substring(2, 6)}`,
        customerId: customer.id,
        customerName: customer.name,
        customerType: customer.customerType || 'Buyer',
        date: nowIso.split('T')[0],
        type: 'CASH_RECEIVED',
        category: 'CREDIT',
        amount: upiPaid,
        paymentMethod: 'UPI / Online',
        referenceNo: `${invoiceNumber}-UPI`,
        notes: `Upfront UPI payment for Bill ${invoiceNumber}`,
        balanceAfter: runningBalance,
        saleId: invoiceId,
        createdAt: nowIso,
        createdBy: input.createdBy,
      };
      newTransactions.push(upiTx);
    }

    updatedCustomer = {
      ...customer,
      currentBalance: runningBalance,
      totalReceivable: runningBalance > 0 ? runningBalance : 0,
      totalPayable: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      pendingAmount: runningBalance > 0 ? runningBalance : 0,
      balance:
        runningBalance > 0
          ? `₹ ${runningBalance.toLocaleString()} Pending`
          : runningBalance < 0
          ? `₹ ${Math.abs(runningBalance).toLocaleString()} Mandi Owes`
          : 'Settled (₹ 0)',
    };
  }

  // Commit invoice, ledger transactions and customer record
  runInTransaction(() => {
    saveDispatchInvoiceToStorage(invoice);
    for (const tx of newTransactions) {
      saveLedgerTransactionToStorage(tx);
    }
    if (updatedCustomer) {
      saveCustomerToStorage(updatedCustomer);
    }
  });

  return {
    invoice,
    updatedProducts: stockResult.updatedProducts,
    updatedGrades: stockResult.updatedGrades,
    updatedCustomer,
    newTransactions,
  };
}

/**
 * Collects a customer repayment / payment:
 * - Validates amount > 0
 * - Credits the customer account
 * - Lowers outstanding debt
 * - Creates a ledger transaction
 */
export async function collectCustomerPayment(params: {
  input: PaymentCollectionInput;
  customer: Customer;
  allTransactions: LedgerTransaction[];
}): Promise<{
  transaction: LedgerTransaction;
  updatedCustomer: Customer;
}> {
  const { input, customer, allTransactions } = params;

  if (input.amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const nowIso = new Date().toISOString();
  const currentBal = calculateCustomerFinancials(customer, allTransactions).currentBalance;

  // Receiving payment credits the customer account, reducing debt
  const balanceAfter = currentBal - input.amount;

  const transaction: LedgerTransaction = {
    id: `tx_${Date.now()}_pmt_${Math.random().toString(36).substring(2, 6)}`,
    customerId: customer.id,
    customerName: customer.name,
    customerType: customer.customerType || 'Buyer',
    date: nowIso.split('T')[0],
    type: 'CASH_RECEIVED',
    category: 'CREDIT',
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    referenceNo: input.referenceNo || `RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: input.notes || `Repayment received via ${input.paymentMethod}`,
    balanceAfter,
    createdAt: nowIso,
    createdBy: input.createdBy,
  };

  const updatedCustomer: Customer = {
    ...customer,
    currentBalance: balanceAfter,
    totalReceivable: balanceAfter > 0 ? balanceAfter : 0,
    totalPayable: balanceAfter < 0 ? Math.abs(balanceAfter) : 0,
    pendingAmount: balanceAfter > 0 ? balanceAfter : 0,
    balance:
      balanceAfter > 0
        ? `₹ ${balanceAfter.toLocaleString()} Pending`
        : balanceAfter < 0
        ? `₹ ${Math.abs(balanceAfter).toLocaleString()} Mandi Owes`
        : 'Settled (₹ 0)',
  };

  runInTransaction(() => {
    saveLedgerTransactionToStorage(transaction);
    saveCustomerToStorage(updatedCustomer);
  });

  return { transaction, updatedCustomer };
}

/**
 * Cancels / reverses a dispatch invoice:
 * - Re-credits the grade-wise stock
 * - Reverses the debt balance on customer ledger
 * - Marks the invoice as reversed
 */
export async function cancelDispatchInvoice(params: {
  invoice: DispatchInvoice;
  customer?: Customer;
  allTransactions: LedgerTransaction[];
  products: Product[];
  productGrades: ProductGrade[];
  reason: string;
  cancelledBy?: string;
}): Promise<{
  reversedInvoice: DispatchInvoice;
  updatedProducts: Product[];
  updatedGrades: ProductGrade[];
  updatedCustomer?: Customer;
  reversalTransactions: LedgerTransaction[];
}> {
  const { invoice, customer, allTransactions, products, productGrades, reason, cancelledBy } = params;

  if (invoice.isReversed) {
    throw new Error('This dispatch invoice has already been cancelled.');
  }

  const nowIso = new Date().toISOString();

  // 1. Re-credit stock via inventory service
  const stockResult = await reverseDispatchStock({
    items: invoice.items.map((li) => ({
      productId: li.productId,
      productName: li.productName,
      gradeId: li.gradeId,
      gradeName: li.gradeName,
      quantity: li.quantity,
      unit: li.unit,
    })),
    products,
    productGrades,
    invoiceId: invoice.id,
    reason,
    recordedBy: cancelledBy,
  });

  const reversalTransactions: LedgerTransaction[] = [];
  let updatedCustomer: Customer | undefined;

  // 2. Adjust customer ledger if customer was attached
  if (invoice.customerId && customer) {
    let runningBalance = calculateCustomerFinancials(customer, allTransactions).currentBalance;

    // Credit the invoice total back to eliminate the original debit bill
    runningBalance -= invoice.totalAmount;

    // If customer paid upfront cash/UPI, they are owed a refund/credit for that payment
    if (invoice.totalPaid > 0) {
      runningBalance += invoice.totalPaid; // Debit back the upfront cash received
    }

    const reversalTx: LedgerTransaction = {
      id: `tx_${Date.now()}_rev_${Math.random().toString(36).substring(2, 6)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.customerType || 'Buyer',
      date: nowIso.split('T')[0],
      type: 'ADJUSTMENT',
      category: 'CREDIT',
      amount: invoice.outstandingDebt,
      paymentMethod: 'Credit',
      referenceNo: `REV-${invoice.invoiceNumber}`,
      notes: `Reversal of cancelled dispatch ${invoice.invoiceNumber}. Reason: ${reason}`,
      balanceAfter: runningBalance,
      saleId: invoice.id,
      createdAt: nowIso,
      createdBy: cancelledBy,
    };
    reversalTransactions.push(reversalTx);

    updatedCustomer = {
      ...customer,
      currentBalance: runningBalance,
      totalReceivable: runningBalance > 0 ? runningBalance : 0,
      totalPayable: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      pendingAmount: runningBalance > 0 ? runningBalance : 0,
      balance:
        runningBalance > 0
          ? `₹ ${runningBalance.toLocaleString()} Pending`
          : runningBalance < 0
          ? `₹ ${Math.abs(runningBalance).toLocaleString()} Mandi Owes`
          : 'Settled (₹ 0)',
    };
  }

  const reversedInvoice: DispatchInvoice = {
    ...invoice,
    isReversed: true,
    reversedAt: nowIso,
    reversalReason: reason,
  };

  runInTransaction(() => {
    saveDispatchInvoiceToStorage(reversedInvoice);
    for (const tx of reversalTransactions) {
      saveLedgerTransactionToStorage(tx);
    }
    if (updatedCustomer) {
      saveCustomerToStorage(updatedCustomer);
    }
  });

  return {
    reversedInvoice,
    updatedProducts: stockResult.updatedProducts,
    updatedGrades: stockResult.updatedGrades,
    updatedCustomer,
    reversalTransactions,
  };
}
