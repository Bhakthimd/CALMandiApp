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
  const { customers, isOwner, isOperator } = useMandi();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.business.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCallCustomer = (name: string, mobile: string) => {
    Alert.alert(
      'Buyer Contact Desk',
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

        <Text style={styles.title}>Customers</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Manage mandi buyers, ledger balances, and credit accounts.'
            : 'Fast customer directory: Look up buyers & confirm dispatch.'}
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
                : '👷 Operator: Buyer Verification Desk'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'View balance status, pending payments, and register buyers'
                : 'Quick search by name or mobile & one-tap calling for floor dispatches'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by buyer name, phone, or shop..."
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

        {/* Add Customer Button */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Text style={styles.addButtonText}>+ Add New Customer</Text>
        </TouchableOpacity>

        {/* Customer List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Customer Directory</Text>
          <View style={styles.countBadge}>
            <Text style={styles.count}>
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1 ? 'Buyer' : 'Buyers'}
            </Text>
          </View>
        </View>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={42} color="#CCCCCC" />
            <Text style={styles.emptyText}>No customers found.</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search query.'
                : 'Tap "+ Add Customer" to get started.'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.customerInfo}>
                <View style={styles.customerTitleRow}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  {isOwner && customer.balance && (
                    <View
                      style={[
                        styles.balanceTag,
                        customer.balance.includes('Pending')
                          ? styles.balancePendingTag
                          : styles.balanceSettledTag,
                      ]}
                    >
                      <Text
                        style={[
                          styles.balanceTagText,
                          customer.balance.includes('Pending')
                            ? styles.balancePendingText
                            : styles.balanceSettledText,
                        ]}
                      >
                        {customer.balance}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.customerBusiness}>{customer.business}</Text>
                <Text style={styles.customerMobile}>
                  <Ionicons name="call-outline" size={13} color="#666666" />{' '}
                  {customer.mobile}
                </Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.callButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleCallCustomer(customer.name, customer.mobile)
                  }
                >
                  <Ionicons name="call" size={16} color="#16834A" />
                </TouchableOpacity>

                {isOperator ? (
                  <TouchableOpacity
                    style={[styles.callButton, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('CreateSlip', {
                        type: 'OUT',
                      })
                    }
                  >
                    <Ionicons name="arrow-up-circle" size={18} color="#0284C7" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.callButton, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Khata')}
                  >
                    <Ionicons name="book-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 19,
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
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  customerBusiness: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  customerMobile: {
    fontSize: 13,
    color: '#888888',
  },
  balanceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  balanceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  balancePendingTag: {
    backgroundColor: '#FEF3C7',
  },
  balanceSettledTag: {
    backgroundColor: '#E8F5EC',
  },
  balancePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  balanceSettledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7E8D3',
  },
});
