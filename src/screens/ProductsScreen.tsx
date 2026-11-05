import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { getProductImage, getProductEmoji, CATEGORY_EMOJIS } from '../utils/productImages';
import { Product } from '../types';

export default function ProductsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const {
    products,
    categories,
    addCategory,
    productGrades,
    updateProductQuantity,
    deleteProduct,
    isOwner,
    isOperator,
    canDeleteProduct,
  } = useMandi();

  const initialCat = route?.params?.category || 'ALL';
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(initialCat);
  const [isAddCatModalVisible, setIsAddCatModalVisible] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Step increments and decrements for stock quantity
  const handleIncrement = (id: string, currentQty: string, step = 1) => {
    const num = parseInt(currentQty, 10) || 0;
    updateProductQuantity(id, (num + step).toString());
  };

  const handleDecrement = (id: string, currentQty: string, step = 1) => {
    const num = parseInt(currentQty, 10) || 0;
    const nextVal = Math.max(0, num - step);
    updateProductQuantity(id, nextVal.toString());
  };

  const handleDelete = (id: string, name: string) => {
    if (!canDeleteProduct) {
      Alert.alert(
        'Owner Privilege Required',
        `Only the Mandi Owner has permission to delete "${name}" from the product catalog.\n\nAs an operator, you can adjust daily arrival and dispatch quantities.`
      );
      return;
    }

    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${name}" from your product catalog?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(id);
          },
        },
      ]
    );
  };

  const handleAddProductPress = (preselectedCategory?: string) => {
    if (isOperator) {
      Alert.alert(
        'Owner Privilege Required',
        'Adding new commodities to the master catalog requires Mandi Owner authorization.\n\nPlease contact your Mandi Owner to add new commodities.'
      );
      return;
    }
    navigation.navigate('AddProduct', {
      initialCategory: preselectedCategory || (selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined),
    });
  };

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }
    const res = addCategory(trimmed);
    if (res.success) {
      setSelectedCategoryTab(trimmed);
      setNewCatName('');
      setIsAddCatModalVisible(false);
      Alert.alert('Category Added', `Category "${trimmed}" has been created.`);
    } else {
      Alert.alert('Error', res.error || 'Could not add category.');
    }
  };

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered list based on active category tab
  const displayedProducts = useMemo(() => {
    if (selectedCategoryTab === 'ALL') return products;
    return products.filter(
      (p) => (p.category || '').toLowerCase() === selectedCategoryTab.toLowerCase()
    );
  }, [products, selectedCategoryTab]);

  const renderProductCard = (product: Product) => {
    const currentQty =
      product.quantity !== undefined ? String(product.quantity) : '0';
    const qtyNum = parseFloat(currentQty) || 0;
    const priceNum = parseFloat(product.price || '0') || 0;
    const itemTotalVal = qtyNum * priceNum;
    const productImgUrl = getProductImage(product);
    const fallbackEmoji = getProductEmoji(product.name, product.category);

    return (
      <View key={product.id} style={styles.productCard}>
        {/* Top Info Row: Product Image & Details */}
        <View style={styles.cardHeader}>
          {/* 🌟 VIBRANT PRODUCT IMAGE */}
          <View style={styles.productImageWrapper}>
            <Image
              source={{ uri: productImgUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productEmojiBadge}>
              <Text style={styles.productEmojiText}>{fallbackEmoji}</Text>
            </View>
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.badgesRow}>
              {/* Category Badge */}
              <TouchableOpacity
                style={styles.categoryBadge}
                activeOpacity={0.7}
                onPress={() => setSelectedCategoryTab(product.category)}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={11}
                  color="#16834A"
                />
                <Text style={styles.categoryBadgeText}>
                  {product.category}
                </Text>
              </TouchableOpacity>

              {/* Price Badge */}
              {product.price ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>
                    ₹{product.price} / {product.unit}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Owner Financial Valuation */}
            {isOwner && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.valuationText}>
                  Stock Capital: ₹{itemTotalVal.toLocaleString('en-IN')}
                </Text>
                {product.costPrice && (
                  <Text style={styles.marginText}>
                    Cost: ₹{product.costPrice} • Margin: +₹{priceNum - parseFloat(product.costPrice)}/{product.unit}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Delete Button (Owner Only) */}
          {isOwner && (
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.7}
              onPress={() => handleDelete(product.id, product.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>

        {/* 🌟 TAP COUNT FOR ADDING/SUBTRACTING CRATE OR KGS WITH FINAL TOTAL AVAILABLE COUNT */}
        <View style={styles.quantitySection}>
          <View style={styles.quantityHeader}>
            <View style={styles.quantityHeaderLeft}>
              <Ionicons name="speedometer-outline" size={15} color="#16834A" />
              <Text style={styles.quantityLabel}>Tap Count & Inventory</Text>
            </View>
            <Text style={styles.unitTag}>Measuring Unit: {product.unit}</Text>
          </View>

          {/* 🎯 FINAL TOTAL AVAILABLE COUNT HIGHLIGHT DISPLAY */}
          <View style={styles.totalAvailableDisplayCard}>
            <View style={styles.totalAvailableLeft}>
              <Text style={styles.totalAvailableLabel}>
                FINAL TOTAL AVAILABLE COUNT:
              </Text>
              <View style={styles.totalAvailableRow}>
                <Text style={styles.totalAvailableNumber}>{currentQty}</Text>
                <Text style={styles.totalAvailableUnit}>{product.unit}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.tapClickerShortcutBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('CrateTally', {
                  productId: product.id,
                  initialMode: 'IN',
                })
              }
            >
              <Ionicons name="finger-print" size={14} color="#0284C7" />
              <Text style={styles.tapClickerShortcutText}>Floor Clicker</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Tap Controls for Adding & Subtracting Crates/Kgs */}
          <View style={styles.quantityInputRow}>
            {/* Fast Subtract -10 */}
            <TouchableOpacity
              style={[styles.stepButton, styles.batchSubBtn]}
              activeOpacity={0.7}
              onPress={() => handleDecrement(product.id, currentQty, 10)}
            >
              <Text style={styles.batchSubText}>-10</Text>
            </TouchableOpacity>

            {/* Subtract -1 */}
            <TouchableOpacity
              style={[styles.stepButton, styles.subStepButton]}
              activeOpacity={0.7}
              onPress={() => handleDecrement(product.id, currentQty, 1)}
            >
              <Ionicons name="remove" size={18} color="#DC2626" />
            </TouchableOpacity>

            {/* Numeric Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={currentQty}
                onChangeText={(val) =>
                  updateProductQuantity(
                    product.id,
                    val.replace(/\D/g, '')
                  )
                }
                selectTextOnFocus
              />
            </View>

            {/* Add +1 */}
            <TouchableOpacity
              style={[styles.stepButton, styles.addStepButton]}
              activeOpacity={0.7}
              onPress={() => handleIncrement(product.id, currentQty, 1)}
            >
              <Ionicons name="add" size={18} color="#16834A" />
            </TouchableOpacity>

            {/* Fast Add +10 */}
            <TouchableOpacity
              style={[styles.stepButton, styles.batchAddBtn]}
              activeOpacity={0.7}
              onPress={() => handleIncrement(product.id, currentQty, 10)}
            >
              <Text style={styles.batchAddText}>+10</Text>
            </TouchableOpacity>
          </View>

          {/* Item Quick Transaction Buttons */}
          <View style={styles.cardQuickActionsRow}>
            <TouchableOpacity
              style={styles.cardQuickArrivalBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('RecordArrival', {
                  productId: product.id,
                })
              }
            >
              <Ionicons name="arrow-down" size={13} color="#16834A" />
              <Text style={styles.cardQuickArrivalText}>+ Inward Arrival</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardQuickSaleBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('RecordSale', {
                  productId: product.id,
                })
              }
            >
              <Ionicons name="arrow-up" size={13} color="#0284C7" />
              <Text style={styles.cardQuickSaleText}>- Outward Sale</Text>
            </TouchableOpacity>
          </View>

          {/* Quality Grades & Wastage Quick Buttons */}
          <View style={styles.cardGradesRow}>
            <TouchableOpacity
              style={styles.cardGradeBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ProductGrades', {
                  productId: product.id,
                })
              }
            >
              <Ionicons name="ribbon-outline" size={13} color="#0284C7" />
              <Text style={styles.cardGradeBtnText}>
                Grades ({productGrades.filter((g) => g.productId === product.id && g.isActive).length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardWastageBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('GradingWastage', {
                  productId: product.id,
                })
              }
            >
              <Ionicons name="funnel-outline" size={13} color="#D97706" />
              <Text style={styles.cardWastageBtnText}>Sort & Wastage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fast Action: Slip & Clicker buttons */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.cardActionTallyBtn}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('CrateTally', {
                productId: product.id,
                initialMode: 'IN',
              })
            }
          >
            <Ionicons name="finger-print" size={15} color="#0284C7" />
            <Text style={styles.cardActionTallyText}>⚡ Tap-to-Count ({product.unit})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardActionOutBtn}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('CreateSlip', {
                type: 'OUT',
                productId: product.id,
              })
            }
          >
            <Ionicons name="receipt-outline" size={15} color="#16834A" />
            <Text style={styles.cardActionOutText}>+ Create Slip</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        keyboardShouldPersistTaps="handled"
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

        <Text style={styles.title}>Products & Categories</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Unified catalog: Manage categories, products, images, stock & prices.'
            : 'Counter operations desk: Real-time stock counts, images & categories.'}
        </Text>

        
        {/* Role Mode Banner */}
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
                ? '👑 Owner Mode: Full Catalog & Category Control'
                : '👷 Operator Mode: Real-Time Stock Count Desk'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'Create categories, add products with images, adjust rates & margins'
                : 'Stock adjustments (+/-) enabled. Master deletions locked by Owner'}
            </Text>
          </View>
        </View>

        {/* Quick Operations (Arrival, Sale & Clicker) Row */}
        <View style={styles.quickOpsRow}>
          <TouchableOpacity
            style={styles.quickOpArrivalBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordArrival')}
          >
            <Ionicons name="arrow-down-circle" size={17} color="#FFFFFF" />
            <Text style={styles.quickOpBtnText}>Record Arrival</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickOpSaleBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordSale')}
          >
            <Ionicons name="receipt" size={17} color="#FFFFFF" />
            <Text style={styles.quickOpBtnText}>Record Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickOpTallyBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CrateTally')}
          >
            <Ionicons name="finger-print" size={17} color="#FFFFFF" />
            <Text style={styles.quickOpBtnText}>Tap Clicker</Text>
          </TouchableOpacity>
        </View>

        {/* Feature 2 & 3 Quick Links Row */}
        <View style={styles.gradeFeatureShortcutsRow}>
          <TouchableOpacity
            style={styles.gradeFeatureBtn}
            onPress={() => navigation.navigate('ProductGrades')}
            activeOpacity={0.7}
          >
            <Ionicons name="ribbon-outline" size={16} color="#0284C7" />
            <Text style={styles.gradeFeatureBtnText}>Product Grades (ग्रेडिंग)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gradeFeatureBtn}
            onPress={() => navigation.navigate('CustomerPricing')}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={16} color="#D97706" />
            <Text style={styles.gradeFeatureBtnText}>Customer Rates (दर सूची)</Text>
          </TouchableOpacity>
        </View>

        {/* 🌟 COMBINED CATEGORIES & PRODUCTS BAR: CATEGORY SELECTOR PILLS */}
        <View style={styles.categoriesBarContainer}>
          <View style={styles.categoriesBarHeader}>
            <View style={styles.categoriesBarTitleRow}>
              <Ionicons name="pricetags" size={16} color="#16834A" />
              <Text style={styles.categoriesBarTitle}>Categories ({categories.length})</Text>
            </View>

            {isOwner && (
              <TouchableOpacity
                style={styles.addCategoryInlineBtn}
                activeOpacity={0.7}
                onPress={() => setIsAddCatModalVisible(true)}
              >
                <Ionicons name="add" size={15} color="#16834A" />
                <Text style={styles.addCategoryInlineText}>+ Add Category</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsScroll}
          >
            {/* All Products Tab */}
            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategoryTab === 'ALL' && styles.categoryPillActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategoryTab('ALL')}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategoryTab === 'ALL' && styles.categoryPillTextActive,
                ]}
              >
                📦 All Items ({products.length})
              </Text>
            </TouchableOpacity>

            {/* Individual Category Pills */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryTab.toLowerCase() === cat.name.toLowerCase();
              const count = categoryCounts[cat.name] || 0;
              const emoji = CATEGORY_EMOJIS[cat.name.toLowerCase()] || '🏷️';

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategoryTab(cat.name)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {emoji} {cat.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Indicator / Active Category Banner */}
        {selectedCategoryTab !== 'ALL' && (
          <View style={styles.categoryFilterBanner}>
            <View style={styles.categoryFilterLeft}>
              <Text style={styles.categoryFilterEmoji}>
                {CATEGORY_EMOJIS[selectedCategoryTab.toLowerCase()] || '🏷️'}
              </Text>
              <View>
                <Text style={styles.categoryFilterTitle}>
                  Category: {selectedCategoryTab}
                </Text>
                <Text style={styles.categoryFilterSub}>
                  {displayedProducts.length}{' '}
                  {displayedProducts.length === 1 ? 'commodity' : 'commodities'} in this department
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.clearFilterBtn}
              activeOpacity={0.7}
              onPress={() => setSelectedCategoryTab('ALL')}
            >
              <Ionicons name="close-circle" size={16} color="#6B7280" />
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Product Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isOperator && styles.addButtonOperatorLocked,
          ]}
          activeOpacity={0.7}
          onPress={() => handleAddProductPress()}
        >
          <Ionicons
            name={isOperator ? 'lock-closed-outline' : 'add-circle-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>
            {isOperator
              ? 'Add Product (Owner Locked)'
              : selectedCategoryTab !== 'ALL'
              ? `+ Add New ${selectedCategoryTab} Item`
              : 'Add New Product'}
          </Text>
        </TouchableOpacity>

        {/* Products List Header with Quick Add */}
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.listTitle}>
              {selectedCategoryTab === 'ALL'
                ? 'Product Catalog'
                : `${selectedCategoryTab} Catalog`}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.count}>
                {displayedProducts.length}{' '}
                {displayedProducts.length === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={styles.headerAddBtn}
              activeOpacity={0.7}
              onPress={() => handleAddProductPress()}
            >
              <Ionicons name="add" size={17} color="#16834A" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products List (Grouped by Category or Filtered) */}
        {displayedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {selectedCategoryTab === 'ALL'
                ? 'No products in catalog.'
                : `No products in "${selectedCategoryTab}".`}
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedCategoryTab === 'ALL'
                ? 'Tap "Add New Product" to list your fruits, vegetables, and commodities.'
                : `Add commodities under ${selectedCategoryTab} or switch to another category.`}
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.7}
                onPress={() => handleAddProductPress(selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined)}
              >
                <Text style={styles.emptyAddBtnText}>
                  + Add Product {selectedCategoryTab !== 'ALL' ? `to ${selectedCategoryTab}` : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : selectedCategoryTab === 'ALL' ? (
          /* When ALL is selected, organize with category group headers */
          categories.map((cat) => {
            const catItems = products.filter(
              (p) => (p.category || '').toLowerCase() === cat.name.toLowerCase()
            );
            if (catItems.length === 0) return null;
            const emoji = CATEGORY_EMOJIS[cat.name.toLowerCase()] || '🏷️';

            return (
              <View key={cat.id} style={styles.categorySectionWrap}>
                <View style={styles.categorySectionHeader}>
                  <View style={styles.categorySectionLeft}>
                    <Text style={styles.categorySectionEmoji}>{emoji}</Text>
                    <Text style={styles.categorySectionTitle}>{cat.name}</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>
                        {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>

                  {isOwner && (
                    <TouchableOpacity
                      style={styles.categorySectionAddBtn}
                      activeOpacity={0.7}
                      onPress={() => handleAddProductPress(cat.name)}
                    >
                      <Ionicons name="add" size={14} color="#16834A" />
                      <Text style={styles.categorySectionAddText}>+ Add {cat.name}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {catItems.map((prod) => renderProductCard(prod))}
              </View>
            );
          })
        ) : (
          /* Filtered Category view */
          displayedProducts.map((product) => renderProductCard(product))
        )}
      </ScrollView>

      {/* Owner Quick Add Category Modal */}
      <Modal
        visible={isAddCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddCatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pricetag" size={20} color="#16834A" />
                <Text style={styles.modalTitle}>Add New Category</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddCatModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Create a category classification for your products (e.g. Exotic Fruits, Spices, Grains).
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Exotic Fruits, Pulses"
              placeholderTextColor="#9CA3AF"
              value={newCatName}
              onChangeText={setNewCatName}
              autoCapitalize="words"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setIsAddCatModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                activeOpacity={0.7}
                onPress={handleCreateCategory}
              >
                <Text style={styles.modalSaveText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 27,
    fontWeight: 'bold',
    color: '#222222',
  },
  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 20,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
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
    color: colors.textSecondary,
    lineHeight: 16,
  },
  quickOpsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickOpArrivalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  quickOpSaleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  quickOpTallyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  quickOpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gradeFeatureShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  gradeFeatureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  gradeFeatureBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
  },
  categoriesBarContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoriesBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoriesBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoriesBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addCategoryInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addCategoryInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
    marginLeft: 2,
  },
  categoryPillsScroll: {
    paddingVertical: 2,
    gap: 6,
  },
  categoryPill: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryFilterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  categoryFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryFilterEmoji: {
    fontSize: 22,
  },
  categoryFilterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  categoryFilterSub: {
    fontSize: 11,
    color: '#047857',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonOperatorLocked: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  countBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  count: {
    fontSize: 12,
    color: '#16834A',
    fontWeight: '600',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16834A',
    marginLeft: 2,
  },
  categorySectionWrap: {
    marginBottom: 16,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  categorySectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categorySectionEmoji: {
    fontSize: 18,
  },
  categorySectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoryCountBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categorySectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: '#C7E8D3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  categorySectionAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  emptyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#16834A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImageWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmojiBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  productEmojiText: {
    fontSize: 11,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 3,
  },
  priceBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  valuationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16834A',
    marginTop: 2,
  },
  marginText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantitySection: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitTag: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalAvailableDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  totalAvailableLeft: {
    flex: 1,
  },
  totalAvailableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16834A',
    letterSpacing: 0.5,
  },
  totalAvailableRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  totalAvailableNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#15803D',
  },
  totalAvailableUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 5,
  },
  tapClickerShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  tapClickerShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  subStepButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  addStepButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  batchSubBtn: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  batchSubText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  batchAddBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  batchAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  inputWrapper: {
    flex: 1,
  },
  numberInput: {
    height: 38,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  cardQuickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cardQuickArrivalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EC',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cardQuickArrivalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  cardQuickSaleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cardQuickSaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardGradesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardGradeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cardGradeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  cardWastageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cardWastageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardActionTallyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  cardActionTallyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    marginLeft: 4,
  },
  cardActionOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cardActionOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16834A',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
