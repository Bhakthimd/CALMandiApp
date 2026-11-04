import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { CustomerType } from '../types';

export default function CashDebtScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { customers, financialSummary, getCustomerBalance } = useMandi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CustomerType | 'ALL'>('ALL');

  // Filter customers based on search and type
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch =
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.mobile.includes(searchQuery);

      const matchesType =
        selectedType === 'ALL' || (cust.customerType || 'Buyer') === selectedType;

      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, selectedType]);

  const customerTypes: { label: string; subLabel: string; value: CustomerType | 'ALL' }[] = [
    { label: 'All', subLabel: 'सभी', value: 'ALL' },
    { label: 'Buyers', subLabel: 'खरीदार', value: 'Buyer' },
    { label: 'Farmers', subLabel: 'किसान', value: 'Farmer' },
    { label: 'Traders', subLabel: 'व्यापारी', value: 'Trader' },
    { label: 'Other', subLabel: 'अन्य', value: 'Other' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Cash & Debt Management</Text>
          <Text style={styles.headerSubtitle}>रोकड़ एवं उधारी (खाताबही)</Text>
        </View>
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => navigation.navigate('Reports', { initialTab: 'financial' })}
          activeOpacity={0.7}
        >
          <Ionicons name="bar-chart-outline" size={20} color="#16834A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Financial Summary Dashboard */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summarySectionTitle}>Mandi Financial Position</Text>
              <Text style={styles.summarySectionSub}>मंडी कुल बकाया एवं नकदी स्थिति</Text>
            </View>
            <View style={styles.badgeLive}>
              <View style={styles.dotLive} />
              <Text style={styles.badgeLiveText}>Real-Time</Text>
            </View>
          </View>

          {/* 4 Financial Grid Tiles */}
          <View style={styles.metricsGrid}>
            {/* 1. Receivables (Customer Owes Mandi) */}
            <View style={[styles.metricTile, styles.tileRed]}>
              <View style={styles.metricIconBox}>
                <Ionicons name="arrow-down-outline" size={18} color="#DC2626" />
              </View>
              <Text style={styles.metricLabel}>Total Receivables</Text>
              <Text style={styles.metricHindi}>लेने बाकी (बाज़ार से)</Text>
              <Text style={[styles.metricValue, { color: '#DC2626' }]}>
                ₹ {financialSummary.totalReceivable.toLocaleString()}
              </Text>
            </View>

            {/* 2. Payables (Mandi Owes Farmers) */}
            <View style={[styles.metricTile, styles.tileOrange]}>
              <View style={styles.metricIconBox}>
                <Ionicons name="arrow-up-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.metricLabel}>Total Payables</Text>
              <Text style={styles.metricHindi}>देने बाकी (किसानों को)</Text>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>
                ₹ {financialSummary.totalPayable.toLocaleString()}
              </Text>
            </View>

            {/* 3. Cash Received */}
            <View style={[styles.metricTile, styles.tileGreen]}>
              <View style={styles.metricIconBox}>
                <Ionicons name="wallet-outline" size={18} color="#16834A" />
              </View>
              <Text style={styles.metricLabel}>Cash Inflow</Text>
              <Text style={styles.metricHindi}>कुल नकद प्राप्त</Text>
              <Text style={[styles.metricValue, { color: '#16834A' }]}>
                ₹ {financialSummary.totalCashReceived.toLocaleString()}
              </Text>
            </View>

            {/* 4. Cash Paid */}
            <View style={[styles.metricTile, styles.tileBlue]}>
              <View style={styles.metricIconBox}>
                <Ionicons name="cash-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.metricLabel}>Cash Outflow</Text>
              <Text style={styles.metricHindi}>कुल नकद भुगतान</Text>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                ₹ {financialSummary.totalCashPaid.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Net Position Banner */}
          <View style={styles.netBalanceBanner}>
            <Text style={styles.netBalanceLabel}>Net Market Position (शुद्ध स्थिति):</Text>
            <Text
              style={[
                styles.netBalanceValue,
                financialSummary.netOutstanding >= 0
                  ? { color: '#16834A' }
                  : { color: '#DC2626' },
              ]}
            >
              {financialSummary.netOutstanding >= 0
                ? `+ ₹ ${financialSummary.netOutstanding.toLocaleString()} Net Inflow`
                : `- ₹ ${Math.abs(financialSummary.netOutstanding).toLocaleString()} Net Due`}
            </Text>
          </View>
        </View>

        {/* Quick Payment Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.receiveBtn]}
            onPress={() => navigation.navigate('AddPayment', { defaultType: 'RECEIVE' })}
            activeOpacity={0.8}
          >
            <View style={styles.btnIconWrap}>
              <Ionicons name="arrow-down-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnTitle}>Receive Payment</Text>
              <Text style={styles.btnSubtitle}>रुपया प्राप्त करें (जमा)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.payBtn]}
            onPress={() => navigation.navigate('AddPayment', { defaultType: 'PAY' })}
            activeOpacity={0.8}
          >
            <View style={styles.btnIconWrap}>
              <Ionicons name="arrow-up-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnTitle}>Make Payment</Text>
              <Text style={styles.btnSubtitle}>भुगतान करें (निकासी)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Customer Directory Header */}
        <View style={styles.directoryHeaderRow}>
          <View>
            <Text style={styles.sectionHeaderTitle}>Customer Ledgers & Dues</Text>
            <Text style={styles.sectionHeaderSub}>खाताबही एवं व्यक्तिगत हिसाब</Text>
          </View>
          <TouchableOpacity
            style={styles.addCustomerBtn}
            onPress={() => navigation.navigate('AddCustomer')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={16} color="#16834A" />
            <Text style={styles.addCustomerBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#888888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer, mandi shop, mobile..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#888888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {customerTypes.map((item) => {
            const isSelected = selectedType === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedType(item.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.filterChipSubText,
                    isSelected && styles.filterChipSubTextActive,
                  ]}
                >
                  {item.subLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Customer Ledger Cards List */}
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Customers Found</Text>
            <Text style={styles.emptySub}>Try searching with another name or filter</Text>
          </View>
        ) : (
          filteredCustomers.map((cust) => {
            const bal = getCustomerBalance(cust.id);
            const isReceivable = bal.currentBalance > 0;
            const isPayable = bal.currentBalance < 0;

            const cType = cust.customerType || 'Buyer';

            return (
              <View key={cust.id} style={styles.customerCard}>
                <View style={styles.custTopRow}>
                  <View style={styles.custInfoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.custName}>{cust.name}</Text>
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
                          {cType === 'Farmer'
                            ? '🌾 Farmer'
                            : cType === 'Buyer'
                            ? '🛒 Buyer'
                            : cType === 'Trader'
                            ? '🏢 Trader'
                            : '👤 Other'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.custBusiness}>
                      {cust.business} • 📞 {cust.mobile}
                    </Text>
                  </View>

                  {/* Balance Badge */}
                  <View
                    style={[
                      styles.balanceBadge,
                      isReceivable
                        ? styles.balBadgeRed
                        : isPayable
                        ? styles.balBadgeGreen
                        : styles.balBadgeGrey,
                    ]}
                  >
                    <Text style={styles.balBadgeTitle}>
                      {isReceivable
                        ? 'OWES MANDI (लेने)'
                        : isPayable
                        ? 'MANDI OWES (देने)'
                        : 'NO DUES (हिसाब चुकता)'}
                    </Text>
                    <Text
                      style={[
                        styles.balBadgeAmount,
                        isReceivable
                          ? styles.balTextRed
                          : isPayable
                          ? styles.balTextGreen
                          : styles.balTextGrey,
                      ]}
                    >
                      ₹ {Math.abs(bal.currentBalance).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.custActionsRow}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => navigation.navigate('CustomerLedger', { customerId: cust.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#16834A" />
                    <Text style={styles.cardActionText}>View Full Ledger (खाता देखें)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, styles.cardActionBtnHighlight]}
                    onPress={() =>
                      navigation.navigate('AddPayment', {
                        customerId: cust.id,
                        defaultType: isPayable ? 'PAY' : 'RECEIVE',
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={isPayable ? '#D97706' : '#16834A'}
                    />
                    <Text
                      style={[
                        styles.cardActionText,
                        { color: isPayable ? '#D97706' : '#16834A' },
                      ]}
                    >
                      {isPayable ? 'Pay Farmer (भुगतान)' : 'Receive Cash (वसूली)'}
                    </Text>
                  </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  reportsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F4EC',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  summarySectionSub: {
    fontSize: 12,
    color: '#666666',
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16834A',
    marginRight: 5,
  },
  badgeLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricTile: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tileRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  tileOrange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  tileGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  tileBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  metricIconBox: {
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  metricHindi: {
    fontSize: 10,
    color: '#777777',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  netBalanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  netBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  netBalanceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    elevation: 3,
  },
  receiveBtn: {
    backgroundColor: '#16834A',
  },
  payBtn: {
    backgroundColor: '#0284C7',
  },
  btnIconWrap: {
    marginRight: 10,
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSubtitle: {
    fontSize: 11,
    color: '#E0F2FE',
  },
  directoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#666666',
  },
  addCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F4EC',
    gap: 4,
  },
  addCustomerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16834A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
  },
  filterChipScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipSubText: {
    fontSize: 10,
    color: '#888888',
  },
  filterChipSubTextActive: {
    color: '#E8F4EC',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444444',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#888888',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  custTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  custInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
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
  custBusiness: {
    fontSize: 12,
    color: '#666666',
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  balBadgeRed: {
    backgroundColor: '#FEF2F2',
  },
  balBadgeGreen: {
    backgroundColor: '#ECFDF5',
  },
  balBadgeGrey: {
    backgroundColor: '#F3F4F6',
  },
  balBadgeTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 2,
  },
  balBadgeAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  balTextRed: {
    color: '#DC2626',
  },
  balTextGreen: {
    color: '#16834A',
  },
  balTextGrey: {
    color: '#6B7280',
  },
  custActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardActionBtnHighlight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16834A',
  },
});
