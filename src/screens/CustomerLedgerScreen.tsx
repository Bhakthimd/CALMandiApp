import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';

export default function CustomerLedgerScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { customerId } = route.params || {};
  const { customers, getCustomerTransactions, getCustomerBalance } = useMandi();

  const [dateFilter, setDateFilter] = useState<'ALL' | 'MONTH' | 'WEEK' | 'TODAY'>('ALL');

  const customer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  const rawTransactions = useMemo(() => {
    return getCustomerTransactions(customerId);
  }, [getCustomerTransactions, customerId]);

  const balanceInfo = useMemo(() => {
    return getCustomerBalance(customerId);
  }, [getCustomerBalance, customerId]);

  // Date filtering logic
  const transactions = useMemo(() => {
    const now = new Date();
    return rawTransactions.filter((tx) => {
      if (dateFilter === 'ALL') return true;
      const txDate = new Date(tx.createdAt || tx.date);

      if (dateFilter === 'TODAY') {
        return txDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      }
      if (dateFilter === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return txDate >= monthAgo;
      }
      return true;
    });
  }, [rawTransactions, dateFilter]);

  if (!customer) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Customer not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReceivable = balanceInfo.currentBalance > 0;
  const isPayable = balanceInfo.currentBalance < 0;

  const totalDebits = rawTransactions
    .filter((t) => t.category === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = rawTransactions
    .filter((t) => t.category === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleShareStatement = () => {
    Alert.alert(
      'Mandi Statement Shared',
      `Khata statement for ${customer.name} (${customer.business}) prepared.\nBalance: ₹ ${Math.abs(
        balanceInfo.currentBalance
      ).toLocaleString()} ${isReceivable ? 'Receivable' : isPayable ? 'Payable' : 'Settled'}.`
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{customer.name}</Text>
          <Text style={styles.headerSubtitle}>
            {customer.business} • {customer.customerType || 'Buyer'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShareStatement}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color="#16834A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 80, 90) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Profile & Balance Overview Card */}
        <View style={styles.balanceCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadgeWrap}>
              <View
                style={[
                  styles.statusPill,
                  isReceivable
                    ? styles.pillRed
                    : isPayable
                    ? styles.pillGreen
                    : styles.pillGrey,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isReceivable
                      ? styles.pillTextRed
                      : isPayable
                      ? styles.pillTextGreen
                      : styles.pillTextGrey,
                  ]}
                >
                  {isReceivable
                    ? '⚠️ CUSTOMER OWES MANDI (उधारी / लेने)'
                    : isPayable
                    ? '✓ MANDI OWES CUSTOMER (देने)'
                    : '✓ ALL DUES SETTLED (हिसाब चुकता)'}
                </Text>
              </View>
            </View>
            <Text style={styles.mobileText}>📞 {customer.mobile}</Text>
          </View>

          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceRupeeSymbol}>₹</Text>
            <Text
              style={[
                styles.balanceMainAmount,
                isReceivable
                  ? { color: '#DC2626' }
                  : isPayable
                  ? { color: '#16834A' }
                  : { color: '#4B5563' },
              ]}
            >
              {Math.abs(balanceInfo.currentBalance).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.balanceHintText}>
            {isReceivable
              ? 'Customer has outstanding credit with Mandi'
              : isPayable
              ? 'Mandi has pending disbursement to customer'
              : 'Zero pending balance'}
          </Text>

          {/* 3 mini balance stats */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatItem}>
              <Text style={styles.miniStatLabel}>Opening Balance</Text>
              <Text style={styles.miniStatValue}>
                ₹ {(customer.openingBalance || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.miniStatItem}>
              <Text style={styles.miniStatLabel}>Total Debits (+)</Text>
              <Text style={[styles.miniStatValue, { color: '#DC2626' }]}>
                ₹ {totalDebits.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.miniStatItem}>
              <Text style={styles.miniStatLabel}>Total Credits (-)</Text>
              <Text style={[styles.miniStatValue, { color: '#16834A' }]}>
                ₹ {totalCredits.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Date Filter Bar */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Transaction History (लेखा-जोखा)</Text>
          <View style={styles.filterTabs}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'MONTH', label: 'Last 30D' },
              { id: 'WEEK', label: 'Last 7D' },
              { id: 'TODAY', label: 'Today' },
            ].map((f) => {
              const active = dateFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterTab, active && styles.filterTabActive]}
                  onPress={() => setDateFilter(f.id as any)}
                >
                  <Text
                    style={[styles.filterTabText, active && styles.filterTabTextActive]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Transactions in this period</Text>
            <Text style={styles.emptySub}>
              Record a sale or payment to update the ledger.
            </Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const isDebit = tx.category === 'DEBIT';

            let typeLabel = tx.type.replace('_', ' ');
            let typeHindi = '';
            if (tx.type === 'CREDIT_SALE') {
              typeLabel = 'Credit Sale (बिक्री)';
              typeHindi = 'Customer purchase on credit';
            } else if (tx.type === 'CASH_RECEIVED') {
              typeLabel = 'Cash Received (जमा)';
              typeHindi = 'Customer paid money to Mandi';
            } else if (tx.type === 'CASH_PAID') {
              typeLabel = 'Cash Paid (निकासी)';
              typeHindi = 'Mandi paid money to customer';
            } else if (tx.type === 'PURCHASE_CREDIT') {
              typeLabel = 'Farmer Arrival Credit (आवक)';
              typeHindi = 'Produce credit settlement';
            } else if (tx.type === 'ADVANCE_PAYMENT') {
              typeLabel = 'Advance Payment (अग्रिम)';
              typeHindi = 'Advance deposit / credit';
            }

            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txTopRow}>
                  <View style={styles.txTypeWrap}>
                    <View
                      style={[
                        styles.txIconCircle,
                        isDebit ? styles.circleRed : styles.circleGreen,
                      ]}
                    >
                      <Ionicons
                        name={isDebit ? 'arrow-up-outline' : 'arrow-down-outline'}
                        size={16}
                        color={isDebit ? '#DC2626' : '#16834A'}
                      />
                    </View>
                    <View>
                      <Text style={styles.txTypeTitle}>{typeLabel}</Text>
                      <Text style={styles.txTypeSub}>{typeHindi}</Text>
                    </View>
                  </View>

                  <View style={styles.txAmountWrap}>
                    <Text
                      style={[
                        styles.txAmount,
                        isDebit ? styles.amountRed : styles.amountGreen,
                      ]}
                    >
                      {isDebit ? '+' : '-'} ₹ {tx.amount.toLocaleString()}
                    </Text>
                    <Text style={styles.txMethodBadge}>
                      {tx.paymentMethod}
                    </Text>
                  </View>
                </View>

                {/* Additional Details */}
                <View style={styles.txMetaRow}>
                  <Text style={styles.txDate}>
                    📅 {new Date(tx.createdAt || tx.date).toLocaleDateString()}
                  </Text>
                  {tx.referenceNo && (
                    <Text style={styles.txRef}>Ref: {tx.referenceNo}</Text>
                  )}
                  {tx.balanceAfter !== undefined && (
                    <Text style={styles.txBalanceAfter}>
                      Bal: ₹ {Math.abs(tx.balanceAfter).toLocaleString()}{' '}
                      {tx.balanceAfter > 0 ? 'Due' : tx.balanceAfter < 0 ? 'Cr' : ''}
                    </Text>
                  )}
                </View>

                {tx.notes && (
                  <View style={styles.txNotesBox}>
                    <Text style={styles.txNotesText}>💬 {tx.notes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Quick Payment Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 10, 16) }]}>
        <TouchableOpacity
          style={styles.floatingPaymentBtn}
          onPress={() =>
            navigation.navigate('AddPayment', {
              customerId: customer.id,
              defaultType: isPayable ? 'PAY' : 'RECEIVE',
            })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.floatingPaymentText}>
            {isPayable
              ? 'Record Payment to Farmer (भुगतान करें)'
              : 'Record Payment Received (रुपया जमा करें)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
  themeToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  shareBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F4EC',
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadgeWrap: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillRed: {
    backgroundColor: '#FEF2F2',
  },
  pillGreen: {
    backgroundColor: '#ECFDF5',
  },
  pillGrey: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextRed: {
    color: '#DC2626',
  },
  pillTextGreen: {
    color: '#16834A',
  },
  pillTextGrey: {
    color: '#6B7280',
  },
  mobileText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  balanceRupeeSymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 4,
  },
  balanceMainAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  balanceHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  miniStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DDDDDD',
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: colors.cardBackground,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#16834A',
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#888888',
  },
  txCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  circleRed: {
    backgroundColor: '#FEF2F2',
  },
  circleGreen: {
    backgroundColor: '#ECFDF5',
  },
  txTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txTypeSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  txAmountWrap: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountRed: {
    color: '#DC2626',
  },
  amountGreen: {
    color: '#16834A',
  },
  txMethodBadge: {
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  txMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  txDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  txRef: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  txBalanceAfter: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  txNotesBox: {
    marginTop: 6,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    padding: 6,
    borderRadius: 6,
  },
  txNotesText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  floatingPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  floatingPaymentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 10,
  },
  backBtn: {
    padding: 10,
    backgroundColor: '#16834A',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
