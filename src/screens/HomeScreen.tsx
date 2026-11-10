import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMandi } from '../context/MandiContext';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import BottomNavBar from '../components/BottomNavBar';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();

  const {
    currentUser,
    isOwner,
    switchRole,
    logout,
    customers,
    products,
    totalStockUnits,
    lowStockCount,
    financialSummary,
    totalUdhaar,
    todaySales,
    operatorCashDrawer,
    arrivals,
    sales,
    dispatchInvoices,
    ledgerTransactions,
    getCustomerBalance,
  } = useMandi();

  const [recentTab, setRecentTab] = useState<'sales' | 'arrivals' | 'payments'>('sales');

  const handleToggleRole = () => {
    const nextRole: UserRole = isOwner ? 'Operator' : 'Owner';
    switchRole(nextRole);
    Alert.alert(
      t('roleSwitched', 'Role Switched'),
      t('roleSwitchedMsg', `You are now viewing as ${nextRole}. Dashboard metrics and permissions updated.`, {
        role: nextRole === 'Owner' ? t('owner', 'Owner') : t('operator', 'Operator'),
      })
    );
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      `Are you sure you want to log out of ${currentUser?.business || 'CAL Mandi'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const userName = currentUser?.name || 'Mandi Operator';
  const businessName = currentUser?.business || 'CAL Mandi';
  const locationName = currentUser?.location || 'APMC Yard';

  // Today's date string YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's Arrivals calculations
  const todayArrivalsList = useMemo(() => {
    return arrivals.filter(
      (a) =>
        (a.timestamp && a.timestamp.startsWith(todayDateStr)) ||
        ((a as any).date && (a as any).date.startsWith(todayDateStr))
    );
  }, [arrivals, todayDateStr]);

  const todayArrivalsCount = todayArrivalsList.length;
  const todayArrivalsQty = todayArrivalsList.reduce((acc, a) => acc + (a.quantity || 0), 0);

  // Pending customers count
  const pendingCustomersCount = useMemo(() => {
    return customers.filter((c) => {
      const bal = getCustomerBalance(c.id);
      return bal.currentBalance > 0;
    }).length;
  }, [customers, getCustomerBalance]);

  // Outstanding receivables
  const outstandingReceivables = totalUdhaar || financialSummary.totalReceivable || 0;

  // Recent Activity data
  const recentSalesList = useMemo(() => {
    if (dispatchInvoices.length > 0) {
      return dispatchInvoices.slice(0, 3);
    }
    return sales.slice(0, 3);
  }, [dispatchInvoices, sales]);

  const recentArrivalsList = useMemo(() => {
    return arrivals.slice(0, 3);
  }, [arrivals]);

  const recentPaymentsList = useMemo(() => {
    return ledgerTransactions
      .filter((t) => t.type === 'CASH_RECEIVED' || t.type === 'CASH_PAID' || t.type === 'PARTIAL_PAYMENT')
      .slice(0, 3);
  }, [ledgerTransactions]);

  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 8, 34),
            paddingBottom: Math.max(insets.bottom + 85, 105),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================== */}
        {/* TOP BAR: Branding Logo, Business Info, Chatbot & Logout Button */}
        {/* ============================================================== */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/app_logo.png')}
              style={styles.logoAvatar}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.headerBrandTitle, { color: isDark ? colors.primaryDark : colors.primary }]}>
                CAL Mandi
              </Text>
              <Text style={[styles.headerBrandSub, { color: isDark ? colors.textSecondary : '#64748B' }]} numberOfLines={1}>
                {businessName} • {locationName}
              </Text>
            </View>
          </View>

          {/* Right Header Actions: Chatbot & Logout */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chatbot')}
              accessibilityLabel="Help and AI Assistant"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={isDark ? '#4ADE80' : '#16834A'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? '#2D1616' : '#FEF2F2',
                  borderColor: isDark ? '#991B1B' : '#FECACA',
                },
              ]}
              activeOpacity={0.7}
              onPress={handleLogoutPress}
              accessibilityLabel="Log Out"
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* WELCOME SECTION: Welcome message & Role Badge                  */}
        {/* ============================================================== */}
        <View
          style={[
            styles.greetingCard,
            {
              backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingSmall, { color: isDark ? colors.textSecondary : '#64748B' }]}>
              {t('welcome', 'Welcome back')},
            </Text>
            <Text style={[styles.greetingName, { color: colors.textPrimary }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleRole}
            style={[
              styles.rolePill,
              { backgroundColor: isOwner ? '#16834A' : '#0284C7' },
            ]}
          >
            <Ionicons
              name={isOwner ? 'shield-checkmark' : 'id-card'}
              size={13}
              color="#FFFFFF"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.rolePillText}>
              {isOwner ? 'Owner' : 'Operator'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* 1. BUSINESS OVERVIEW: Total Customers, Products, Inventory     */}
        {/* ============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Business Overview
          </Text>
        </View>

        <View style={styles.overviewRow}>
          {/* Total Customers */}
          <TouchableOpacity
            style={[
              styles.overviewCard,
              {
                backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Customers')}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: isDark ? '#0C2D48' : '#E0F2FE' }]}>
              <Ionicons name="people-outline" size={18} color={isDark ? '#38BDF8' : '#0284C7'} />
            </View>
            <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
              {customers.length}
            </Text>
            <Text style={[styles.overviewLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Total Customers
            </Text>
          </TouchableOpacity>

          {/* Total Products */}
          <TouchableOpacity
            style={[
              styles.overviewCard,
              {
                backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Products')}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
              <Ionicons name="cube-outline" size={18} color={isDark ? '#4ADE80' : '#16834A'} />
            </View>
            <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
              {products.length}
            </Text>
            <Text style={[styles.overviewLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Total Products
            </Text>
          </TouchableOpacity>

          {/* Total Inventory */}
          <TouchableOpacity
            style={[
              styles.overviewCard,
              {
                backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Inventory')}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: isDark ? '#3B2904' : '#FEF3C7' }]}>
              <Ionicons name="layers-outline" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
              {totalStockUnits}
            </Text>
            <Text style={[styles.overviewLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Total Inventory
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* 2. TODAY'S BUSINESS SUMMARY: Sales, Arrivals, Collections      */}
        {/* ============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Today&apos;s Business Summary
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Text style={[styles.viewAllLink, { color: isDark ? '#4ADE80' : '#16834A' }]}>
              Reports ›
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.todaySummaryCard,
            {
              backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          {/* Today's Sales */}
          <View style={styles.todayMetricCol}>
            <Text style={[styles.todayMetricVal, { color: isDark ? '#4ADE80' : '#16834A' }]}>
              ₹{todaySales.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.todayMetricLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Today&apos;s Sales
            </Text>
          </View>

          <View style={[styles.todayDivider, { backgroundColor: isDark ? colors.border : '#E2E8F0' }]} />

          {/* Today's Arrivals */}
          <View style={styles.todayMetricCol}>
            <Text style={[styles.todayMetricVal, { color: colors.textPrimary }]}>
              {todayArrivalsCount} {todayArrivalsCount === 1 ? 'Lot' : 'Lots'}
            </Text>
            <Text style={[styles.todayMetricLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Today&apos;s Arrivals
            </Text>
            {todayArrivalsQty > 0 ? (
              <Text style={[styles.todayMetricSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {todayArrivalsQty} units
              </Text>
            ) : null}
          </View>

          <View style={[styles.todayDivider, { backgroundColor: isDark ? colors.border : '#E2E8F0' }]} />

          {/* Today's Collections */}
          <View style={styles.todayMetricCol}>
            <Text style={[styles.todayMetricVal, { color: colors.textPrimary }]}>
              ₹{operatorCashDrawer.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.todayMetricLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Today&apos;s Collections
            </Text>
          </View>
        </View>

        {/* Quick Operations: Record Arrival & Record Sale */}
        <View style={styles.quickOpsRow}>
          <TouchableOpacity
            style={[
              styles.quickOpBtn,
              { backgroundColor: isDark ? '#064E3B' : '#16834A' },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecordArrival')}
          >
            <Ionicons name="arrow-down-circle" size={18} color="#FFFFFF" />
            <Text style={styles.quickOpBtnText}>Record Inward Arrival</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickOpBtn,
              { backgroundColor: isDark ? '#082F49' : '#0284C7' },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecordSale')}
          >
            <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
            <Text style={styles.quickOpBtnText}>Record Sale</Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* 3. IMPORTANT ALERTS: Low Stock, Pending Payments, Receivables  */}
        {/* ============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Important Alerts
          </Text>
        </View>

        <View style={styles.alertsContainer}>
          {/* Low Stock Alert */}
          {lowStockCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Inventory')}
              style={[
                styles.alertItem,
                {
                  backgroundColor: isDark ? '#431407' : '#FFF7ED',
                  borderColor: isDark ? '#9A3412' : '#FFEDD5',
                },
              ]}
            >
              <View style={[styles.alertIconCircle, { backgroundColor: isDark ? '#7C2D12' : '#FFEDD5' }]}>
                <Ionicons name="alert-circle" size={18} color="#EA580C" />
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: isDark ? '#FDBA74' : '#9A3412' }]}>
                  Low Stock Alert
                </Text>
                <Text style={[styles.alertSubtitle, { color: isDark ? '#FB923C' : '#C2410C' }]}>
                  {lowStockCount} {lowStockCount === 1 ? 'commodity' : 'commodities'} running low on inventory
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#EA580C" />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.alertItem,
                {
                  backgroundColor: isDark ? '#064E3B20' : '#F0FDF4',
                  borderColor: isDark ? '#065F46' : '#DCFCE7',
                },
              ]}
            >
              <View style={[styles.alertIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: isDark ? '#86EFAC' : '#15803D' }]}>
                  Stock Healthy
                </Text>
                <Text style={[styles.alertSubtitle, { color: isDark ? '#4ADE80' : '#166534' }]}>
                  All commodities are well stocked
                </Text>
              </View>
            </View>
          )}

          {/* Pending Customer Payments Alert */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Customers')}
            style={[
              styles.alertItem,
              {
                backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
          >
            <View style={[styles.alertIconCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="time-outline" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                Pending Customer Payments
              </Text>
              <Text style={[styles.alertSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {pendingCustomersCount > 0
                  ? `${pendingCustomersCount} customers have outstanding balances`
                  : 'All customer accounts are settled'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#94A3B8' : '#CBD5E1'} />
          </TouchableOpacity>

          {/* Outstanding Receivables Alert */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CashDebt')}
            style={[
              styles.alertItem,
              {
                backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
          >
            <View style={[styles.alertIconCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="wallet-outline" size={18} color={isDark ? '#F87171' : '#DC2626'} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                Outstanding Receivables
              </Text>
              <Text style={[styles.alertSubtitle, { color: outstandingReceivables > 0 ? '#DC2626' : (isDark ? '#94A3B8' : '#64748B'), fontWeight: '600' }]}>
                ₹ {outstandingReceivables.toLocaleString('en-IN')} total due from buyers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#94A3B8' : '#CBD5E1'} />
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* 4. RECENT ACTIVITY: Sales, Arrivals, Payments                  */}
        {/* ============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Activity
          </Text>
        </View>

        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          {/* Activity Category Tabs */}
          <View style={[styles.activityTabs, { backgroundColor: isDark ? '#0A0F1D' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[
                styles.activityTabBtn,
                recentTab === 'sales' && {
                  backgroundColor: isDark ? '#143823' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                  elevation: 1,
                },
              ]}
              onPress={() => setRecentTab('sales')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.activityTabText,
                  {
                    color: recentTab === 'sales'
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#94A3B8' : '#64748B'),
                    fontWeight: recentTab === 'sales' ? '700' : '500',
                  },
                ]}
              >
                Recent Sales
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.activityTabBtn,
                recentTab === 'arrivals' && {
                  backgroundColor: isDark ? '#143823' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                  elevation: 1,
                },
              ]}
              onPress={() => setRecentTab('arrivals')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.activityTabText,
                  {
                    color: recentTab === 'arrivals'
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#94A3B8' : '#64748B'),
                    fontWeight: recentTab === 'arrivals' ? '700' : '500',
                  },
                ]}
              >
                Recent Arrivals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.activityTabBtn,
                recentTab === 'payments' && {
                  backgroundColor: isDark ? '#143823' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                  elevation: 1,
                },
              ]}
              onPress={() => setRecentTab('payments')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.activityTabText,
                  {
                    color: recentTab === 'payments'
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#94A3B8' : '#64748B'),
                    fontWeight: recentTab === 'payments' ? '700' : '500',
                  },
                ]}
              >
                Recent Payments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity Content List */}
          <View style={styles.activityContentList}>
            {/* Tab 1: Sales */}
            {recentTab === 'sales' && (
              recentSalesList.length === 0 ? (
                <Text style={[styles.emptyActivityText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  No sales recorded yet.
                </Text>
              ) : (
                recentSalesList.map((item, idx) => {
                  const isInv = 'invoiceNumber' in item;
                  const party = isInv ? item.customerName : (item as any).customerName;
                  const amt = item.totalAmount || 0;
                  const detail = isInv && item.items?.length > 0
                    ? `${item.items[0].productName} (${item.items[0].quantity} ${item.items[0].unit})`
                    : (item as any).productName
                    ? `${(item as any).productName} (${(item as any).quantity} ${(item as any).unit})`
                    : 'Dispatch produce';

                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.activityRow,
                        idx < recentSalesList.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? '#334155' : '#F1F5F9',
                        },
                      ]}
                    >
                      <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                        <Ionicons name="cart-outline" size={16} color="#0284C7" />
                      </View>
                      <View style={styles.activityMain}>
                        <Text style={[styles.activityParty, { color: colors.textPrimary }]} numberOfLines={1}>
                          {party}
                        </Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                          {detail}
                        </Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text style={[styles.activityAmount, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                          ₹{amt.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {formatActivityTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )
            )}

            {/* Tab 2: Arrivals */}
            {recentTab === 'arrivals' && (
              recentArrivalsList.length === 0 ? (
                <Text style={[styles.emptyActivityText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  No arrivals recorded yet.
                </Text>
              ) : (
                recentArrivalsList.map((item, idx) => (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.activityRow,
                      idx < recentArrivalsList.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#334155' : '#F1F5F9',
                      },
                    ]}
                  >
                    <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
                      <Ionicons name="leaf-outline" size={16} color="#16834A" />
                    </View>
                    <View style={styles.activityMain}>
                      <Text style={[styles.activityParty, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.farmerName}
                      </Text>
                      <Text style={[styles.activitySub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                        {item.productName} • {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Text style={[styles.activityAmount, { color: colors.textPrimary }]}>
                        {item.quantity} {item.unit}
                      </Text>
                      <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {formatActivityTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ))
              )
            )}

            {/* Tab 3: Payments */}
            {recentTab === 'payments' && (
              recentPaymentsList.length === 0 ? (
                <Text style={[styles.emptyActivityText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  No payment transactions yet.
                </Text>
              ) : (
                recentPaymentsList.map((item, idx) => {
                  const isReceived = item.category === 'CREDIT' || item.type === 'CASH_RECEIVED';
                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.activityRow,
                        idx < recentPaymentsList.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? '#334155' : '#F1F5F9',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.activityIconCircle,
                          {
                            backgroundColor: isReceived
                              ? (isDark ? '#143823' : '#DCFCE7')
                              : (isDark ? '#2D1616' : '#FEF2F2'),
                          },
                        ]}
                      >
                        <Ionicons
                          name={isReceived ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                          size={16}
                          color={isReceived ? '#16834A' : '#DC2626'}
                        />
                      </View>
                      <View style={styles.activityMain}>
                        <Text style={[styles.activityParty, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item.customerName}
                        </Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                          {isReceived ? 'Payment Received' : 'Payment Given'} • {item.paymentMethod}
                        </Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text
                          style={[
                            styles.activityAmount,
                            { color: isReceived ? '#16834A' : '#DC2626' },
                          ]}
                        >
                          {isReceived ? '+ ' : '- '}₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {formatActivityTime(item.createdAt || item.date)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* 5-Item Bottom Navigation */}
      <BottomNavBar activeTab="Home" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  headerBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerBrandSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutBtn: {
    marginLeft: 8,
  },

  /* Greeting Card */
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  greetingSmall: {
    fontSize: 12,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 1,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* 1. Business Overview Row */
  overviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  overviewCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  overviewIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* 2. Today's Business Summary */
  todaySummaryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  todayMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  todayMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  todayMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayMetricSub: {
    fontSize: 9,
    marginTop: 1,
  },
  todayDivider: {
    width: 1,
    height: 30,
  },

  /* Quick Operations Row */
  quickOpsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickOpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  quickOpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 3. Important Alerts */
  alertsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  /* 4. Recent Activity */
  activityCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  activityTabs: {
    flexDirection: 'row',
    padding: 3,
  },
  activityTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  activityTabText: {
    fontSize: 11,
  },
  activityContentList: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityMain: {
    flex: 1,
    marginRight: 8,
  },
  activityParty: {
    fontSize: 13,
    fontWeight: '700',
  },
  activitySub: {
    fontSize: 11,
    marginTop: 1,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityTime: {
    fontSize: 10,
    marginTop: 1,
  },
  emptyActivityText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 18,
  },
});
