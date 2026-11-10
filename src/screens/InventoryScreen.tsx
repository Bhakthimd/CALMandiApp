import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColors } from '../styles/theme';
import { getProductImage } from '../utils/productImages';
import BottomNavBar from '../components/BottomNavBar';

type StockFilter = 'ALL' | 'AVAILABLE' | 'LOW' | 'OUT';

export default function InventoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { products, lowStockCount } = useMandi();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (parseFloat(p.quantity || '0') || 0), 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);

      const qty = parseFloat(prod.quantity || '0') || 0;
      let matchesFilter = true;

      if (stockFilter === 'AVAILABLE') {
        matchesFilter = qty > 10;
      } else if (stockFilter === 'LOW') {
        matchesFilter = qty > 0 && qty <= 10;
      } else if (stockFilter === 'OUT') {
        matchesFilter = qty <= 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 14, 38),
            paddingBottom: Math.max(insets.bottom + 85, 105),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={styles.backText}>{t('back', 'Back')}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('inventory', 'Inventory')}</Text>

          <TouchableOpacity
            style={styles.addProductBtn}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addProductText}>{t('add', 'Add')}</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Summary Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{totalStockUnits}</Text>
            <Text style={styles.statLabel}>Stock Units</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text
              style={[
                styles.statValue,
                lowStockCount > 0 ? { color: '#EA580C' } : { color: isDark ? '#4ADE80' : '#16834A' },
              ]}
            >
              {lowStockCount}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder', 'Search inventory by commodity name...')}
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stock Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'AVAILABLE', label: 'Available (In Stock)' },
            { id: 'LOW', label: `Low Stock (${lowStockCount})` },
            { id: 'OUT', label: 'Out of Stock' },
          ].map((tab) => {
            const isSelected = stockFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setStockFilter(tab.id as StockFilter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products Inventory List */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Inventory Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try adjusting your search query or filter.' : 'Add your first product to start tracking inventory.'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((prod) => {
            const qty = parseFloat(prod.quantity || '0') || 0;
            const unit = prod.unit || 'Kg';
            const price = parseFloat(prod.price || prod.costPrice || '0') || 0;

            let statusLabel = 'Available';
            let statusBadgeStyle = styles.statusAvailable;
            let statusTextStyle = styles.statusTextAvailable;

            if (qty <= 0) {
              statusLabel = 'Out of Stock';
              statusBadgeStyle = styles.statusOut;
              statusTextStyle = styles.statusTextOut;
            } else if (qty <= 10) {
              statusLabel = 'Low Stock';
              statusBadgeStyle = styles.statusLow;
              statusTextStyle = styles.statusTextLow;
            }

            return (
              <View key={prod.id} style={styles.itemCard}>
                <Image
                  source={{ uri: getProductImage(prod) }}
                  style={styles.itemThumb}
                />

                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {prod.name}
                    </Text>
                    <View style={[styles.statusBadge, statusBadgeStyle]}>
                      <Text style={[styles.statusBadgeText, statusTextStyle]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemCategory}>{prod.category}</Text>

                  <View style={styles.itemStockRow}>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockLabel}>Available Stock:</Text>
                      <Text style={styles.stockValue}>
                        {qty} {unit}
                      </Text>
                    </View>

                    {price > 0 && (
                      <View style={styles.priceInfo}>
                        <Text style={styles.priceLabel}>Base Rate:</Text>
                        <Text style={styles.priceValue}>
                          ₹{price} / {unit}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionBtnInward}
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate('RecordArrival', { productId: prod.id })
                      }
                    >
                      <Ionicons name="arrow-down-circle" size={14} color="#16834A" />
                      <Text style={styles.actionBtnInwardText}>+ Add Stock</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOutward}
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate('RecordSale', { productId: prod.id })
                      }
                    >
                      <Ionicons name="arrow-up-circle" size={14} color="#0284C7" />
                      <Text style={styles.actionBtnOutwardText}>Record Sale</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab="More" navigation={navigation} />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    addProductBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#16834A',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    addProductText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statsCard: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
    },
    filterRow: {
      gap: 8,
      paddingBottom: 12,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
      borderColor: isDark ? '#22C55E' : '#16834A',
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterPillTextActive: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    emptyCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 10,
    },
    emptySub: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemThumb: {
      width: 60,
      height: 60,
      borderRadius: 10,
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
    },
    itemDetails: {
      flex: 1,
      marginLeft: 12,
    },
    itemTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: 6,
    },
    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusAvailable: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
    },
    statusTextAvailable: {
      color: isDark ? '#4ADE80' : '#16834A',
    },
    statusLow: {
      backgroundColor: isDark ? '#431407' : '#FFEDD5',
    },
    statusTextLow: {
      color: '#EA580C',
    },
    statusOut: {
      backgroundColor: isDark ? '#3B1212' : '#FEE2E2',
    },
    statusTextOut: {
      color: '#DC2626',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    itemCategory: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    itemStockRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    stockInfo: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    stockLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    stockValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    priceInfo: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    priceLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    priceValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    itemActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    actionBtnInward: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDark ? '#1E5E35' : '#BBF7D0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    actionBtnInwardText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    actionBtnOutward: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#082F49' : '#F0F9FF',
      borderWidth: 1,
      borderColor: isDark ? '#075985' : '#BAE6FD',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    actionBtnOutwardText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
  });
