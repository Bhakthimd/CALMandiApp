import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';

interface NetworkStatusBannerProps {
  onSyncPress?: () => void;
  onOpenSyncCenter?: () => void;
  showOfflineToggle?: boolean;
}

export default function NetworkStatusBanner({
  onSyncPress,
  onOpenSyncCenter,
  showOfflineToggle = true,
}: NetworkStatusBannerProps) {
  const {
    isEffectiveOnline,
    isSimulatedOffline,
    toggleOfflineSimulation,
    isSyncing,
    pendingSyncCount,
    lastSyncedAt,
    syncPendingRecords,
  } = useMandi();

  const handleSync = async () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      await syncPendingRecords();
    }
  };

  return (
    <View
      style={[
        styles.bannerContainer,
        isEffectiveOnline ? styles.onlineBanner : styles.offlineBanner,
      ]}
    >
      {/* Top Banner Row: Status & Test Offline Button */}
      <View style={styles.topRow}>
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.statusIconWrap,
              isEffectiveOnline ? styles.onlineIconWrap : styles.offlineIconWrap,
            ]}
          >
            <Ionicons
              name={isEffectiveOnline ? 'cloud-done' : 'cloud-offline'}
              size={18}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.statusTextGroup}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.statusTitle}>
                {isEffectiveOnline ? 'ONLINE: MANDI CLOUD' : '⚡ OFFLINE MODE (No Internet)'}
              </Text>
              {isSimulatedOffline && (
                <View style={styles.simPill}>
                  <Text style={styles.simPillText}>SIMULATED</Text>
                </View>
              )}
            </View>

            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {isEffectiveOnline
                ? pendingSyncCount > 0
                  ? `${pendingSyncCount} offline record${pendingSyncCount > 1 ? 's' : ''} waiting to sync`
                  : lastSyncedAt
                  ? `Cloud Synced • Last: ${lastSyncedAt}`
                  : 'Cloud sync active and connected'
                : pendingSyncCount > 0
                ? `${pendingSyncCount} record${pendingSyncCount > 1 ? 's' : ''} stored locally on device`
                : 'Recording locally • Zero internet required'}
            </Text>
          </View>
        </View>

        {/* Test Offline Button */}
        {showOfflineToggle && (
          <TouchableOpacity
            style={[
              styles.testOfflineBtn,
              isSimulatedOffline ? styles.testOfflineBtnActive : styles.testOfflineBtnNormal,
            ]}
            activeOpacity={0.8}
            onPress={() => toggleOfflineSimulation()}
          >
            <Ionicons
              name={isSimulatedOffline ? 'wifi' : 'airplane'}
              size={13}
              color={isSimulatedOffline ? '#FFFFFF' : '#1F2937'}
            />
            <Text
              style={[
                styles.testOfflineBtnText,
                isSimulatedOffline && styles.testOfflineBtnTextActive,
              ]}
            >
              {isSimulatedOffline ? 'Go Online' : 'Test Offline'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Strip: Data Sync Center button + Quick Sync */}
      <View style={styles.actionStrip}>
        {onOpenSyncCenter && (
          <TouchableOpacity
            style={[
              styles.syncCenterNavBtn,
              isEffectiveOnline ? styles.syncCenterNavBtnOnline : styles.syncCenterNavBtnOffline,
            ]}
            activeOpacity={0.8}
            onPress={onOpenSyncCenter}
          >
            <Ionicons name="layers-outline" size={14} color="#FFFFFF" />
            <Text style={styles.syncCenterNavBtnText}>
              Data Sync Center
            </Text>
            {pendingSyncCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingSyncCount} Pending</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        )}

        {isEffectiveOnline && pendingSyncCount > 0 && (
          <TouchableOpacity
            style={styles.quickSyncBtn}
            activeOpacity={0.8}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#16834A" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={13} color="#16834A" />
                <Text style={styles.quickSyncBtnText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineBanner: {
    backgroundColor: '#0F766E', // Deep rich teal/green
  },
  offlineBanner: {
    backgroundColor: '#92400E', // Deep rich amber/brown for high contrast
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  onlineIconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  offlineIconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusTextGroup: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  simPill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  simPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78350F',
  },
  statusSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  testOfflineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  testOfflineBtnNormal: {
    backgroundColor: '#FFFFFF',
  },
  testOfflineBtnActive: {
    backgroundColor: '#10B981',
  },
  testOfflineBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  testOfflineBtnTextActive: {
    color: '#FFFFFF',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  syncCenterNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  syncCenterNavBtnOnline: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  syncCenterNavBtnOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  syncCenterNavBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  quickSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  quickSyncBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#16834A',
  },
});
