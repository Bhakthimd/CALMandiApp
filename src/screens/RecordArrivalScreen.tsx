import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColors } from '../styles/theme';
import { getProductImage } from '../utils/productImages';

const COMMON_UNITS = ['Kg', 'Crate', 'Box', 'Bag', 'Quintal'];

function createLotNumber(): string {
  return `LOT-${Date.now().toString().slice(-4)}`;
}

export default function RecordArrivalScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    products,
    customers,
    recordArrival,
    generatePatti,
  } = useMandi();

  const initialProductId = route?.params?.productId;
  const initialProduct = products.find((p) => p.id === initialProductId) || products[0];

  // 1. Farmer / Supplier State
  const registeredSuppliers = useMemo(() => {
    return customers.filter((c) => {
      const type = c.customerType || 'Buyer';
      return type === 'Farmer' || type === 'Supplier' || type === 'Both' || type === 'Trader';
    });
  }, [customers]);

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(
    registeredSuppliers.length > 0 ? registeredSuppliers[0].id : ''
  );
  const [customFarmerName, setCustomFarmerName] = useState<string>('');
  const [isNewSupplier, setIsNewSupplier] = useState<boolean>(registeredSuppliers.length === 0);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  // 2. Product Details State
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [quantity, setQuantity] = useState<string>('50');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    initialProduct?.unit || 'Kg'
  );
  const [ratePerUnit, setRatePerUnit] = useState<string>(
    initialProduct?.costPrice || initialProduct?.price || '40'
  );

  // 3. Final Details & Charges State
  const [commissionPercent, setCommissionPercent] = useState<string>('2');
  const [laborCharge, setLaborCharge] = useState<string>('100');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Derived calculations
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const selectedFarmer = customers.find((c) => c.id === selectedFarmerId);

  const activeFarmerName = isNewSupplier
    ? customFarmerName.trim()
    : selectedFarmer?.name || 'Farmer / Supplier';

  const qtyNum = parseFloat(quantity) || 0;
  const rateNum = parseFloat(ratePerUnit) || 0;
  const grossAmount = Math.round(qtyNum * rateNum);

  const commPct = parseFloat(commissionPercent) || 0;
  const commAmount = Math.round((grossAmount * commPct) / 100);
  const laborAmount = parseFloat(laborCharge) || 0;
  const netPayable = Math.max(0, grossAmount - commAmount - laborAmount);

  const handleStepQuantity = (delta: number) => {
    setQuantity((prev) => {
      const curr = parseFloat(prev) || 0;
      return String(Math.max(1, curr + delta));
    });
  };

  const handleProductSelect = (prod: any) => {
    setSelectedProductId(prod.id);
    if (prod.unit) {
      setSelectedUnit(prod.unit);
    }
    if (prod.costPrice || prod.price) {
      setRatePerUnit(prod.costPrice || prod.price);
    }
  };

  const handleSaveArrival = async () => {
    if (!activeFarmerName) {
      Alert.alert(
        t('missingSupplier', 'Supplier Name Required'),
        'Please select a supplier or enter farmer name.'
      );
      return;
    }

    if (qtyNum <= 0) {
      Alert.alert(
        t('invalidQuantity', 'Invalid Quantity'),
        'Please enter an arrival quantity greater than 0.'
      );
      return;
    }

    if (rateNum <= 0) {
      Alert.alert(
        t('invalidRate', 'Invalid Rate'),
        'Please enter a valid purchase rate per unit.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const saved = await recordArrival({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        quantity: qtyNum,
        unit: selectedUnit,
        farmerName: activeFarmerName,
        farmerMobile: selectedFarmer?.mobile || undefined,
        farmerId: isNewSupplier ? undefined : selectedFarmerId,
        vehicleNumber: vehicleNumber.trim() || undefined,
        lotNumber: createLotNumber(),
        notes: `Recorded via Inward Arrival. Rate: ₹${rateNum}/${selectedUnit}. Net: ₹${netPayable}`,
      });

      // Optionally generate Patti record so financial ledger is integrated
      try {
        generatePatti({
          arrivalId: saved.id,
          farmerId: isNewSupplier ? 'farmer_direct' : selectedFarmerId || 'farmer_direct',
          farmerName: activeFarmerName,
          farmerMobile: selectedFarmer?.mobile || '9876500000',
          productName: selectedProduct.name,
          quantity: qtyNum,
          unit: selectedUnit,
          rate: rateNum,
          grossAmount,
          commissionRate: commPct,
          commissionAmount: commAmount,
          laborCharges: laborAmount,
          netPayable,
          paymentStatus: 'Pending',
          date: new Date().toLocaleDateString('en-IN'),
        });
      } catch {
        // Patti generation non-blocking for basic arrivals
      }

      setIsSaving(false);

      // Navigate to clean Transaction Confirmation Screen (Section 9)
      navigation.replace('TransactionConfirmation', {
        transactionNumber: saved.lotNumber || saved.id,
        transactionType: 'ARRIVAL',
        partyName: activeFarmerName,
        partyType: 'Farmer / Supplier',
        items: [
          {
            name: selectedProduct.name,
            quantity: qtyNum,
            unit: selectedUnit,
            rate: rateNum,
            amount: grossAmount,
            productId: selectedProduct.id,
          },
        ],
        totalBill: netPayable,
        amountPaid: netPayable,
        remainingBalance: 0,
        receiptId: saved.id,
      });
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Save Failed', err?.message || 'Could not record inward arrival.');
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
            paddingTop: Math.max(insets.top + 14, 38),
            paddingBottom: Math.max(insets.bottom + 24, 36),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={styles.backText}>{t('back', 'Back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('recordInwardArrival', 'Record Inward Arrival')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ============================================================== */}
        {/* SECTION 1: Farmer / Supplier Details                           */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
              <Ionicons name="person" size={16} color="#16834A" />
            </View>
            <Text style={styles.sectionTitle}>1. Farmer / Supplier Details</Text>
          </View>

          {/* Supplier Select Chips */}
          {!isNewSupplier && registeredSuppliers.length > 0 ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Select Registered Supplier:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.supplierScroll}
              >
                {registeredSuppliers.map((sup) => {
                  const isSelected = sup.id === selectedFarmerId;
                  return (
                    <TouchableOpacity
                      key={sup.id}
                      style={[
                        styles.supplierChip,
                        isSelected && styles.supplierChipSelected,
                      ]}
                      onPress={() => setSelectedFarmerId(sup.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={14}
                        color={isSelected ? '#16834A' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.supplierChipText,
                          isSelected && styles.supplierChipTextSelected,
                        ]}
                      >
                        {sup.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Farmer / Supplier Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Basavaraj Farmer"
                placeholderTextColor={colors.inputPlaceholder}
                value={customFarmerName}
                onChangeText={setCustomFarmerName}
              />
            </View>
          )}

          {/* Toggle New vs Existing Supplier */}
          <TouchableOpacity
            style={styles.toggleSupplierBtn}
            onPress={() => setIsNewSupplier(!isNewSupplier)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isNewSupplier ? 'people-outline' : 'person-add-outline'}
              size={14}
              color={colors.primary}
            />
            <Text style={styles.toggleSupplierText}>
              {isNewSupplier ? 'Pick from Registered Suppliers' : '+ Add New Supplier'}
            </Text>
          </TouchableOpacity>

          {/* Vehicle / Truck Number */}
          <View style={[styles.formGroup, { marginTop: 8 }]}>
            <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. KA-04-E-1234"
              placeholderTextColor={colors.inputPlaceholder}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* ============================================================== */}
        {/* SECTION 2: Product Details (Visual Selection & Rate)           */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
              <Ionicons name="cube" size={16} color="#0284C7" />
            </View>
            <Text style={styles.sectionTitle}>2. Product Details</Text>
          </View>

          {/* Horizontal Product Picker with Thumbnails */}
          <Text style={styles.inputLabel}>Select Commodity to Unload:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {products.map((p) => {
              const isSelected = p.id === selectedProductId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productTile,
                    isSelected && styles.productTileSelected,
                  ]}
                  onPress={() => handleProductSelect(p)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: getProductImage(p) }}
                    style={styles.productTileThumb}
                  />
                  <Text
                    style={[
                      styles.productTileName,
                      isSelected && styles.productTileNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quantity & Unit Stepper */}
          <View style={styles.qtyUnitRow}>
            {/* Quantity Stepper */}
            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputLabel}>Quantity Arriving *</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepQuantity(-5)}
                >
                  <Text style={styles.stepBtnText}>-5</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepQuantity(5)}
                >
                  <Text style={styles.stepBtnText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Measuring Unit Selector */}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inputLabel}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitScroll}
              >
                {COMMON_UNITS.map((u) => {
                  const isUnitSelected = selectedUnit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitPill,
                        isUnitSelected && styles.unitPillSelected,
                      ]}
                      onPress={() => setSelectedUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitPillText,
                          isUnitSelected && styles.unitPillTextSelected,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Purchase Rate per Unit & Live Line Amount */}
          <View style={styles.rateCalculationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Purchase Rate (₹ per {selectedUnit})</Text>
              <View style={styles.rateInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.rateInput}
                  keyboardType="numeric"
                  value={ratePerUnit}
                  onChangeText={setRatePerUnit}
                  placeholder="0"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
            </View>

            {/* Live Line Amount Badge */}
            <View style={styles.liveLineAmountBox}>
              <Text style={styles.liveLineAmountLabel}>Gross Produce Value</Text>
              <Text style={styles.liveLineAmountValue}>
                ₹{grossAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* SECTION 3: Final Details & Charges                             */}
        {/* ============================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#3B2904' : '#FEF3C7' }]}>
              <Ionicons name="receipt" size={16} color="#D97706" />
            </View>
            <Text style={styles.sectionTitle}>3. Charges & Final Settlement</Text>
          </View>

          <View style={styles.chargesRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Commission ({commissionPercent}%)</Text>
              <View style={styles.chargeField}>
                <TextInput
                  style={styles.chargeInput}
                  keyboardType="numeric"
                  value={commissionPercent}
                  onChangeText={setCommissionPercent}
                />
                <Text style={styles.chargeSuffix}>% (₹{commAmount})</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Labor / Hamali (₹)</Text>
              <View style={styles.chargeField}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.chargeInput}
                  keyboardType="numeric"
                  value={laborCharge}
                  onChangeText={setLaborCharge}
                />
              </View>
            </View>
          </View>

          {/* Final Net Settlement Summary */}
          <View style={styles.netPayableCard}>
            <View>
              <Text style={styles.netPayableLabel}>Net Amount Payable to Farmer</Text>
              <Text style={styles.netPayableFormula}>
                ₹{grossAmount} (Gross) - ₹{commAmount + laborAmount} (Charges)
              </Text>
            </View>
            <Text style={styles.netPayableAmount}>
              ₹{netPayable.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Prominent Save Arrival Action Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSaveArrival}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isSaving
              ? 'Saving Inward Lot...'
              : `Save Inward Arrival (${qtyNum} ${selectedUnit} ${selectedProduct.name})`}
          </Text>
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
      alignItems: 'center',
      justifyContent: 'space-between',
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
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sectionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    supplierScroll: {
      gap: 8,
      paddingVertical: 2,
    },
    supplierChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    supplierChipSelected: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
      borderColor: '#16834A',
    },
    supplierChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    supplierChipTextSelected: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    toggleSupplierBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      paddingVertical: 2,
    },
    toggleSupplierText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    formGroup: {
      marginBottom: 6,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: isDark ? colors.surface : '#F9FAFB',
    },
    productScroll: {
      gap: 8,
      paddingVertical: 6,
      marginBottom: 10,
    },
    productTile: {
      width: 76,
      padding: 6,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: isDark ? colors.surface : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    productTileSelected: {
      borderColor: '#16834A',
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
    },
    productTileThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      marginBottom: 4,
    },
    productTileName: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    productTileNameSelected: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    qtyUnitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    stepBtn: {
      backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    stepBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    qtyInput: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingVertical: 8,
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
    },
    unitScroll: {
      gap: 6,
      paddingVertical: 4,
    },
    unitPill: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitPillSelected: {
      backgroundColor: isDark ? '#143823' : '#DCFCE7',
      borderColor: '#16834A',
    },
    unitPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    unitPillTextSelected: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    rateCalculationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rateInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: isDark ? colors.surface : '#F9FAFB',
    },
    currencyPrefix: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      marginRight: 4,
    },
    rateInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingVertical: 8,
    },
    liveLineAmountBox: {
      flex: 1.2,
      backgroundColor: isDark ? colors.surface : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
    },
    liveLineAmountLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    liveLineAmountValue: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#16834A',
      marginTop: 2,
    },
    chargesRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    chargeField: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 8,
      backgroundColor: isDark ? colors.surface : '#F9FAFB',
    },
    chargeInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      paddingVertical: 7,
    },
    chargeSuffix: {
      fontSize: 11,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    netPayableCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
      borderWidth: 1.5,
      borderColor: isDark ? '#22C55E' : '#16834A',
      borderRadius: 12,
      padding: 12,
    },
    netPayableLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    netPayableFormula: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    netPayableAmount: {
      fontSize: 18,
      fontWeight: '900',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    saveButton: {
      flexDirection: 'row',
      backgroundColor: '#16834A',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#16834A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: 16,
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
