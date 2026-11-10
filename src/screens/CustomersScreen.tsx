import React, { useState, useMemo } from 'react';
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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColors } from '../styles/theme';
import { Customer } from '../types';
import BottomNavBar from '../components/BottomNavBar';

export default function CustomersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { customers, getCustomerBalance, deleteCustomer } = useMandi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'Farmer' | 'Buyer' | 'Trader' | 'Supplier' | 'Both'>('ALL');

  // More menu & customer details modal state
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Filter customers based on search query and selected filter
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.business.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q));

    const matchesType =
      selectedFilter === 'ALL' || (c.customerType || 'Buyer') === selectedFilter;

    return matchesSearch && matchesType;
  });

  // Native phone call handler
  const handleCallCustomer = (name: string, mobile: string) => {
    const cleanNumber = mobile.replace(/\D/g, '');
    if (!cleanNumber) {
      Alert.alert('No Number', 'Mobile number is not available for this contact.');
      return;
    }
    const telUrl = `tel:${cleanNumber}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert(
            'Customer Contact',
            `Customer: ${name}\nMobile: +91 ${cleanNumber}`
          );
        }
      })
      .catch(() => {
        Alert.alert('Customer Contact', `Calling ${name} at +91 ${cleanNumber}`);
      });
  };

  // Open the More actions bottom sheet for a customer
  const handleOpenMore = (customer: Customer) => {
    setActiveCustomer(customer);
    setIsMoreMenuVisible(true);
  };

  // Close the More menu
  const handleCloseMore = () => {
    setIsMoreMenuVisible(false);
  };

  // Delete customer with improved confirmation
  const handleDeleteCustomer = (customer: Customer) => {
    setIsMoreMenuVisible(false);
    const bal = getCustomerBalance(customer.id);
    const balanceVal = bal.currentBalance || 0;

    const balanceText =
      balanceVal > 0
        ? `Pending Receivable: ₹${balanceVal.toLocaleString('en-IN')} (Customer owes Mandi)`
        : balanceVal < 0
        ? `Pending Payable: ₹${Math.abs(balanceVal).toLocaleString('en-IN')} (Mandi owes customer)`
        : 'All dues settled (₹0)';

    Alert.alert(
      'Delete Customer',
      `Are you sure you want to remove this customer from the registered directory?\n\n` +
      `• Name: ${customer.name}\n` +
      `• Mobile: +91 ${customer.mobile}\n` +
      `• Type: ${customer.customerType || 'Buyer'}\n` +
      (customer.business ? `• Business: ${customer.business}\n` : '') +
      `• Balance: ${balanceText}\n\n` +
      `This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Customer',
          style: 'destructive',
          onPress: () => {
            deleteCustomer(customer.id);
            Alert.alert('Customer Removed', `${customer.name} has been removed from the directory.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 34),
            paddingBottom: Math.max(insets.bottom + 88, 108),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================= TOP BAR ================= */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>
              {t('navHome', 'Home')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.brandLogo, { color: isDark ? '#4ADE80' : '#16834A' }]}>
            CAL Mandi
          </Text>
        </View>

        {/* ================= DIRECTORY HEADER ================= */}
        <View style={styles.directoryHeader}>
          <View style={styles.titleWithBadge}>
            <Text style={[styles.mainHeading, { color: colors.textPrimary }]}>
              {t('registeredDirectory', 'Customer Directory')}
            </Text>
            <View
              style={[
                styles.contactCountBadge,
                {
                  backgroundColor: isDark ? '#143823' : '#DCFCE7',
                  borderColor: isDark ? '#166534' : '#BBF7D0',
                },
              ]}
            >
              <Text
                style={[
                  styles.contactCountText,
                  { color: isDark ? '#4ADE80' : '#166534' },
                ]}
              >
                {filteredCustomers.length}
              </Text>
            </View>
          </View>

          {/* Add Customer Button */}
          <TouchableOpacity
            style={styles.addCustomerBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddCustomer')}
          >
            <Ionicons name="person-add" size={15} color="#FFFFFF" />
            <Text style={styles.addCustomerBtnText}>+ Add Customer</Text>
          </TouchableOpacity>
        </View>

        {/* ================= SEARCH BAR ================= */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons name="search" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search name, mobile or business..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ================= TYPE FILTER PILLS ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {[
            { id: 'ALL', label: 'All' },
            { id: 'Buyer', label: 'Buyers' },
            { id: 'Farmer', label: 'Farmers' },
            { id: 'Supplier', label: 'Suppliers' },
            { id: 'Trader', label: 'Traders' },
            { id: 'Both', label: 'Both' },
          ].map((item) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? '#143823' : '#16834A')
                      : (isDark ? colors.surfaceElevated : '#FFFFFF'),
                    borderColor: isSelected
                      ? (isDark ? '#4ADE80' : '#16834A')
                      : (isDark ? '#334155' : '#E2E8F0'),
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(item.id as any)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : (isDark ? '#CBD5E1' : '#475569'),
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= CUSTOMER CARDS LIST ================= */}
        {filteredCustomers.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Ionicons name="people-outline" size={40} color={isDark ? '#64748B' : '#94A3B8'} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Customers Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? `No customers match "${searchQuery}".`
                : 'Tap "+ Add Customer" above to register farmers and buyers.'}
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.resetSearchBtn}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Text style={styles.resetSearchBtnText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCustomers.map((customer) => {
            const bal = getCustomerBalance(customer.id);
            const balanceVal = bal.currentBalance || 0;
            const isReceivable = balanceVal > 0; // Customer owes mandi
            const isPayable = balanceVal < 0;    // Mandi owes customer

            const cType = customer.customerType || 'Buyer';
            const isFarmer = cType === 'Farmer';
            const isBuyer = cType === 'Buyer';

            // Outstanding balance label & styling
            let balanceLabel = 'Account Settled';
            let balanceColor = isDark ? '#94A3B8' : '#64748B';

            if (isReceivable) {
              balanceLabel = 'Customer Owes Mandi';
              balanceColor = isDark ? '#4ADE80' : '#16834A';
            } else if (isPayable) {
              balanceLabel = 'Mandi Owes Customer';
              balanceColor = isDark ? '#F87171' : '#DC2626';
            }

            return (
              <View
                key={customer.id}
                style={[
                  styles.customerCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                {/* 1. Card Top: Customer Name, Type Badge, and Three-Dot Menu */}
                <View style={styles.cardTopRow}>
                  <View style={styles.nameAndBadgeWrap}>
                    <Text
                      style={[
                        styles.customerName,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                      numberOfLines={1}
                    >
                      {customer.name}
                    </Text>
                    <View
                      style={[
                        styles.customerTypeBadge,
                        isFarmer
                          ? {
                              backgroundColor: isDark ? '#143823' : '#DCFCE7',
                              borderColor: isDark ? '#166534' : '#86EFAC',
                            }
                          : isBuyer
                          ? {
                              backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
                              borderColor: isDark ? '#1D4ED8' : '#93C5FD',
                            }
                          : {
                              backgroundColor: isDark ? '#3B2904' : '#FEF3C7',
                              borderColor: isDark ? '#D97706' : '#FDE68A',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.customerTypeBadgeText,
                          isFarmer
                            ? { color: isDark ? '#4ADE80' : '#166534' }
                            : isBuyer
                            ? { color: isDark ? '#60A5FA' : '#1E40AF' }
                            : { color: isDark ? '#FBBF24' : '#92400E' },
                        ]}
                      >
                        {cType}
                      </Text>
                    </View>
                  </View>

                  {/* Secondary Actions: Three-dot Menu */}
                  <TouchableOpacity
                    style={[
                      styles.threeDotBtn,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleOpenMore(customer)}
                    accessibilityLabel="Customer menu"
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={isDark ? '#94A3B8' : '#475569'}
                    />
                  </TouchableOpacity>
                </View>

                {/* 2. Customer Subtitle: Mobile number & Business */}
                <View style={styles.cardSubRow}>
                  <Ionicons
                    name="call-outline"
                    size={13}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.customerMobile,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    +91 {customer.mobile}
                  </Text>
                  {customer.business ? (
                    <Text
                      style={[
                        styles.customerBusiness,
                        { color: isDark ? '#64748B' : '#94A3B8' },
                      ]}
                      numberOfLines={1}
                    >
                      • {customer.business}
                    </Text>
                  ) : null}
                </View>

                {/* 3. Outstanding Balance Section */}
                <View
                  style={[
                    styles.balanceCardBox,
                    {
                      backgroundColor: isDark
                        ? (isReceivable ? '#142E1F' : isPayable ? '#2D1616' : '#1E293B')
                        : (isReceivable ? '#F0FDF4' : isPayable ? '#FEF2F2' : '#F8FAFC'),
                      borderColor: isDark
                        ? (isReceivable ? '#166534' : isPayable ? '#991B1B' : '#334155')
                        : (isReceivable ? '#BBF7D0' : isPayable ? '#FECACA' : '#E2E8F0'),
                    },
                  ]}
                >
                  <Text style={[styles.balanceTitle, { color: balanceColor }]}>
                    {balanceLabel}
                  </Text>
                  <Text style={[styles.balanceValue, { color: balanceColor }]}>
                    ₹ {Math.abs(balanceVal).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* 4. Only Two Prominent Actions: Ledger & Receive Payment */}
                <View style={styles.twoActionsRow}>
                  {/* Action 1: Ledger */}
                  <TouchableOpacity
                    style={[
                      styles.actionLedgerBtn,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() =>
                      navigation.navigate('CustomerLedger', { customerId: customer.id })
                    }
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={15}
                      color={isDark ? '#4ADE80' : '#16834A'}
                    />
                    <Text
                      style={[
                        styles.actionLedgerBtnText,
                        { color: isDark ? '#FFFFFF' : '#1E293B' },
                      ]}
                    >
                      Ledger
                    </Text>
                  </TouchableOpacity>

                  {/* Action 2: Receive Payment */}
                  <TouchableOpacity
                    style={[
                      styles.actionPaymentBtn,
                      {
                        backgroundColor: isPayable
                          ? (isDark ? '#991B1B' : '#DC2626')
                          : '#16834A',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('AddPayment', {
                        customerId: customer.id,
                        defaultType: isPayable ? 'PAY' : 'RECEIVE',
                      });
                    }}
                  >
                    <Ionicons
                      name={isPayable ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionPaymentBtnText}>
                      {isPayable ? 'Pay Farmer' : 'Receive Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= CUSTOMER ACTION MENU BOTTOM SHEET ================= */}
      <Modal
        visible={isMoreMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMore}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseMore}>
          <Pressable
            style={[
              styles.bottomSheetCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            {/* Sheet Handle */}
            <View
              style={[
                styles.bottomSheetHandle,
                { backgroundColor: isDark ? '#475569' : '#CBD5E1' },
              ]}
            />

            {/* Customer Summary in Bottom Sheet */}
            {activeCustomer && (
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sheetCustomerName,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {activeCustomer.name}
                  </Text>
                  <Text
                    style={[
                      styles.sheetCustomerBusiness,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {activeCustomer.customerType || 'Buyer'}
                    {activeCustomer.business ? ` • ${activeCustomer.business}` : ''}
                    {activeCustomer.mobile ? ` • +91 ${activeCustomer.mobile}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseMore}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[
                    styles.sheetCloseBtn,
                    { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#CBD5E1' : '#64748B'} />
                </TouchableOpacity>
              </View>
            )}

            {/* Actions Menu Items */}
            <View style={styles.sheetActionsList}>
              {/* Call Customer (Quick secondary action) */}
              {activeCustomer?.mobile ? (
                <TouchableOpacity
                  style={styles.sheetMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleCloseMore();
                    handleCallCustomer(activeCustomer.name, activeCustomer.mobile);
                  }}
                >
                  <View
                    style={[
                      styles.sheetMenuIconWrap,
                      { backgroundColor: isDark ? '#143823' : '#F0FDF4' },
                    ]}
                  >
                    <Ionicons name="call-outline" size={18} color="#16834A" />
                  </View>
                  <View style={styles.sheetMenuTextWrap}>
                    <Text style={[styles.sheetMenuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      Call Customer
                    </Text>
                    <Text style={[styles.sheetMenuSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      +91 {activeCustomer.mobile}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94A3B8'} />
                </TouchableOpacity>
              ) : null}

              {/* 1. Dispatch Products */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                activeOpacity={0.7}
                onPress={() => {
                  handleCloseMore();
                  if (activeCustomer) {
                    navigation.navigate('RecordSale', { customerId: activeCustomer.id });
                  }
                }}
              >
                <View
                  style={[
                    styles.sheetMenuIconWrap,
                    { backgroundColor: isDark ? '#082F49' : '#EFF6FF' },
                  ]}
                >
                  <Ionicons name="cube-outline" size={18} color="#0284C7" />
                </View>
                <View style={styles.sheetMenuTextWrap}>
                  <Text style={[styles.sheetMenuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Dispatch Products
                  </Text>
                  <Text style={[styles.sheetMenuSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Record outbound sale or floor delivery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94A3B8'} />
              </TouchableOpacity>

              {/* 2. Edit Customer */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                activeOpacity={0.7}
                onPress={() => {
                  handleCloseMore();
                  if (activeCustomer) {
                    navigation.navigate('AddCustomer', { customer: activeCustomer });
                  }
                }}
              >
                <View
                  style={[
                    styles.sheetMenuIconWrap,
                    { backgroundColor: isDark ? '#3B2904' : '#FFFBEB' },
                  ]}
                >
                  <Ionicons name="create-outline" size={18} color="#D97706" />
                </View>
                <View style={styles.sheetMenuTextWrap}>
                  <Text style={[styles.sheetMenuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Edit Customer
                  </Text>
                  <Text style={[styles.sheetMenuSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Update name, mobile, type, and details
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94A3B8'} />
              </TouchableOpacity>

              {/* 3. Customer Details */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setIsMoreMenuVisible(false);
                  setIsDetailsVisible(true);
                }}
              >
                <View
                  style={[
                    styles.sheetMenuIconWrap,
                    { backgroundColor: isDark ? '#143823' : '#F0FDF4' },
                  ]}
                >
                  <Ionicons name="information-circle-outline" size={18} color="#16834A" />
                </View>
                <View style={styles.sheetMenuTextWrap}>
                  <Text style={[styles.sheetMenuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Customer Details
                  </Text>
                  <Text style={[styles.sheetMenuSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    View contact info and financial balance
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94A3B8'} />
              </TouchableOpacity>

              {/* 4. Transaction History */}
              <TouchableOpacity
                style={styles.sheetMenuItem}
                activeOpacity={0.7}
                onPress={() => {
                  handleCloseMore();
                  if (activeCustomer) {
                    navigation.navigate('CustomerLedger', { customerId: activeCustomer.id });
                  }
                }}
              >
                <View
                  style={[
                    styles.sheetMenuIconWrap,
                    { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' },
                  ]}
                >
                  <Ionicons name="time-outline" size={18} color="#7C3AED" />
                </View>
                <View style={styles.sheetMenuTextWrap}>
                  <Text style={[styles.sheetMenuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Transaction History
                  </Text>
                  <Text style={[styles.sheetMenuSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Full statement and payment records
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94A3B8'} />
              </TouchableOpacity>

              {/* 5. Delete Customer (Red Warning Style at Bottom) */}
              <TouchableOpacity
                style={[styles.sheetMenuItem, { borderBottomWidth: 0, marginTop: 4 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (activeCustomer) {
                    handleDeleteCustomer(activeCustomer);
                  }
                }}
              >
                <View
                  style={[
                    styles.sheetMenuIconWrap,
                    { backgroundColor: isDark ? '#3B1515' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </View>
                <View style={styles.sheetMenuTextWrap}>
                  <Text style={[styles.sheetMenuTitle, { color: '#DC2626', fontWeight: '700' }]}>
                    Delete Customer
                  </Text>
                  <Text style={[styles.sheetMenuSub, { color: isDark ? '#F87171' : '#EF4444' }]}>
                    Remove contact from registered directory
                  </Text>
                </View>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= CUSTOMER DETAILS MODAL ================= */}
      <Modal
        visible={isDetailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsDetailsVisible(false)}>
          <Pressable
            style={[
              styles.detailsDialog,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            {activeCustomer && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.detailsName,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      {activeCustomer.name}
                    </Text>
                    <Text
                      style={[
                        styles.detailsType,
                        { color: isDark ? '#4ADE80' : '#16834A' },
                      ]}
                    >
                      {activeCustomer.customerType || 'Buyer'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsDetailsVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[
                      styles.sheetCloseBtn,
                      { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                    ]}
                  >
                    <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {/* Group 1: Personal Details */}
                  <View style={styles.detailSectionGroup}>
                    <Text style={[styles.detailSectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Personal Details
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Full Name:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                        {activeCustomer.name}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Customer Type:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                        {activeCustomer.customerType || 'Buyer'}
                      </Text>
                    </View>
                  </View>

                  {/* Group 2: Business Details */}
                  <View style={styles.detailSectionGroup}>
                    <Text style={[styles.detailSectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Business Details
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Business / Shop:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                        {activeCustomer.business || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Mandi Location / Address:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                        {activeCustomer.address || 'APMC Yard Floor'}
                      </Text>
                    </View>
                  </View>

                  {/* Group 3: Contact Information */}
                  <View style={styles.detailSectionGroup}>
                    <Text style={[styles.detailSectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Contact Information
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Mobile Number:
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCallCustomer(activeCustomer.name, activeCustomer.mobile)}
                        style={styles.detailPhoneTouch}
                      >
                        <Text style={[styles.detailVal, { color: isDark ? '#4ADE80' : '#16834A', textDecorationLine: 'underline' }]}>
                          +91 {activeCustomer.mobile}
                        </Text>
                        <Ionicons name="call" size={14} color={isDark ? '#4ADE80' : '#16834A'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Group 4: Financial Balance Information */}
                  {(() => {
                    const b = getCustomerBalance(activeCustomer.id);
                    const balVal = b.currentBalance || 0;
                    const isRec = balVal > 0;
                    const isPay = balVal < 0;

                    return (
                      <View style={styles.detailSectionGroup}>
                        <Text style={[styles.detailSectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          Account & Balance
                        </Text>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Current Balance:
                          </Text>
                          <Text
                            style={[
                              styles.detailVal,
                              {
                                fontWeight: '800',
                                color: isRec
                                  ? (isDark ? '#4ADE80' : '#16834A')
                                  : isPay
                                  ? (isDark ? '#F87171' : '#DC2626')
                                  : (isDark ? '#94A3B8' : '#64748B'),
                              },
                            ]}
                          >
                            {isRec
                              ? `Customer Owes Mandi (₹ ${balVal.toLocaleString('en-IN')})`
                              : isPay
                              ? `Mandi Owes Customer (₹ ${Math.abs(balVal).toLocaleString('en-IN')})`
                              : 'Account Settled (₹ 0)'}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Total Receivable:
                          </Text>
                          <Text style={[styles.detailVal, { color: isDark ? '#4ADE80' : '#16834A', fontWeight: '700' }]}>
                            ₹ {(b.totalReceivable || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Total Payable:
                          </Text>
                          <Text style={[styles.detailVal, { color: isDark ? '#F87171' : '#DC2626', fontWeight: '700' }]}>
                            ₹ {(b.totalPayable || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </ScrollView>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.detailsCloseBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsDetailsVisible(false)}
                >
                  <Text style={styles.detailsCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= BOTTOM NAVIGATION BAR ================= */}
      <BottomNavBar activeTab="Customers" navigation={navigation} />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0A0F1D' : '#F8FAF8',
    },
    content: {
      paddingHorizontal: 16,
    },

    /* Top Bar */
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
      gap: 4,
    },
    backText: {
      fontSize: 15,
      fontWeight: '600',
    },
    brandLogo: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    /* Directory Header */
    directoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    mainHeading: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    contactCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      borderWidth: 1,
    },
    contactCountText: {
      fontSize: 12,
      fontWeight: '700',
    },
    addCustomerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      gap: 6,
    },
    addCustomerBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    /* Search Bar */
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      padding: 0,
    },

    /* Filter Pills */
    filterPillsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 14,
    },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterPillText: {
      fontSize: 13,
    },

    /* Simplified Customer Card */
    customerCard: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    nameAndBadgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '700',
      flexShrink: 1,
    },
    customerTypeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    customerTypeBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    threeDotBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 10,
    },
    customerMobile: {
      fontSize: 13,
      fontWeight: '500',
    },
    customerBusiness: {
      fontSize: 13,
    },

    /* Balance Section */
    balanceCardBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
    },
    balanceTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    balanceValue: {
      fontSize: 16,
      fontWeight: '800',
    },

    /* Two Prominent Action Buttons */
    twoActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionLedgerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      gap: 6,
    },
    actionLedgerBtnText: {
      fontSize: 14,
      fontWeight: '700',
    },
    actionPaymentBtn: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
    },
    actionPaymentBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    /* Empty Card */
    emptyCard: {
      padding: 32,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      marginTop: 20,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    resetSearchBtn: {
      backgroundColor: '#16834A',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 6,
    },
    resetSearchBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    /* Bottom Sheet Modal Styles */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    bottomSheetCard: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      borderWidth: 1,
      borderBottomWidth: 0,
      maxHeight: '80%',
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F1F5F9',
      marginBottom: 8,
    },
    sheetCustomerName: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 2,
    },
    sheetCustomerBusiness: {
      fontSize: 12,
    },
    sheetCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheetActionsList: {
      marginTop: 4,
    },
    sheetMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F8FAFC',
    },
    sheetMenuIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sheetMenuTextWrap: {
      flex: 1,
    },
    sheetMenuTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    sheetMenuSub: {
      fontSize: 12,
    },

    /* Details Modal Styles */
    detailsDialog: {
      marginHorizontal: 18,
      marginVertical: 'auto',
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      maxHeight: '85%',
    },
    detailsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F1F5F9',
      marginBottom: 12,
    },
    detailsName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 2,
    },
    detailsType: {
      fontSize: 13,
      fontWeight: '700',
    },
    detailSectionGroup: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F8FAFC',
      gap: 6,
    },
    detailSectionHeading: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailPhoneTouch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailKey: {
      fontSize: 13,
    },
    detailVal: {
      fontSize: 13,
      fontWeight: '600',
      maxWidth: '65%',
      textAlign: 'right',
    },
    detailsCloseBtn: {
      backgroundColor: '#16834A',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 14,
    },
    detailsCloseBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
