import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { getProductImage, DEFAULT_PRODUCT_IMAGES, getProductEmoji } from '../utils/productImages';

const POPULAR_PRESETS = [
  // Fruits
  { name: 'Coconut', emoji: '🥥', category: 'Fruits' },
  { name: 'Lemon', emoji: '🍋', category: 'Vegetables' },
  { name: 'Banana', emoji: '🍌', category: 'Fruits' },
  { name: 'Apple', emoji: '🍎', category: 'Fruits' },
  { name: 'Mango', emoji: '🥭', category: 'Fruits' },
  { name: 'Orange', emoji: '🍊', category: 'Fruits' },
  { name: 'Grapes', emoji: '🍇', category: 'Fruits' },
  { name: 'Pomegranate', emoji: '🍈', category: 'Fruits' },
  { name: 'Papaya', emoji: '🍈', category: 'Fruits' },
  { name: 'Watermelon', emoji: '🍉', category: 'Fruits' },

  // Vegetables
  { name: 'Tomato', emoji: '🍅', category: 'Vegetables' },
  { name: 'Potato', emoji: '🥔', category: 'Vegetables' },
  { name: 'Onion', emoji: '🧅', category: 'Vegetables' },
  { name: 'Carrot', emoji: '🥕', category: 'Vegetables' },
  { name: 'Cabbage', emoji: '🥬', category: 'Vegetables' },
  { name: 'Cauliflower', emoji: '🥦', category: 'Vegetables' },
  { name: 'Brinjal', emoji: '🍆', category: 'Vegetables' },
  { name: 'Cucumber', emoji: '🥒', category: 'Vegetables' },
  { name: 'Peas', emoji: '🫛', category: 'Vegetables' },

  // Leafy Vegetables
  { name: 'Spinach', emoji: '🥬', category: 'Leafy Vegetables' },
  { name: 'Coriander', emoji: '🌿', category: 'Leafy Vegetables' },
  { name: 'Mint', emoji: '🌱', category: 'Leafy Vegetables' },
  { name: 'Fenugreek', emoji: '🌿', category: 'Leafy Vegetables' },

  // Dry Fruits & Nuts
  { name: 'Almonds', emoji: '🥜', category: 'Dry Fruits' },
  { name: 'Cashews', emoji: '🥜', category: 'Dry Fruits' },
  { name: 'Raisins', emoji: '🍇', category: 'Dry Fruits' },
  { name: 'Pistachios', emoji: '🥜', category: 'Dry Fruits' },
  { name: 'Walnuts', emoji: '🥜', category: 'Dry Fruits' },
  { name: 'Groundnut', emoji: '🥜', category: 'Dry Fruits' },

  // Grains & Pulses
  { name: 'Wheat', emoji: '🌾', category: 'Grains' },
  { name: 'Rice', emoji: '🍚', category: 'Grains' },
  { name: 'Corn', emoji: '🌽', category: 'Grains' },
  { name: 'Pulses', emoji: '🫘', category: 'Grains' },

  // Spices & Others
  { name: 'Garlic', emoji: '🧄', category: 'Others' },
  { name: 'Ginger', emoji: '🫚', category: 'Others' },
  { name: 'Turmeric', emoji: '🫚', category: 'Others' },
  { name: 'Chilli', emoji: '🌶️', category: 'Others' },
  { name: 'Pepper', emoji: '🧂', category: 'Others' },
  { name: 'Cardamom', emoji: '🌿', category: 'Others' },
];

