import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { getCategoryImage, DEFAULT_CATEGORY_IMAGES } from '../utils/productImages';
import { Category } from '../types';

export default function CategoriesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    categories,
    products,
    isOwner,
    canAddCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useMandi();

  // Add / Edit Category Modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalCatName, setModalCatName] = useState<string>('');
  const [modalCatImage, setModalCatImage] = useState<string>('');

  const handleOpenAdd = () => {
    if (!canAddCategory) {
      Alert.alert(
        'Owner Privilege Required',
        'Creating new master categories is reserved for the Mandi Owner.'
      );
      return;
    }
    setEditingCategory(null);
    setModalCatName('');
    setModalCatImage('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    if (!isOwner) {
      Alert.alert(
        'Owner Privilege Required',
        'Editing categories is reserved for the Mandi Owner.'
      );
      return;
    }
    setEditingCategory(category);
    setModalCatName(category.name);
    setModalCatImage(category.image || '');
    setIsAddModalOpen(true);
  };

  const [isSavingCat, setIsSavingCat] = useState<boolean>(false);

  const handleSaveCategory = () => {
    const cleanName = modalCatName.trim();
    if (!cleanName) {
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }

    setIsSavingCat(true);
    setTimeout(() => {
      if (editingCategory) {
        // Update
        const res = updateCategory(editingCategory.id, {
          name: cleanName,
          image: modalCatImage.trim() || undefined,
        });
        setIsSavingCat(false);
        if (res.success) {
          setIsAddModalOpen(false);
          Alert.alert('Updated', `Category "${cleanName}" updated successfully.`);
        } else {
          Alert.alert('Error', res.error || 'Could not update category.');
        }
      } else {
        // Add
        const res = addCategory(cleanName, modalCatImage.trim() || undefined);
        setIsSavingCat(false);
        if (res.success) {
          setIsAddModalOpen(false);
          Alert.alert('Category Created', `Category "${cleanName}" added successfully.`);
        } else {
          Alert.alert('Error', res.error || 'Could not create category.');
        }
      }
    }, 150);
  };

  const handleDeleteCategory = (category: Category) => {
    if (!isOwner) {
      Alert.alert('Owner Privilege Required', 'Only owners can remove categories.');
      return;
    }

    const assignedCount = products.filter(
      (p) => (p.category || '').toLowerCase() === category.name.toLowerCase()
    ).length;

    if (assignedCount > 0) {
      Alert.alert(
        'Category In Use',
        `"${category.name}" currently has ${assignedCount} active product(s). Please reassign or delete these products first.`
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete category "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(category.id);
          },
        },
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
            paddingBottom: Math.max(insets.bottom + 25, 35),
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
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? colors.textPrimary : colors.primary}
            />
            <Text style={styles.backText}>Home</Text>
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

        {/* Title & Subtitle */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>
              Manage product classifications & visual departments.
            </Text>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={styles.addCategoryHeaderBtn}
              activeOpacity={0.8}
              onPress={handleOpenAdd}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addCategoryHeaderBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Combined Catalog Shortcut Banner */}
        <TouchableOpacity
          style={styles.combinedBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={styles.combinedBannerLeft}>
            <Ionicons
              name="grid-outline"
              size={22}
              color={isDark ? '#4ADE80' : '#16834A'}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.combinedBannerTitle}>Visual Product Catalogue</Text>
              <Text style={styles.combinedBannerSub}>
                Browse all {products.length} products with photo cards
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? '#4ADE80' : '#16834A'}
          />
        </TouchableOpacity>

        {/* Categories List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>All Categories</Text>
          <View style={styles.countBadge}>
            <Text style={styles.count}>
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </Text>
          </View>
        </View>

        {/* Visual Category Cards */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No categories added yet</Text>
            <Text style={styles.emptySubtext}>
              {isOwner
                ? 'Tap "+ Add Category" to create your first visual department.'
                : 'Waiting for Mandi Owner to create initial categories.'}
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const matchingProducts = products.filter(
              (p) => (p.category || '').toLowerCase() === category.name.toLowerCase()
            );
            const count = matchingProducts.length;
            const photoUrl = category.image || getCategoryImage(category.name);

            return (
              <View key={category.id} style={styles.visualCard}>
                {/* Photo Header */}
                <View style={styles.visualCardImageWrapper}>
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.visualCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.visualCardOverlay}>
                    <Text style={styles.visualCardName}>{category.name}</Text>
                    <View style={styles.visualCardCountPill}>
                      <Text style={styles.visualCardCountText}>
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.visualCardBody}>
                  {/* Sample Produce list */}
                  <Text style={styles.producePreviewText} numberOfLines={1}>
                    {count > 0
                      ? matchingProducts
                          .map((p) => p.name)
                          .slice(0, 4)
                          .join(', ') + (count > 4 ? ` +${count - 4} more` : '')
                      : 'No items currently assigned to this category.'}
                  </Text>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.browseBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate('Products', { category: category.name })
                      }
                    >
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color={isDark ? '#4ADE80' : '#16834A'}
                      />
                      <Text style={styles.browseBtnText}>Browse Produce</Text>
                    </TouchableOpacity>

                    {isOwner && (
                      <View style={styles.cardRightActions}>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          activeOpacity={0.7}
                          onPress={() => handleOpenEdit(category)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={isDark ? '#38BDF8' : '#0284C7'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.iconBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteCategory(category)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={isDark ? '#F87171' : '#DC2626'}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? colors.textSecondary : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* Photo Preview */}
            <View style={styles.modalPhotoPreviewWrap}>
              <Image
                source={{
                  uri:
                    modalCatImage.trim() ||
                    getCategoryImage(modalCatName) ||
                    DEFAULT_CATEGORY_IMAGES.default,
                }}
                style={styles.modalPhotoPreview}
                resizeMode="cover"
              />
              <Text style={styles.modalPhotoPreviewLabel}>
                Category Photo (Auto-matched or custom)
              </Text>
            </View>

            <Text style={styles.inputLabel}>Category Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Exotic Fruits, Pulses, Spices"
              placeholderTextColor={colors.inputPlaceholder}
              value={modalCatName}
              onChangeText={setModalCatName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Custom Photo URL (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://images.unsplash.com/photo-..."
              placeholderTextColor={colors.inputPlaceholder}
              value={modalCatImage}
              onChangeText={setModalCatImage}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCategory}
                disabled={isSavingCat}
              >
                {isSavingCat ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Text>
                )}
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
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    addCategoryHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16834A',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 4,
    },
    addCategoryHeaderBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    combinedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#064E3B20' : '#F0FDF4',
      borderWidth: 1.5,
      borderColor: isDark ? '#4ADE80' : '#16834A',
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
    },
    combinedBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    combinedBannerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    combinedBannerSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    countBadge: {
      backgroundColor: isDark ? colors.surface : '#E2E8F0',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    count: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // Visual Category Card
    visualCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    visualCardImageWrapper: {
      width: '100%',
      height: 110,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    visualCardImage: {
      width: '100%',
      height: '100%',
    },
    visualCardOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
      padding: 12,
    },
    visualCardName: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    visualCardCountPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginTop: 3,
    },
    visualCardCountText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    visualCardBody: {
      padding: 12,
    },
    producePreviewText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    cardActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    browseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#064E3B30' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDark ? '#4ADE80' : '#16834A',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 6,
    },
    browseBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    cardRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      padding: 4,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 10,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalPhotoPreviewWrap: {
      alignItems: 'center',
      marginBottom: 14,
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
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 6,
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
  });
