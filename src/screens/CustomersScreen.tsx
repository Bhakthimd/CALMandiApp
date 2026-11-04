import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';

export default function CustomersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { customers, isOwner, getCustomerBalance } = useMandi();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'Farmer' | 'Buyer' | 'Trader'>('ALL');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.business.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedFilter === 'ALL' || (c.customerType || 'Buyer') === selectedFilter;
    return matchesSearch && matchesType;
  });

  const handleCallCustomer = (name: string, mobile: string) => {
    Alert.alert(
      'Customer Contact Desk',
      `Dialing ${name} (${mobile}) to confirm dispatch & mandi arrival.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Simulate Call', onPress: () => Alert.alert('Call Connected', `Talking to ${name}...`) },
      ]
    );
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

          <Text style={styles.logo}>CALMandi</Text>
        </View>

        <Text style={styles.title}>Customers & Farmers</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Manage mandi buyers, farmer ledgers, balances, and credit accounts.'
            : 'Fast directory: Look up buyers & farmers, check balance & confirm dispatch.'}
        </Text>

        {/* Role Banner */}
        <View
          style={[
            styles.roleBanner,
            isOwner ? styles.ownerBannerBg : styles.operatorBannerBg,
          ]}
        >
          <Ionicons
            name={isOwner ? 'shield-checkmark' : 'briefcase'}
            size={18}
            color={isOwner ? '#16834A' : '#0284C7'}
          />
          <View style={styles.roleBannerTextWrap}>
            <Text
              style={[
                styles.roleBannerTitle,
                { color: isOwner ? '#16834A' : '#0284C7' },
              ]}
            >
              {isOwner
                ? '👑 Owner: Customer Ledgers & Balances'
                : '👷 Operator: Customer Directory & Quick Calling'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'View balance status, pending dues, financial ledgers, and register customers'
                : 'Quick search by name or mobile & one-tap calling for floor dispatches'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by buyer or farmer name, phone, shop..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'Buyer', label: '🛒 Buyers' },
            { id: 'Farmer', label: '🌾 Farmers' },
            { id: 'Trader', label: '🏢 Traders' },
          ].map((item) => {
            const isSel = selectedFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterTab, isSel && styles.filterTabActive]}
                onPress={() => setSelectedFilter(item.id as any)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSel && styles.filterTabTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Customer Button */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Text style={styles.addButtonText}>+ Add New Customer / Farmer</Text>
        </TouchableOpacity>

        {/* Customer List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Registered Directory</Text>
          <View style={styles.countBadge}>
            <Text style={styles.count}>
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1 ? 'Contact' : 'Contacts'}
            </Text>
          </View>
        </View>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={42} color="#CCCCCC" />
            <Text style={styles.emptyText}>No contacts found.</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search query.'
                : 'Tap "+ Add New Customer / Farmer" to get started.'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => {
            const bal = getCustomerBalance(customer.id);
            const isRec = bal.currentBalance > 0;
            const isPay = bal.currentBalance < 0;
            const cType = customer.customerType || 'Buyer';

            return (
              <View key={customer.id} style={styles.customerCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {customer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.customerInfo}>
                    <View style={styles.customerTitleRow}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      {/* Customer Type Tag */}
                      <View
                        style={[
                          styles.typeTag,
                          cType === 'Farmer'
                            ? styles.typeFarmer
                            : cType === 'Buyer'
                            ? styles.typeBuyer
                            : styles.typeTrader,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeTagText,
                            cType === 'Farmer'
                              ? styles.typeFarmerText
                              : cType === 'Buyer'
                              ? styles.typeBuyerText
                              : styles.typeTraderText,
                          ]}
                        >
                          {cType}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.customerBusiness}>{customer.business}</Text>
                    <Text style={styles.customerMobile}>
                      <Ionicons name="call-outline" size={13} color="#666666" />{' '}
                      {customer.mobile}
                    </Text>
                  </View>

                  {/* Call Action Button */}
                  <TouchableOpacity
                    style={styles.callButton}
                    activeOpacity={0.7}
                    onPress={() =>
                      handleCallCustomer(customer.name, customer.mobile)
                    }
                  >
                    <Ionicons name="call" size={16} color="#16834A" />
                  </TouchableOpacity>
                </View>

                {/* Balance Status & Actions Row */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.balanceInfoCol}>
                    <Text style={styles.balanceStatusLabel}>
                      {isRec
                        ? 'Owes Mandi (उधारी)'
                        : isPay
                        ? 'Mandi Owes (देय)'
                        : 'Account Settled'}
                    </Text>
                    <Text
                      style={[
                        styles.balanceStatusVal,
                        isRec
                          ? { color: '#DC2626' }
                          : isPay
                          ? { color: '#16834A' }
                          : { color: '#6B7280' },
                      ]}
                    >
                      ₹ {Math.abs(bal.currentBalance).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.actionBtnsWrap}>
                    <TouchableOpacity
                      style={styles.actionBtnSmall}
                      onPress={() =>
                        navigation.navigate('CustomerLedger', { customerId: customer.id })
                      }
                    >
                      <Ionicons name="document-text-outline" size={14} color="#16834A" />
                      <Text style={styles.actionBtnSmallText}>Ledger</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnSmall, styles.actionBtnSmallHighlight]}
                      onPress={() =>
                        navigation.navigate('AddPayment', {
                          customerId: customer.id,
                          defaultType: isPay ? 'PAY' : 'RECEIVE',
                        })
                      }
                    >
                      <Ionicons
                        name="cash-outline"
                        size={14}
                        color={isPay ? '#D97706' : '#16834A'}
                      />
                      <Text
                        style={[
                          styles.actionBtnSmallText,
                          { color: isPay ? '#D97706' : '#16834A' },
                        ]}
                      >
                        {isPay ? 'Pay' : 'Receive'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnSmall, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}
                      onPress={() =>
                        navigation.navigate('RecordSale', { customerId: customer.id })
                      }
                    >
                      <Ionicons name="arrow-up-circle-outline" size={14} color="#0284C7" />
                      <Text style={[styles.actionBtnSmallText, { color: '#0284C7' }]}>Dispatch</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },
  backText: {
    fontSize: 18,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
  },
  subtitle: {
    fontSize: 15,
    color: '#777777',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 21,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  ownerBannerBg: {
    backgroundColor: '#E8F5EC',
    borderColor: '#C7E8D3',
  },
  operatorBannerBg: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  roleBannerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  roleBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleBannerDesc: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  countBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  count: {
    fontSize: 13,
    color: '#16834A',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16834A',
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222222',
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  typeFarmer: {
    backgroundColor: '#ECFDF5',
  },
  typeFarmerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  typeBuyer: {
    backgroundColor: '#EFF6FF',
  },
  typeBuyerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  typeTrader: {
    backgroundColor: '#FFFBEB',
  },
  typeTraderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  customerBusiness: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  customerMobile: {
    fontSize: 12,
    color: '#888888',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7E8D3',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  balanceInfoCol: {},
  balanceStatusLabel: {
    fontSize: 10,
    color: '#777777',
  },
  balanceStatusVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  actionBtnSmallHighlight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  actionBtnSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16834A',
  },
});
