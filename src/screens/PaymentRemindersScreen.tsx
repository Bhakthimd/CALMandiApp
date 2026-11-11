import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { PaymentReminder } from '../types';
import {
  addDaysToIsoDate,
  buildReminderMessage,
  formatReminderDate,
  toIsoDate,
} from '../services/reminderService';

type ReminderFilter = 'ALL' | 'OVERDUE' | 'BUYER' | 'FARMER' | 'SNOOZED';

export default function PaymentRemindersScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    currentUser,
    paymentReminders,
    reminderSummary,
    markReminderSent,
    updateReminderDueDate,
    snoozeReminder,
    clearReminderSnooze,
  } = useMandi();

  const initialFilter: ReminderFilter = route?.params?.initialFilter || 'ALL';
  const [activeFilter, setActiveFilter] = useState<ReminderFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Due Date & Snooze Modal State
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const businessName = currentUser?.business || 'CAL Mandi Yard';

  const filteredReminders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return paymentReminders.filter((item) => {
      if (activeFilter === 'OVERDUE' && item.status !== 'OVERDUE') return false;
      if (activeFilter === 'BUYER' && item.kind !== 'BUYER_RECEIVABLE') return false;
      if (activeFilter === 'FARMER' && item.kind !== 'FARMER_SETTLEMENT') return false;
      if (activeFilter === 'SNOOZED' && item.status !== 'SNOOZED') return false;

      if (q) {
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesBiz = (item.business || '').toLowerCase().includes(q);
        const matchesMob = (item.customerMobile || '').includes(q);
        const matchesRef = (item.referenceNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBiz && !matchesMob && !matchesRef) return false;
      }

      return true;
    });
  }, [paymentReminders, activeFilter, searchQuery]);

  const filterTabs: { id: ReminderFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: reminderSummary.totalCount },
    { id: 'OVERDUE', label: 'Overdue', count: reminderSummary.overdueCount },
    { id: 'BUYER', label: 'Buyer Dues', count: reminderSummary.pendingBuyerCount },
    { id: 'FARMER', label: 'Farmer Payouts', count: reminderSummary.pendingFarmerCount },
    { id: 'SNOOZED', label: 'Snoozed', count: reminderSummary.snoozedCount },
  ];

  const handleOpenDueModal = (item: PaymentReminder) => {
    setSelectedReminder(item);
    setDueDateInput(item.dueDate);
    setNotesInput(item.notes || '');
  };

  const handleWhatsAppRemind = async (item: PaymentReminder) => {
    const msg = buildReminderMessage(item, businessName);
    const cleanPhone = (item.customerMobile || '').replace(/\D/g, '');
    const waPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
    const url = waPhone
      ? `whatsapp://send?phone=${waPhone}&text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: msg });
      }
      await markReminderSent(item.customerId);
    } catch {
      try {
        await Share.share({ message: msg });
        await markReminderSent(item.customerId);
      } catch {
        Alert.alert('Share Cancelled', 'Could not open WhatsApp or share sheet.');
      }
    }
  };

  const handleSmsRemind = async (item: PaymentReminder) => {
    const msg = buildReminderMessage(item, businessName).replace(/\*/g, '');
    const cleanPhone = (item.customerMobile || '').replace(/\D/g, '');
    if (!cleanPhone) {
      Alert.alert('No Mobile Number', 'Please add a mobile number for this party first.');
      return;
    }
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
    try {
      await Linking.openURL(url);
      await markReminderSent(item.customerId);
    } catch {
      Alert.alert('SMS Unavailable', 'Could not open the SMS app on this device.');
    }
  };

  const handleCallParty = async (item: PaymentReminder) => {
    const cleanPhone = (item.customerMobile || '').replace(/\D/g, '');
    if (!cleanPhone) {
      Alert.alert('No Mobile Number', 'No phone number is saved for this account.');
      return;
    }
    try {
      await Linking.openURL(`tel:${cleanPhone}`);
    } catch {
      Alert.alert('Call Failed', `Unable to place a call to ${item.customerMobile}`);
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedReminder) return;
    const trimmed = dueDateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      Alert.alert('Invalid Date', 'Please enter due date in YYYY-MM-DD format (e.g. 2026-11-15).');
      return;
    }
    await updateReminderDueDate(selectedReminder.customerId, trimmed, notesInput.trim() || undefined);
    setSelectedReminder(null);
    Alert.alert('Due Date Updated', `Due date for ${selectedReminder.customerName} set to ${formatReminderDate(trimmed)}.`);
  };

  const handleSnooze = async (days: number) => {
    if (!selectedReminder) return;
    await snoozeReminder(selectedReminder.customerId, days);
    const targetName = selectedReminder.customerName;
    setSelectedReminder(null);
    Alert.alert('Reminder Snoozed', `${targetName} snoozed for ${days} ${days === 1 ? 'day' : 'days'}.`);
  };

  const handleUnsnooze = async (item: PaymentReminder) => {
    await clearReminderSnooze(item.customerId);
  };

  const todayIso = toIsoDate();

  const renderStatusPill = (item: PaymentReminder) => {
    if (item.status === 'OVERDUE') {
      return (
        <View style={[styles.statusPill, styles.pillOverdue]}>
          <Ionicons name="alert-circle" size={12} color="#DC2626" />
          <Text style={styles.pillOverdueText}>
            OVERDUE • {item.daysOverdue}d
          </Text>
        </View>
      );
    }
    if (item.status === 'DUE_TODAY') {
      return (
        <View style={[styles.statusPill, styles.pillDueToday]}>
          <Ionicons name="time" size={12} color="#D97706" />
          <Text style={styles.pillDueTodayText}>DUE TODAY</Text>
        </View>
      );
    }
    if (item.status === 'SNOOZED') {
      return (
        <View style={[styles.statusPill, styles.pillSnoozed]}>
          <Ionicons name="notifications-off-outline" size={12} color={isDark ? '#94A3B8' : '#475569'} />
          <Text style={styles.pillSnoozedText}>
            SNOOZED
          </Text>
        </View>
      );
    }
    const daysLeft = Math.abs(item.daysOverdue);
    return (
      <View style={[styles.statusPill, styles.pillUpcoming]}>
        <Ionicons name="calendar-outline" size={12} color="#0284C7" />
        <Text style={styles.pillUpcomingText}>
          DUE IN {daysLeft}d
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Payment Reminders</Text>
          <Text style={styles.headerSubtitle}>
            Overdue buyer dues &amp; pending farmer settlements
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cashDebtShortcut}
          onPress={() => navigation.navigate('CashDebt')}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={20} color={isDark ? '#4ADE80' : '#16834A'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Banner */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.summaryCard, styles.buyerSummaryCard]}
            activeOpacity={0.8}
            onPress={() => setActiveFilter('BUYER')}
          >
            <View style={styles.summaryTopRow}>
              <View style={[styles.summaryIconWrap, { backgroundColor: isDark ? '#5C1D1D' : '#FEE2E2' }]}>
                <Ionicons name="arrow-down-circle" size={18} color="#DC2626" />
              </View>
              {reminderSummary.overdueBuyerCount > 0 && (
                <View style={styles.overdueMiniBadge}>
                  <Text style={styles.overdueMiniText}>
                    {reminderSummary.overdueBuyerCount} Overdue
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.summaryLabel}>Buyer Payments Due</Text>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
              ₹ {reminderSummary.pendingBuyerAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              {reminderSummary.pendingBuyerCount}{' '}
              {reminderSummary.pendingBuyerCount === 1 ? 'buyer account' : 'buyer accounts'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, styles.farmerSummaryCard]}
            activeOpacity={0.8}
            onPress={() => setActiveFilter('FARMER')}
          >
            <View style={styles.summaryTopRow}>
              <View style={[styles.summaryIconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="arrow-up-circle" size={18} color="#D97706" />
              </View>
              {reminderSummary.overdueFarmerCount > 0 && (
                <View style={[styles.overdueMiniBadge, { backgroundColor: isDark ? '#78350F' : '#FDE68A' }]}>
                  <Text style={[styles.overdueMiniText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                    {reminderSummary.overdueFarmerCount} Overdue
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.summaryLabel}>Farmer Settlements</Text>
            <Text style={[styles.summaryValue, { color: '#D97706' }]}>
              ₹ {reminderSummary.pendingFarmerAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summarySub}>
              {reminderSummary.pendingFarmerCount}{' '}
              {reminderSummary.pendingFarmerCount === 1 ? 'farmer pending' : 'farmers pending'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isDark ? colors.textMuted : '#888888'}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search buyer, farmer, mobile or ref no..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={isDark ? colors.textMuted : '#888888'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Reminders List */}
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={52}
              color={isDark ? '#4ADE80' : '#16A34A'}
            />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'ALL' && !searchQuery
                ? 'All Accounts Settled!'
                : 'No Matching Reminders'}
            </Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'ALL' && !searchQuery
                ? 'There are no pending buyer dues or unsettled farmer payouts right now.'
                : 'Try switching filters or clearing your search query.'}
            </Text>
          </View>
        ) : (
          filteredReminders.map((item) => {
            const isBuyer = item.kind === 'BUYER_RECEIVABLE';
            return (
              <View
                key={item.id}
                style={[
                  styles.reminderCard,
                  item.status === 'OVERDUE' && styles.reminderCardOverdue,
                ]}
              >
                {/* Top Row: Party + Status */}
                <View style={styles.cardTopRow}>
                  <View style={styles.partyInfoCol}>
                    <View style={styles.partyNameRow}>
                      <Text style={styles.partyName} numberOfLines={1}>
                        {item.customerName}
                      </Text>
                      <View
                        style={[
                          styles.kindBadge,
                          isBuyer ? styles.kindBuyer : styles.kindFarmer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.kindBadgeText,
                            isBuyer ? styles.kindBuyerText : styles.kindFarmerText,
                          ]}
                        >
                          {isBuyer ? '🛒 Buyer' : '🌾 Farmer'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.partySub} numberOfLines={1}>
                      {item.business ? `${item.business} • ` : ''}
                      {item.customerMobile ? `📞 ${item.customerMobile}` : 'No phone'}
                    </Text>
                  </View>

                  {renderStatusPill(item)}
                </View>

                {/* Middle Row: Amount & Due Metadata */}
                <View style={styles.amountDueBox}>
                  <View>
                    <Text style={styles.amountDirectionLabel}>
                      {isBuyer ? 'Collect from Buyer' : 'Pay Farmer Settlement'}
                    </Text>
                    <Text
                      style={[
                        styles.amountValue,
                        { color: isBuyer ? '#DC2626' : '#D97706' },
                      ]}
                    >
                      ₹ {item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.dueMetaCol}>
                    <Text style={styles.dueDateText}>
                      Due: {formatReminderDate(item.dueDate)}
                      {item.isCustomDueDate ? ' (Custom)' : ''}
                    </Text>
                    {item.referenceNumber ? (
                      <Text style={styles.refText}>
                        Ref: {item.referenceNumber} • {formatReminderDate(item.referenceDate)}
                      </Text>
                    ) : (
                      <Text style={styles.refText}>
                        Since {formatReminderDate(item.referenceDate)}
                      </Text>
                    )}
                    <Text style={styles.remindedMetaText}>
                      {item.status === 'SNOOZED' && item.snoozedUntil
                        ? `Snoozed until ${formatReminderDate(item.snoozedUntil)}`
                        : item.reminderCount > 0
                        ? `Reminded ${item.reminderCount}x${
                            item.lastRemindedAt
                              ? ` • ${formatReminderDate(item.lastRemindedAt)}`
                              : ''
                          }`
                        : 'Not reminded yet'}
                    </Text>
                  </View>
                </View>

                {item.notes ? (
                  <View style={styles.noteBox}>
                    <Ionicons name="document-text-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.noteText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.waBtn]}
                    activeOpacity={0.75}
                    onPress={() => handleWhatsAppRemind(item)}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color={isDark ? '#4ADE80' : '#16834A'} />
                    <Text style={styles.waBtnText}>
                      {isBuyer ? 'Remind' : 'Notify'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.callBtn]}
                    activeOpacity={0.75}
                    onPress={() => handleCallParty(item)}
                  >
                    <Ionicons name="call-outline" size={15} color="#0284C7" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isBuyer ? styles.collectBtn : styles.payFarmerBtn,
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('AddPayment', {
                        customerId: item.customerId,
                        defaultType: isBuyer ? 'RECEIVE' : 'PAY',
                      })
                    }
                  >
                    <Ionicons name="cash-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>
                      {isBuyer ? 'Collect' : 'Settle'}
                    </Text>
                  </TouchableOpacity>

                  {item.status === 'SNOOZED' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.dueBtn]}
                      activeOpacity={0.75}
                      onPress={() => handleUnsnooze(item)}
                    >
                      <Ionicons name="notifications-outline" size={15} color={colors.textPrimary} />
                      <Text style={styles.dueBtnText}>Wake</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.dueBtn]}
                      activeOpacity={0.75}
                      onPress={() => handleOpenDueModal(item)}
                    >
                      <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} />
                      <Text style={styles.dueBtnText}>Due Date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Due Date / Snooze / Options Modal */}
      <Modal
        visible={selectedReminder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReminder(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedReminder(null)}
        >
          {selectedReminder && (
            <TouchableOpacity
              style={[
                styles.modalCard,
                { paddingBottom: Math.max(insets.bottom + 16, 24) },
              ]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Manage Reminder</Text>
                  <Text style={styles.modalSub}>
                    {selectedReminder.customerName} • ₹{' '}
                    {selectedReminder.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReminder(null)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Quick Due Date Presets */}
              <Text style={styles.modalLabel}>Quick Set Due Date</Text>
              <View style={styles.presetsRow}>
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Tomorrow', days: 1 },
                  { label: '+3 Days', days: 3 },
                  { label: '+7 Days', days: 7 },
                  { label: '+15 Days', days: 15 },
                ].map((p) => {
                  const targetDate = addDaysToIsoDate(todayIso, p.days);
                  const isActive = dueDateInput === targetDate;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.presetChip, isActive && styles.presetChipActive]}
                      onPress={() => setDueDateInput(targetDate)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isActive && styles.presetChipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={dueDateInput}
                onChangeText={setDueDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={styles.modalLabel}>Reminder Note (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="e.g. Promised UPI transfer by evening"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <TouchableOpacity
                style={styles.saveDueBtn}
                onPress={handleSaveDueDate}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveDueBtnText}>Save Due Date &amp; Note</Text>
              </TouchableOpacity>

              {/* Snooze & Secondary Actions */}
              <View style={styles.modalSecondaryRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => handleSnooze(1)}
                >
                  <Ionicons name="time-outline" size={15} color={colors.textPrimary} />
                  <Text style={styles.modalSecondaryText}>Snooze 1d</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => handleSnooze(3)}
                >
                  <Ionicons name="time-outline" size={15} color={colors.textPrimary} />
                  <Text style={styles.modalSecondaryText}>Snooze 3d</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={() => {
                    const target = selectedReminder;
                    setSelectedReminder(null);
                    handleSmsRemind(target);
                  }}
                >
                  <Ionicons name="chatbox-outline" size={15} color="#0284C7" />
                  <Text style={[styles.modalSecondaryText, { color: '#0284C7' }]}>Send SMS</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.ledgerLinkBtn}
                onPress={() => {
                  const cid = selectedReminder.customerId;
                  setSelectedReminder(null);
                  navigation.navigate('CustomerLedger', { customerId: cid });
                }}
              >
                <Ionicons name="book-outline" size={16} color={isDark ? '#4ADE80' : '#16834A'} />
                <Text style={styles.ledgerLinkText}>View Full Customer Ledger</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 6,
      marginRight: 8,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cashDebtShortcut: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? '#143823' : '#ECFDF5',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#235336' : '#BBF7D0',
    },
    content: {
      padding: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
    },
    buyerSummaryCard: {
      backgroundColor: isDark ? '#2D1616' : '#FEF2F2',
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
    },
    farmerSummaryCard: {
      backgroundColor: isDark ? '#2E1E06' : '#FFFBEB',
      borderColor: isDark ? '#78350F' : '#FDE68A',
    },
    summaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overdueMiniBadge: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    overdueMiniText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#FCA5A5' : '#B91C1C',
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 19,
      fontWeight: '800',
      marginTop: 3,
    },
    summarySub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
    filterChipScroll: {
      gap: 8,
      paddingBottom: 12,
    },
    filterChip: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 20,
    },
    filterChipActive: {
      backgroundColor: isDark ? '#143823' : '#16834A',
      borderColor: isDark ? '#22C55E' : '#16834A',
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 20,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 12,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    reminderCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 15,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    reminderCardOverdue: {
      borderColor: isDark ? '#991B1B' : '#FCA5A5',
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
      gap: 8,
    },
    partyInfoCol: {
      flex: 1,
    },
    partyNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    partyName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    kindBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    kindBuyer: {
      backgroundColor: isDark ? '#0C2D48' : '#E0F2FE',
    },
    kindFarmer: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
    },
    kindBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    kindBuyerText: {
      color: isDark ? '#38BDF8' : '#0369A1',
    },
    kindFarmerText: {
      color: isDark ? '#4ADE80' : '#15803D',
    },
    partySub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    pillOverdue: {
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
    },
    pillOverdueText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#FCA5A5' : '#DC2626',
    },
    pillDueToday: {
      backgroundColor: isDark ? '#451A03' : '#FEF3C7',
    },
    pillDueTodayText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    pillUpcoming: {
      backgroundColor: isDark ? '#082F49' : '#E0F2FE',
    },
    pillUpcomingText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    pillSnoozed: {
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    pillSnoozedText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#94A3B8' : '#475569',
    },
    amountDueBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
      borderRadius: 10,
      padding: 11,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
      gap: 8,
    },
    amountDirectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: '800',
      marginTop: 2,
    },
    dueMetaCol: {
      alignItems: 'flex-end',
      flex: 1,
    },
    dueDateText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    refText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    remindedMetaText: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
    noteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    noteText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 9,
      gap: 4,
      flexGrow: 1,
    },
    waBtn: {
      backgroundColor: isDark ? '#143823' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDark ? '#22C55E50' : '#A7F3D0',
    },
    waBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    callBtn: {
      backgroundColor: isDark ? '#082F49' : '#F0F9FF',
      borderWidth: 1,
      borderColor: isDark ? '#0284C750' : '#BAE6FD',
    },
    callBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    collectBtn: {
      backgroundColor: '#16834A',
    },
    payFarmerBtn: {
      backgroundColor: '#D97706',
    },
    primaryActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    dueBtn: {
      backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dueBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.modalBackground,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
    },
    presetChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipActive: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
      borderColor: '#16834A',
    },
    presetChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.inputBackground,
      marginBottom: 6,
    },
    saveDueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#16834A',
      borderRadius: 12,
      paddingVertical: 13,
      marginTop: 10,
      gap: 6,
    },
    saveDueBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalSecondaryRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    modalSecondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    modalSecondaryText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    ledgerLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
      gap: 6,
    },
    ledgerLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
  });
