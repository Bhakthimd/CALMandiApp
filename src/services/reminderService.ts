import {
  Customer,
  DispatchInvoice,
  FarmerPatti,
  LedgerTransaction,
  PaymentReminder,
  PaymentReminderMeta,
  PaymentReminderStatus,
  PaymentReminderSummary,
} from '../types';
import { calculateCustomerFinancials } from './financeService';

export const DEFAULT_BUYER_CREDIT_DAYS = 7;
export const DEFAULT_FARMER_SETTLEMENT_DAYS = 3;

export function toIsoDate(dateInput?: string | Date): string {
  if (!dateInput) {
    return new Date().toISOString().split('T')[0];
  }
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  const trimmed = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const base = toIsoDate(isoDate);
  const [y, m, d] = base.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}

export function diffIsoDays(laterIso: string, earlierIso: string): number {
  const [y1, m1, d1] = toIsoDate(laterIso).split('-').map((n) => parseInt(n, 10));
  const [y2, m2, d2] = toIsoDate(earlierIso).split('-').map((n) => parseInt(n, 10));
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t1 - t2) / (24 * 60 * 60 * 1000));
}

export function formatReminderDate(isoDate?: string): string {
  if (!isoDate) return '-';
  const normalized = toIsoDate(isoDate);
  const [y, m, d] = normalized.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Finds the oldest unsettled debit transaction date (FIFO) for a buyer with a positive receivable balance.
 */
function findOldestUnsettledReceivableInfo(
  customer: Customer,
  customerTxs: LedgerTransaction[],
  customerInvoices: DispatchInvoice[],
  todayIso: string
): { referenceDate: string; referenceNumber?: string } {
  const sortedAsc = [...customerTxs].sort((a, b) =>
    (a.createdAt || a.date).localeCompare(b.createdAt || b.date)
  );

  // Total credits already applied against debits
  let remainingCreditPool = sortedAsc
    .filter((tx) => tx.category === 'CREDIT')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Account for opening balance if not already represented by a debit transaction
  const opening = customer.openingBalance || 0;
  const debits = sortedAsc.filter((tx) => tx.category === 'DEBIT');

  if (opening > 0 && debits.length === 0) {
    const fallbackDate = customer.createdAt ? toIsoDate(customer.createdAt) : addDaysToIsoDate(todayIso, -DEFAULT_BUYER_CREDIT_DAYS);
    return { referenceDate: fallbackDate, referenceNumber: 'OPENING' };
  }

  for (const tx of debits) {
    if (remainingCreditPool >= tx.amount) {
      remainingCreditPool -= tx.amount;
      continue;
    }
    return {
      referenceDate: toIsoDate(tx.date || tx.createdAt),
      referenceNumber: tx.referenceNo || tx.saleId,
    };
  }

  // Fallback to latest unpaid invoice or today
  const unpaidInv = customerInvoices.find((inv) => !inv.isReversed && inv.outstandingDebt > 0);
  if (unpaidInv) {
    return {
      referenceDate: toIsoDate(unpaidInv.timestamp),
      referenceNumber: unpaidInv.invoiceNumber,
    };
  }

  return {
    referenceDate: customer.createdAt ? toIsoDate(customer.createdAt) : todayIso,
  };
}

/**
 * Finds the oldest unsettled credit / patti date (FIFO) for a farmer/supplier payable.
 */
function findOldestUnsettledPayableInfo(
  customer: Customer,
  customerTxs: LedgerTransaction[],
  pendingPattis: FarmerPatti[],
  todayIso: string
): { referenceDate: string; referenceNumber?: string } {
  // Check pending pattis first (sorted oldest first)
  if (pendingPattis.length > 0) {
    const oldestPatti = [...pendingPattis].sort((a, b) => a.date.localeCompare(b.date))[0];
    return {
      referenceDate: toIsoDate(oldestPatti.date),
      referenceNumber: oldestPatti.pattiNumber,
    };
  }

  const sortedAsc = [...customerTxs].sort((a, b) =>
    (a.createdAt || a.date).localeCompare(b.createdAt || b.date)
  );

  // Payments made by Mandi to farmer reduce what Mandi owes
  let remainingPaidPool = sortedAsc
    .filter((tx) => tx.category === 'DEBIT')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const credits = sortedAsc.filter((tx) => tx.category === 'CREDIT');
  for (const tx of credits) {
    if (remainingPaidPool >= tx.amount) {
      remainingPaidPool -= tx.amount;
      continue;
    }
    return {
      referenceDate: toIsoDate(tx.date || tx.createdAt),
      referenceNumber: tx.referenceNo || tx.pattiId,
    };
  }

  return {
    referenceDate: customer.createdAt ? toIsoDate(customer.createdAt) : todayIso,
  };
}

export function computePaymentReminders(params: {
  customers: Customer[];
  ledgerTransactions: LedgerTransaction[];
  pattis: FarmerPatti[];
  dispatchInvoices: DispatchInvoice[];
  reminderMetas: PaymentReminderMeta[];
  todayDateStr?: string;
}): PaymentReminder[] {
  const {
    customers,
    ledgerTransactions,
    pattis,
    dispatchInvoices,
    reminderMetas,
    todayDateStr,
  } = params;

  const todayIso = toIsoDate(todayDateStr);
  const metaMap = new Map<string, PaymentReminderMeta>();
  for (const m of reminderMetas) {
    metaMap.set(m.customerId, m);
  }

  const reminders: PaymentReminder[] = [];

  for (const customer of customers) {
    const customerTxs = ledgerTransactions.filter((tx) => tx.customerId === customer.id);
    const bal = calculateCustomerFinancials(customer, ledgerTransactions);
    const pendingPattis = pattis.filter(
      (p) => p.farmerId === customer.id && p.paymentStatus !== 'Paid'
    );
    const pendingPattiTotal = pendingPattis.reduce((sum, p) => sum + (p.netPayable || 0), 0);

    const meta = metaMap.get(customer.id);
    const customerInvoices = dispatchInvoices.filter((inv) => inv.customerId === customer.id);

    if (bal.currentBalance > 0) {
      // Buyer / Trader owes Mandi
      const refInfo = findOldestUnsettledReceivableInfo(
        customer,
        customerTxs,
        customerInvoices,
        todayIso
      );
      const dueDate = meta?.customDueDate
        ? toIsoDate(meta.customDueDate)
        : addDaysToIsoDate(refInfo.referenceDate, DEFAULT_BUYER_CREDIT_DAYS);
      const daysOverdue = diffIsoDays(todayIso, dueDate);

      let status: PaymentReminderStatus;
      if (meta?.snoozedUntil && toIsoDate(meta.snoozedUntil) > todayIso) {
        status = 'SNOOZED';
      } else if (daysOverdue > 0) {
        status = 'OVERDUE';
      } else if (daysOverdue === 0) {
        status = 'DUE_TODAY';
      } else {
        status = 'UPCOMING';
      }

      reminders.push({
        id: `rem_${customer.id}_BUYER`,
        customerId: customer.id,
        customerName: customer.name,
        customerMobile: customer.mobile,
        business: customer.business,
        customerType: customer.customerType || 'Buyer',
        kind: 'BUYER_RECEIVABLE',
        amount: bal.currentBalance,
        dueDate,
        referenceDate: refInfo.referenceDate,
        referenceNumber: refInfo.referenceNumber,
        daysOverdue,
        status,
        lastRemindedAt: meta?.lastRemindedAt,
        reminderCount: meta?.reminderCount || 0,
        snoozedUntil: meta?.snoozedUntil,
        notes: meta?.notes,
        isCustomDueDate: Boolean(meta?.customDueDate),
      });
    } else if (bal.currentBalance < 0 || pendingPattiTotal > 0) {
      // Mandi owes Farmer / Supplier settlement
      const settlementAmount =
        bal.totalPayable > 0 ? bal.totalPayable : pendingPattiTotal;

      if (settlementAmount <= 0) continue;

      const refInfo = findOldestUnsettledPayableInfo(
        customer,
        customerTxs,
        pendingPattis,
        todayIso
      );
      const dueDate = meta?.customDueDate
        ? toIsoDate(meta.customDueDate)
        : addDaysToIsoDate(refInfo.referenceDate, DEFAULT_FARMER_SETTLEMENT_DAYS);
      const daysOverdue = diffIsoDays(todayIso, dueDate);

      let status: PaymentReminderStatus;
      if (meta?.snoozedUntil && toIsoDate(meta.snoozedUntil) > todayIso) {
        status = 'SNOOZED';
      } else if (daysOverdue > 0) {
        status = 'OVERDUE';
      } else if (daysOverdue === 0) {
        status = 'DUE_TODAY';
      } else {
        status = 'UPCOMING';
      }

      reminders.push({
        id: `rem_${customer.id}_FARMER`,
        customerId: customer.id,
        customerName: customer.name,
        customerMobile: customer.mobile,
        business: customer.business,
        customerType: customer.customerType || 'Farmer',
        kind: 'FARMER_SETTLEMENT',
        amount: settlementAmount,
        dueDate,
        referenceDate: refInfo.referenceDate,
        referenceNumber: refInfo.referenceNumber,
        daysOverdue,
        status,
        lastRemindedAt: meta?.lastRemindedAt,
        reminderCount: meta?.reminderCount || 0,
        snoozedUntil: meta?.snoozedUntil,
        notes: meta?.notes,
        isCustomDueDate: Boolean(meta?.customDueDate),
      });
    }
  }

  // Sort: OVERDUE (highest daysOverdue first) -> DUE_TODAY -> UPCOMING (soonest first) -> SNOOZED
  const statusRank: Record<PaymentReminderStatus, number> = {
    OVERDUE: 0,
    DUE_TODAY: 1,
    UPCOMING: 2,
    SNOOZED: 3,
  };

  return reminders.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;
    if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
    return b.amount - a.amount;
  });
}

