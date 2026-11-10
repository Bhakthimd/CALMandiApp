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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryImage, DEFAULT_CATEGORY_IMAGES } from '../utils/productImages';

const CATEGORY_PRESETS = [
  'Fruits',
  'Vegetables',
  'Leafy Vegetables',
  'Dry Fruits',
  'Grains',
  'Spices',
  'Dairy & Eggs',
  'Others',
];

export default function AddCategoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { addCategory } = useMandi();
  const [name, setName] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const previewImageUrl =
    customImage.trim() || getCategoryImage(name) || DEFAULT_CATEGORY_IMAGES.default;

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('Missing Details', 'Please enter a category name.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const result = addCategory(cleanName, customImage.trim() || undefined);
      setIsSaving(false);

      if (!result.success) {
        Alert.alert('Cannot Add Category', result.error || 'Duplicate category name.');
        return;
      }

      Keyboard.dismiss();
      Alert.alert(
        'Category Created',
        `Category "${cleanName}" has been created successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 150);
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
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? colors.textPrimary : colors.primary}
            />
            <Text style={styles.backText}>Categories</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.logo,
              { color: isDark ? colors.primaryDark : colors.primary },
            ]}
          >
            CAL Mandi
          </Text>
        </View>

        <Text style={styles.title}>Add Category</Text>

        <Text style={styles.subtitle}>
          Create a visual department to categorize your mandi produce.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Visual Header Preview */}
          <View style={styles.photoPreviewCard}>
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoPreviewTitle}>{name || 'Category Name'}</Text>
              <Text style={styles.photoPreviewSubtitle}>
                {customImage ? 'Custom photo attached' : 'Auto-matched produce photo'}
              </Text>
            </View>
          </View>

          {/* Quick Presets */}
          <Text style={styles.label}>Popular Category Presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}
          >
            {CATEGORY_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  name.toLowerCase() === preset.toLowerCase() && styles.presetChipActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setName(preset)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    name.toLowerCase() === preset.toLowerCase() &&
                      styles.presetChipTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Name Input */}
          <Text style={styles.label}>Category Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Exotic Fruits, Pulses, Spices"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Custom Photo URL Toggle */}
          <TouchableOpacity
            style={styles.customImageToggleBtn}
            activeOpacity={0.7}
            onPress={() => setShowImageInput(!showImageInput)}
          >
            <Ionicons
              name="image-outline"
              size={16}
              color={isDark ? '#4ADE80' : '#16834A'}
            />
            <Text style={styles.customImageToggleText}>
              {showImageInput ? 'Hide Custom Image URL' : 'Provide Custom Image URL (Optional)'}
            </Text>
          </TouchableOpacity>

          {showImageInput && (
            <View style={{ marginTop: 8, marginBottom: 14 }}>
              <Text style={styles.helperText}>Custom Photo Image URL (HTTPS):</Text>
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

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Category</Text>
              </>
            )}
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
      paddingVertical: 6,
      marginLeft: -6,
    },
    backText: {
      fontSize: 16,
      color: isDark ? colors.textPrimary : colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    logo: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    photoPreviewCard: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    photoPreview: {
      width: '100%',
      height: '100%',
    },
    photoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
      padding: 12,
    },
    photoPreviewTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    photoPreviewSubtitle: {
      fontSize: 11,
      color: '#E2E8F0',
      marginTop: 2,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    helperText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    presetScroll: {
      gap: 8,
      marginBottom: 16,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: isDark ? colors.background : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#CBD5E1',
    },
    presetChipActive: {
      backgroundColor: '#16834A',
      borderColor: '#16834A',
    },
    presetChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
    },
    input: {
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
    customImageToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      gap: 6,
    },
    customImageToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 12,
      borderRadius: 10,
      gap: 6,
      marginTop: 4,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 10,
      marginTop: 8,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
