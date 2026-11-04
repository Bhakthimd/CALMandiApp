import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { UserRole } from '../types';
import NetworkStatusBanner from '../components/NetworkStatusBanner';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    isOwner,
    isOperator,
    switchRole,
    logout,
    totalInventoryValue,
    totalStockUnits,
    lowStockCount,
    shiftUpdatesCount,
    customers,
    categories,
    products,
    pendingArrivalsCount,
    pendingSalesCount,
    failedRecordsCount,
    pendingSyncCount,
    syncPendingRecords,
    financialSummary,
    pricingRules,
  } = useMandi();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of CALMandi?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleToggleRole = () => {
    const nextRole: UserRole = isOwner ? 'Operator' : 'Owner';
    switchRole(nextRole);
    Alert.alert(
      'Role Switched',
      `You are now viewing as ${nextRole}.\nNotice the updated dashboard, metrics, and permissions.`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 16, 40),
          paddingBottom: Math.max(insets.bottom + 25, 30),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.logo}>CALMandi</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 1. CLEARLY VISIBLE ONLINE/OFFLINE STATUS BANNER AT TOP OF HOMESCREEN */}
      {/* 2. INCLUDES "TEST OFFLINE" BUTTON & "DATA SYNC CENTER" BUTTON */}
      <NetworkStatusBanner
        onOpenSyncCenter={() => navigation.navigate('SyncCenter')}
        onSyncPress={() => syncPendingRecords()}
      />

      {/* User Profile & Role Banner Card */}
      <View
        style={[
          styles.profileCard,
          isOwner ? styles.ownerCardBorder : styles.operatorCardBorder,
        ]}
      >
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeGreeting}>Welcome,</Text>
            <Text style={styles.userName}>{currentUser?.name || 'Mandi User'}</Text>
            <Text style={styles.mandiBusiness}>
              {currentUser?.business || 'CALMandi APMC'} • {currentUser?.location || 'Bangalore'}
            </Text>
          </View>

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              isOwner ? styles.ownerBadgeBg : styles.operatorBadgeBg,
            ]}
          >
            <Ionicons
              name={isOwner ? 'shield-checkmark' : 'briefcase'}
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.roleBadgeText}>
              {isOwner ? '👑 Owner' : '👷 Operator'}
            </Text>
          </View>
        </View>

        {/* Quick Role Switcher Banner */}
        <View style={styles.roleSwitcherRow}>
          <View style={styles.roleDescContainer}>
            <Text style={styles.roleTagline}>
              {isOwner
                ? 'Full Administrative & Financial Access'
                : 'Stock Counter & Daily Operations Desk'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.roleSwitchBtn}
            activeOpacity={0.7}
            onPress={handleToggleRole}
          >
            <Ionicons name="swap-horizontal" size={15} color="#16834A" />
            <Text style={styles.roleSwitchBtnText}>
              Test as {isOwner ? 'Operator' : 'Owner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role-Specific Metric Overview */}
      {isOwner ? (
        /* OWNER OVERVIEW: Financials & Business Insights */
        <View style={styles.ownerMetricsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Business Overview</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.greenDot} />
              <Text style={styles.liveText}>Live Analytics</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            {/* Total Inventory Value */}
            <View style={[styles.metricCard, styles.metricCardPrimary]}>
              <View style={styles.metricIconWrapPrimary}>
                <Ionicons name="cash-outline" size={20} color="#16834A" />
              </View>
              <Text style={styles.metricLabel}>Total Inventory Value</Text>
              <Text style={styles.metricValueLarge}>
                ₹ {totalInventoryValue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.metricSubtext}>Across {products.length} products</Text>
            </View>

            {/* Total Stock Units */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrapBlue}>
                <Ionicons name="cube-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.metricLabel}>Total Stock Units</Text>
              <Text style={styles.metricValue}>{totalStockUnits}</Text>
              <Text style={styles.metricSubtext}>Physical quantity in mandi</Text>
            </View>

            {/* Customers Count */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrapPurple}>
                <Ionicons name="people-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.metricLabel}>Active Buyers</Text>
              <Text style={styles.metricValue}>{customers.length}</Text>
              <Text style={styles.metricSubtext}>Registered mandi accounts</Text>
            </View>

            {/* Low Stock Alert */}
            <View style={[styles.metricCard, lowStockCount > 0 && styles.metricCardAlert]}>
              <View
                style={[
                  styles.metricIconWrapAmber,
                  lowStockCount > 0 && styles.metricIconWrapRed,
                ]}
              >
                <Ionicons
                  name={lowStockCount > 0 ? 'warning-outline' : 'checkmark-done'}
                  size={20}
                  color={lowStockCount > 0 ? '#DC2626' : '#16834A'}
                />
              </View>
              <Text style={styles.metricLabel}>Stock Status</Text>
              <Text
                style={[
                  styles.metricValue,
                  lowStockCount > 0 && { color: '#DC2626' },
                ]}
              >
                {lowStockCount > 0 ? `${lowStockCount} Low` : 'Healthy'}
              </Text>
              <Text style={styles.metricSubtext}>
                {lowStockCount > 0 ? 'Reorder needed soon' : 'All items well stocked'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* OPERATOR OVERVIEW: Shift & Counter Operations Desk */
        <View style={styles.operatorShiftSection}>
          <View style={styles.operatorShiftCard}>
            <View style={styles.operatorShiftHeader}>
              <View style={styles.shiftBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.shiftBadgeText}>COUNTER DESK ACTIVE</Text>
              </View>
              <Text style={styles.shiftTimeText}>{"Today's Shift"}</Text>
            </View>

            <Text style={styles.shiftCardTitle}>Operational Stock Counter</Text>
            <Text style={styles.shiftCardDesc}>
              Quick adjustments for crates, boxes, and bags arriving from farmers or departing to buyers.
            </Text>

            <View style={styles.shiftStatsRow}>
              <View style={styles.shiftStatItem}>
                <Text style={styles.shiftStatNumber}>{shiftUpdatesCount}</Text>
                <Text style={styles.shiftStatLabel}>Updates Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.shiftStatItem}>
                <Text style={styles.shiftStatNumber}>{products.length}</Text>
                <Text style={styles.shiftStatLabel}>Floor Items</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.shiftStatItem}>
                <Text
                  style={[
                    styles.shiftStatNumber,
                    pendingSyncCount > 0 ? { color: '#D97706' } : { color: '#16834A' },
                  ]}
                >
                  {pendingSyncCount}
                </Text>
                <Text style={styles.shiftStatLabel}>Offline Queue</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.shiftStatItem}>
                <Text style={[styles.shiftStatNumber, { color: '#D97706' }]}>
                  {lowStockCount}
                </Text>
                <Text style={styles.shiftStatLabel}>Low Stock</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 3. VISIBLE DATA SYNC CENTER & OFFLINE OPERATIONS */}
      <Text style={styles.sectionTitle}>
        {isOwner ? 'Mandi Operations & Offline Sync' : 'Floor Operations (Offline Ready)'}
      </Text>

      {/* Data Sync Center Card (Requirement 3) */}
      <TouchableOpacity
        style={[styles.menuCard, styles.syncMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SyncCenter')}
      >
        <View style={[styles.iconContainer, styles.syncIconContainer]}>
          <Ionicons name="cloud-upload" size={28} color="#D97706" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Data Sync Center</Text>
            <View
              style={[
                styles.moduleTag,
                pendingSyncCount > 0 ? styles.amberTag : styles.syncedTag,
              ]}
            >
              <Text
                style={
                  pendingSyncCount > 0 ? styles.amberTagText : styles.syncedTagText
                }
              >
                {pendingSyncCount > 0
                  ? `⚡ ${pendingSyncCount} Pending Sync`
                  : failedRecordsCount > 0
                  ? `⚠️ ${failedRecordsCount} Failed`
                  : '✓ Synced to Cloud'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Manage offline arrivals & sales, view sync history, and upload records to Mandi Cloud
          </Text>

          <View style={styles.syncMiniStatsRow}>
            <Text style={styles.syncMiniStatItem}>
              Inward: <Text style={{ fontWeight: 'bold' }}>{pendingArrivalsCount} pending</Text>
            </Text>
            <Text style={styles.syncMiniStatDot}>•</Text>
            <Text style={styles.syncMiniStatItem}>
              Outward: <Text style={{ fontWeight: 'bold' }}>{pendingSalesCount} pending</Text>
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Record Arrival Card */}
      <TouchableOpacity
        style={[styles.menuCard, styles.arrivalMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RecordArrival')}
      >
        <View style={[styles.iconContainer, styles.arrivalIconContainer]}>
          <Ionicons name="arrow-down-circle" size={28} color="#16834A" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Record Arrival (आवक)</Text>
            <View style={[styles.moduleTag, styles.offlineTag]}>
              <Text style={styles.offlineTagText}>⚡ Works Offline</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Record incoming farmer produce, lot numbers, and add crates to stock without internet
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Record Sale Card */}
      <TouchableOpacity
        style={[styles.menuCard, styles.saleMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RecordSale')}
      >
        <View style={[styles.iconContainer, styles.saleIconContainer]}>
          <Ionicons name="receipt-outline" size={28} color="#0284C7" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Record Sale (जावक / Bikri)</Text>
            <View style={[styles.moduleTag, styles.offlineTag]}>
              <Text style={styles.offlineTagText}>⚡ Works Offline</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Dispatch produce to buyers, calculate totals, and record cash/credit bills with zero network
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* DASHBOARD SHORTCUTS: FEATURE 1, 2, 3 & ANALYTICS */}
      <Text style={styles.sectionTitle}>
        {isOwner ? 'Financials, Grades & Pricing' : 'Mandi Services & Ledgers'}
      </Text>

      {/* 1. Cash & Debt Management Shortcut */}
      <TouchableOpacity
        style={[styles.menuCard, styles.cashDebtMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CashDebt')}
      >
        <View style={[styles.iconContainer, styles.cashDebtIconWrap]}>
          <Ionicons name="wallet-outline" size={28} color="#16834A" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Cash & Debt (रोकड़ एवं उधारी)</Text>
            <View style={[styles.moduleTag, styles.cashDebtTag]}>
              <Text style={styles.cashDebtTagText}>
                {financialSummary.totalReceivable > 0
                  ? `₹${financialSummary.totalReceivable.toLocaleString()} Due`
                  : 'Balances Settled'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Individual customer ledgers, debt balance tracking, receive payments & farmer disbursements
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* 2. Product Grades Shortcut */}
      <TouchableOpacity
        style={[styles.menuCard, styles.gradesMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ProductGrades')}
      >
        <View style={[styles.iconContainer, styles.gradesIconWrap]}>
          <Ionicons name="ribbon-outline" size={28} color="#0284C7" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Product Grades (गुणवत्ता ग्रेडिंग)</Text>
            <View style={[styles.moduleTag, styles.gradesTag]}>
              <Text style={styles.gradesTagText}>Grades A, B, C, D</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Configure grade quality price tiers, record sorting batches, and track culled wastage
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* 3. Customer Pricing Shortcut */}
      <TouchableOpacity
        style={[styles.menuCard, styles.pricingMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CustomerPricing')}
      >
        <View style={[styles.iconContainer, styles.pricingIconWrap]}>
          <Ionicons name="pricetag-outline" size={28} color="#D97706" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Customer Pricing (ग्राहक दर सूची)</Text>
            <View style={[styles.moduleTag, styles.pricingTag]}>
              <Text style={styles.pricingTagText}>{pricingRules.length} Custom Rates</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Negotiated selling rates by customer, commodity & quality grade with automatic dispatch lookup
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* 4. Reports & Analytics Shortcut */}
      <TouchableOpacity
        style={[styles.menuCard, styles.reportsMenuCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Reports')}
      >
        <View style={[styles.iconContainer, styles.reportsIconWrap]}>
          <Ionicons name="bar-chart-outline" size={28} color="#7C3AED" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Reports & Analytics (व्यापार रिपोर्ट)</Text>
            <View style={[styles.moduleTag, styles.reportsTag]}>
              <Text style={styles.reportsTagText}>Financials & Wastage</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Customer balance sheets, cash flow summaries, grade sales revenue & wastage loss reports
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Main Master Management Modules */}
      <Text style={styles.sectionTitle}>
        {isOwner ? 'Mandi Catalog & Management' : 'Mandi Catalog Directory'}
      </Text>

      {/* Products Module Card */}
      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Products')}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={28} color="#16834A" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Products</Text>
            <View
              style={[
                styles.moduleTag,
                isOwner ? styles.ownerTag : styles.operatorTag,
              ]}
            >
              <Text
                style={[
                  styles.moduleTagText,
                  isOwner ? styles.ownerTagText : styles.operatorTagText,
                ]}
              >
                {isOwner ? 'Full Control' : 'Daily Stock Entry'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            {isOwner
              ? 'Add products, update pricing, margins & manage master catalog'
              : 'Adjust stock quantities (+ / -), record shipments & check prices'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Customers Module Card */}
      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Customers')}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="people-outline" size={28} color="#16834A" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Customers</Text>
            <View style={[styles.moduleTag, styles.commonTag]}>
              <Text style={styles.commonTagText}>
                {isOwner ? 'Accounts & Ledgers' : 'Directory & Calling'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            {isOwner
              ? 'View customer directory, balances, and add new mandi buyers'
              : 'Search registered buyers & quickly verify for dispatch and billing'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Categories Module Card */}
      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Categories')}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="pricetags-outline" size={28} color="#16834A" />
        </View>

        <View style={styles.cardText}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Categories</Text>
            <View
              style={[
                styles.moduleTag,
                isOwner ? styles.ownerTag : styles.readOnlyTag,
              ]}
            >
              <Text
                style={[
                  styles.moduleTagText,
                  isOwner ? styles.ownerTagText : styles.readOnlyTagText,
                ]}
              >
                {isOwner ? `${categories.length} Categories` : '🔒 View Only'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            {isOwner
              ? 'Add and configure product categories and department sections'
              : 'View category classification (Master additions managed by Owner)'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </TouchableOpacity>

      {/* Staff & Permissions Matrix (Owner Feature) */}
      {isOwner && (
        <TouchableOpacity
          style={[styles.menuCard, styles.specialMenuCard]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Staff')}
        >
          <View style={[styles.iconContainer, styles.specialIconContainer]}>
            <Ionicons name="shield-outline" size={28} color="#7C3AED" />
          </View>

          <View style={styles.cardText}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Team & Permissions</Text>
              <View style={[styles.moduleTag, styles.purpleTag]}>
                <Text style={styles.purpleTagText}>Owner Only</Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>
              Manage mandi operators, desk assignments, and role access permissions
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#888888" />
        </TouchableOpacity>
      )}

      {/* Operator Permission Guidance Banner */}
      {isOperator && (
        <View style={styles.operatorNoticeCard}>
          <Ionicons name="information-circle" size={24} color="#0284C7" />
          <View style={styles.operatorNoticeContent}>
            <Text style={styles.operatorNoticeTitle}>Operator Privileges Notice</Text>
            <Text style={styles.operatorNoticeText}>
              You have operational access for recording offline arrivals, dispatches, stock tracking, and customer lookups. Master category additions and commodity removals require Mandi Owner authorization.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#16834A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  ownerCardBorder: {
    borderColor: '#A7F3D0',
  },
  operatorCardBorder: {
    borderColor: '#BAE6FD',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  profileInfo: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  mandiBusiness: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownerBadgeBg: {
    backgroundColor: '#16834A',
  },
  operatorBadgeBg: {
    backgroundColor: '#0284C7',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  roleSwitcherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleDescContainer: {
    flex: 1,
    paddingRight: 8,
  },
  roleTagline: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7E8D3',
  },
  roleSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16834A',
    marginLeft: 4,
  },
  ownerMetricsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 14,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16834A',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16834A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricCardPrimary: {
    width: '100%',
    borderColor: '#A7F3D0',
    backgroundColor: '#F8FCF9',
  },
  metricCardAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  metricIconWrapPrimary: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconWrapBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconWrapPurple: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconWrapAmber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconWrapRed: {
    backgroundColor: '#FEE2E2',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16834A',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  operatorShiftSection: {
    marginBottom: 20,
  },
  operatorShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  operatorShiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0284C7',
    marginRight: 6,
  },
  shiftBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  shiftTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  shiftCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  shiftCardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  shiftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },
  shiftStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284C7',
    marginBottom: 2,
  },
  shiftStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  arrivalMenuCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FCFDFD',
  },
  saleMenuCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#FCFDFD',
  },
  syncMenuCard: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
  },
  cashDebtMenuCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FCFDFD',
  },
  cashDebtIconWrap: {
    backgroundColor: '#E8F5EC',
  },
  cashDebtTag: {
    backgroundColor: '#FEF2F2',
  },
  cashDebtTagText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  gradesMenuCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#FCFDFD',
  },
  gradesIconWrap: {
    backgroundColor: '#E0F2FE',
  },
  gradesTag: {
    backgroundColor: '#E0F2FE',
  },
  gradesTagText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  pricingMenuCard: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF7',
  },
  pricingIconWrap: {
    backgroundColor: '#FEF3C7',
  },
  pricingTag: {
    backgroundColor: '#FEF3C7',
  },
  pricingTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  reportsMenuCard: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  reportsIconWrap: {
    backgroundColor: '#F3E8FF',
  },
  reportsTag: {
    backgroundColor: '#F3E8FF',
  },
  reportsTagText: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '700',
  },
  specialMenuCard: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  arrivalIconContainer: {
    backgroundColor: '#E8F5EC',
  },
  saleIconContainer: {
    backgroundColor: '#E0F2FE',
  },
  syncIconContainer: {
    backgroundColor: '#FEF3C7',
  },
  specialIconContainer: {
    backgroundColor: '#F3E8FF',
  },
  cardText: {
    flex: 1,
    paddingRight: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  syncMiniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  syncMiniStatItem: {
    fontSize: 11,
    color: '#64748B',
  },
  syncMiniStatDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  moduleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moduleTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offlineTag: {
    backgroundColor: '#FEF3C7',
  },
  offlineTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  amberTag: {
    backgroundColor: '#FEF3C7',
  },
  amberTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  syncedTag: {
    backgroundColor: '#DCFCE7',
  },
  syncedTagText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  ownerTag: {
    backgroundColor: '#E8F5EC',
  },
  ownerTagText: {
    color: '#16834A',
    fontSize: 11,
    fontWeight: '700',
  },
  operatorTag: {
    backgroundColor: '#E0F2FE',
  },
  operatorTagText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  commonTag: {
    backgroundColor: '#F3F4F6',
  },
  commonTagText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
  },
  readOnlyTag: {
    backgroundColor: '#FEF3C7',
  },
  readOnlyTagText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  purpleTag: {
    backgroundColor: '#F3E8FF',
  },
  purpleTagText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
  },
  operatorNoticeCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 8,
    marginBottom: 20,
  },
  operatorNoticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  operatorNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  operatorNoticeText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
});