export function getReminderSummary(reminders: PaymentReminder[]): PaymentReminderSummary {
  const summary: PaymentReminderSummary = {
    totalCount: reminders.length,
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0,
    snoozedCount: 0,
    overdueBuyerCount: 0,
    overdueBuyerAmount: 0,
    pendingBuyerCount: 0,
    pendingBuyerAmount: 0,
    pendingFarmerCount: 0,
    pendingFarmerAmount: 0,
    overdueFarmerCount: 0,
    overdueFarmerAmount: 0,
  };

  for (const r of reminders) {
    if (r.status === 'OVERDUE') summary.overdueCount += 1;
    else if (r.status === 'DUE_TODAY') summary.dueTodayCount += 1;
    else if (r.status === 'UPCOMING') summary.upcomingCount += 1;
    else if (r.status === 'SNOOZED') summary.snoozedCount += 1;

    if (r.kind === 'BUYER_RECEIVABLE') {
      summary.pendingBuyerCount += 1;
      summary.pendingBuyerAmount += r.amount;
      if (r.status === 'OVERDUE') {
        summary.overdueBuyerCount += 1;
        summary.overdueBuyerAmount += r.amount;
      }
    } else {
      summary.pendingFarmerCount += 1;
      summary.pendingFarmerAmount += r.amount;
      if (r.status === 'OVERDUE') {
        summary.overdueFarmerCount += 1;
        summary.overdueFarmerAmount += r.amount;
      }
    }
  }

  return summary;
}

