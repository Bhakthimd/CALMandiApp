import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { ProductGrade } from '../types';

export default function ProductGradesScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { productId: initialProductId } = route.params || {};
  const {
    products,
    productGrades,
    addProductGrade,
    updateProductGrade,
    deleteProductGrade,
    isOwner,
  } = useMandi();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id ?? '')
  );

  // Modal state for adding/editing grade
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<ProductGrade | null>(null);
  const [gradeName, setGradeName] = useState('');
  const [gradeDesc, setGradeDesc] = useState('');
  const [gradePrice, setGradePrice] = useState('');
  const [gradeStock, setGradeStock] = useState('0');

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const currentGrades = useMemo(() => {
    return productGrades.filter((g) => g.productId === selectedProductId);
  }, [productGrades, selectedProductId]);

  const totalGradeStock = useMemo(() => {
    return currentGrades.reduce((sum, g) => sum + (g?.isActive ? (g?.stockQuantity || 0) : 0), 0);
  }, [currentGrades]);

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    setGradeName('');
    setGradeDesc('');
    setGradePrice(selectedProduct?.price || '20');
    setGradeStock('0');
    setModalVisible(true);
  };

  const handleOpenEditModal = (grade: ProductGrade) => {
    setEditingGrade(grade);
    setGradeName(grade.name);
    setGradeDesc(grade.description || '');
    setGradePrice(String(grade.defaultPrice));
    setGradeStock(String(grade.stockQuantity));
    setModalVisible(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeName.trim()) {
      Alert.alert('Required Field', 'Please enter a grade name (e.g. Grade A or Grade Premium).');
      return;
    }

    const priceNum = parseFloat(gradePrice) || 0;
    const stockNum = parseFloat(gradeStock) || 0;

    if (editingGrade) {
      // Edit existing grade
      await updateProductGrade(editingGrade.id, {
        name: gradeName.trim(),
        description: gradeDesc.trim() || undefined,
        defaultPrice: priceNum,
        stockQuantity: stockNum,
      });
      Alert.alert('Grade Updated', `${gradeName.trim()} settings have been saved.`);
    } else {
      // Create new grade
      await addProductGrade({
        productId: selectedProductId,
        name: gradeName.trim(),
        description: gradeDesc.trim() || undefined,
        defaultPrice: priceNum,
        stockQuantity: stockNum,
        isActive: true,
      });
      Alert.alert('Grade Created', `New grade ${gradeName.trim()} added to ${selectedProduct?.name}.`);
    }

    setModalVisible(false);
  };

  const handleDeleteGrade = (gradeId: string, name: string) => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only Mandi Owners can delete grades.');
      return;
    }
    Alert.alert(
      'Delete Grade',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProductGrade(gradeId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Product Grades & Quality</Text>
          <Text style={styles.headerSubtitle}>उत्पाद ग्रेडिंग एवं गुणवत्ता मानक</Text>
        </View>
        {isOwner && (
          <TouchableOpacity
            style={styles.addGradeHeaderBtn}
            onPress={handleOpenAddModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#16834A" />
            <Text style={styles.addGradeHeaderBtnText}>+ Grade</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 80, 90) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Commodity / Product Selector Tabs */}
        <Text style={styles.sectionHeaderTitle}>Select Commodity (उत्पाद चुनें)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productChipScroll}
        >
          {products.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.productTab,
                  isSelected && styles.productTabActive,
                ]}
                onPress={() => setSelectedProductId(p.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.productTabText,
                    isSelected && styles.productTabTextActive,
                  ]}
                >
                  {p.name}
                </Text>
                <Text
                  style={[
                    styles.productTabSub,
                    isSelected && styles.productTabSubActive,
                  ]}
                >
                  {p.category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Product Overview Card */}
        {selectedProduct && (
          <View style={styles.productBanner}>
            <View style={styles.productBannerTop}>
              <View>
                <Text style={styles.bannerProdName}>{selectedProduct.name}</Text>
                <Text style={styles.bannerProdUnit}>
                  Standard Unit: <Text style={{ fontWeight: '700' }}>{selectedProduct.unit}</Text> • Master Base Price: ₹{selectedProduct.price || 0}
                </Text>
              </View>
              <View style={styles.stockCounterBadge}>
                <Text style={styles.stockBadgeTitle}>Total Graded Stock</Text>
                <Text style={styles.stockBadgeValue}>
                  {totalGradeStock} {selectedProduct.unit}
                </Text>
              </View>
            </View>

            {/* Shortcut to Grading & Sorting */}
            <TouchableOpacity
              style={styles.sortWastageShortcut}
              onPress={() =>
                navigation.navigate('GradingWastage', { productId: selectedProduct.id })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="funnel-outline" size={18} color="#FFFFFF" />
              <Text style={styles.sortWastageShortcutText}>
                Record Grading & Wastage (सॉर्टिंग एवं छंटाई)
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Grades List Section */}
        <View style={styles.gradesListHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            Configured Grades ({currentGrades.length})
          </Text>
          <Text style={styles.gradesListSub}>
            {isOwner ? 'Edit prices or delete grades' : 'View grade prices and stock'}
          </Text>
        </View>

        {currentGrades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pricetags-outline" size={40} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Grades Added Yet</Text>
            <Text style={styles.emptySub}>
              {"Tap '+ Grade' above to create Grade A, Grade B, etc."}
            </Text>
          </View>
        ) : (
          currentGrades.map((grade) => {
            const isActive = grade.isActive;

            return (
              <View
                key={grade.id}
                style={[
                  styles.gradeCard,
                  !isActive && styles.gradeCardDisabled,
                ]}
              >
                <View style={styles.gradeTopRow}>
                  <View style={styles.gradeTitleWrap}>
                    <View style={styles.gradeNameRow}>
                      <Text
                        style={[
                          styles.gradeName,
                          !isActive && { color: '#888888' },
                        ]}
                      >
                        {grade.name}
                      </Text>
                      <View
                        style={[
                          styles.activeTag,
                          isActive ? styles.activeTagOn : styles.activeTagOff,
                        ]}
                      >
                        <Text
                          style={[
                            styles.activeTagText,
                            isActive ? styles.activeTagTextOn : styles.activeTagTextOff,
                          ]}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </Text>
                      </View>
                    </View>

                    {grade.description ? (
                      <Text style={styles.gradeDesc}>{grade.description}</Text>
                    ) : null}
                  </View>

                  {/* Stock pill */}
                  <View style={styles.gradeStockBadge}>
                    <Text style={styles.gradeStockLabel}>Available Stock</Text>
                    <Text style={styles.gradeStockValue}>
                      {grade.stockQuantity} {selectedProduct?.unit}
                    </Text>
                  </View>
                </View>

                {/* Pricing & Control Row */}
                <View style={styles.gradeBottomRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Default Grade Rate:</Text>
                    <Text style={styles.priceValue}>
                      ₹ {grade.defaultPrice} / {selectedProduct?.unit}
                    </Text>
                  </View>

                  {isOwner && (
                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEditModal(grade)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={15} color="#16834A" />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteGrade(grade.id, grade.name)}
                        activeOpacity={0.7}
                        accessibilityLabel={`Delete ${grade.name}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color="#DC2626"
                        />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Grade Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGrade ? 'Edit Grade Settings' : `Add Grade to ${selectedProduct?.name}`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Grade Name (e.g. Grade A, Grade B)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Grade Name"
                placeholderTextColor="#888888"
                value={gradeName}
                onChangeText={setGradeName}
              />

              <Text style={styles.inputLabel}>Quality Description</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Premium export quality, bright red"
                placeholderTextColor="#888888"
                value={gradeDesc}
                onChangeText={setGradeDesc}
              />

              <View style={styles.modalRowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>
                    Default Price (₹/{selectedProduct?.unit})
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Rate"
                    placeholderTextColor="#888888"
                    keyboardType="numeric"
                    value={gradePrice}
                    onChangeText={setGradePrice}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>
                    Stock Quantity ({selectedProduct?.unit})
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Stock"
                    placeholderTextColor="#888888"
                    keyboardType="numeric"
                    value={gradeStock}
                    onChangeText={setGradeStock}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveGrade}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>
                  {editingGrade ? 'Save Changes' : 'Create Grade'}
                </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addGradeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addGradeHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16834A',
  },
  content: {
    padding: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  productChipScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  productTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  productTabActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  productTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  productTabTextActive: {
    color: '#FFFFFF',
  },
  productTabSub: {
    fontSize: 10,
    color: '#777777',
    marginTop: 2,
  },
  productTabSubActive: {
    color: '#E0F2FE',
  },
  productBanner: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
    elevation: 2,
  },
  productBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bannerProdName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bannerProdUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockCounterBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  stockBadgeTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16834A',
  },
  stockBadgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16834A',
  },
  sortWastageShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16834A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sortWastageShortcutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gradesListHeaderRow: {
    marginBottom: 10,
  },
  gradesListSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#888888',
  },
  gradeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  gradeCardDisabled: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    opacity: 0.7,
  },
  gradeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  gradeTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  gradeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gradeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagOn: {
    backgroundColor: '#ECFDF5',
  },
  activeTagOff: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeTagTextOn: {
    color: '#16834A',
  },
  activeTagTextOff: {
    color: colors.textSecondary,
  },
  gradeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gradeStockBadge: {
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  gradeStockLabel: {
    fontSize: 10,
    color: '#777777',
  },
  gradeStockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gradeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16834A',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E8F4EC',
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16834A',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalRowInputs: {
    flexDirection: 'row',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
