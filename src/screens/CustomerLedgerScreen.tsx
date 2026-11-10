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
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
    const statusText = isReceivable
      ? 'Customer Owes Mandi'
      : isPayable
      ? 'Mandi Owes Customer'
      : 'All Dues Settled';

    Alert.alert(
      'Mandi Statement',
      `Ledger summary for ${customer.name}\n` +
      `Business: ${customer.business || 'N/A'}\n` +
      `Mobile: +91 ${customer.mobile}\n` +
      `Outstanding Balance: ₹ ${Math.abs(balanceInfo.currentBalance).toLocaleString('en-IN')} (${statusText})\n` +
      `Total Debits: ₹ ${totalDebits.toLocaleString('en-IN')}\n` +
      `Total Credits: ₹ ${totalCredits.toLocaleString('en-IN')}`
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 34),
            backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
            borderBottomColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            {customer.customerType || 'Buyer'}
            {customer.business ? ` • ${customer.business}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.shareBtn,
            { backgroundColor: isDark ? '#143823' : '#DCFCE7' },
          ]}
          onPress={handleShareStatement}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={18} color={isDark ? '#4ADE80' : '#16834A'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 84, 96) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= 1. OUTSTANDING BALANCE OVERVIEW CARD ================= */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          {/* Status Badge & Mobile */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isReceivable
                    ? (isDark ? '#142E1F' : '#F0FDF4')
                    : isPayable
                    ? (isDark ? '#2D1616' : '#FEF2F2')
                    : (isDark ? '#1E293B' : '#F8FAFC'),
                  borderColor: isReceivable
                    ? (isDark ? '#4ADE80' : '#16834A')
                    : isPayable
                    ? (isDark ? '#F87171' : '#DC2626')
                    : (isDark ? '#334155' : '#CBD5E1'),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: isReceivable
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : isPayable
                      ? (isDark ? '#F87171' : '#DC2626')
                      : (isDark ? '#94A3B8' : '#64748B'),
                  },
                ]}
              >
                {isReceivable
                  ? 'Customer Owes Mandi'
                  : isPayable
                  ? 'Mandi Owes Customer'
                  : 'All Dues Settled'}
              </Text>
            </View>

            <Text style={[styles.mobileText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              +91 {customer.mobile}
            </Text>
          </View>

          {/* Outstanding Balance Main Amount */}
          <View style={styles.balanceAmountRow}>
            <Text style={[styles.balanceRupeeSymbol, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              ₹
            </Text>
            <Text
              style={[
                styles.balanceMainAmount,
                {
                  color: isReceivable
                    ? (isDark ? '#4ADE80' : '#16834A')
                    : isPayable
                    ? (isDark ? '#F87171' : '#DC2626')
                    : colors.textPrimary,
                },
              ]}
            >
              {Math.abs(balanceInfo.currentBalance).toLocaleString('en-IN')}
            </Text>
          </View>

          <Text style={[styles.balanceHintText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {isReceivable
              ? 'Outstanding balance receivable from customer'
              : isPayable
              ? 'Pending payment disbursement to customer'
              : 'Account fully settled'}
          </Text>

          {/* Mini Financial Summary Strip */}
          <View
            style={[
              styles.miniStatsRow,
              {
                backgroundColor: isDark ? '#0A0F1D' : '#F8FAF8',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            {/* Opening Balance */}
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Opening Bal.
              </Text>
              <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>
                ₹ {(customer.openingBalance || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

            {/* Total Debits (+) */}
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Total Debits (+)
              </Text>
              <Text style={[styles.miniStatValue, { color: isDark ? '#F87171' : '#DC2626' }]}>
                ₹ {totalDebits.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

            {/* Total Credits (-) */}
            <View style={styles.miniStatItem}>
              <Text style={[styles.miniStatLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Total Credits (-)
              </Text>
              <Text style={[styles.miniStatValue, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                ₹ {totalCredits.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= 2. DATE FILTER TABS ================= */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Transaction History
          </Text>
          <View
            style={[
              styles.filterTabs,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              },
            ]}
          >
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
                  style={[
                    styles.filterTab,
                    active && {
                      backgroundColor: isDark ? '#143823' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 1,
                      elevation: 1,
                    },
                  ]}
                  onPress={() => setDateFilter(f.id as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: active
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#94A3B8' : '#64748B'),
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ================= 3. OPENING BALANCE DISTINCT INDICATOR ================= */}
        {customer.openingBalance !== undefined && customer.openingBalance !== 0 && (
          <View
            style={[
              styles.openingBalanceCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.openingBalLeft}>
              <View
                style={[
                  styles.openingBalIconCircle,
                  { backgroundColor: isDark ? '#082F49' : '#EFF6FF' },
                ]}
              >
                <Ionicons name="wallet-outline" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.openingBalTitle, { color: colors.textPrimary }]}>
                  Opening Balance
                </Text>
                <Text style={[styles.openingBalSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {customer.openingBalance > 0
                    ? 'Customer owed Mandi on registration'
                    : 'Mandi owed customer on registration'}
                </Text>
              </View>
            </View>

            <View style={styles.openingBalRight}>
              <Text
                style={[
                  styles.openingBalAmount,
                  {
                    color: customer.openingBalance > 0
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#F87171' : '#DC2626'),
                  },
                ]}
              >
                ₹ {Math.abs(customer.openingBalance).toLocaleString('en-IN')}
              </Text>
              <Text
                style={[
                  styles.openingBalBadge,
                  {
                    color: customer.openingBalance > 0
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#F87171' : '#DC2626'),
                  },
                ]}
              >
                {customer.openingBalance > 0 ? 'Receivable' : 'Payable'}
              </Text>
            </View>
          </View>
        )}

        {/* ================= 4. TRANSACTIONS LIST ================= */}
        {transactions.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Ionicons name="receipt-outline" size={40} color={isDark ? '#64748B' : '#CBD5E1'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Transactions In This Period
            </Text>
            <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Sales, dispatches, and payments will appear here.
            </Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const isDebit = tx.category === 'DEBIT';

            // Distinct visual indicators for transaction types
            let typeLabel = 'Transaction';
            let typeSub = '';
            let iconName: any = 'receipt-outline';
            let iconColor = isDebit ? '#DC2626' : '#16834A';
            let iconBg = isDark ? (isDebit ? '#2D1616' : '#142E1F') : (isDebit ? '#FEF2F2' : '#F0FDF4');

            if (tx.type === 'CREDIT_SALE') {
              typeLabel = 'Credit Sale';
              typeSub = 'Outbound dispatch on credit';
              iconName = 'cart-outline';
              iconColor = '#D97706';
              iconBg = isDark ? '#3B2904' : '#FEF3C7';
            } else if (tx.type === 'CASH_RECEIVED') {
              typeLabel = 'Payment Received';
              typeSub = 'Cash payment collected';
              iconName = 'arrow-down-circle-outline';
              iconColor = '#16834A';
              iconBg = isDark ? '#143823' : '#DCFCE7';
            } else if (tx.type === 'CASH_PAID') {
              typeLabel = 'Payment to Customer';
              typeSub = 'Disbursement paid to customer';
              iconName = 'arrow-up-circle-outline';
              iconColor = '#DC2626';
              iconBg = isDark ? '#2D1616' : '#FEF2F2';
            } else if (tx.type === 'PURCHASE_CREDIT') {
              typeLabel = 'Farmer Arrival Credit';
              typeSub = 'Produce arrival recorded';
              iconName = 'leaf-outline';
              iconColor = '#7C3AED';
              iconBg = isDark ? '#2E1065' : '#F5F3FF';
            } else if (tx.type === 'ADVANCE_PAYMENT') {
              typeLabel = 'Advance Payment';
              typeSub = 'Advance deposit recorded';
              iconName = 'cash-outline';
              iconColor = '#0284C7';
              iconBg = isDark ? '#082F49' : '#EFF6FF';
            }

            return (
              <View
                key={tx.id}
                style={[
                  styles.txCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                {/* Transaction Header Row */}
                <View style={styles.txTopRow}>
                  <View style={styles.txTypeWrap}>
                    <View style={[styles.txIconCircle, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName} size={16} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txTypeTitle, { color: colors.textPrimary }]}>
                        {typeLabel}
                      </Text>
                      <Text style={[styles.txTypeSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {typeSub}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txAmountWrap}>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: isDebit
                            ? (isDark ? '#F87171' : '#DC2626')
                            : (isDark ? '#4ADE80' : '#16834A'),
                        },
                      ]}
                    >
                      {isDebit ? '+ ' : '- '}₹ {tx.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.txMethodBadge,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          color: isDark ? '#CBD5E1' : '#475569',
                        },
                      ]}
                    >
                      {tx.paymentMethod}
                    </Text>
                  </View>
                </View>

                {/* Transaction Metadata: Date, Reference, Running Balance */}
                <View
                  style={[
                    styles.txMetaRow,
                    { borderTopColor: isDark ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  <Text style={[styles.txDate, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {new Date(tx.createdAt || tx.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>

                  {tx.referenceNo ? (
                    <Text style={[styles.txRef, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Ref: {tx.referenceNo}
                    </Text>
                  ) : null}

                  {tx.balanceAfter !== undefined && (
                    <Text style={[styles.txBalanceAfter, { color: colors.textPrimary }]}>
                      Bal: ₹ {Math.abs(tx.balanceAfter).toLocaleString('en-IN')}{' '}
                      {tx.balanceAfter > 0 ? '(Due)' : tx.balanceAfter < 0 ? '(Cr)' : ''}
                    </Text>
                  )}
                </View>

                {/* Notes if any */}
                {tx.notes ? (
                  <View
                    style={[
                      styles.txNotesBox,
                      { backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC' },
                    ]}
                  >
                    <Text style={[styles.txNotesText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Note: {tx.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= 5. BOTTOM RECORD PAYMENT BUTTON ================= */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom + 10, 16),
            backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
            borderTopColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
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
          <Ionicons
            name={isPayable ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.floatingPaymentText}>
            {isPayable ? 'Record Payment to Farmer' : 'Record Payment Received'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0A0F1D' : '#F8FAF8',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    headerBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
    },
    headerSubtitle: {
      fontSize: 12,
      marginTop: 1,
    },
    shareBtn: {
      padding: 8,
      borderRadius: 8,
    },
    content: {
      padding: 16,
    },

    /* Balance Card */
    balanceCard: {
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      marginBottom: 14,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    mobileText: {
      fontSize: 13,
      fontWeight: '500',
    },
    balanceAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    balanceRupeeSymbol: {
      fontSize: 22,
      fontWeight: '700',
      marginRight: 4,
    },
    balanceMainAmount: {
      fontSize: 32,
      fontWeight: '800',
    },
    balanceHintText: {
      fontSize: 12,
      marginBottom: 14,
    },

    /* Mini Stats */
    miniStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    miniStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    miniStatLabel: {
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 3,
    },
    miniStatValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    statDivider: {
      width: 1,
      height: 24,
    },

    /* Filter Section */
    filterSection: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    filterTabs: {
      flexDirection: 'row',
      borderRadius: 8,
      padding: 3,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 6,
    },
    filterTabText: {
      fontSize: 12,
    },

    /* Opening Balance Card */
    openingBalanceCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 10,
    },
    openingBalLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    openingBalIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    openingBalTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    openingBalSub: {
      fontSize: 11,
      marginTop: 1,
    },
    openingBalRight: {
      alignItems: 'flex-end',
    },
    openingBalAmount: {
      fontSize: 14,
      fontWeight: '800',
    },
    openingBalBadge: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
    },

    /* Empty Card */
    emptyCard: {
      alignItems: 'center',
      padding: 32,
      borderRadius: 12,
      borderWidth: 1,
      gap: 6,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    emptySub: {
      fontSize: 12,
    },

    /* Transaction Card */
    txCard: {
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      marginBottom: 10,
    },
    txTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    txTypeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 10,
    },
    txIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txTypeTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    txTypeSub: {
      fontSize: 11,
    },
    txAmountWrap: {
      alignItems: 'flex-end',
    },
    txAmount: {
      fontSize: 15,
      fontWeight: '800',
    },
    txMethodBadge: {
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 3,
    },
    txMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
    },
    txDate: {
      fontSize: 11,
    },
    txRef: {
      fontSize: 11,
    },
    txBalanceAfter: {
      fontSize: 12,
      fontWeight: '700',
    },
    txNotesBox: {
      marginTop: 6,
      padding: 6,
      borderRadius: 6,
    },
    txNotesText: {
      fontSize: 11,
    },

    /* Bottom Floating Action Bar */
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    floatingPaymentBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#16834A',
      minHeight: 50,
      borderRadius: 12,
      gap: 8,
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: '#16834A',
      borderRadius: 8,
    },
    backBtnText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