export function buildReminderMessage(
  reminder: PaymentReminder,
  businessName = 'CAL Mandi Yard'
): string {
  const formattedAmt = `₹${reminder.amount.toLocaleString('en-IN')}`;
  const formattedDue = formatReminderDate(reminder.dueDate);
  const refLine = reminder.referenceNumber ? `\nReference: ${reminder.referenceNumber}` : '';

  if (reminder.kind === 'BUYER_RECEIVABLE') {
    const overdueNotice =
      reminder.daysOverdue > 0
        ? ` (Overdue by ${reminder.daysOverdue} ${reminder.daysOverdue === 1 ? 'day' : 'days'})`
        : reminder.daysOverdue === 0
        ? ' (Due Today)'
        : '';

    return `*${businessName} - Payment Reminder*\n-----------------------------\nDear *${reminder.customerName}*${
      reminder.business ? ` (${reminder.business})` : ''
    },\nYour pending balance is *${formattedAmt}*.\nDue Date: *${formattedDue}*${overdueNotice}${refLine}\n\nKindly arrange payment at your earliest convenience.\n\nThank you,\n*${businessName}*`;
  }

  const settlementNotice =
    reminder.daysOverdue > 0
      ? ` (Pending ${reminder.daysOverdue} ${reminder.daysOverdue === 1 ? 'day' : 'days'} past due date)`
      : '';

  return `*${businessName} - Farmer Settlement Update*\n-----------------------------\nNamaste *${reminder.customerName}*,\nYour produce settlement of *${formattedAmt}* is scheduled for payout.\nDue Date: *${formattedDue}*${settlementNotice}${refLine}\n\nPlease contact the Mandi counter or share your UPI/bank details for prompt settlement.\n\nRegards,\n*${businessName}*`;
}
