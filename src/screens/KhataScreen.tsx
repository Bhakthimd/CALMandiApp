import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { Customer, PaymentMode } from '../types';

export default function KhataScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    customers,
    totalUdhaar,
    settleCustomerBalance,
    recordCustomerPayment,
    getCustomerHistory,
    isOwner,
  } = useMandi();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<PaymentMode>('Cash');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleModalVisible, setSettleModalVisible] = useState(false);

  // Customer Ledger Statement Modal
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [statementModalVisible, setStatementModalVisible] = useState(false);

  // Filter: ALL, PENDING, SETTLED
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');

  // If accessed by non-owner, guard
  if (!isOwner) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, padding: 20 }]}>
        <Text style={styles.title}>🔒 Owner Privilege Required</Text>
        <Text style={styles.subtitle}>
          Customer Khata and credit ledger is confidential and accessible only by the Mandi Owner.
        </Text>
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredCustomers = customers.filter((c) => {
    const hasDebt = (c.pendingAmount || 0) > 0;
    if (filter === 'PENDING') return hasDebt;
    if (filter === 'SETTLED') return !hasDebt;
    return true;
  });

  const handleOpenSettle = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSettleAmount((customer.pendingAmount || 0).toString());
    setSettleMode('Cash');
    setSettleNotes('');
    setSettleModalVisible(true);
  };

  const handleConfirmSettlement = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(settleAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    recordCustomerPayment(
      selectedCustomer.id,
      amount,
      settleMode,
      settleNotes || `Debt payment via ${settleMode}`
    );

    setSettleModalVisible(false);
    Alert.alert(
      'Payment Recorded',
      `Received ₹${amount.toLocaleString('en-IN')} via ${settleMode} from ${selectedCustomer.name}. Debt balance updated.`
    );
  };

  const handleOpenStatement = (customer: Customer) => {
    setStatementCustomer(customer);
    setStatementModalVisible(true);
  };

  const handleShareStatement = async (customer: Customer) => {
    const history = getCustomerHistory(customer.id);
    const dispatchesSummary = history.dispatches
      .slice(0, 5)
      .map(
        (d) =>
          `• ${d.date}: ${d.productName} (${d.quantity} ${d.unit}) - Total: ₹${d.totalAmount.toLocaleString('en-IN')}, Upfront: ₹${d.paidAmount.toLocaleString('en-IN')}, Added to Debt: ₹${d.balanceAmount.toLocaleString('en-IN')}`
      )
      .join('\n');

    const msg = `*CALMandi Customer Ledger Statement*
---------------------------------------
Customer: *${customer.name}* (${customer.business})
Mobile: ${customer.mobile}
*Current Outstanding Debt:* ₹${(customer.pendingAmount || 0).toLocaleString('en-IN')}
---------------------------------------
*Recent Dispatches & Debt Additions:*
${dispatchesSummary || 'No recent dispatches'}
---------------------------------------
*Debt is maintained per customer across all commodities.*
Please settle your outstanding dues at your earliest convenience.

*Patel Krishi Mandi, APMC Market Yard*`;

    const cleanPhone = customer.mobile.replace(/\D/g, '');
    const url = `whatsapp://send?phone=+91${cleanPhone}&text=${encodeURIComponent(msg)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: msg });
      }
    } catch {
      await Share.share({ message: msg });
    }
  };

  const handleSendReminder = async (customer: Customer) => {
    const pending = customer.pendingAmount || 0;
    const msg = `*CALMandi Payment Reminder*
-----------------------------
Dear *${customer.name}* (${customer.business}),
Your current consolidated pending debt balance at our Mandi shop is *₹${pending.toLocaleString('en-IN')}*.
Kindly clear the balance at your earliest convenience.

Thank you,
*Patel Krishi Mandi, APMC Yard*`;

    const cleanPhone = customer.mobile.replace(/\D/g, '');
    const url = `whatsapp://send?phone=+91${cleanPhone}&text=${encodeURIComponent(msg)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: msg });
      }
    } catch {
      await Share.share({ message: msg });
    }
  };

  const statementHistory = statementCustomer
    ? getCustomerHistory(statementCustomer.id)
    : { dispatches: [], payments: [], totalDebt: 0 };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹ Home</Text>
          </TouchableOpacity>

          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>👑 OWNER ONLY</Text>
          </View>
        </View>

        <Text style={styles.title}>Buyer Khata & Debt Ledger</Text>
        <Text style={styles.subtitle}>
          Debt is managed per customer across all commodities. Track market credit, upfront Cash/UPI collections, and debt settlements.
        </Text>

        {/* Per-Customer Debt Info Banner */}
        <View style={styles.debtRuleBanner}>
          <Ionicons name="information-circle" size={20} color="#0284C7" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.debtRuleTitle}>Customer-Level Debt Architecture</Text>
            <Text style={styles.debtRuleText}>
              Every dispatch allows upfront Cash/UPI payments; any remaining balance is added to that customer's centralized account, regardless of the commodity.
            </Text>
          </View>
        </View>

        {/* Total Outstanding Card */}
        <View style={styles.totalUdhaarCard}>
          <View style={styles.udhaarIconBox}>
            <Ionicons name="alert-circle" size={28} color="#DC2626" />
          </View>
          <View style={styles.udhaarTextBox}>
            <Text style={styles.udhaarLabel}>Total Market Credit (Active Buyer Debt)</Text>
            <Text style={styles.udhaarValue}>
              ₹ {totalUdhaar.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.udhaarSub}>Consolidated across all wholesale customers</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterChipText, filter === 'ALL' && styles.filterChipTextActive]}>
              All ({customers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'PENDING' && styles.filterChipActive]}
            onPress={() => setFilter('PENDING')}
          >
            <Text style={[styles.filterChipText, filter === 'PENDING' && styles.filterChipTextActive]}>
              Pending Debt ({customers.filter((c) => (c.pendingAmount || 0) > 0).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'SETTLED' && styles.filterChipActive]}
            onPress={() => setFilter('SETTLED')}
          >
            <Text style={[styles.filterChipText, filter === 'SETTLED' && styles.filterChipTextActive]}>
              Settled ({customers.filter((c) => (c.pendingAmount || 0) === 0).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Accounts */}
        <Text style={styles.sectionTitle}>Customer Accounts & Debt Status</Text>

        {filteredCustomers.map((c) => {
          const isPending = (c.pendingAmount || 0) > 0;
          const custHistory = getCustomerHistory(c.id);

          return (
            <View key={c.id} style={styles.khataCard}>
              <View style={styles.khataHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.buyerName}>{c.name}</Text>
                  <Text style={styles.businessName}>{c.business}</Text>
                  <Text style={styles.mobileText}>
                    <Ionicons name="call-outline" size={12} color="#666666" />{' '}
                    {c.mobile}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isPending ? styles.pendingPill : styles.settledPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isPending ? styles.pendingPillText : styles.settledPillText,
                    ]}
                  >
                    {isPending
                      ? `₹ ${(c.pendingAmount || 0).toLocaleString('en-IN')} Due`
                      : 'Settled'}
                  </Text>
                </View>
              </View>

              {/* Multi-product summary note */}
              <View style={styles.customerSummaryRow}>
                <Text style={styles.customerSummaryText}>
                  📊 {custHistory.dispatches.length} Total Dispatches recorded across commodities
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.ledgerBtn}
                  activeOpacity={0.7}
                  onPress={() => handleOpenStatement(c)}
                >
                  <Ionicons name="document-text-outline" size={15} color="#0284C7" />
                  <Text style={styles.ledgerBtnText}>Statement</Text>
                </TouchableOpacity>

                {isPending && (
                  <TouchableOpacity
                    style={styles.reminderBtn}
                    activeOpacity={0.7}
                    onPress={() => handleSendReminder(c)}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color="#16834A" />
                    <Text style={styles.reminderBtnText}>Reminder</Text>
                  </TouchableOpacity>
                )}

                {isPending && (
                  <TouchableOpacity
                    style={styles.settleBtn}
                    activeOpacity={0.7}
                    onPress={() => handleOpenSettle(c)}
                  >
                    <Ionicons name="cash-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.settleBtnText}>Receive Payment</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* SETTLE PAYMENT MODAL (WITH CASH & UPI SELECTION) */}
      <Modal
        visible={settleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Receive Debt Payment</Text>
            <Text style={styles.modalSub}>
              Receiving settlement from {selectedCustomer?.name} ({selectedCustomer?.business})
            </Text>

            <Text style={styles.modalLabel}>Payment Method</Text>
            <View style={styles.modalModeRow}>
              <TouchableOpacity
                style={[
                  styles.modalModeBtn,
                  settleMode === 'Cash' && styles.modalModeBtnActiveCash,
                ]}
                onPress={() => setSettleMode('Cash')}
              >
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={settleMode === 'Cash' ? '#FFFFFF' : '#16834A'}
                />
                <Text
                  style={[
                    styles.modalModeBtnText,
                    settleMode === 'Cash' && styles.modalModeBtnTextActive,
                  ]}
                >
                  💵 Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalModeBtn,
                  settleMode === 'UPI' && styles.modalModeBtnActiveUpi,
                ]}
                onPress={() => setSettleMode('UPI')}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={16}
                  color={settleMode === 'UPI' ? '#FFFFFF' : '#0284C7'}
                />
                <Text
                  style={[
                    styles.modalModeBtnText,
                    settleMode === 'UPI' && styles.modalModeBtnTextActive,
                  ]}
                >
                  📱 UPI / GPay
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Payment Amount (₹)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={settleAmount}
              onChangeText={setSettleAmount}
              placeholder="Enter amount paid"
            />

            <Text style={styles.modalLabel}>Notes / Reference (Optional)</Text>
            <TextInput
              style={styles.modalInputSmall}
              value={settleNotes}
              onChangeText={setSettleNotes}
              placeholder="e.g. UPI Ref #4512 or Cash received by owner"
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSettleModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSettleBtn}
                onPress={handleConfirmSettlement}
              >
                <Text style={styles.confirmSettleBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOMER LEDGER STATEMENT MODAL */}
      <Modal
        visible={statementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statementTitle}>
                  {statementCustomer?.name} - Customer Ledger
                </Text>
                <Text style={styles.statementSub}>
                  {statementCustomer?.business} • {statementCustomer?.mobile}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setStatementModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.statementDebtBox}>
              <Text style={styles.statementDebtLabel}>Current Outstanding Debt:</Text>
              <Text style={styles.statementDebtValue}>
                ₹ {(statementCustomer?.pendingAmount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statementDebtNote}>
                Combined balance across all dispatches & commodities
              </Text>
            </View>

            <Text style={styles.statementSectionLabel}>Recent Transaction History</Text>
            <ScrollView style={{ maxHeight: 250 }}>
              {statementHistory.dispatches.length === 0 && statementHistory.payments.length === 0 ? (
                <Text style={styles.noTransactionsText}>No transactions recorded yet.</Text>
              ) : (
                <>
                  {statementHistory.dispatches.map((disp) => (
                    <View key={disp.id} style={styles.statementItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statementItemTitle}>
                          📤 Dispatch: {disp.productName} ({disp.quantity} {disp.unit})
                        </Text>
                        <Text style={styles.statementItemDate}>
                          {disp.date} • #{disp.slipNumber}
                        </Text>
                        <Text style={styles.statementItemDetail}>
                          Bill: ₹{disp.totalAmount.toLocaleString('en-IN')} | Upfront: ₹{disp.paidAmount.toLocaleString('en-IN')} ({disp.paymentMode || 'Cash'})
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.statementItemAmount, { color: '#DC2626' }]}>
                          +₹{disp.balanceAmount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.debtTag}>Added to Debt</Text>
                      </View>
                    </View>
                  ))}

                  {statementHistory.payments.map((pmt) => (
                    <View key={pmt.id} style={[styles.statementItem, { backgroundColor: '#F0FDF4' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statementItemTitle, { color: '#16834A' }]}>
                          💵 Payment Received ({pmt.paymentMode})
                        </Text>
                        <Text style={styles.statementItemDate}>{pmt.date}</Text>
                        {pmt.notes ? (
                          <Text style={styles.statementItemDetail}>{pmt.notes}</Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.statementItemAmount, { color: '#16834A' }]}>
                          -₹{pmt.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.debtTag, { color: '#16834A' }]}>Settled</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.shareStatementBtn}
              activeOpacity={0.8}
              onPress={() => statementCustomer && handleShareStatement(statementCustomer)}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.shareStatementBtnText}>
                Share Ledger on WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: '#16834A',
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: '#16834A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  debtRuleBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
    alignItems: 'center',
  },
  debtRuleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  debtRuleText: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 15,
  },
  totalUdhaarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  udhaarIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  udhaarTextBox: {
    flex: 1,
  },
  udhaarLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  udhaarValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  udhaarSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#16834A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  khataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  khataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  businessName: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 1,
  },
  mobileText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingPill: {
    backgroundColor: '#FEE2E2',
  },
  settledPill: {
    backgroundColor: '#E8F5EC',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingPillText: {
    color: '#DC2626',
  },
  settledPillText: {
    color: '#16834A',
  },
  customerSummaryRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  customerSummaryText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  ledgerBtnText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  reminderBtnText: {
    fontSize: 12,
    color: '#16834A',
    fontWeight: '700',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16834A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    marginLeft: 'auto',
  },
  settleBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  modalModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  modalModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  modalModeBtnActiveCash: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  modalModeBtnActiveUpi: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  modalModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalModeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  modalInputSmall: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 10,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  confirmSettleBtn: {
    flex: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#16834A',
    borderRadius: 8,
  },
  confirmSettleBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statementTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statementSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  statementDebtBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  statementDebtLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statementDebtValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  statementDebtNote: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 2,
  },
  statementSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  statementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statementItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statementItemDate: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  statementItemDetail: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 2,
  },
  statementItemAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  debtTag: {
    fontSize: 9,
    color: '#DC2626',
    marginTop: 2,
  },
  noTransactionsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 16,
  },
  shareStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  shareStatementBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backHomeBtn: {
    backgroundColor: '#16834A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
