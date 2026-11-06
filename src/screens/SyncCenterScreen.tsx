import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { ArrivalRecord, SaleRecord } from '../types';

type FilterTab = 'all' | 'pending' | 'synced' | 'failed' | 'arrivals' | 'sales';

interface UnifiedItem {
  type: 'arrival' | 'sale';
  data: ArrivalRecord | SaleRecord;
  timestamp: string;
}

export default function SyncCenterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const {
    arrivals,
    sales,
    isEffectiveOnline,
    isSimulatedOffline,
    toggleOfflineSimulation,
    isSyncing,
    lastSyncedAt,
    pendingArrivalsCount,
    pendingSalesCount,
    syncedRecordsCount,
    failedRecordsCount,
    syncPendingRecords,
  } = useMandi();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const handleSyncNow = async () => {
    if (!isEffectiveOnline) {
      Alert.alert(
        'Offline Mode Active ⚡',
        'Cannot synchronize while offline. Please turn off "Simulate Offline Mode" or reconnect to the internet to upload pending records to Mandi Cloud.',
        [
          {
            text: 'Turn Off Simulation',
            onPress: () => toggleOfflineSimulation(false),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    const res = await syncPendingRecords();
    if (res.success && res.syncedCount > 0) {
      Alert.alert('Sync Successful! 🎉', res.message);
    } else {
      Alert.alert('Data Sync Status', res.message);
    }
  };

  // Combine and sort arrivals and sales by timestamp descending
  const unifiedItems: UnifiedItem[] = [
    ...arrivals.map((a) => ({
      type: 'arrival' as const,
      data: a,
      timestamp: a.timestamp,
    })),
    ...sales.map((s) => ({
      type: 'sale' as const,
      data: s,
      timestamp: s.timestamp,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter items based on activeTab
  const filteredItems = unifiedItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.data.syncStatus === 'pending';
    if (activeTab === 'synced') return item.data.syncStatus === 'synced';
    if (activeTab === 'failed') return item.data.syncStatus === 'failed';
    if (activeTab === 'arrivals') return item.type === 'arrival';
    if (activeTab === 'sales') return item.type === 'sale';
    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

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
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleBtn}
              activeOpacity={0.7}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.gold} />
            </TouchableOpacity>
            <Text style={styles.logo}>CAL Mandi</Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>Data Sync Center</Text>
        <Text style={styles.subtitle}>
          Manage offline records, review transaction queues, and synchronize local records with Mandi Cloud.
        </Text>

        {/* Hero Sync Status Card */}
        <View
          style={[
            styles.heroCard,
            isEffectiveOnline ? styles.heroCardOnline : styles.heroCardOffline,
          ]}
        >
          {/* Top Status Row */}
          <View style={styles.heroHeaderRow}>
            <View
              style={[
                styles.connectionBadge,
                isEffectiveOnline ? styles.badgeOnlineBg : styles.badgeOfflineBg,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isEffectiveOnline ? styles.dotOnline : styles.dotOffline,
                ]}
              />
              <Text
                style={[
                  styles.connectionBadgeText,
                  { color: isEffectiveOnline ? '#065F46' : '#92400E' },
                ]}
              >
                {isEffectiveOnline ? 'ONLINE • MANDI CLOUD' : '⚡ OFFLINE MODE ACTIVE'}
              </Text>
            </View>

            {/* Offline Simulation Switch Button */}
            <TouchableOpacity
              style={[
                styles.simToggleBtn,
                isSimulatedOffline ? styles.simToggleBtnActive : styles.simToggleBtnNormal,
              ]}
              activeOpacity={0.7}
              onPress={() => toggleOfflineSimulation()}
            >
              <Ionicons
                name={isSimulatedOffline ? 'wifi' : 'airplane'}
                size={14}
                color={isSimulatedOffline ? '#FFFFFF' : '#374151'}
              />
              <Text
                style={[
                  styles.simToggleText,
                  isSimulatedOffline && styles.simToggleTextActive,
                ]}
              >
                {isSimulatedOffline ? 'Disable Test Mode' : 'Test Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* REQUIREMENT 4: 5 SPECIFIC SYNC METRICS DISPLAY */}
          <View style={styles.metricsGrid}>
            {/* 1. Pending Offline Arrivals */}
            <View style={[styles.metricTile, styles.tileAmber]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="arrow-down-circle" size={16} color="#D97706" />
                <Text style={styles.metricTileLabel}>Pending Arrivals</Text>
              </View>
              <Text style={[styles.metricTileNumber, { color: '#D97706' }]}>
                {pendingArrivalsCount}
              </Text>
              <Text style={styles.metricTileSub}>Recorded offline</Text>
            </View>

            {/* 2. Pending Offline Sales */}
            <View style={[styles.metricTile, styles.tileBlue]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="receipt" size={16} color="#0284C7" />
                <Text style={styles.metricTileLabel}>Pending Sales</Text>
              </View>
              <Text style={[styles.metricTileNumber, { color: '#0284C7' }]}>
                {pendingSalesCount}
              </Text>
              <Text style={styles.metricTileSub}>Ready to sync</Text>
            </View>

            {/* 3. Successfully Synced Records */}
            <View style={[styles.metricTile, styles.tileGreen]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.metricTileLabel}>Synced Records</Text>
              </View>
              <Text style={[styles.metricTileNumber, { color: '#16A34A' }]}>
                {syncedRecordsCount}
              </Text>
              <Text style={styles.metricTileSub}>In Mandi Cloud</Text>
            </View>

            {/* 4. Failed Sync Records */}
            <View style={[styles.metricTile, styles.tileRed]}>
              <View style={styles.metricTileHeader}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.metricTileLabel}>Failed Records</Text>
              </View>
              <Text
                style={[
                  styles.metricTileNumber,
                  { color: failedRecordsCount > 0 ? '#DC2626' : '#6B7280' },
                ]}
              >
                {failedRecordsCount}
              </Text>
              <Text style={styles.metricTileSub}>
                {failedRecordsCount > 0 ? 'Retry needed' : 'Zero errors'}
              </Text>
            </View>
          </View>

          {/* 5. Last Synchronization Time */}
          <View style={styles.lastSyncRow}>
            <Ionicons name="time" size={15} color="#16834A" />
            <Text style={styles.lastSyncText}>
              Last Synchronization Time:{' '}
              <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>
                {lastSyncedAt ? lastSyncedAt : 'Never'}
              </Text>
            </Text>
          </View>

          {/* Large Synchronize Records Now Button */}
          <TouchableOpacity
            style={[
              styles.syncNowBtn,
              (!isEffectiveOnline || isSyncing) && styles.syncNowBtnDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.syncNowBtnText}>
                  {isEffectiveOnline
                    ? pendingArrivalsCount + pendingSalesCount + failedRecordsCount > 0
                      ? `Synchronize ${pendingArrivalsCount + pendingSalesCount + failedRecordsCount} Pending Records`
                      : 'All Records Up to Date (Sync Cloud)'
                    : 'Sync Unavailable (Connect Online to Sync)'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Record Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.arrivalBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordArrival')}
          >
            <Ionicons name="arrow-down-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>+ Record Arrival</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saleBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordSale')}
          >
            <Ionicons name="receipt" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>+ Record Sale</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'all' && styles.filterTabTextActive,
              ]}
            >
              All Records ({unifiedItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'pending' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <View style={styles.tabBadgeRow}>
              <Text
                style={[
                  styles.filterTabText,
                  activeTab === 'pending' && styles.filterTabTextActive,
                ]}
              >
                Pending
              </Text>
              {pendingArrivalsCount + pendingSalesCount > 0 && (
                <View style={styles.badgePillAmber}>
                  <Text style={styles.badgePillTextAmber}>
                    {pendingArrivalsCount + pendingSalesCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'synced' && styles.filterTabActive]}
            onPress={() => setActiveTab('synced')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'synced' && styles.filterTabTextActive,
              ]}
            >
              Synced ({syncedRecordsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'failed' && styles.filterTabActive]}
            onPress={() => setActiveTab('failed')}
          >
            <View style={styles.tabBadgeRow}>
              <Text
                style={[
                  styles.filterTabText,
                  activeTab === 'failed' && styles.filterTabTextActive,
                ]}
              >
                Failed
              </Text>
              {failedRecordsCount > 0 && (
                <View style={styles.badgePillRed}>
                  <Text style={styles.badgePillTextRed}>{failedRecordsCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'arrivals' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('arrivals')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'arrivals' && styles.filterTabTextActive,
              ]}
            >
              Arrivals ({arrivals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'sales' && styles.filterTabActive]}
            onPress={() => setActiveTab('sales')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'sales' && styles.filterTabTextActive,
              ]}
            >
              Sales ({sales.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Records List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>Transactions Ledger</Text>
          <Text style={styles.listCountSubtext}>
            Showing {filteredItems.length} of {unifiedItems.length} items
          </Text>
        </View>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No records in this category</Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'pending'
                ? 'All pending records are synchronized! Everything is safely saved in Mandi Cloud.'
                : activeTab === 'failed'
                ? 'Zero failed sync transactions. All records processed cleanly.'
                : 'Tap "+ Record Arrival" or "+ Record Sale" to create transactions.'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isArrival = item.type === 'arrival';
            const arr = isArrival ? (item.data as ArrivalRecord) : null;
            const sale = !isArrival ? (item.data as SaleRecord) : null;
            const status = item.data.syncStatus;
            const isPending = status === 'pending';
            const isFailed = status === 'failed';

            return (
              <View
                key={item.data.id}
                style={[
                  styles.recordCard,
                  isPending && styles.recordCardPending,
                  isFailed && styles.recordCardFailed,
                ]}
              >
                {/* Top Type & Sync Status Row */}
                <View style={styles.recordTopRow}>
                  {/* Type Badge */}
                  <View
                    style={[
                      styles.typeBadge,
                      isArrival ? styles.arrivalBadgeBg : styles.saleBadgeBg,
                    ]}
                  >
                    <Ionicons
                      name={isArrival ? 'arrow-down-circle' : 'receipt-outline'}
                      size={14}
                      color={isArrival ? '#16834A' : '#0284C7'}
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isArrival ? '#16834A' : '#0284C7' },
                      ]}
                    >
                      {isArrival ? 'Arrival (आवक)' : 'Sale (जावक)'}
                    </Text>
                  </View>

                  {/* Sync Status Badge */}
                  <View
                    style={[
                      styles.syncStatusBadge,
                      isPending
                        ? styles.badgePending
                        : isFailed
                        ? styles.badgeFailed
                        : styles.badgeSynced,
                    ]}
                  >
                    <Ionicons
                      name={
                        isPending
                          ? 'cloud-offline-outline'
                          : isFailed
                          ? 'alert-circle'
                          : 'checkmark-circle'
                      }
                      size={12}
                      color={isPending ? '#B45309' : isFailed ? '#DC2626' : '#15803D'}
                    />
                    <Text
                      style={[
                        styles.syncStatusText,
                        {
                          color: isPending
                            ? '#B45309'
                            : isFailed
                            ? '#DC2626'
                            : '#15803D',
                        },
                      ]}
                    >
                      {isPending
                        ? 'Pending Sync (Offline)'
                        : isFailed
                        ? 'Sync Failed'
                        : 'Synced Cloud'}
                    </Text>
                  </View>
                </View>

                {/* Main Content Info */}
                <View style={styles.recordMainRow}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordCommodity}>
                      {isArrival ? arr?.productName : sale?.productName}
                    </Text>
                    <Text style={styles.recordParty}>
                      {isArrival
                        ? `Farmer: ${arr?.farmerName}${arr?.vehicleNumber ? ` • ${arr.vehicleNumber}` : ''}`
                        : `Buyer: ${sale?.customerName}`}
                    </Text>

                    {item.data.notes && (
                      <Text style={styles.recordNotes} numberOfLines={1}>
                        Note: {item.data.notes}
                      </Text>
                    )}

                    {item.data.syncError && (
                      <Text style={styles.recordErrorText} numberOfLines={2}>
                        Error: {item.data.syncError}
                      </Text>
                    )}
                  </View>

                  {/* Quantity & Amount Display */}
                  <View style={styles.recordValues}>
                    <Text style={styles.recordQuantity}>
                      {isArrival
                        ? `+${arr?.quantity} ${arr?.unit}`
                        : `-${sale?.quantity} ${sale?.unit}`}
                    </Text>
                    {!isArrival && sale && (
                      <Text style={styles.recordAmount}>
                        ₹{sale.totalAmount.toLocaleString('en-IN')}
                      </Text>
                    )}
                    {!isArrival && sale && (
                      <Text style={styles.recordPayMethod}>
                        {sale.paymentMethod}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Footer Timestamp */}
                <View style={styles.recordFooter}>
                  <Text style={styles.recordDateText}>
                    Recorded: {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
                  </Text>
                  {isPending ? (
                    <Text style={styles.offlineHintText}>
                      Stored locally on device
                    </Text>
                  ) : isFailed ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleSyncNow}
                    >
                      <Text style={styles.retryHintText}>
                        Tap to Retry Sync ↻
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.syncedHintText}>
                      Cloud synchronized
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    fontSize: 17,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  heroCardOnline: {
    borderColor: '#BBF7D0',
  },
  heroCardOffline: {
    borderColor: '#FDE68A',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeOnlineBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeOfflineBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#16A34A',
  },
  dotOffline: {
    backgroundColor: '#D97706',
  },
  connectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  simToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  simToggleBtnNormal: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  simToggleBtnActive: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  simToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  simToggleTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricTile: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  tileAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tileBlue: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  tileGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  tileRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metricTileNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricTileSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lastSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lastSyncText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  syncNowBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  syncNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  arrivalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  saleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#16834A',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePillAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgePillTextAmber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
  },
  badgePillRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgePillTextRed: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  listCountSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  recordCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recordCardPending: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  recordCardFailed: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  arrivalBadgeBg: {
    backgroundColor: '#E8F5EC',
  },
  saleBadgeBg: {
    backgroundColor: '#E0F2FE',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeSynced: {
    backgroundColor: '#DCFCE7',
  },
  badgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recordInfo: {
    flex: 1,
    paddingRight: 10,
  },
  recordCommodity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  recordParty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  recordErrorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
  recordValues: {
    alignItems: 'flex-end',
  },
  recordQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16834A',
    marginTop: 2,
  },
  recordPayMethod: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  recordDateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  offlineHintText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  retryHintText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  syncedHintText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
});
