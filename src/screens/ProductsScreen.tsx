import React, { useState, useMemo, useCallback } from 'react';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { getProductImage, getCategoryImage, DEFAULT_CATEGORY_IMAGES } from '../utils/productImages';
import { Product, UnitType } from '../types';
import BottomNavBar from '../components/BottomNavBar';

const STANDARD_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Leafy Vegetables',
  'Dry Fruits',
  'Grains',
  'Spices',
  'Others',
];

const AVAILABLE_UNITS: UnitType[] = [
  'Kg',
  'Gram',
  'Box',
  'Bag',
  'Piece',
  'Crate',
  'Quintal',
];

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'stock-asc'
  | 'stock-desc';

interface SelectedProductState {
  quantity: number;
  unit: string;
}

export default function ProductsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    products,
    categories,
    addCategory,
    deleteProduct,
    batchAddSelectedProducts,
    isOwner,
    isOperator,
    canDeleteProduct,
  } = useMandi();

  const initialCat = route?.params?.category || 'ALL';
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOnly, setSelectedOnly] = useState<boolean>(false);

  // Sorting state & bottom sheet
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [tempSortBy, setTempSortBy] = useState<SortOption>('name-asc');
  const [showSortSheet, setShowSortSheet] = useState<boolean>(false);

  // Multi-product selection state: productId -> { quantity, unit }
  // PERSISTS across category tab switches!
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedProductState>>({});

  // Review Selected Products Bottom Sheet
  const [showReviewSheet, setShowReviewSheet] = useState<boolean>(false);

  // Unit Picker Bottom Sheet
  const [unitPickerTarget, setUnitPickerTarget] = useState<Product | null>(null);

  // Manual Quantity Entry Modal
  const [manualQtyTarget, setManualQtyTarget] = useState<Product | null>(null);
  const [manualQtyInput, setManualQtyInput] = useState<string>('');

  // Quick Mandi Operations Modal (Arrival, Sale, Crate Tally, Slip, Grades)
  const [activeActionProduct, setActiveActionProduct] = useState<Product | null>(null);

  // Add Category Bottom Sheet
  const [showAddCatSheet, setShowAddCatSheet] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatImage, setNewCatImage] = useState<string>('');
  const [isCreatingCat, setIsCreatingCat] = useState<boolean>(false);

  // Add Selected Stock Modal (Mode: ADD to existing vs SET exact stock)
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [stockAddMode, setStockAddMode] = useState<'ADD' | 'SET'>('ADD');
  const [isSubmittingStock, setIsSubmittingStock] = useState<boolean>(false);

  // Unified list of categories
  const allCategoryList = useMemo(() => {
    const list: string[] = [];
    STANDARD_CATEGORIES.forEach((c) => list.push(c));
    categories.forEach((c) => {
      if (!list.some((existing) => existing.toLowerCase() === c.name.toLowerCase())) {
        list.push(c.name);
      }
    });
    return list;
  }, [categories]);

  // Unique products deduplicated by ID to prevent duplicate product cards
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [products]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueProducts.forEach((p) => {
      const cat = (p.category || 'Others').trim();
      const key = cat.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [uniqueProducts]);

  // Selected products entries
  const selectedEntries = useMemo(() => Object.entries(selectedItems), [selectedItems]);
  const selectedCount = selectedEntries.length;

  // Meaningful quantity summary: Never combines different measuring units into one misleading total!
  const meaningfulQuantitySummary = useMemo(() => {
    if (selectedCount === 0) return '';
    // Group quantities by unit
    const unitTotals: Record<string, number> = {};
    selectedEntries.forEach(([, item]) => {
      const u = item.unit || 'Kg';
      unitTotals[u] = (unitTotals[u] || 0) + (item.quantity || 0);
    });

    const parts = Object.entries(unitTotals).map(([u, total]) => `${total} ${u}`);
    return parts.join(' • ');
  }, [selectedEntries, selectedCount]);

  // Toggle selection on product card: default quantity is 1
  const handleToggleSelect = useCallback((product: Product) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          quantity: 1,
          unit: product.unit || 'Kg',
        };
      }
      return next;
    });
  }, []);

  // Increment selected quantity
  const handleIncrementQty = useCallback((productId: string) => {
    setSelectedItems((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: current.quantity + 1,
        },
      };
    });
  }, []);

  // Decrement selected quantity: Minimum 1 or deselect if decremented below 1
  const handleDecrementQty = useCallback((productId: string) => {
    setSelectedItems((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: Math.max(1, current.quantity - 1),
        },
      };
    });
  }, []);

  // Remove individual product from selection
  const handleRemoveFromSelection = useCallback((productId: string) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  // Open manual quantity entry modal
  const handleOpenManualQty = (product: Product) => {
    const current = selectedItems[product.id];
    setManualQtyTarget(product);
    setManualQtyInput(current ? String(current.quantity) : '1');
  };

  // Submit manual quantity entry
  const handleSaveManualQty = () => {
    if (!manualQtyTarget) return;
    const parsed = parseFloat(manualQtyInput);
    if (isNaN(parsed) || parsed <= 0) {
      // Remove selection if invalid or 0
      setSelectedItems((prev) => {
        const next = { ...prev };
        delete next[manualQtyTarget.id];
        return next;
      });
    } else {
      setSelectedItems((prev) => {
        const current = prev[manualQtyTarget.id];
        return {
          ...prev,
          [manualQtyTarget.id]: {
            quantity: parsed,
            unit: current?.unit || manualQtyTarget.unit || 'Kg',
          },
        };
      });
    }
    setManualQtyTarget(null);
    setManualQtyInput('');
  };

  // Unit change for selected item
  const handleChangeUnit = (unit: string) => {
    if (!unitPickerTarget) return;
    setSelectedItems((prev) => {
      const current = prev[unitPickerTarget.id];
      if (!current) return prev;
      return {
        ...prev,
        [unitPickerTarget.id]: {
          ...current,
          unit,
        },
      };
    });
    setUnitPickerTarget(null);
  };

  // Open Sort Bottom Sheet
  const handleOpenSortSheet = () => {
    setTempSortBy(sortBy);
    setShowSortSheet(true);
  };

  // Apply Sort
  const handleApplySort = () => {
    setSortBy(tempSortBy);
    setShowSortSheet(false);
  };

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let result = [...uniqueProducts];

    // 1. Category filter
    if (selectedCategoryTab !== 'ALL') {
      const targetCat = selectedCategoryTab.toLowerCase().trim();
      result = result.filter((p) => {
        const cat = (p.category || 'Others').toLowerCase().trim();
        if (targetCat === 'others' || targetCat === 'other') {
          return cat === 'others' || cat === 'other';
        }
        return cat === targetCat;
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      );
    }

    // 3. Selected only filter
    if (selectedOnly) {
      result = result.filter((p) => Boolean(selectedItems[p.id]));
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'price-asc') {
        const pa = parseFloat(a.price || '0') || 0;
        const pb = parseFloat(b.price || '0') || 0;
        return pa - pb;
      }
      if (sortBy === 'price-desc') {
        const pa = parseFloat(a.price || '0') || 0;
        const pb = parseFloat(b.price || '0') || 0;
        return pb - pa;
      }
      if (sortBy === 'stock-asc') {
        const sa = parseFloat(a.quantity || '0') || 0;
        const sb = parseFloat(b.quantity || '0') || 0;
        return sa - sb;
      }
      if (sortBy === 'stock-desc') {
        const sa = parseFloat(a.quantity || '0') || 0;
        const sb = parseFloat(b.quantity || '0') || 0;
        return sb - sa;
      }
      return 0;
    });

    return result;
  }, [uniqueProducts, selectedCategoryTab, searchQuery, selectedOnly, selectedItems, sortBy]);

  // Execute Batch Add / Update stock to inventory
  const handleExecuteAddSelectedProducts = () => {
    if (isSubmittingStock) return;

    const itemsToSave = selectedEntries.map(([productId, item]) => ({
      productId,
      quantity: item.quantity,
      unit: item.unit,
      mode: stockAddMode,
    }));

    if (itemsToSave.length === 0) return;

    setIsSubmittingStock(true);
    try {
      const res = batchAddSelectedProducts(itemsToSave);
      setShowAddStockModal(false);
      setShowReviewSheet(false);
      setSelectedItems({});

      if (res.success) {
        const summaryText = itemsToSave
          .map((it) => {
            const prod = products.find((p) => p.id === it.productId);
            return `• ${prod?.name || 'Produce'}: ${it.quantity} ${it.unit}`;
          })
          .join('\n');

        Alert.alert(
          'Inventory Updated',
          `Successfully ${stockAddMode === 'ADD' ? 'added to' : 'updated'} stock for ${itemsToSave.length} product(s):\n\n${summaryText}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not update inventory. Please try again.');
      }
    } finally {
      setIsSubmittingStock(false);
    }
  };

  // Delete product handler (Owner only)
  const handleDeleteProduct = (product: Product) => {
    if (!canDeleteProduct) {
      Alert.alert(
        'Owner Privilege Required',
        `Only the Mandi Owner has permission to delete "${product.name}".`
      );
      return;
    }

    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${product.name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(product.id);
            setSelectedItems((prev) => {
              const next = { ...prev };
              delete next[product.id];
              return next;
            });
            setActiveActionProduct(null);
          },
        },
      ]
    );
  };

  // Create Category Bottom Sheet Save
  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }

    setIsCreatingCat(true);
    setTimeout(() => {
      const res = addCategory(trimmed, newCatImage.trim() || undefined);
      setIsCreatingCat(false);
      if (res.success) {
        setSelectedCategoryTab(trimmed);
        setNewCatName('');
        setNewCatImage('');
        setShowAddCatSheet(false);
        Alert.alert('Category Added', `Category "${trimmed}" has been created successfully.`);
      } else {
        Alert.alert('Error', res.error || 'Could not add category.');
      }
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 10, 36),
            paddingBottom: selectedCount > 0 ? 170 : Math.max(insets.bottom + 90, 110),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================== */}
        {/* A. HEADER: Title, Product Count, Back & Add Product Action    */}
        {/* ============================================================== */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? colors.textPrimary : colors.primary}
            />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            <Text
              style={[
                styles.logo,
                { color: isDark ? colors.primaryDark : colors.primary },
              ]}
            >
              CAL Mandi
            </Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.titleHeadingRow}>
            <Text style={styles.title}>Product Catalogue</Text>
            <View style={styles.countBadgePill}>
              <Text style={styles.countBadgeText}>
                {filteredProducts.length === uniqueProducts.length
                  ? `${uniqueProducts.length} Products`
                  : `${filteredProducts.length} of ${uniqueProducts.length} Products`}
              </Text>
            </View>
          </View>

          <View style={styles.subtitleActionRow}>
            <Text style={styles.subtitle}>
              Browse produce, select quantities & update mandi stock.
            </Text>

            {isOwner && (
              <TouchableOpacity
                style={styles.headerAddBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AddProduct', {
                    initialCategory:
                      selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined,
                  })
                }
              >
                <Ionicons name="add" size={17} color="#FFFFFF" />
                <Text style={styles.headerAddBtnText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ============================================================== */}
        {/* B. SEARCH: Immediate Search Input by Name and Category        */}
        {/* ============================================================== */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={isDark ? colors.textSecondary : '#64748B'}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search produce (e.g. Tomato, Mango, Wheat)..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? colors.textSecondary : '#94A3B8'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ============================================================== */}
        {/* C. CATEGORIES: Visually Appealing Horizontal Cards             */}
        {/* ============================================================== */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>
              Categories ({allCategoryList.length})
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.addCategoryLink}
                onPress={() => setShowAddCatSheet(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color={isDark ? '#4ADE80' : '#16864B'} />
                <Text style={styles.addCategoryLinkText}>Add Category</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCardsScroll}
          >
            {/* All Items Card */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategoryTab === 'ALL' && styles.categoryCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedCategoryTab('ALL')}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
                }}
                style={styles.categoryCardImage}
                resizeMode="cover"
              />
              <View style={styles.categoryCardOverlay}>
                <Text style={styles.categoryCardName}>All Items</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {uniqueProducts.length} products
                  </Text>
                </View>
              </View>
              {selectedCategoryTab === 'ALL' && (
                <View style={styles.activeCategoryCheck}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Individual Category Cards with Curated Images */}
            {allCategoryList.map((catName) => {
              const isSelected = selectedCategoryTab.toLowerCase() === catName.toLowerCase();
              const count = categoryCounts[catName.toLowerCase()] || 0;
              const photoUrl = getCategoryImage(catName);

              return (
                <TouchableOpacity
                  key={catName}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategoryTab(catName)}
                >
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.categoryCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.categoryCardOverlay}>
                    <Text style={styles.categoryCardName} numberOfLines={1}>
                      {catName}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {count} {count === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.activeCategoryCheck}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Controls Row: Count, Selected Only Filter & Sort Button */}
        <View style={styles.controlsRow}>
          <Text style={styles.resultCountText}>
            {filteredProducts.length === uniqueProducts.length
              ? `Showing all ${uniqueProducts.length} commodities`
              : `Showing ${filteredProducts.length} of ${uniqueProducts.length} commodities`}
          </Text>

          <View style={styles.controlsRightGroup}>
            {/* Selected Only Filter Pill */}
            {selectedCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  selectedOnly && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedOnly(!selectedOnly)}
              >
                <Ionicons
                  name={selectedOnly ? 'checkbox' : 'checkbox-outline'}
                  size={14}
                  color={selectedOnly ? '#FFFFFF' : isDark ? '#4ADE80' : '#16834A'}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    selectedOnly && styles.filterPillTextActive,
                  ]}
                >
                  Selected ({selectedCount})
                </Text>
              </TouchableOpacity>
            )}

            {/* Sort Button (Opens compact bottom sheet) */}
            <TouchableOpacity
              style={styles.sortButton}
              activeOpacity={0.7}
              onPress={handleOpenSortSheet}
            >
              <Ionicons
                name="swap-vertical"
                size={14}
                color={isDark ? colors.textPrimary : '#1E293B'}
              />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* D. PRODUCT GRID (RESPONSIVE TWO-COLUMN GRID)                   */}
        {/* ============================================================== */}
        {filteredProducts.length === 0 ? (
          /* SECTION 10: CLEAN COMPACT EMPTY STATE */
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={52} color="#94A3B8" />
            <Text style={styles.emptyTitle}>
              {selectedCategoryTab !== 'ALL'
                ? `No products in this category yet.`
                : 'No commodities found.'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No produce matching "${searchQuery}".`
                : selectedOnly
                ? 'No items selected yet. Tap "Select" on any card.'
                : `Add commodities to start tracking inventory in "${selectedCategoryTab}".`}
            </Text>

            {isOwner && !isOperator && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AddProduct', {
                    initialCategory:
                      selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined,
                  })
                }
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.emptyAddBtnText}>
                  Add Product to {selectedCategoryTab !== 'ALL' ? selectedCategoryTab : 'Catalog'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredProducts.map((product) => {
              const isSelected = Boolean(selectedItems[product.id]);
              const selState = selectedItems[product.id];
              const displayQty = isSelected
                ? selState.quantity
                : 1;
              const displayUnit = isSelected ? selState.unit : product.unit || 'Kg';
              const imgUrl = getProductImage(product);
              const priceText = product.price
                ? `₹${product.price} / ${product.unit || 'Kg'}`
                : 'Market Rate';
              const stockNum = parseFloat(product.quantity || '0') || 0;
              const isLowStock = stockNum <= 10;

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productGridCard,
                    isSelected && styles.productGridCardSelected,
                  ]}
                >
                  {/* Top Image with Badges */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleToggleSelect(product)}
                    style={styles.cardImageWrapper}
                  >
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />

                    {/* Operations Action Button (Three dots) - consistently positioned in Top-Right */}
                    <TouchableOpacity
                      style={styles.cardActionsBtn}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveActionProduct(product);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Selection Checkmark - Top Left */}
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <Ionicons name="checkmark-circle" size={22} color="#16834A" />
                      </View>
                    )}

                    {/* Category Pill Tag - Bottom Left */}
                    <View style={styles.cardCategoryBadge}>
                      <Text style={styles.cardCategoryBadgeText} numberOfLines={1}>
                        {product.category}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card Body Details */}
                  <View style={styles.cardBody}>
                    <View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {product.name}
                      </Text>

                      <Text style={styles.cardPrice} numberOfLines={1}>
                        {priceText}
                      </Text>

                      {/* Available Stock & Low Stock Indicator */}
                      <View style={styles.stockStatusRow}>
                        <View
                          style={[
                            styles.stockDot,
                            {
                              backgroundColor:
                                stockNum <= 0
                                  ? '#DC2626'
                                  : isLowStock
                                  ? '#EA580C'
                                  : '#16A34A',
                            },
                          ]}
                        />
                        <Text style={styles.stockStatusText}>
                          Stock: {stockNum} {product.unit || 'Kg'}
                        </Text>

                        {stockNum <= 0 ? (
                          <View style={[styles.lowStockIndicatorBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.lowStockIndicatorText, { color: '#DC2626' }]}>Out</Text>
                          </View>
                        ) : isLowStock ? (
                          <View style={styles.lowStockIndicatorBadge}>
                            <Text style={styles.lowStockIndicatorText}>Low</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* ============================================================== */}
                    {/* SECTION 5: SELECTION & QUANTITY CONTROLS                       */}
                    {/* ============================================================== */}
                    {isSelected ? (
                      <View style={styles.selectedControlsContainer}>
                        {/* Unit Selector Button (Opens Clean Bottom Sheet) */}
                        <TouchableOpacity
                          style={styles.unitSelectorBtn}
                          activeOpacity={0.7}
                          onPress={() => setUnitPickerTarget(product)}
                        >
                          <Text style={styles.unitSelectorBtnText}>Unit: {displayUnit}</Text>
                          <Ionicons
                            name="chevron-down"
                            size={12}
                            color={isDark ? '#4ADE80' : '#16834A'}
                          />
                        </TouchableOpacity>

                        {/* Stepper Controls: [-] [Qty] [+] with manual typing support */}
                        <View style={styles.qtyControlRow}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            activeOpacity={0.7}
                            onPress={() => handleDecrementQty(product.id)}
                          >
                            <Ionicons
                              name="remove"
                              size={16}
                              color={isDark ? '#F87171' : '#DC2626'}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.qtyNumberBox}
                            activeOpacity={0.7}
                            onPress={() => handleOpenManualQty(product)}
                          >
                            <Text style={styles.qtyNumberText}>{displayQty}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            activeOpacity={0.7}
                            onPress={() => handleIncrementQty(product.id)}
                          >
                            <Ionicons
                              name="add"
                              size={16}
                              color={isDark ? '#4ADE80' : '#16834A'}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.selectBtn}
                        activeOpacity={0.8}
                        onPress={() => handleToggleSelect(product)}
                      >
                        <Ionicons
                          name="add"
                          size={15}
                          color={isDark ? '#4ADE80' : '#16834A'}
                        />
                        <Text style={styles.selectBtnText}>Select</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* SECTION 7: BOTTOM SELECTION SUMMARY (DOES NOT OVERLAP)         */}
      {/* ============================================================== */}
      {selectedCount > 0 && (
        <View
          style={[
            styles.stickySummaryBar,
            { bottom: Math.max(insets.bottom + 68, 76) },
          ]}
        >
          <TouchableOpacity
            style={styles.stickySummaryLeft}
            activeOpacity={0.8}
            onPress={() => setShowReviewSheet(true)}
          >
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{selectedCount}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>
                {selectedCount} {selectedCount === 1 ? 'Product' : 'Products'} Selected
              </Text>
              <Text style={styles.summarySub} numberOfLines={1}>
                {meaningfulQuantitySummary}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.stickySummaryRight}>
            <TouchableOpacity
              style={styles.reviewBtn}
              activeOpacity={0.7}
              onPress={() => setShowReviewSheet(true)}
            >
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addSelectedBtn}
              activeOpacity={0.85}
              onPress={() => setShowAddStockModal(true)}
            >
              <Ionicons name="checkmark-done" size={17} color="#FFFFFF" />
              <Text style={styles.addSelectedBtnText}>Add to Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}



      {/* Bottom Navigation */}
      <BottomNavBar activeTab="Products" navigation={navigation} />

      {/* ============================================================== */}
      {/* BOTTOM SHEET 1: MEASURING UNIT SELECTION (SECTION 6)           */}
      {/* ============================================================== */}
      <Modal
        visible={unitPickerTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitPickerTarget(null)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setUnitPickerTarget(null)}
        >
          <TouchableOpacity
            style={[styles.bottomSheetCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Select Measuring Unit</Text>
                <Text style={styles.sheetSubtitle}>
                  {unitPickerTarget ? `For ${unitPickerTarget.name}` : 'Choose unit'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setUnitPickerTarget(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.unitChipsGrid}>
              {AVAILABLE_UNITS.map((u) => {
                const currentUnit =
                  unitPickerTarget && selectedItems[unitPickerTarget.id]
                    ? selectedItems[unitPickerTarget.id].unit
                    : unitPickerTarget?.unit;
                const isSelected = currentUnit === u;

                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitChoiceChip,
                      isSelected && styles.unitChoiceChipActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleChangeUnit(u)}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.unitChoiceChipText,
                        isSelected && styles.unitChoiceChipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setUnitPickerTarget(null)}
            >
              <Text style={styles.sheetCancelText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* BOTTOM SHEET 2: SORTING (SECTION 8)                            */}
      {/* ============================================================== */}
      <Modal
        visible={showSortSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowSortSheet(false)}
        >
          <TouchableOpacity
            style={[styles.bottomSheetCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort Commodities</Text>
              <TouchableOpacity onPress={() => setShowSortSheet(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsList}>
              {[
                { label: 'Name: A–Z', val: 'name-asc' as SortOption },
                { label: 'Name: Z–A', val: 'name-desc' as SortOption },
                { label: 'Price: Low to High', val: 'price-asc' as SortOption },
                { label: 'Price: High to Low', val: 'price-desc' as SortOption },
                { label: 'Stock: Low to High', val: 'stock-asc' as SortOption },
                { label: 'Stock: High to Low', val: 'stock-desc' as SortOption },
              ].map((opt) => {
                const isActive = tempSortBy === opt.val;
                return (
                  <TouchableOpacity
                    key={opt.val}
                    style={styles.sortOptionRow}
                    activeOpacity={0.7}
                    onPress={() => setTempSortBy(opt.val)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        isActive && styles.sortOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Ionicons
                      name={isActive ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isActive ? '#16834A' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={styles.sheetSecondaryBtn}
                onPress={() => setShowSortSheet(false)}
              >
                <Text style={styles.sheetSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetPrimaryBtn}
                onPress={handleApplySort}
              >
                <Text style={styles.sheetPrimaryBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* BOTTOM SHEET 3: REVIEW & REMOVE SELECTED PRODUCTS (SECTION 7)  */}
      {/* ============================================================== */}
      <Modal
        visible={showReviewSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowReviewSheet(false)}
        >
          <TouchableOpacity
            style={[styles.bottomSheetCard, { maxHeight: '82%', paddingBottom: Math.max(insets.bottom + 16, 24) }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  Selected Products ({selectedCount})
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {meaningfulQuantitySummary}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedItems({})}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reviewListScroll} showsVerticalScrollIndicator={false}>
              {selectedEntries.map(([pId, item]) => {
                const prod = products.find((p) => p.id === pId);
                if (!prod) return null;

                return (
                  <View key={pId} style={styles.reviewItemCard}>
                    <Image
                      source={{ uri: getProductImage(prod) }}
                      style={styles.reviewItemThumb}
                      resizeMode="cover"
                    />

                    <View style={styles.reviewItemInfo}>
                      <Text style={styles.reviewItemName} numberOfLines={1}>
                        {prod.name}
                      </Text>
                      <Text style={styles.reviewItemSub}>
                        {prod.category} • {prod.price ? `₹${prod.price}/${item.unit}` : item.unit}
                      </Text>

                      {/* Unit Changer */}
                      <TouchableOpacity
                        style={styles.reviewUnitPill}
                        onPress={() => setUnitPickerTarget(prod)}
                      >
                        <Text style={styles.reviewUnitPillText}>{item.unit} ▾</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Stepper Controls in Review */}
                    <View style={styles.reviewStepper}>
                      <TouchableOpacity
                        style={styles.reviewStepBtn}
                        onPress={() => handleDecrementQty(prod.id)}
                      >
                        <Ionicons name="remove" size={14} color="#DC2626" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reviewStepVal}
                        onPress={() => handleOpenManualQty(prod)}
                      >
                        <Text style={styles.reviewStepValText}>{item.quantity}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reviewStepBtn}
                        onPress={() => handleIncrementQty(prod.id)}
                      >
                        <Ionicons name="add" size={14} color="#16834A" />
                      </TouchableOpacity>
                    </View>

                    {/* Remove Action */}
                    <TouchableOpacity
                      style={styles.reviewRemoveBtn}
                      onPress={() => handleRemoveFromSelection(prod.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.reviewSheetFooter}>
              <TouchableOpacity
                style={styles.confirmAddStockBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setShowReviewSheet(false);
                  setShowAddStockModal(true);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.confirmAddStockBtnText}>
                  Add Selected Products to Inventory
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* BOTTOM SHEET 4: ADD CATEGORY (SECTION 9)                       */}
      {/* ============================================================== */}
      <Modal
        visible={showAddCatSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCatSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowAddCatSheet(false)}
        >
          <TouchableOpacity
            style={[styles.bottomSheetCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowAddCatSheet(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Photo Preview */}
            <View style={styles.modalPhotoPreviewWrap}>
              <Image
                source={{
                  uri:
                    newCatImage.trim() ||
                    getCategoryImage(newCatName) ||
                    DEFAULT_CATEGORY_IMAGES.default,
                }}
                style={styles.modalPhotoPreview}
                resizeMode="cover"
              />
              <Text style={styles.modalPhotoPreviewLabel}>
                Category Photo (Auto-matched fresh produce)
              </Text>
            </View>

            <Text style={styles.inputLabel}>Category Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Exotic Fruits, Spices, Dairy"
              placeholderTextColor={colors.inputPlaceholder}
              value={newCatName}
              onChangeText={setNewCatName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Custom Photo URL (Optional HTTPS)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://images.unsplash.com/photo-..."
              placeholderTextColor={colors.inputPlaceholder}
              value={newCatImage}
              onChangeText={setNewCatImage}
              autoCapitalize="none"
            />

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={styles.sheetSecondaryBtn}
                onPress={() => setShowAddCatSheet(false)}
              >
                <Text style={styles.sheetSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetPrimaryBtn}
                onPress={handleCreateCategory}
                disabled={isCreatingCat}
              >
                {isCreatingCat ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetPrimaryBtnText}>Create Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 5: MANUAL QUANTITY ENTRY MODAL                           */}
      {/* ============================================================== */}
      <Modal
        visible={manualQtyTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setManualQtyTarget(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalCard}>
            <Text style={styles.modalTitle}>Enter Quantity</Text>
            <Text style={styles.modalSubtitle}>
              {manualQtyTarget ? `For ${manualQtyTarget.name}:` : 'Type exact count:'}
            </Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={manualQtyInput}
              onChangeText={setManualQtyInput}
              placeholder="e.g. 5, 25, 100"
              placeholderTextColor={colors.inputPlaceholder}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setManualQtyTarget(null);
                  setManualQtyInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveManualQty}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6: INVENTORY STOCK ADD/UPDATE SELECTION                  */}
      {/* ============================================================== */}
      <Modal
        visible={showAddStockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStockModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.stockOptionsModalCard}>
            <View style={styles.stockModalHeader}>
              <Ionicons name="cube" size={24} color="#16834A" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stockModalTitle}>Add to Inventory</Text>
                <Text style={styles.stockModalSubtitle}>
                  {selectedCount} product(s) selected
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddStockModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? colors.textSecondary : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.stockModeHeading}>Choose inventory action:</Text>

            {/* Option 1: Add to existing stock */}
            <TouchableOpacity
              style={[
                styles.modeOptionCard,
                stockAddMode === 'ADD' && styles.modeOptionCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setStockAddMode('ADD')}
            >
              <Ionicons
                name={stockAddMode === 'ADD' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={stockAddMode === 'ADD' ? '#16834A' : '#94A3B8'}
              />
              <View style={styles.modeOptionTextWrap}>
                <Text style={styles.modeOptionTitle}>
                  Add to Existing Stock (Increases Inventory)
                </Text>
                <Text style={styles.modeOptionDesc}>
                  Increases current inventory count by adding the entered quantity (Current + Entered). Perfect for new arrivals or daily purchases.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Replace / Set exact stock */}
            <TouchableOpacity
              style={[
                styles.modeOptionCard,
                stockAddMode === 'SET' && styles.modeOptionCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setStockAddMode('SET')}
            >
              <Ionicons
                name={stockAddMode === 'SET' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={stockAddMode === 'SET' ? '#16834A' : '#94A3B8'}
              />
              <View style={styles.modeOptionTextWrap}>
                <Text style={styles.modeOptionTitle}>
                  Set Exact Stock Count (Replaces Inventory)
                </Text>
                <Text style={styles.modeOptionDesc}>
                  Replaces the current available count with the newly entered quantity. Ideal for physical stock audits or floor inventory resets.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Summary preview list */}
            <Text style={styles.stockSummaryPreviewTitle}>Selected Items Preview:</Text>
            <ScrollView style={styles.stockPreviewList}>
              {selectedEntries.map(([pId, item]) => {
                const prod = products.find((p) => p.id === pId);
                const currentStock = parseFloat(prod?.quantity || '0') || 0;
                const newStock =
                  stockAddMode === 'ADD'
                    ? currentStock + item.quantity
                    : item.quantity;

                return (
                  <View key={pId} style={styles.previewItemRow}>
                    <Text style={styles.previewItemName} numberOfLines={1}>
                      {prod?.name}
                    </Text>
                    <Text style={styles.previewItemStock}>
                      {stockAddMode === 'ADD'
                        ? `${currentStock} + ${item.quantity} → `
                        : `${currentStock} replaced by `}
                      <Text style={{ fontWeight: '700', color: '#16834A' }}>
                        {newStock} {item.unit}
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.confirmAddStockBtn,
                isSubmittingStock && { opacity: 0.6 },
              ]}
              activeOpacity={0.85}
              disabled={isSubmittingStock}
              onPress={handleExecuteAddSelectedProducts}
            >
              {isSubmittingStock ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmAddStockBtnText}>
                    {stockAddMode === 'ADD' ? 'Confirm & Add to Stock' : 'Confirm & Set Exact Stock'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 7: MANDI OPERATIONS ACTION SHEET                         */}
      {/* ============================================================== */}
      <Modal
        visible={activeActionProduct !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveActionProduct(null)}
      >
        <TouchableOpacity
          style={styles.centerModalOverlay}
          activeOpacity={1}
          onPress={() => setActiveActionProduct(null)}
        >
          {activeActionProduct && (
            <View style={styles.actionsSheetCard}>
              <View style={styles.actionsSheetHeader}>
                <Image
                  source={{ uri: getProductImage(activeActionProduct) }}
                  style={styles.actionSheetThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionSheetTitle} numberOfLines={1}>
                    {activeActionProduct.name}
                  </Text>
                  <Text style={styles.actionSheetSub}>
                    {activeActionProduct.category} • {activeActionProduct.quantity || 0}{' '}
                    {activeActionProduct.unit || 'Kg'} Available
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActiveActionProduct(null)}>
                  <Ionicons name="close" size={22} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionSheetButtons}>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('RecordArrival', { productId: p.id });
                  }}
                >
                  <Ionicons name="arrow-down-circle" size={20} color="#16834A" />
                  <Text style={styles.sheetBtnText}>Record Inward Arrival</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('RecordSale', { productId: p.id });
                  }}
                >
                  <Ionicons name="arrow-up-circle" size={20} color="#0284C7" />
                  <Text style={styles.sheetBtnText}>Record Outward Sale</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('CrateTally', {
                      productId: p.id,
                      initialMode: 'IN',
                    });
                  }}
                >
                  <Ionicons name="finger-print" size={20} color="#8B5CF6" />
                  <Text style={styles.sheetBtnText}>Floor Clicker Tally</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('CreateSlip', {
                      type: 'OUT',
                      productId: p.id,
                    });
                  }}
                >
                  <Ionicons name="receipt-outline" size={20} color="#D97706" />
                  <Text style={styles.sheetBtnText}>Create Mandi Slip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('ProductGrades', { productId: p.id });
                  }}
                >
                  <Ionicons name="ribbon-outline" size={20} color="#0D9488" />
                  <Text style={styles.sheetBtnText}>Manage Quality Grades</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const p = activeActionProduct;
                    setActiveActionProduct(null);
                    navigation.navigate('GradingWastage', { productId: p.id });
                  }}
                >
                  <Ionicons name="funnel-outline" size={20} color="#F59E0B" />
                  <Text style={styles.sheetBtnText}>Sort & Wastage Record</Text>
                </TouchableOpacity>

                {isOwner && (
                  <TouchableOpacity
                    style={[styles.sheetBtn, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={() => handleDeleteProduct(activeActionProduct)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text style={[styles.sheetBtnText, { color: '#DC2626' }]}>
                      Remove Product from Catalog
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
    content: {
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginLeft: -8,
    },
    backText: {
      fontSize: 16,
      color: isDark ? colors.textPrimary : colors.primary,
      marginLeft: 4,
      fontWeight: '600',
    },
    headerRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    titleContainer: {
      marginBottom: 14,
    },
    titleHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    countBadgePill: {
      backgroundColor: isDark ? '#064E3B40' : '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4ADE80' : '#16834A',
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    subtitleActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 180,
    },
    headerAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 8,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    headerAddBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 4,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#E2E8F0',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },

    // Categories Section
    categoriesSection: {
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    addCategoryLink: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addCategoryLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16864B',
      marginLeft: 2,
    },
    categoryCardsScroll: {
      paddingRight: 16,
      gap: 10,
    },
    categoryCard: {
      width: 110,
      height: 96,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    categoryCardActive: {
      borderColor: '#16834A',
    },
    categoryCardImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    categoryCardOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.42)',
      justifyContent: 'flex-end',
      padding: 8,
    },
    categoryCardName: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 255, 255, 0.28)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      marginTop: 2,
    },
    categoryBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    activeCategoryCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: '#16834A',
      borderRadius: 10,
    },

    // Controls Row
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultCountText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    controlsRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: isDark ? '#064E3B40' : '#DCFCE7',
      borderWidth: 1,
      borderColor: isDark ? '#4ADE80' : '#16834A',
      gap: 4,
    },
    filterPillActive: {
      backgroundColor: '#16834A',
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    filterPillTextActive: {
      color: '#FFFFFF',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surface : '#E2E8F0',
      gap: 4,
    },
    sortButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // 2-Column Responsive Grid
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    productGridCard: {
      width: '48.5%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : '#E2E8F0',
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      minHeight: 258,
      justifyContent: 'space-between',
    },
    productGridCardSelected: {
      borderColor: '#16834A',
      backgroundColor: isDark ? '#064E3B20' : '#F0FDF4',
    },
    cardImageWrapper: {
      width: '100%',
      height: 120,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardCategoryBadge: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      maxWidth: '80%',
    },
    cardCategoryBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    cardActionsBtn: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedCheckBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    cardBody: {
      padding: 10,
      flex: 1,
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
      marginBottom: 6,
    },
    stockStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stockDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },
    stockStatusText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    lowStockIndicatorBadge: {
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      marginLeft: 'auto',
    },
    lowStockIndicatorText: {
      color: '#DC2626',
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
    },

    // Card Action: Select Button
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#064E3B30' : '#F0FDF4',
      borderWidth: 1.5,
      borderColor: isDark ? '#4ADE80' : '#16834A',
      borderRadius: 8,
      paddingVertical: 7,
      gap: 4,
    },
    selectBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },

    // Card Action: Selected Controls
    selectedControlsContainer: {
      gap: 6,
    },
    unitSelectorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#CBD5E1',
      paddingVertical: 3,
      borderRadius: 6,
      gap: 4,
    },
    unitSelectorBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    qtyControlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? colors.background : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#16834A',
      overflow: 'hidden',
    },
    qtyBtn: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surface : '#F8FAFC',
    },
    qtyNumberBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 4,
    },
    qtyNumberText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },

    // Sticky Bottom Summary Bar
    stickySummaryBar: {
      position: 'absolute',
      left: 12,
      right: 12,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      borderWidth: 1.5,
      borderColor: '#16834A',
    },
    stickySummaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
      paddingRight: 8,
    },
    summaryBadge: {
      backgroundColor: '#16834A',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryBadgeText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    summaryTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    summarySub: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 1,
    },
    stickySummaryRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reviewBtn: {
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#E2E8F0',
    },
    reviewBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    addSelectedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 4,
    },
    addSelectedBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // Empty State
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      maxWidth: 280,
    },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      backgroundColor: '#16834A',
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    emptyAddBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    // Bottom Sheets Common
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'flex-end',
    },
    bottomSheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 18,
      paddingTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 12,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? '#475569' : '#CBD5E1',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sheetSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sheetCancelBtn: {
      backgroundColor: isDark ? colors.background : '#F1F5F9',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    sheetCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sheetActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 12,
    },
    sheetSecondaryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    sheetSecondaryBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sheetPrimaryBtn: {
      backgroundColor: '#16834A',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      minWidth: 90,
      alignItems: 'center',
    },
    sheetPrimaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Unit Picker Sheet
    unitChipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    unitChoiceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
      backgroundColor: isDark ? colors.background : '#F1F5F9',
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : '#CBD5E1',
    },
    unitChoiceChipActive: {
      backgroundColor: '#16834A',
      borderColor: '#16834A',
    },
    unitChoiceChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    unitChoiceChipTextActive: {
      color: '#FFFFFF',
    },

    // Sort Sheet
    sortOptionsList: {
      marginBottom: 8,
    },
    sortOptionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sortOptionText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    sortOptionTextActive: {
      color: '#16834A',
      fontWeight: '800',
    },

    // Review Sheet
    clearAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#DC2626',
    },
    reviewListScroll: {
      maxHeight: 280,
      marginBottom: 10,
    },
    reviewItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.background : '#F8FAFC',
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewItemThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
    },
    reviewItemInfo: {
      flex: 1,
      marginLeft: 10,
    },
    reviewItemName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    reviewItemSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    reviewUnitPill: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#064E3B40' : '#DCFCE7',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      marginTop: 3,
    },
    reviewUnitPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    reviewStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 8,
    },
    reviewStepBtn: {
      padding: 6,
    },
    reviewStepVal: {
      paddingHorizontal: 8,
    },
    reviewStepValText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    reviewRemoveBtn: {
      padding: 6,
    },
    reviewSheetFooter: {
      marginTop: 4,
    },

    // Modals Common (Center)
    centerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    centerModalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    modalInput: {
      backgroundColor: isDark ? colors.background : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 14,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    modalCancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    modalCancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalSaveBtn: {
      backgroundColor: '#16834A',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    modalSaveText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalPhotoPreviewWrap: {
      alignItems: 'center',
      marginBottom: 12,
    },
    modalPhotoPreview: {
      width: '100%',
      height: 90,
      borderRadius: 8,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    modalPhotoPreviewLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },

    // Stock Options Modal
    stockOptionsModalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '85%',
    },
    stockModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    stockModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    stockModalSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    stockModeHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    modeOptionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.background : '#F8FAFC',
      marginBottom: 10,
      gap: 10,
    },
    modeOptionCardActive: {
      borderColor: '#16834A',
      backgroundColor: isDark ? '#064E3B20' : '#F0FDF4',
    },
    modeOptionTextWrap: {
      flex: 1,
    },
    modeOptionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    modeOptionDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    stockSummaryPreviewTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: 6,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    stockPreviewList: {
      maxHeight: 140,
      backgroundColor: isDark ? colors.background : '#F1F5F9',
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
    },
    previewItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    previewItemName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    previewItemStock: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    confirmAddStockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 12,
      borderRadius: 10,
      gap: 6,
    },
    confirmAddStockBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    // Actions Sheet Modal
    actionsSheetCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionsSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionSheetThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
    },
    actionSheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    actionSheetSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionSheetButtons: {
      gap: 2,
    },
    sheetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    sheetBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
