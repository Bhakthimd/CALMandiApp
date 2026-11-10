import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';

export default function GradingWastageScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { productId: initialProductId, arrivalId: initialArrivalId } = route.params || {};
  const {
    products,
    productGrades,
    wastageRecords,
    arrivalLots,
    recordWastageAndSorting,
  } = useMandi();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id ?? '')
  );

  const activeLot = useMemo(() => {
    if (initialArrivalId) {
      return arrivalLots.find((l) => l.arrivalId === initialArrivalId);
    }
    return arrivalLots.find((l) => l.productId === selectedProductId && l.ungradedQuantity > 0);
  }, [arrivalLots, initialArrivalId, selectedProductId]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const grades = useMemo(() => {
    return productGrades.filter((g) => g.productId === selectedProductId && g.isActive);
  }, [productGrades, selectedProductId]);

  // Original quantity to sort
  const [originalQty, setOriginalQty] = useState<string>(
    activeLot
      ? String(activeLot.ungradedQuantity)
      : selectedProduct?.ungradedStock && selectedProduct.ungradedStock > 0
      ? String(selectedProduct.ungradedStock)
      : '100'
  );

  // Quantities assigned to each grade (gradeId -> string)
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  // Wastage inputs
  const [wastageQty, setWastageQty] = useState<string>('5');
  const [wastageReason, setWastageReason] = useState<string>('Transportation Damage / Overripe');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGradeInputChange = (gradeId: string, val: string) => {
    setGradeInputs((prev) => ({
      ...prev,
      [gradeId]: val,
    }));
  };

  const parsedOriginal = parseFloat(originalQty) || 0;
  const parsedWastage = parseFloat(wastageQty) || 0;

  // Calculate total graded quantity
  const totalGraded = useMemo(() => {
    let sum = 0;
    grades.forEach((g) => {
      const val = parseFloat(gradeInputs[g.id] || '0') || 0;
      sum += val;
    });
    return sum;
  }, [grades, gradeInputs]);

  // Total processed = graded + wastage
  const totalProcessed = totalGraded + parsedWastage;

  // Remaining ungraded
  const remainingUngraded = Math.max(0, parsedOriginal - totalProcessed);

  // Wastage percentage
  const wastagePercentage = parsedOriginal > 0 ? (parsedWastage / parsedOriginal) * 100 : 0;

  // Validation
  const isOverAllocated = totalProcessed > parsedOriginal;
  const isValid = parsedOriginal > 0 && !isOverAllocated;

  const wastageReasonChips = [
    'Transportation Damage / Overripe',
    'Spoiled / Rotten Produce',
    'Pest / Disease Damage',
    'Under-sized / Immature Produce',
    'Sorting Residue / Culled Stems',
  ];

  const handleSubmit = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product.');
      return;
    }

    if (parsedOriginal <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid original quantity to grade.');
      return;
    }

    if (isOverAllocated) {
      Alert.alert(
        'Validation Error',
        `Total graded (${totalGraded}) + wastage (${parsedWastage}) = ${totalProcessed} exceeds original quantity of ${parsedOriginal}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const numericGradeQuantities: Record<string, number> = {};
      grades.forEach((g) => {
        numericGradeQuantities[g.id] = parseFloat(gradeInputs[g.id] || '0') || 0;
      });

      const res = await recordWastageAndSorting({
        lotId: activeLot?.id,
        arrivalId: activeLot?.arrivalId || initialArrivalId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        originalQuantity: parsedOriginal,
        gradeQuantities: numericGradeQuantities,
        wastageQuantity: parsedWastage,
        wastageReason,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        Alert.alert(
          'Grading & Wastage Recorded',
          `Successfully processed ${parsedOriginal} ${selectedProduct.unit} of ${selectedProduct.name}.\n` +
            `• Graded Produce: ${totalGraded} ${selectedProduct.unit}\n` +
            `• Wastage Tracked: ${parsedWastage} ${selectedProduct.unit} (${wastagePercentage.toFixed(1)}%)\n` +
            `• Remaining Ungraded: ${remainingUngraded} ${selectedProduct.unit}`,
          [
            {
              text: 'View Grades',
              onPress: () =>
                navigation.replace('ProductGrades', { productId: selectedProduct.id }),
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Failed', res.error || 'Could not record grading batch.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recent wastage records for this product
  const recentProductWastage = useMemo(() => {
    return wastageRecords.filter((w) => w.productId === selectedProductId);
  }, [wastageRecords, selectedProductId]);

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
          <Text style={styles.headerTitle}>Grading & Wastage Management</Text>
          <Text style={styles.headerSubtitle}>गुणवत्ता छंटाई एवं खराबी (वेस्टेज) हिसाब</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 50) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Selector */}
        <Text style={styles.sectionHeaderTitle}>Select Commodity (उत्पाद)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prodScroll}
        >
          {products.map((p) => {
            const isSelected = p.id === selectedProductId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.prodTab, isSelected && styles.prodTabActive]}
                onPress={() => {
                  setSelectedProductId(p.id);
                  setGradeInputs({});
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.prodTabText,
                    isSelected && styles.prodTabTextActive,
                  ]}
                >
                  {p.name}
                </Text>
                <Text
                  style={[styles.prodTabSub, isSelected && styles.prodTabSubActive]}
                >
                  Stock: {p.quantity || 0} {p.unit}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 1: Original Quantity Received */}
        <View style={styles.card}>
          {activeLot && (
            <View style={{ marginBottom: 12, padding: 8, backgroundColor: isDark ? colors.surfaceElevated : '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#22C55E' : '#86EFAC' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#4ADE80' : '#16834A' }}>
                📦 Lot #{activeLot.lotNumber} ({activeLot.supplierName})
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Ungraded Lot Stock: {activeLot.ungradedQuantity} {selectedProduct?.unit}
              </Text>
            </View>
          )}

          <View style={styles.stepTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Original Quantity Received</Text>
              <Text style={styles.stepSub}>मूल आवक मात्रा (छंटाई हेतु)</Text>
            </View>
          </View>

          <View style={styles.qtyInputWrap}>
            <TextInput
              style={styles.bigQtyInput}
              keyboardType="numeric"
              value={originalQty}
              onChangeText={setOriginalQty}
              placeholder="0"
              placeholderTextColor={colors.inputPlaceholder}
            />
            <Text style={styles.unitSuffix}>{selectedProduct?.unit}</Text>
          </View>
        </View>

        {/* Step 2: Grade Allocations */}
        <View style={styles.card}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Grade-Wise Allotment</Text>
              <Text style={styles.stepSub}>विभिन्न ग्रेडों में विभाजित मात्रा</Text>
            </View>
          </View>

          {grades.length === 0 ? (
            <Text style={styles.noGradesWarning}>
              No active grades configured for this product. Please add grades first.
            </Text>
          ) : (
            grades.map((grade) => (
              <View key={grade.id} style={styles.gradeInputRow}>
                <View style={styles.gradeMetaCol}>
                  <Text style={styles.gradeInputName}>{grade.name}</Text>
                  <Text style={styles.gradeInputPrice}>
                    Rate: ₹{grade.defaultPrice}/{selectedProduct?.unit}
                  </Text>
                </View>

                <View style={styles.gradeInputBoxWrap}>
                  <TextInput
                    style={styles.gradeInputField}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={gradeInputs[grade.id] || ''}
                    onChangeText={(val) => handleGradeInputChange(grade.id, val)}
                  />
                  <Text style={styles.gradeInputUnit}>{selectedProduct?.unit}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.totalGradedSummaryRow}>
            <Text style={styles.totalGradedLabel}>Sum of Graded Produce:</Text>
            <Text style={styles.totalGradedValue}>
              {totalGraded} {selectedProduct?.unit}
            </Text>
          </View>
        </View>

        {/* Step 3: Wastage Tracking */}
        <View style={styles.card}>
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: isDark ? '#DC2626' : '#DC2626' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Wastage & Culled Produce</Text>
              <Text style={styles.stepSub}>खराब, सड़ा-गला या छंटाई वेस्टेज</Text>
            </View>
          </View>

          <View style={styles.qtyInputWrap}>
            <TextInput
              style={[styles.bigQtyInput, { color: isDark ? '#F87171' : '#DC2626' }]}
              keyboardType="numeric"
              value={wastageQty}
              onChangeText={setWastageQty}
              placeholder="0"
              placeholderTextColor={colors.inputPlaceholder}
            />
            <Text style={styles.unitSuffix}>{selectedProduct?.unit} Wastage</Text>
          </View>

          <Text style={styles.subFieldLabel}>Wastage Reason (खराबी का कारण):</Text>
          <View style={styles.reasonsChipWrap}>
            {wastageReasonChips.map((reason) => {
              const isSelected = wastageReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonChip,
                    isSelected && styles.reasonChipActive,
                  ]}
                  onPress={() => setWastageReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      isSelected && styles.reasonChipTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.notesField}
            placeholder="Additional sorting notes (e.g. Unloading bay #2, lorry damage)"
            placeholderTextColor={colors.inputPlaceholder}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Step 4: Real-Time Audit & Calculations */}
        <View
          style={[
            styles.auditCard,
            isOverAllocated ? styles.auditCardError : styles.auditCardValid,
          ]}
        >
          <Text style={styles.auditTitle}>Batch Sorting Calculations</Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Original Quantity Received:</Text>
            <Text style={styles.calcValue}>
              {parsedOriginal} {selectedProduct?.unit}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total Graded Quantity:</Text>
            <Text style={[styles.calcValue, { color: isDark ? '#4ADE80' : '#16834A' }]}>
              + {totalGraded} {selectedProduct?.unit}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Wastage Quantity:</Text>
            <Text style={[styles.calcValue, { color: isDark ? '#F87171' : '#DC2626' }]}>
              + {parsedWastage} {selectedProduct?.unit} ({wastagePercentage.toFixed(1)}%)
            </Text>
          </View>

          <View style={styles.calcDivider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcBoldLabel}>Total Processed Produce:</Text>
            <Text
              style={[
                styles.calcBoldValue,
                isOverAllocated && { color: isDark ? '#F87171' : '#DC2626' },
              ]}
            >
              {totalProcessed} / {parsedOriginal} {selectedProduct?.unit}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Remaining Ungraded Produce:</Text>
            <Text style={styles.calcValue}>
              {remainingUngraded} {selectedProduct?.unit}
            </Text>
          </View>

          {isOverAllocated && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>
                Allocated quantity ({totalProcessed}) exceeds original ({parsedOriginal})!
                Reduce grade or wastage amounts.
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isValid || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done-circle" size={22} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Recording Batch...' : 'Confirm & Update Grade Stocks'}
          </Text>
        </TouchableOpacity>

        {/* Recent Wastage History Log */}
        {recentProductWastage.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>
              Recent Grading & Wastage History ({recentProductWastage.length})
            </Text>
            {recentProductWastage.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    📅 {new Date(item.timestamp).toLocaleDateString()} • {item.recordedBy}
                  </Text>
                  <View style={styles.historyWastagePill}>
                    <Text style={styles.historyWastagePillText}>
                      {item.wastagePercentage}% Wastage
                    </Text>
                  </View>
                </View>
                <Text style={styles.historySummary}>
                  Original: {item.originalQuantity} {selectedProduct?.unit} • Wastage: {item.wastageQuantity} {selectedProduct?.unit}
                </Text>
                <Text style={styles.historyReason}>
                  Reason: {item.wastageReason}
                </Text>
              </View>
            ))}
          </View>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  content: {
    padding: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  prodScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  prodTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  prodTabActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  prodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  prodTabTextActive: {
    color: '#FFFFFF',
  },
  prodTabSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  prodTabSubActive: {
    color: '#E0F2FE',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#16834A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  qtyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  bigQtyInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noGradesWarning: {
    fontSize: 13,
    color: isDark ? '#F87171' : '#DC2626',
    padding: 8,
  },
  gradeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gradeMetaCol: {
    flex: 1,
  },
  gradeInputName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gradeInputPrice: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  gradeInputBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
  },
  gradeInputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    paddingRight: 4,
  },
  gradeInputUnit: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalGradedSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
  },
  totalGradedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalGradedValue: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#4ADE80' : '#16834A',
  },
  subFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  reasonsChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  reasonChipActive: {
    backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
    borderColor: isDark ? '#7F1D1D' : '#F87171',
  },
  reasonChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  reasonChipTextActive: {
    color: isDark ? '#F87171' : '#DC2626',
    fontWeight: '700',
  },
  notesField: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  auditCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  auditCardValid: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  },
  auditCardError: {
    backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
    borderColor: isDark ? '#7F1D1D' : '#F87171',
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calcDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  calcBoldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calcBoldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#4ADE80' : '#16834A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: isDark ? '#3B1212' : '#FEE2E2',
    padding: 8,
    borderRadius: 6,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 11,
    color: isDark ? '#F87171' : '#DC2626',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  historyWastagePill: {
    backgroundColor: isDark ? '#3B1212' : '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyWastagePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: isDark ? '#F87171' : '#DC2626',
  },
  historySummary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyReason: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
