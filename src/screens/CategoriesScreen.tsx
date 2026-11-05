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
import { ThemeColors } from '../styles/theme';
import { CATEGORY_EMOJIS } from '../utils/productImages';

export default function CategoriesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { categories, products, isOwner, canAddCategory } = useMandi();

  const handleAddCategoryPress = () => {
    if (!canAddCategory) {
      Alert.alert(
        'Owner Privilege Required',
        'Creating new master categories is reserved for the Mandi Owner.\n\nAs an operator, you can select from existing categories when updating commodities.'
      );
      return;
    }
    navigation.navigate('AddCategory');
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
            <Text style={styles.logo}>CALMandi</Text>
          </View>
        </View>

        <Text style={styles.title}>Categories</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Configure product classifications and market departments.'
            : 'View active mandi categories configured by the Mandi Owner.'}
        </Text>

        {/* Combined Catalog Shortcut Banner */}
        <TouchableOpacity
          style={styles.combinedBanner}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={styles.combinedBannerLeft}>
            <Ionicons name="apps" size={20} color="#16834A" />
            <View>
              <Text style={styles.combinedBannerTitle}>View Combined Products & Categories</Text>
              <Text style={styles.combinedBannerSub}>
                See all {products.length} products with photos categorized
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#16834A" />
        </TouchableOpacity>

        {/* Role Banner */}
        <View
          style={[
            styles.roleBanner,
            isOwner ? styles.ownerBannerBg : styles.operatorBannerBg,
          ]}
        >
          <Ionicons
            name={isOwner ? 'shield-checkmark' : 'lock-closed'}
            size={18}
            color={isOwner ? '#16834A' : '#D97706'}
          />
          <View style={styles.roleBannerTextWrap}>
            <Text
              style={[
                styles.roleBannerTitle,
                { color: isOwner ? '#16834A' : '#B45309' },
              ]}
            >
              {isOwner
                ? '👑 Owner: Category Management'
                : '🔒 Operator: Master Catalog View-Only'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'You have permission to create and organize categories'
                : 'Categories are managed by Mandi Owner to prevent catalog fragmentation'}
            </Text>
          </View>
        </View>

        {/* Add Category Button (Owner Only) */}
        {isOwner && (
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={handleAddCategoryPress}
          >
            <Text style={styles.addButtonText}>+ Add Category</Text>
          </TouchableOpacity>
        )}

        {/* Categories List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Category List</Text>
          <View style={styles.countBadge}>
            <Text style={styles.count}>
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </Text>
          </View>
        </View>

        {/* Categories List */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories added yet.</Text>
            <Text style={styles.emptySubtext}>
              {isOwner
                ? 'Tap "+ Add Category" to create your first category.'
                : 'Waiting for Mandi Owner to create initial categories.'}
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const matchingProducts = products.filter(
              (p) => (p.category || '').toLowerCase() === category.name.toLowerCase()
            );
            const emoji = CATEGORY_EMOJIS[category.name.toLowerCase()] || '🏷️';

            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Products', { category: category.name })
                }
              >
                <View style={styles.iconContainer}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </View>

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryProductsText}>
                    {matchingProducts.length > 0
                      ? `${matchingProducts.length} items: ${matchingProducts
                          .map((p) => p.name)
                          .slice(0, 3)
                          .join(', ')}${
                          matchingProducts.length > 3 ? '...' : ''
                        }`
                      : 'No items currently assigned'}
                  </Text>
                </View>

                <View style={styles.viewProductsBadge}>
                  <Text style={styles.viewProductsText}>View Items</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#16834A"
                  />
                </View>
              </TouchableOpacity>
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
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 21,
  },
  combinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  combinedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  combinedBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
  },
  combinedBannerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  ownerBannerBg: {
    backgroundColor: '#E8F5EC',
    borderColor: '#C7E8D3',
  },
  operatorBannerBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
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
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginLeft: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoryProductsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  viewProductsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  viewProductsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
});
