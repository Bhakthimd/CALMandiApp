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
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, colors } = useTheme();
  const {
    currentUser,
    isOwner,
    isOperator,
    switchRole,
    logout,
    customers,
    categories,
    products,
    tallyRecords,
    totalUdhaar,
    slips,
  } = useMandi();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Welcome');
        },
      },
    ]);
  };

  const handleToggleRole = () => {
    const nextRole: UserRole = isOwner ? 'Operator' : 'Owner';
    switchRole(nextRole);
    Alert.alert(
      'Role Switched',
      `You are now viewing as ${nextRole}.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <View style={[styles.miniLogoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="leaf" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.logo, { color: colors.primary }]}>CALMandi</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.themeHeaderBtn,
                {
                  backgroundColor: isDark ? '#1E2D23' : '#F1F5F9',
                  borderColor: isDark ? '#283C30' : '#E2E8F0',
                },
              ]}
              activeOpacity={0.7}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={16}
                color={isDark ? '#FBBF24' : '#16834A'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Shortcut to First Home Screen */}
        <TouchableOpacity
          style={[
            styles.welcomeBanner,
            {
              backgroundColor: isDark ? '#143823' : '#E8F5EC',
              borderColor: colors.primary,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Welcome')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.welcomeBannerText, { color: colors.primaryDark }]}>
              Open First Home (Welcome) Screen
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* User Greeting Card */}
        <View
          style={[
            styles.welcomeCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.welcomeLeft}>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Welcome,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {currentUser?.name || 'Mandi Trader'}
            </Text>
            <Text style={[styles.businessName, { color: colors.textSecondary }]}>
              {currentUser?.business || 'CALMandi Market'}
            </Text>
          </View>

          <View style={styles.roleBox}>
            <View
              style={[
                styles.roleBadge,
                isOwner ? styles.ownerBadgeBg : styles.operatorBadgeBg,
              ]}
            >
              <Text style={styles.roleBadgeText}>
                {isOwner ? '👑 Owner' : '👷 Operator'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.switchRoleBtn,
                { backgroundColor: isDark ? '#1E2D23' : '#E8F5EC' },
              ]}
              activeOpacity={0.7}
              onPress={handleToggleRole}
            >
              <Ionicons name="swap-horizontal" size={13} color={colors.primary} />
              <Text style={[styles.switchRoleBtnText, { color: colors.primary }]}>
                Switch to {isOwner ? 'Operator' : 'Owner'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isOperator ? 'Operator Floor Desk' : 'What would you like to do?'}
        </Text>

        {/* --- OPERATOR UNIQUE FEATURE: Live Floor Crate Tally --- */}
        {isOperator && (
          <TouchableOpacity
            style={[styles.largeMenuCard, styles.operatorFeatureCard]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CrateTally')}
          >
            <View style={[styles.largeIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="finger-print" size={38} color="#0284C7" />
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Floor Crate Tally</Text>
                <View style={styles.operatorOnlyBadge}>
                  <Text style={styles.operatorOnlyBadgeText}>OPERATOR ONLY</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Tap-to-count incoming crates & outgoing shipments in real-time
              </Text>
              <View style={[styles.countPill, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.countPillText, { color: '#0284C7' }]}>
                  ⚡ {tallyRecords.length} Tallies Recorded Today
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={26} color="#0284C7" />
          </TouchableOpacity>
        )}

        {/* --- OWNER UNIQUE FEATURE: Buyer Khata & Credit Ledger --- */}
        {isOwner && (
          <TouchableOpacity
            style={[styles.largeMenuCard, styles.ownerFeatureCard]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Khata')}
          >
            <View style={[styles.largeIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="wallet" size={38} color="#D97706" />
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Buyer Khata</Text>
                <View style={styles.ownerOnlyBadge}>
                  <Text style={styles.ownerOnlyBadgeText}>OWNER ONLY</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Track buyer credit, pending balances & send WhatsApp reminders
              </Text>
              <View style={[styles.countPill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.countPillText, { color: '#B45309' }]}>
                  ₹ {totalUdhaar.toLocaleString('en-IN')} Total Credit Outstanding
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={26} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* 1. Large Button: Customers */}
        <TouchableOpacity
          style={[
            styles.largeMenuCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Customers')}
        >
          <View style={[styles.largeIconBox, { backgroundColor: isDark ? '#143823' : '#E8F5EC' }]}>
            <Ionicons name="people" size={38} color={colors.primary} />
          </View>

          <View style={styles.cardDetails}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customers</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Add and view customer list
            </Text>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#143823' : '#E8F5EC' }]}>
              <Text style={[styles.countPillText, { color: colors.primary }]}>
                {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 2. Large Button: Products */}
        <TouchableOpacity
          style={[
            styles.largeMenuCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={[styles.largeIconBox, { backgroundColor: isDark ? '#11294D' : '#E0F2FE' }]}>
            <Ionicons name="cube" size={38} color="#0284C7" />
          </View>

          <View style={styles.cardDetails}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Products</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Add and view product catalog
            </Text>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#11294D' : '#E0F2FE' }]}>
              <Text style={[styles.countPillText, { color: '#0284C7' }]}>
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 3. Large Button: Categories */}
        <TouchableOpacity
          style={[
            styles.largeMenuCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Categories')}
        >
          <View style={[styles.largeIconBox, { backgroundColor: isDark ? '#3B2904' : '#FEF3C7' }]}>
            <Ionicons name="pricetags" size={38} color="#D97706" />
          </View>

          <View style={styles.cardDetails}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Categories</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Fruits, Vegetables, Leafy Vegetables & more
            </Text>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#3B2904' : '#FEF3C7' }]}>
              <Text style={[styles.countPillText, { color: '#B45309' }]}>
                {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 4. Common Module: Mandi Delivery Slips (Stock In / Stock Out) */}
        <TouchableOpacity
          style={[
            styles.largeMenuCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Slips')}
        >
          <View style={[styles.largeIconBox, { backgroundColor: isDark ? '#2E1065' : '#F3E8FF' }]}>
            <Ionicons name="receipt" size={38} color="#9333EA" />
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Mandi Slips</Text>
              <View style={[styles.slipTypeBadge, { backgroundColor: isDark ? '#3B0764' : '#F3E8FF' }]}>
                <Text style={styles.slipTypeBadgeText}>IN & OUT</Text>
              </View>
            </View>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Farmer arrivals, buyer dispatches & instant WhatsApp slips
            </Text>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#2E1065' : '#F3E8FF' }]}>
              <Text style={[styles.countPillText, { color: '#9333EA' }]}>
                {slips.length} Slips Recorded
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 5. Owner-Only: Mandi Staff Team */}
        {isOwner && (
          <TouchableOpacity
            style={[
              styles.largeMenuCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Staff')}
          >
            <View style={[styles.largeIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="shield-checkmark" size={38} color="#64748B" />
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Mandi Staff & Operators</Text>
                <View style={styles.ownerOnlyBadge}>
                  <Text style={styles.ownerOnlyBadgeText}>OWNER ONLY</Text>
                </View>
              </View>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Manage your floor operators, desk assignments & permissions
              </Text>
              <View style={[styles.countPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.countPillText, { color: '#64748B' }]}>
                  4 Active Staff Members
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  content: {
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  welcomeBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16834A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16834A',
    letterSpacing: 0.5,
  },
  themeHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
    marginLeft: 4,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 8,
  },
  greetingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  businessName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  roleBox: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 6,
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
    fontWeight: 'bold',
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  switchRoleBtnText: {
    color: '#16834A',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 14,
  },
  largeMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  largeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16834A',
  },
  operatorFeatureCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  ownerFeatureCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  operatorOnlyBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  operatorOnlyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  ownerOnlyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerOnlyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  slipTypeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slipTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
  },
});
