import React, { useState } from 'react';
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
import { getProductImage, DEFAULT_PRODUCT_IMAGES } from '../utils/productImages';

const POPULAR_PRESETS = [
  { name: 'Banana', emoji: '🍌' },
  { name: 'Apple', emoji: '🍎' },
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Mango', emoji: '🥭' },
  { name: 'Carrot', emoji: '🥕' },
  { name: 'Spinach', emoji: '🥬' },
  { name: 'Almonds', emoji: '🥜' },
  { name: 'Chilli', emoji: '🌶️' },
  { name: 'Garlic', emoji: '🧄' },
];

export default function AddProductScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { categories, units, addProduct } = useMandi();

  const initialCat = route?.params?.initialCategory || '';

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [customImage, setCustomImage] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);

  const previewImageUrl = getProductImage({
    name,
    category: selectedCategory,
    image: customImage,
  });

  const handleSelectPreset = (presetName: string) => {
    setName(presetName);
    const key = presetName.toLowerCase();
    if (DEFAULT_PRODUCT_IMAGES[key]) {
      setCustomImage(DEFAULT_PRODUCT_IMAGES[key]);
    }
  };

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('Missing Details', 'Please enter a product name.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Selection', 'Please select a category for the product.');
      return;
    }

    if (!selectedUnit) {
      Alert.alert('Missing Selection', 'Please select a unit for the product.');
      return;
    }

    const success = addProduct({
      name: cleanName,
      category: selectedCategory,
      unit: selectedUnit,
      quantity: quantity.trim() || '0',
      price: price.trim(),
      image: customImage.trim() || previewImageUrl,
    });

    if (success) {
      Keyboard.dismiss();
      const qtyMsg = quantity.trim() ? `${quantity.trim()} ${selectedUnit}` : selectedUnit;
      Alert.alert(
        'Product Added',
        `${cleanName} (${selectedCategory}, ${qtyMsg}) has been added successfully with photo.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not add product. Please check the entered fields.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 35),
          },
        ]}
        keyboardShouldPersistTaps="always"
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
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Products</Text>
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

        <Text style={styles.title}>Add Product</Text>

        <Text style={styles.subtitle}>
          Add a new commodity with product image, category, and measuring unit.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Product Image Preview Card */}
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <View style={styles.imagePreviewTextWrap}>
              <Text style={styles.imagePreviewTitle}>Product Photo</Text>
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
                <Ionicons name="camera-outline" size={14} color="#16834A" />
                <Text style={styles.customImageToggleText}>
                  {showImageInput ? 'Hide Image URL' : 'Set Custom Image URL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showImageInput && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.helperText}>Custom Photo Image URL (HTTPS):</Text>
              <TextInput
                style={styles.input}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor={colors.textMuted}
                value={customImage}
                onChangeText={setCustomImage}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Quick Preset Selector */}
          <Text style={styles.label}>Quick Commodity Presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}
          >
            {POPULAR_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={[
                  styles.presetChip,
                  name.toLowerCase() === preset.name.toLowerCase() && styles.presetChipActive,
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectPreset(preset.name)}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text
                  style={[
                    styles.presetText,
                    name.toLowerCase() === preset.name.toLowerCase() && styles.presetTextActive,
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Name */}
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Mango, Potato, Coriander"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Category Selection */}
          <Text style={styles.label}>Category *</Text>
          <Text style={styles.helperText}>
            Tap a category to select:
          </Text>

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
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedCategory(cat.name);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
                      size={18}
                      color={isSelected ? '#FFFFFF' : '#16834A'}
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

          {/* Unit Selection */}
          <Text style={styles.label}>Unit *</Text>
          <Text style={styles.helperText}>
            Select how this item is counted or weighed:
          </Text>

          <View style={styles.chipGrid}>
            {units.map((unit) => {
              const isSelected = selectedUnit === unit;
              return (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitChip,
                    isSelected && styles.unitChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedUnit(unit);
                  }}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
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

          {/* Numbers / Quantity Input */}
          <Text style={styles.label}>Initial Available Quantity (Numbers) *</Text>
          <Text style={styles.helperText}>
            Enter starting count in {selectedUnit || 'selected unit'}:
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 25 (${selectedUnit})` : 'e.g. 25, 50, 100'}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(val) => setQuantity(val.replace(/\D/g, ''))}
            returnKeyType="next"
          />

          {/* Price / Rate (Optional) */}
          <Text style={styles.label}>Price / Rate (₹) (Optional)</Text>
          <Text style={styles.helperText}>
            Enter rate per {selectedUnit || 'unit'}:
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 40 (₹ per ${selectedUnit})` : 'e.g. 40, 1200'}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={price}
            onChangeText={(val) => setPrice(val.replace(/\D/g, ''))}
            returnKeyType="done"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.7}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: isDark ? colors.surfaceElevated : '#F7F9F7',
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
    color: '#16834A',
    fontSize: 17,
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
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  imagePreviewTextWrap: {
    flex: 1,
  },
  imagePreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  imagePreviewDesc: {
    fontSize: 11,
    color: '#6B7280',
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
    color: '#16834A',
  },
  presetScroll: {
    paddingVertical: 6,
    gap: 6,
    marginBottom: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: '#E8F5EC',
    borderColor: '#16834A',
  },
  presetEmoji: {
    fontSize: 14,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  presetTextActive: {
    color: '#16834A',
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
    marginBottom: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
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
    backgroundColor: '#16834A',
    borderColor: '#16834A',
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
    backgroundColor: '#16834A',
    borderColor: '#16834A',
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
    padding: 15,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#9A3412',
    marginBottom: 8,
  },
  inlineAddCatButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16834A',
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
    backgroundColor: '#16834A',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