export default function AddProductScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { products, categories, units, addProduct } = useMandi();

  const initialCat = route?.params?.initialCategory || '';

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [customImage, setCustomImage] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);

  // Auto-calculated produce image
  const previewImageUrl = getProductImage({
    name,
    category: selectedCategory,
    image: customImage,
  });

  // Autocomplete matching presets when typing
  const matchingSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return POPULAR_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) &&
        p.name.toLowerCase() !== q
    ).slice(0, 5);
  }, [name]);

  const handleSelectPreset = (presetName: string, presetCategory?: string) => {
    setName(presetName);
    const key = presetName.toLowerCase();
    if (DEFAULT_PRODUCT_IMAGES[key]) {
      setCustomImage(DEFAULT_PRODUCT_IMAGES[key]);
    } else {
      setCustomImage('');
    }
    if (presetCategory) {
      setSelectedCategory(presetCategory);
    }
  };

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('Missing Name', 'Please enter a product name (e.g. Coconut, Lemon, Tomato).');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category for this commodity.');
      return;
    }

    if (!selectedUnit) {
      Alert.alert('Missing Unit', 'Please select a measuring unit (e.g. Kg, Piece, Crate).');
      return;
    }

    // Duplicate commodity prevention
    const isDuplicate = products.some(
      (p) =>
        p.name.trim().toLowerCase() === cleanName.toLowerCase() &&
        (p.category || '').trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert(
        'Duplicate Produce',
        `"${cleanName}" already exists in the ${selectedCategory} category. You can update its stock in the catalogue instead of adding a duplicate.`
      );
      return;
    }

    // Validate quantity: Must be >= 0 if provided
    let cleanQty = '0';
    if (quantity.trim() !== '') {
      const parsedQty = parseFloat(quantity.trim());
      if (isNaN(parsedQty) || parsedQty < 0) {
        Alert.alert('Invalid Quantity', 'Initial available quantity cannot be negative.');
        return;
      }
      cleanQty = String(parsedQty);
    }

    // Validate price: Must be >= 0 if provided
    let cleanPrice = '';
    if (price.trim() !== '') {
      const parsedPrice = parseFloat(price.trim());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        Alert.alert('Invalid Price', 'Price per unit cannot be negative.');
        return;
      }
      cleanPrice = String(parsedPrice);
    }

    const success = addProduct({
      name: cleanName,
      category: selectedCategory,
      unit: selectedUnit,
      quantity: cleanQty,
      price: cleanPrice,
      image: customImage.trim() || previewImageUrl,
    });

    if (success) {
      Keyboard.dismiss();
      const qtyMsg = cleanQty !== '0' ? `${cleanQty} ${selectedUnit}` : selectedUnit;
      Alert.alert(
        'Product Added',
        `${cleanName} (${selectedCategory}, ${qtyMsg}) has been added successfully to your mandi catalogue.`,
        [
          {
            text: 'View Catalogue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not add product. Please verify the entered fields.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 80, 100),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? colors.textPrimary : colors.primary} />
            <Text style={styles.backText}>Products</Text>
          </TouchableOpacity>

          <Text style={[styles.logo, { color: isDark ? colors.primaryDark : colors.primary }]}>
            CAL Mandi
          </Text>
        </View>

        <Text style={styles.title}>Add Product</Text>
        <Text style={styles.subtitle}>
          Add a new commodity with product photo, category, measuring unit, and opening stock.
        </Text>

        {/* ============================================================== */}
        {/* GROUP 1: PRODUCT INFORMATION                                   */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="cube-outline" size={16} color="#16834A" />
            </View>
            <Text style={styles.sectionHeading}>Product Information</Text>
          </View>

          {/* Product Image Preview Card */}
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <View style={styles.imagePreviewTextWrap}>
              <View style={styles.imageTitleRow}>
                <Text style={styles.imagePreviewTitle}>
                  {name.trim() ? `${name.trim()} Photo` : 'Product Photo'}
                </Text>
                <Text style={styles.emojiBadge}>
                  {getProductEmoji(name, selectedCategory)}
                </Text>
              </View>
              <Text style={styles.imagePreviewDesc}>
                {customImage
                  ? 'Custom photo attached'
                  : 'Auto-matched fresh produce photo'}
              </Text>

              <TouchableOpacity
                style={styles.customImageToggleBtn}
                activeOpacity={0.7}
                onPress={() => setShowImageInput(!showImageInput)}
              >
                <Ionicons
                  name="camera-outline"
                  size={14}
                  color={isDark ? '#4ADE80' : '#16834A'}
                />
                <Text style={styles.customImageToggleText}>
                  {showImageInput ? 'Hide Custom URL' : 'Set Custom Image URL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showImageInput && (
            <View style={styles.customUrlInputWrap}>
              <Text style={styles.fieldHelper}>Custom Photo Image URL (HTTPS):</Text>
              <TextInput
                style={styles.input}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor={colors.inputPlaceholder}
                value={customImage}
                onChangeText={setCustomImage}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Quick Commodity Presets */}
          <Text style={styles.fieldLabel}>Popular Commodity Presets</Text>
          <Text style={styles.fieldHelper}>Tap to instantly fill name, category and matching photo:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.presetScroll}
          >
            {POPULAR_PRESETS.map((preset) => {
              const isActive = name.toLowerCase().trim() === preset.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={preset.name}
                  style={[styles.presetChip, isActive && styles.presetChipActive]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPreset(preset.name, preset.category)}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Product Name */}
          <Text style={styles.fieldLabel}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coconut, Lemon, Tomato, Ginger"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Selectable Autocomplete Suggestions Dropdown */}
          {matchingSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggested matches:</Text>
              <View style={styles.suggestionsGrid}>
                {matchingSuggestions.map((sug) => (
                  <TouchableOpacity
                    key={sug.name}
                    style={styles.suggestionPill}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPreset(sug.name, sug.category)}
                  >
                    <Text style={styles.suggestionEmoji}>{sug.emoji}</Text>
                    <Text style={styles.suggestionName}>{sug.name}</Text>
                    <Text style={styles.suggestionCat}>({sug.category})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category Selection */}
          <Text style={styles.fieldLabel}>Category *</Text>
          <Text style={styles.fieldHelper}>Select commodity category:</Text>

          {categories.length === 0 ? (
            <View style={styles.noCategoriesBox}>
              <Text style={styles.noCategoriesText}>
                No categories available. Please add a category first.
              </Text>
              <TouchableOpacity
                style={styles.inlineAddCatButton}
                onPress={() => navigation.navigate('AddCategory')}
              >
                <Text style={styles.inlineAddCatText}>+ Add Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedCategory(cat.name);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
                      size={16}
                      color={isSelected ? '#FFFFFF' : isDark ? '#4ADE80' : '#16834A'}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ============================================================== */}
        {/* GROUP 2: MEASUREMENT                                           */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="scale-outline" size={16} color="#16834A" />
            </View>
            <Text style={styles.sectionHeading}>Measurement Unit</Text>
          </View>

          <Text style={styles.fieldLabel}>Unit of Sale / Inventory *</Text>
          <Text style={styles.fieldHelper}>Select how this produce is weighed, packed, or counted:</Text>

          <View style={styles.chipGrid}>
            {units.map((unit) => {
              const isSelected = selectedUnit === unit;
              return (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedUnit(unit);
                  }}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.unitChipText,
                      isSelected && styles.unitChipTextSelected,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ============================================================== */}
        {/* GROUP 3: INVENTORY                                             */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="layers-outline" size={16} color="#16834A" />
            </View>
            <Text style={styles.sectionHeading}>Inventory</Text>
          </View>

          <Text style={styles.fieldLabel}>Initial Available Quantity</Text>
          <Text style={styles.fieldHelper}>
            Enter starting stock count in {selectedUnit || 'selected unit'} (0 or more):
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 50 (${selectedUnit})` : 'e.g. 25, 50, 100'}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="numeric"
            value={quantity}
            onChangeText={(val) => {
              // Strip negative signs and non-numeric characters (allow decimal point)
              const sanitized = val.replace(/[^0-9.]/g, '');
              setQuantity(sanitized);
            }}
            returnKeyType="next"
          />
        </View>

        {/* ============================================================== */}
        {/* GROUP 4: PRICING                                               */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="cash-outline" size={16} color="#16834A" />
            </View>
            <Text style={styles.sectionHeading}>Pricing</Text>
          </View>

          <Text style={styles.fieldLabel}>Price / Rate per Unit (₹) (Optional)</Text>
          <Text style={styles.fieldHelper}>
            {selectedUnit
              ? `Estimated mandi market rate in ₹ per ${selectedUnit}:`
              : 'Estimated mandi market rate per unit in ₹:'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 40 (₹ per ${selectedUnit})` : 'e.g. 40, 1200'}
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="numeric"
            value={price}
            onChangeText={(val) => {
              // Strip negative signs and non-numeric characters (allow decimal point)
              const sanitized = val.replace(/[^0-9.]/g, '');
              setPrice(sanitized);
            }}
            returnKeyType="done"
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.saveButtonText}>Save Product to Catalogue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
      marginBottom: 16,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingRight: 12,
    },
    backText: {
      color: isDark ? colors.textPrimary : colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 4,
    },
    logo: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 18,
      lineHeight: 20,
    },
    sectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    sectionIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: isDark ? '#064E3B' : '#E8F5EC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    imagePreviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : '#F8FAF9',
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    imagePreview: {
      width: 68,
      height: 68,
      borderRadius: 12,
      backgroundColor: isDark ? colors.surfaceMuted : '#E2E8F0',
    },
    imagePreviewTextWrap: {
      flex: 1,
    },
    imageTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    imagePreviewTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    emojiBadge: {
      fontSize: 16,
    },
    imagePreviewDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    customImageToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 4,
    },
    customImageToggleText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    customUrlInputWrap: {
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
      marginBottom: 4,
    },
    fieldHelper: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    presetScroll: {
      paddingVertical: 4,
      gap: 6,
      marginBottom: 12,
    },
    presetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    presetChipActive: {
      backgroundColor: isDark ? '#143823' : '#E8F5EC',
      borderColor: isDark ? '#22C55E' : '#16834A',
    },
    presetEmoji: {
      fontSize: 14,
    },
    presetText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetTextActive: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.inputBackground,
      marginBottom: 6,
    },
    suggestionsContainer: {
      backgroundColor: isDark ? colors.surfaceElevated : '#F8FAF9',
      borderWidth: 1,
      borderColor: isDark ? '#22C55E40' : '#86EFAC',
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
    },
    suggestionsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    suggestionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    suggestionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#143823' : '#E8F5EC',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    suggestionEmoji: {
      fontSize: 13,
    },
    suggestionName: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    suggestionCat: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : '#F7F9F7',
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
    },
    categoryChipSelected: {
      backgroundColor: isDark ? colors.primary : '#16834A',
      borderColor: isDark ? colors.primary : '#16834A',
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    categoryChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    unitChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceElevated : '#F7F9F7',
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    unitChipSelected: {
      backgroundColor: isDark ? colors.primary : '#16834A',
      borderColor: isDark ? colors.primary : '#16834A',
    },
    unitChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    unitChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    noCategoriesBox: {
      padding: 14,
      backgroundColor: isDark ? '#3B2904' : '#FFF7ED',
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#78350F' : '#FED7AA',
    },
    noCategoriesText: {
      fontSize: 13,
      color: isDark ? '#FDE68A' : '#9A3412',
      marginBottom: 8,
    },
    inlineAddCatButton: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? colors.primary : '#16834A',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    inlineAddCatText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: 'bold',
    },
    saveButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.primary : '#16834A',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#16834A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelButton: {
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
