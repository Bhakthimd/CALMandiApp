import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Linking,
  } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { MandiSlip } from '../types';

export default function SlipsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { slips } = useMandi();
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  const filteredSlips = slips.filter((s: any) => {
    if (filter === 'ALL') return true;
    return s.type === filter;
  });

  const generateWhatsAppMessage = (slip: MandiSlip) => {
    const isOut = slip.type === 'OUT';
    return `*CAL Mandi Delivery Slip*
-----------------------------
*Slip No:* #${slip.slipNumber}
*Date:* ${slip.date}
*Type:* ${isOut ? '📤 Sale / Dispatch' : '📥 Farmer Arrival (Aawak)'}
*Party:* ${slip.partyName} (${slip.partyMobile})
-----------------------------
*Commodity:* ${slip.productName} (${slip.category})
*Quantity:* ${slip.quantity} ${slip.unit}
*Rate:* ₹${slip.ratePerUnit} / ${slip.unit}
*Total Amount:* ₹${slip.totalAmount.toLocaleString('en-IN')}
*Amount Paid:* ₹${slip.paidAmount.toLocaleString('en-IN')}
*Balance Due:* ₹${slip.balanceAmount.toLocaleString('en-IN')}
${slip.notes ? `*Notes:* ${slip.notes}\n` : ''}-----------------------------
_Thank you for your business!_
*CAL Mandi APMC Market Yard*`;
  };

  const handleShare = async (slip: MandiSlip) => {
    const msg = generateWhatsAppMessage(slip);
    const cleanPhone = slip.partyMobile.replace(/\D/g, '');
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 20, 30),
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

          <Text style={styles.logo}>CAL Mandi</Text>
        </View>

        <Text style={styles.title}>Delivery Slips & Bills</Text>
        <Text style={styles.subtitle}>
          Track daily inward farmer arrivals and outward sales receipts.
        </Text>

        {/* Create New Slip Button */}
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateSlip')}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.createBtnText}>+ Create New Delivery Slip</Text>
        </TouchableOpacity>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {[
            { key: 'ALL', label: 'All Slips' },
            { key: 'IN', label: '📥 Inward (Arrival)' },
            { key: 'OUT', label: '📤 Outward (Sales)' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterChip,
                filter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(item.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Slips List */}
        {filteredSlips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No delivery slips recorded.</Text>
            <Text style={styles.emptySubtext}>
              Tap &quot;+ Create New Delivery Slip&quot; to generate your first receipt.
            </Text>
          </View>
        ) : (
          filteredSlips.map((slip: any) => {
            const isOut = slip.type === 'OUT';
            return (
              <View key={slip.id} style={styles.slipCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        isOut ? styles.outBadgeBg : styles.inBadgeBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          isOut ? styles.outBadgeText : styles.inBadgeText,
                        ]}
                      >
                        {isOut ? '📤 DISPATCH' : '📥 ARRIVAL'}
                      </Text>
                    </View>
                    <Text style={styles.slipNum}>#{slip.slipNumber}</Text>
                  </View>
                  <Text style={styles.slipDate}>{slip.date}</Text>
                </View>

                {/* Party & Commodity Details */}
                <Text style={styles.partyName}>{slip.partyName}</Text>
                <Text style={styles.partyMobile}>
                  <Ionicons name="call-outline" size={12} color={colors.textSecondary} />{' '}
                  {slip.partyMobile}
                </Text>

                <View style={styles.detailBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailCommodity}>
                      {slip.productName} ({slip.category})
                    </Text>
                    <Text style={styles.detailQty}>
                      {slip.quantity} {slip.unit}
                    </Text>
                  </View>
                  <Text style={styles.detailRate}>
                    Rate: ₹{slip.ratePerUnit} / {slip.unit}
                  </Text>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Total Bill</Text>
                    <Text style={styles.totalAmountText}>
                      ₹{slip.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {slip.balanceAmount > 0 ? (
                    <View style={styles.balanceBadge}>
                      <Text style={styles.balanceBadgeText}>
                        ₹{slip.balanceAmount.toLocaleString('en-IN')} Pending
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.settledBadge}>
                      <Text style={styles.settledBadgeText}>Fully Paid</Text>
                    </View>
                  )}
                </View>

                {/* WhatsApp Share Button */}
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  activeOpacity={0.7}
                  onPress={() => handleShare(slip)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.whatsappBtnText}>Send WhatsApp Slip</Text>
                </TouchableOpacity>
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
    backgroundColor: colors.background,
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
    fontSize: 18,
    color: isDark ? colors.textPrimary : colors.primary,
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDark ? '#4ADE80' : '#16834A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  slipCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  inBadgeBg: {
    backgroundColor: isDark ? '#143823' : '#E8F5EC',
  },
  outBadgeBg: {
    backgroundColor: isDark ? '#082F49' : '#E0F2FE',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inBadgeText: {
    color: isDark ? '#4ADE80' : '#16834A',
  },
  outBadgeText: {
    color: isDark ? '#38BDF8' : '#0284C7',
  },
  slipNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  slipDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  partyName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  partyMobile: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 2,
  },
  detailBox: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailCommodity: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailQty: {
    fontSize: 15,
    fontWeight: 'bold',
    color: isDark ? '#4ADE80' : '#16834A',
  },
  detailRate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  balanceBadge: {
    backgroundColor: isDark ? '#3B2904' : '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  balanceBadgeText: {
    color: isDark ? '#FBBF24' : '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  settledBadge: {
    backgroundColor: isDark ? '#143823' : '#E8F5EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settledBadgeText: {
    color: isDark ? '#4ADE80' : '#16834A',
    fontSize: 12,
    fontWeight: '700',
  },
  whatsappBtn: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});
