import assert from 'node:assert/strict';
import {
  CLEAN_PRODUCT_PLACEHOLDER,
  DEFAULT_CATEGORY_IMAGES,
  DEFAULT_PRODUCT_IMAGES,
  getProductEmoji,
  getProductImage,
  resolveCommodityKey,
} from '../../utils/productImages';
import {
  computePaymentReminders,
  getReminderSummary,
  buildReminderMessage,
} from '../reminderService';
import {
  initOfflineStorage,
  savePaymentReminderMetaToStorage,
  loadPaymentReminderMetaFromStorage,
  deletePaymentReminderMetaFromStorage,
  resetStorageForTesting,
} from '../offlineStorage';
import {
  initialCustomers,
  initialLedgerTransactions,
  initialFarmerPattis,
  initialProducts,
} from '../../data/mockData';
import { aiService } from '../aiService';

export async function runPaymentRemindersAndRecognitionTests() {
  // 1. Product & Picture Recognition
  assert.equal(resolveCommodityKey('Tomato'), 'tomato');
  assert.equal(resolveCommodityKey('Tomatoes'), 'tomato');
  assert.equal(resolveCommodityKey('Fresh Red Tomatoes'), 'tomato');
  assert.equal(resolveCommodityKey('Green Chillies'), 'chilli');
  assert.equal(resolveCommodityKey('Kesar Mangoes'), 'mango');
  assert.equal(resolveCommodityKey('Nashik Onions'), 'onion');
  assert.equal(resolveCommodityKey('Bhindi'), 'okra');
  assert.equal(resolveCommodityKey('Lady Finger'), 'okra');
  assert.equal(resolveCommodityKey('Shimla Mirch'), 'capsicum');
  assert.equal(resolveCommodityKey('टमाटर'), 'tomato');
  assert.equal(resolveCommodityKey('प्याज'), 'onion');
  assert.equal(resolveCommodityKey('ಟೊಮೆಟೊ'), 'tomato');
  assert.equal(resolveCommodityKey('ಬಾಳೆಹಣ್ಣು'), 'banana');
  assert.equal(resolveCommodityKey('greenchilli'), 'chilli');

  const tomatoWithPlaceholder = getProductImage({
    name: 'Tomatoes',
    category: 'Vegetables',
    image: CLEAN_PRODUCT_PLACEHOLDER,
  });
  assert.equal(tomatoWithPlaceholder, DEFAULT_PRODUCT_IMAGES.tomato);

  const mangoWithCatPlaceholder = getProductImage({
    name: 'Alphonso Mangoes',
    category: 'Fruits',
    image: DEFAULT_CATEGORY_IMAGES.fruits,
  });
  assert.equal(mangoWithCatPlaceholder, DEFAULT_PRODUCT_IMAGES.mango);

  assert.equal(
    getProductImage({ name: 'Tomato', image: 'file:///storage/emulated/0/tom.jpg' }),
    'file:///storage/emulated/0/tom.jpg'
  );
  assert.equal(
    getProductImage({ name: 'Tomato', image: 'https://example.com/my-tomato.jpg' }),
    'https://example.com/my-tomato.jpg'
  );

  assert.equal(getProductEmoji('Tomatoes', 'Vegetables'), '🍅');
  assert.equal(getProductEmoji('टमाटर', 'Vegetables'), '🍅');

  const aiResp1 = await aiService.processPrompt('Tomatoes stock', {
    currentUser: null,
    isOwner: true,
    products: initialProducts,
    customers: initialCustomers,
    todaySales: 0,
    totalUdhaar: 0,
    language: 'en',
  });
  assert.ok(aiResp1.text.includes('Tomato'), `Expected Tomato in AI response, got: ${aiResp1.text}`);

  const aiResp2 = await aiService.processPrompt('add 20 kg pyaz', {
    currentUser: null,
    isOwner: true,
    products: initialProducts,
    customers: initialCustomers,
    todaySales: 0,
    totalUdhaar: 0,
    language: 'en',
  });
  assert.equal(aiResp2.intent, 'TRANSACTION');
  assert.equal(aiResp2.transactionPayload?.productName, 'Onion');

  console.log('✓ Product & picture recognition checks passed!');

  // 2. Payment Reminders
  const reminders = computePaymentReminders({
    customers: initialCustomers,
    ledgerTransactions: initialLedgerTransactions,
    pattis: initialFarmerPattis,
    dispatchInvoices: [],
    reminderMetas: [],
    todayDateStr: '2026-11-11',
  });

  assert.equal(reminders.length, 4);
  assert.ok(!reminders.some((r) => r.customerId === '2'), 'Settled customer should not be flagged');

  const ravi = reminders.find((r) => r.customerId === '1')!;
  assert.equal(ravi.kind, 'BUYER_RECEIVABLE');
  assert.equal(ravi.amount, 18800);
  assert.equal(ravi.dueDate, '2026-11-01');
  assert.equal(ravi.daysOverdue, 10);
  assert.equal(ravi.status, 'OVERDUE');

  const rameshwar = reminders.find((r) => r.customerId === '4')!;
  assert.equal(rameshwar.kind, 'FARMER_SETTLEMENT');
  assert.equal(rameshwar.amount, 8500);
  assert.equal(rameshwar.status, 'UPCOMING');

  const kailash = reminders.find((r) => r.customerId === '5')!;
  assert.equal(kailash.kind, 'FARMER_SETTLEMENT');
  assert.equal(kailash.amount, 14200);
  assert.equal(kailash.status, 'OVERDUE');

  const summary = getReminderSummary(reminders);
  assert.equal(summary.overdueCount, 3);
  assert.equal(summary.upcomingCount, 1);
  assert.equal(summary.pendingBuyerCount, 2);
  assert.equal(summary.pendingBuyerAmount, 27200);
  assert.equal(summary.pendingFarmerCount, 2);
  assert.equal(summary.pendingFarmerAmount, 22700);

  const remindersWithCustom = computePaymentReminders({
    customers: initialCustomers,
    ledgerTransactions: initialLedgerTransactions,
    pattis: initialFarmerPattis,
    dispatchInvoices: [],
    reminderMetas: [
      {
        customerId: '1',
        customDueDate: '2026-11-11',
        reminderCount: 2,
        lastRemindedAt: '2026-11-10T10:00:00Z',
        updatedAt: '2026-11-10T10:00:00Z',
      },
      {
        customerId: '3',
        snoozedUntil: '2026-11-14',
        reminderCount: 1,
        updatedAt: '2026-11-11T09:00:00Z',
      },
    ],
    todayDateStr: '2026-11-11',
  });
  const raviCustom = remindersWithCustom.find((r) => r.customerId === '1')!;
  assert.equal(raviCustom.status, 'DUE_TODAY');
  assert.equal(raviCustom.reminderCount, 2);
  assert.equal(raviCustom.isCustomDueDate, true);

  const manjunathSnoozed = remindersWithCustom.find((r) => r.customerId === '3')!;
  assert.equal(manjunathSnoozed.status, 'SNOOZED');

  const msg = buildReminderMessage(ravi, 'MDessentials');
  assert.ok(msg.includes('Ravi Kumar'));
  assert.ok(msg.includes('18,800'));
  assert.ok(msg.includes('Overdue by 10 days'));

  resetStorageForTesting();
  await initOfflineStorage();
  await savePaymentReminderMetaToStorage({
    customerId: '1',
    customDueDate: '2026-11-15',
    reminderCount: 1,
    notes: 'Promised UPI tomorrow',
    updatedAt: '2026-11-11T12:00:00Z',
  });
  const loadedMeta = await loadPaymentReminderMetaFromStorage();
  assert.equal(loadedMeta.length, 1);
  assert.equal(loadedMeta[0].customDueDate, '2026-11-15');
  await deletePaymentReminderMetaFromStorage('1');
  const afterDel = await loadPaymentReminderMetaFromStorage();
  assert.equal(afterDel.length, 0);

  const aiRem = await aiService.processPrompt('Show payment reminders', {
    currentUser: null,
    isOwner: true,
    products: initialProducts,
    customers: initialCustomers,
    todaySales: 0,
    totalUdhaar: 17200,
    language: 'en',
  });
  assert.equal(aiRem.intent, 'NAVIGATE');
  assert.equal(aiRem.navigationTarget, 'PaymentReminders');

  console.log('✓ Payment reminders checks passed!');
}

runPaymentRemindersAndRecognitionTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
