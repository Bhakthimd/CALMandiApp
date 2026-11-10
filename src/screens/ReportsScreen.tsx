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
import BottomNavBar from '../components/BottomNavBar';

export default function ReportsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { initialTab } = route.params || {};
  const {
    customers,
    products,
    productGrades,
    sales,
    dispatchInvoices,
    wastageRecords,
    financialSummary,
    getCustomerBalance,
  } = useMandi();

  const [activeTab, setActiveTab] = useState<'financial' | 'product'>(
    initialTab || 'financial'
  );
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MONTH' | 'WEEK' | 'TODAY'>('ALL');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');

  // Customer outstanding list
  const customerBalances = useMemo(() => {
    return customers.map((c) => {
      const bal = getCustomerBalance(c.id);
      return {
        customer: c,
        balance: bal.currentBalance,
        totalReceivable: bal.totalReceivable,
        totalPayable: bal.totalPayable,
      };
    });
  }, [customers, getCustomerBalance]);

  // Helper to test if an ISO timestamp is within selected date filter
  const isWithinDateFilter = (
    timestampStr: string | undefined,
    filter: 'ALL' | 'MONTH' | 'WEEK' | 'TODAY'
  ): boolean => {
    if (filter === 'ALL') return true;
    if (!timestampStr) return false;
    const itemDate = new Date(timestampStr);
    if (isNaN(itemDate.getTime())) return false;

    const now = new Date();
    if (filter === 'TODAY') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }
    if (filter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }
    if (filter === 'MONTH') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= oneMonthAgo && itemDate <= now;
    }
    return true;
  };

  // Grade-wise sales & revenue calculations respecting dateFilter and selectedProductId
  const gradeSalesStats = useMemo(() => {
    const stats: Record<
      string,
      { gradeName: string; productName: string; quantity: number; revenue: number; unit: string }
    > = {};

    // 1. Process active dispatch invoices line items
    dispatchInvoices.forEach((inv) => {
      if (inv.isReversed) return;
      if (!isWithinDateFilter(inv.timestamp, dateFilter)) return;

      inv.items.forEach((item) => {
        if (selectedProductId !== 'ALL' && item.productId !== selectedProductId) {
          return;
        }
        const key = `${item.productId}_${item.gradeId || 'default'}`;
        if (!stats[key]) {
          stats[key] = {
            gradeName: item.gradeName || 'Standard Grade',
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            unit: item.unit,
          };
        }
        stats[key].quantity += item.quantity;
        stats[key].revenue += item.totalAmount;
      });
    });

    // 2. Process legacy sales (if not already represented in dispatchInvoices)
    sales.forEach((s) => {
      if (!isWithinDateFilter(s.timestamp, dateFilter)) return;
      if (selectedProductId !== 'ALL' && s.productId !== selectedProductId) return;
      if (dispatchInvoices.some((inv) => inv.id === s.id)) return;

      const key = `${s.productId}_${s.gradeId || 'default'}`;
      if (!stats[key]) {
        stats[key] = {
          gradeName: s.gradeName || 'Standard Grade',
          productName: s.productName,
          quantity: 0,
          revenue: 0,
          unit: s.unit,
        };
      }
      stats[key].quantity += s.quantity;
      stats[key].revenue += s.totalAmount;
    });

    return Object.values(stats);
  }, [sales, dispatchInvoices, dateFilter, selectedProductId]);

  // Product-wise wastage stats respecting dateFilter and selectedProductId
  const productWastageStats = useMemo(() => {
    const map: Record<
      string,
      {
        productId: string;
        productName: string;
        originalQty: number;
        wastageQty: number;
        count: number;
      }
    > = {};

    wastageRecords.forEach((w) => {
      if (!isWithinDateFilter(w.timestamp, dateFilter)) return;
      if (selectedProductId !== 'ALL' && w.productId !== selectedProductId) return;

      if (!map[w.productId]) {
        map[w.productId] = {
          productId: w.productId,
          productName: w.productName,
          originalQty: 0,
          wastageQty: 0,
          count: 0,
        };
      }
      map[w.productId].originalQty += w.originalQuantity;
      map[w.productId].wastageQty += w.wastageQuantity;
      map[w.productId].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      wastagePercentage:
        item.originalQty > 0
          ? ((item.wastageQty / item.originalQty) * 100).toFixed(1)
          : '0.0',
    }));
  }, [wastageRecords, dateFilter, selectedProductId]);

  // Handle export simulation
  const handleExportSummary = () => {
    Alert.alert(
      'Mandi Report Exported',
      `Summary report for ${
        activeTab === 'financial' ? 'Financials & Cash Flow' : 'Product Grades & Wastage'
      } generated.\n\nDate Range: ${dateFilter}\nStatus: Ready for PDF/WhatsApp share.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSubtitle}>मंडी रिपोर्ट एवं व्यापार विश्लेषण</Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportSummary}
          activeOpacity={0.7}
        >
          <Ionicons name="download-outline" size={20} color={isDark ? '#4ADE80' : '#16834A'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Switcher: Financial Reports vs Product Reports */}
        <View style={styles.mainTabContainer}>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'financial' && styles.mainTabActive]}
            onPress={() => setActiveTab('financial')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={activeTab === 'financial' ? '#FFFFFF' : (isDark ? colors.textSecondary : '#444444')}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'financial' && styles.mainTabTextActive,
              ]}
            >
              Financial Reports (वित्तीय)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'product' && styles.mainTabActive]}
            onPress={() => setActiveTab('product')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pie-chart-outline"
              size={18}
              color={activeTab === 'product' ? '#FFFFFF' : (isDark ? colors.textSecondary : '#444444')}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'product' && styles.mainTabTextActive,
              ]}
            >
              Product & Grades (उत्पाद)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter Bar */}
        <View style={styles.dateFilterRow}>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'MONTH', label: 'This Month' },
            { id: 'WEEK', label: 'This Week' },
            { id: 'TODAY', label: 'Today' },
          ].map((f) => {
            const isSel = dateFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.dateFilterChip, isSel && styles.dateFilterChipActive]}
                onPress={() => setDateFilter(f.id as any)}
              >
                <Text
                  style={[
                    styles.dateFilterText,
                    isSel && styles.dateFilterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: FINANCIAL REPORTS */}
        {activeTab === 'financial' && (
          <View>
            {/* 4 Financial KPI Cards */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardRed]}>
                <Text style={styles.kpiLabel}>Total Receivables</Text>
                <Text style={styles.kpiHindi}>लेने बाकी (बाज़ार से)</Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  ₹ {financialSummary.totalReceivable.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardOrange]}>
                <Text style={styles.kpiLabel}>Total Payables</Text>
                <Text style={styles.kpiHindi}>देने बाकी (किसानों को)</Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                  ₹ {financialSummary.totalPayable.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                <Text style={styles.kpiLabel}>Total Cash Inflow</Text>
                <Text style={styles.kpiHindi}>कुल नकद प्राप्त</Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                  ₹ {financialSummary.totalCashReceived.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                <Text style={styles.kpiLabel}>Total Cash Outflow</Text>
                <Text style={styles.kpiHindi}>कुल नकद भुगतान</Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                  ₹ {financialSummary.totalCashPaid.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Customer-Wise Outstanding Balances */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Customer-Wise Balances ({customerBalances.length})
                </Text>
                <Text style={styles.sectionSubtitle}>व्यक्तिगत बकाया विवरण</Text>
              </View>

              {customerBalances.map(({ customer, balance }) => {
                const isRec = balance > 0;
                const isPay = balance < 0;

                return (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerReportRow}
                    onPress={() =>
                      navigation.navigate('CustomerLedger', { customerId: customer.id })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.custRepInfo}>
                      <Text style={styles.custRepName}>{customer.name}</Text>
                      <Text style={styles.custRepBiz}>
                        {customer.business} • {customer.customerType || 'Buyer'}
                      </Text>
                    </View>

                    <View style={styles.custRepBal}>
                      <Text
                        style={[
                          styles.custRepAmount,
                          isRec
                            ? { color: '#DC2626' }
                            : isPay
                            ? { color: '#16834A' }
                            : { color: '#6B7280' },
                        ]}
                      >
                        ₹ {Math.abs(balance).toLocaleString()}
                      </Text>
                      <Text style={styles.custRepTag}>
                        {isRec ? 'Owes Mandi' : isPay ? 'Mandi Owes' : 'Settled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 2: PRODUCT & GRADING REPORTS */}
        {activeTab === 'product' && (
          <View>
            {/* Filter by Product */}
            <Text style={styles.filterTitle}>Select Product Filter:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prodFilterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.prodFilterChip,
                  selectedProductId === 'ALL' && styles.prodFilterChipActive,
                ]}
                onPress={() => setSelectedProductId('ALL')}
              >
                <Text
                  style={[
                    styles.prodFilterChipText,
                    selectedProductId === 'ALL' && styles.prodFilterChipTextActive,
                  ]}
                >
                  All Products
                </Text>
              </TouchableOpacity>
              {products.map((p) => {
                const isSel = selectedProductId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.prodFilterChip, isSel && styles.prodFilterChipActive]}
                    onPress={() => setSelectedProductId(p.id)}
                  >
                    <Text
                      style={[
                        styles.prodFilterChipText,
                        isSel && styles.prodFilterChipTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 1. Grade-Wise Available Stock */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Grade-Wise Available Stock</Text>
                <Text style={styles.sectionSubtitle}>गुणवत्ता अनुसार उपलब्ध स्टॉक</Text>
              </View>

              {productGrades
                .filter(
                  (g) =>
                    selectedProductId === 'ALL' || g.productId === selectedProductId
                )
                .map((grade) => {
                  const prod = products.find((p) => p.id === grade.productId);
                  const stockValue = grade.stockQuantity * grade.defaultPrice;

                  return (
                    <View key={grade.id} style={styles.gradeStockRow}>
                      <View style={styles.gradeStockInfo}>
                        <Text style={styles.gradeStockName}>
                          {prod?.name} - {grade.name}
                        </Text>
                        <Text style={styles.gradeStockRate}>
                          Rate: ₹{grade.defaultPrice}/{prod?.unit}
                        </Text>
                      </View>

                      <View style={styles.gradeStockValBox}>
                        <Text style={styles.gradeStockQty}>
                          {grade.stockQuantity} {prod?.unit}
                        </Text>
                        <Text style={styles.gradeStockValueLabel}>
                          Est: ₹{stockValue.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* 2. Grade-Wise Sales & Revenue */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Grade-Wise Sales & Revenue</Text>
                <Text style={styles.sectionSubtitle}>ग्रेड अनुसार कुल बिक्री एवं आमदनी</Text>
              </View>

              {gradeSalesStats.length === 0 ? (
                <Text style={styles.emptyNotice}>No sales recorded yet.</Text>
              ) : (
                gradeSalesStats.map((item, idx) => (
                  <View key={idx} style={styles.gradeStockRow}>
                    <View style={styles.gradeStockInfo}>
                      <Text style={styles.gradeStockName}>
                        {item.productName} ({item.gradeName})
                      </Text>
                      <Text style={styles.gradeStockRate}>
                        Sold: {item.quantity} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.gradeStockValBox}>
                      <Text style={[styles.gradeStockQty, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                        ₹ {item.revenue.toLocaleString()}
                      </Text>
                      <Text style={styles.gradeStockValueLabel}>Revenue</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 3. Product Wastage & Culled Produce */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Product Wastage Summary</Text>
                <Text style={styles.sectionSubtitle}>छंटाई खराबी एवं वेस्टेज प्रतिशत</Text>
              </View>

              {productWastageStats.length === 0 ? (
                <Text style={styles.emptyNotice}>No wastage recorded yet.</Text>
              ) : (
                productWastageStats.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <View key={item.productId} style={styles.wastageReportRow}>
                      <View style={styles.wastageRepInfo}>
                        <Text style={styles.wastageRepProd}>{item.productName}</Text>
                        <Text style={styles.wastageRepCounts}>
                          Processed: {item.originalQty} {prod?.unit} • Wastage: {item.wastageQty} {prod?.unit}
                        </Text>
                      </View>

                      <View style={styles.wastagePillBox}>
                        <Text style={styles.wastagePercentText}>
                          {item.wastagePercentage}%
                        </Text>
                        <Text style={styles.wastagePercentLabel}>Loss Ratio</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="More" navigation={navigation} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  exportBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: isDark ? '#143823' : '#E8F4EC',
  },
  content: {
    padding: 16,
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? colors.surfaceElevated : '#EEEEEE',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mainTabActive: {
    backgroundColor: '#16834A',
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dateFilterChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dateFilterChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  dateFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  kpiCardRed: {
    backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
    borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
  },
  kpiCardOrange: {
    backgroundColor: isDark ? '#3B2904' : '#FFFBEB',
    borderColor: isDark ? '#78350F' : '#FCD34D',
  },
  kpiCardGreen: {
    backgroundColor: isDark ? '#143823' : '#ECFDF5',
    borderColor: isDark ? '#1E5E35' : '#A7F3D0',
  },
  kpiCardBlue: {
    backgroundColor: isDark ? '#082F49' : '#EFF6FF',
    borderColor: isDark ? '#0369A1' : '#BFDBFE',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  kpiHindi: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  customerReportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  custRepInfo: {
    flex: 1,
  },
  custRepName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  custRepBiz: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  custRepBal: {
    alignItems: 'flex-end',
  },
  custRepAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  custRepTag: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  prodFilterScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  prodFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prodFilterChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  prodFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  prodFilterChipTextActive: {
    color: '#FFFFFF',
  },
  gradeStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gradeStockInfo: {
    flex: 1,
  },
  gradeStockName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gradeStockRate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  gradeStockValBox: {
    alignItems: 'flex-end',
  },
  gradeStockQty: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  gradeStockValueLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  wastageReportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wastageRepInfo: {
    flex: 1,
  },
  wastageRepProd: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wastageRepCounts: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  wastagePillBox: {
    backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
    borderWidth: 1,
    borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  wastagePercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#F87171' : '#DC2626',
  },
  wastagePercentLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  emptyNotice: {
    fontSize: 12,
    color: colors.textSecondary,
    padding: 10,
    textAlign: 'center',
  },
});
