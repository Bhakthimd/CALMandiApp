import React, { useState, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { PaymentMethod } from '../types';

export default function RecordSaleScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const {
    products,
    customers,
    productGrades,
    recordSale,
    getCustomerPrice,
  } = useMandi();

  const initialProductId = route?.params?.productId;
  const initialCustomerId = route?.params?.customerId;
  const initialGradeId = route?.params?.gradeId;

  const initialProd = products.find((p) => p.id === initialProductId) || products[0];
  const initialCust = customers.find((c) => c.id === initialCustomerId);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProd ? initialProd.id : ''
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCust ? initialCust.id : ''
  );
  const [customBuyerName, setCustomBuyerName] = useState<string>('');
  const [isCustomBuyer, setIsCustomBuyer] = useState<boolean>(!initialCust);

  // Feature 2: Grade Selection
  const availableGrades = useMemo(() => {
    return productGrades.filter(
      (g) => g.productId === selectedProductId && g.isActive
    );
  }, [productGrades, selectedProductId]);

  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    initialGradeId || (availableGrades[0]?.id ?? '')
  );

  const selectedGrade = useMemo(() => {
    return availableGrades.find((g) => g.id === selectedGradeId) || availableGrades[0];
  }, [availableGrades, selectedGradeId]);

  // Pricing state
  const [unitPrice, setUnitPrice] = useState<string>('30');
  const [appliedPriceType, setAppliedPriceType] = useState<
    'Customer-Specific' | 'Default Grade Price' | 'Manual Override'
  >('Default Grade Price');

  const [quantity, setQuantity] = useState<string>('10');
  const [commissionRate, setCommissionRate] = useState<string>('0');
  const [otherCharges, setOtherCharges] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Automatically fetch customer-specific price when Customer, Product, or Grade changes
  useEffect(() => {
    if (!selectedProductId) return;

    const timer = setTimeout(() => {
      const priceInfo = getCustomerPrice(
        isCustomBuyer ? '' : selectedCustomerId,
        selectedProductId,
        selectedGrade?.id
      );

      setUnitPrice(String(priceInfo.price));
      setAppliedPriceType(
        priceInfo.isCustom ? 'Customer-Specific' : 'Default Grade Price'
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [
    selectedCustomerId,
    selectedProductId,
    selectedGrade?.id,
    isCustomBuyer,
    getCustomerPrice,
  ]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentGradeStock = selectedGrade?.stockQuantity ?? 0;

  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = parseFloat(unitPrice) || 0;
  const subtotal = qtyNum * priceNum;
  const commRateNum = parseFloat(commissionRate) || 0;
  const commissionAmount = (subtotal * commRateNum) / 100;
  const otherChargesNum = parseFloat(otherCharges) || 0;
  const netTotal = subtotal + commissionAmount + otherChargesNum;

  const handleStepQuantity = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const handleSave = async () => {
    let resolvedBuyerName = '';
    let resolvedCustomerId: string | undefined = undefined;

    if (isCustomBuyer) {
      const cleanBuyer = customBuyerName.trim();
      if (!cleanBuyer) {
        Alert.alert('Missing Detail', 'Please enter the Buyer / Customer name.');
        return;
      }
      resolvedBuyerName = cleanBuyer;
    } else {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (!cust) {
        Alert.alert('Select Customer', 'Please select a registered customer or choose "Other Buyer".');
        return;
      }
      resolvedBuyerName = `${cust.name} (${cust.business})`;
      resolvedCustomerId = cust.id;
    }

    if (!selectedProduct) {
      Alert.alert('Select Commodity', 'Please select a commodity from the product list.');
      return;
    }

    if (qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a sale quantity greater than 0.');
      return;
    }

    if (priceNum <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate/price per unit.');
      return;
    }

    // Strict validation against grade-wise stock
    if (selectedGrade && qtyNum > currentGradeStock) {
      Alert.alert(
        'Stock Deficit Warning',
        `Current available stock of ${selectedProduct.name} (${selectedGrade.name}) is only ${currentGradeStock} ${selectedProduct.unit}, but you entered ${qtyNum} ${selectedProduct.unit}.\n\nPlease adjust the quantity or select another grade.`,
        [{ text: 'Adjust Quantity', style: 'cancel' }]
      );
      return;
    }

    // Requirement 7: Confirmation dialog on dispatch transaction
    // Requirement 8: Upfront payment given by customer, rest added to customer debt
    Alert.alert(
      'Confirm Dispatch Transaction',
      `Buyer: ${resolvedBuyerName}\n` +
      `Commodity: ${selectedProduct.name} (${selectedGrade?.name || 'Standard Grade'})\n` +
      `Quantity: ${qtyNum} ${selectedProduct.unit} @ ₹${priceNum}\n` +
      `Total Bill: ₹${netTotal.toLocaleString('en-IN')}\n` +
      `Payment Mode: ${paymentMethod}\n` +
      (paymentMethod === 'Credit'
        ? `Entire ₹${netTotal.toLocaleString('en-IN')} will be added to Customer Debt.`
        : `Upfront payment of ₹${netTotal.toLocaleString('en-IN')} received via ${paymentMethod}.`),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Dispatch',
          onPress: async () => {
            await proceedSave(resolvedBuyerName, resolvedCustomerId);
          },
        },
      ]
    );
  };

  const proceedSave = async (buyerName: string, customerId?: string) => {
    if (!selectedProduct) return;
    setIsSaving(true);

    try {
      const saved = await recordSale({
        customerId,
        customerName: buyerName,
        customerMobile: customerId
          ? customers.find((c) => c.id === customerId)?.mobile
          : undefined,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        quantity: qtyNum,
        unit: selectedProduct.unit,
        unitPrice: priceNum,
        totalAmount: subtotal,
        paymentMethod,
        notes: notes.trim() || undefined,
        // Grade & Pricing extensions
        gradeId: selectedGrade?.id,
        gradeName: selectedGrade?.name,
        appliedPriceType,
        commissionRate: commRateNum,
        commissionAmount,
        otherCharges: otherChargesNum,
        netTotal,
      });

      setIsSaving(false);

      Alert.alert(
        'Sale Confirmed ✅',
        `Sale recorded successfully!\n\n• ${qtyNum} ${selectedProduct.unit} ${selectedProduct.name} (${selectedGrade?.name || 'Standard'})\n• Unit Rate: ₹${priceNum} (${appliedPriceType})\n• Net Total: ₹${netTotal.toLocaleString('en-IN')} (${paymentMethod})\n• Buyer: ${buyerName}\n• Grade Stock Deducted: ${qtyNum} ${selectedProduct.unit}\n• Customer Ledger Updated.`,
        [
          {
            text: 'View Receipt / Bill',
            onPress: () =>
              navigation.replace('PattiReceipt', {
                saleId: saved.id,
                type: 'INVOICE',
              }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch {
      setIsSaving(false);
      Alert.alert('Error', 'Could not record sale. Please try again.');
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
            paddingBottom: Math.max(insets.bottom + 25, 30),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
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

        {/* Title & Subtitle */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Record Sale (जावक / Bikri)</Text>
          <Text style={styles.subtitle}>
            Grade-aware dispatch with customer custom rates.
          </Text>
        </View>

        
        {/* 1. Buyer / Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. Select Buyer / Customer (ग्राहक) *</Text>
          <View style={styles.chipRow}>
            {customers.map((c) => {
              const isSelected = !isCustomBuyer && selectedCustomerId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.customerChip,
                    isSelected && styles.customerChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCustomerId(c.id);
                    setIsCustomBuyer(false);
                  }}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'person-outline'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#16834A'}
                  />
                  <Text
                    style={[
                      styles.customerChipText,
                      isSelected && styles.customerChipTextSelected,
                    ]}
                  >
                    {c.name} ({c.business})
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.customerChip,
                isCustomBuyer && styles.customerChipSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => setIsCustomBuyer(true)}
            >
              <Ionicons
                name={isCustomBuyer ? 'checkmark-circle' : 'add'}
                size={14}
                color={isCustomBuyer ? '#FFFFFF' : '#16834A'}
              />
              <Text
                style={[
                  styles.customerChipText,
                  isCustomBuyer && styles.customerChipTextSelected,
                ]}
              >
                + Walk-In / Other
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomBuyer && (
            <TextInput
              style={styles.textInput}
              placeholder="Enter Buyer Name or Stall Number"
              placeholderTextColor={colors.textMuted}
              value={customBuyerName}
              onChangeText={setCustomBuyerName}
            />
          )}
        </View>

        {/* 2. Commodity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>2. Select Commodity (उत्पाद) *</Text>
          <View style={styles.chipRow}>
            {products.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productChip,
                    isSelected && styles.productChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedProductId(p.id);
                    const gradesForP = productGrades.filter(
                      (g) => g.productId === p.id && g.isActive
                    );
                    if (gradesForP.length > 0) {
                      setSelectedGradeId(gradesForP[0].id);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.productChipText,
                      isSelected && styles.productChipTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.productChipSub,
                      isSelected && styles.productChipSubSelected,
                    ]}
                  >
                    {p.quantity || 0} {p.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Product Grade Selection (Feature 2 & 3) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>3. Select Quality Grade (गुणवत्ता ग्रेड) *</Text>
          {availableGrades.length === 0 ? (
            <Text style={styles.noGradesText}>Standard ungraded inventory</Text>
          ) : (
            <View style={styles.gradeGrid}>
              {availableGrades.map((g) => {
                const isSelected = selectedGrade?.id === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.gradeSelectCard,
                      isSelected && styles.gradeSelectCardActive,
                    ]}
                    onPress={() => setSelectedGradeId(g.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.gradeSelectTop}>
                      <Text
                        style={[
                          styles.gradeSelectName,
                          isSelected && styles.gradeSelectNameActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color="#16834A" />
                      )}
                    </View>
                    <Text style={styles.gradeSelectStock}>
                      Available: <Text style={{ fontWeight: '700' }}>{g.stockQuantity} {selectedProduct?.unit}</Text>
                    </Text>
                    <Text style={styles.gradeSelectDefPrice}>
                      Base Rate: ₹{g.defaultPrice}/{selectedProduct?.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Automated Pricing Display & Input */}
        <View style={styles.section}>
          <View style={styles.priceHeaderRow}>
            <Text style={styles.sectionLabel}>4. Price Per Unit (बिक्री दर ₹) *</Text>
            {/* Tag showing whether customer custom or default grade rate */}
            <View
              style={[
                styles.appliedTag,
                appliedPriceType === 'Customer-Specific'
                  ? styles.appliedTagCustom
                  : styles.appliedTagDefault,
              ]}
            >
              <Text
                style={[
                  styles.appliedTagText,
                  appliedPriceType === 'Customer-Specific'
                    ? styles.appliedTagTextCustom
                    : styles.appliedTagTextDefault,
                ]}
              >
                {appliedPriceType === 'Customer-Specific'
                  ? '★ Agreed Customer Rate'
                  : '✓ Default Grade Rate'}
              </Text>
            </View>
          </View>

          <View style={styles.priceInputWrap}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={unitPrice}
              onChangeText={(val) => {
                setUnitPrice(val);
                setAppliedPriceType('Manual Override');
              }}
            />
            <Text style={styles.unitSuffix}>/ {selectedProduct?.unit}</Text>
          </View>
        </View>

        {/* 5. Quantity Input & Stock Check */}
        <View style={styles.section}>
          <View style={styles.stockStatusRow}>
            <Text style={styles.sectionLabel}>5. Quantity (मात्रा) *</Text>
            <Text style={styles.stockNoticeText}>
              In Stock: {currentGradeStock} {selectedProduct?.unit}
            </Text>
          </View>

          <View style={styles.qtyControlRow}>
            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => handleStepQuantity(-10)}
            >
              <Text style={styles.qtyStepBtnText}>-10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => handleStepQuantity(-1)}
            >
              <Text style={styles.qtyStepBtnText}>-1</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => handleStepQuantity(1)}
            >
              <Text style={styles.qtyStepBtnText}>+1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => handleStepQuantity(10)}
            >
              <Text style={styles.qtyStepBtnText}>+10</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>6. Payment Terms (भुगतान का प्रकार) *</Text>
          <View style={styles.paymentMethodRow}>
            {(['Cash', 'Credit', 'UPI / Online'] as PaymentMethod[]).map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodBtn,
                    isSelected && styles.paymentMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.paymentMethodBtnText,
                      isSelected && styles.paymentMethodBtnTextActive,
                    ]}
                  >
                    {method === 'Cash'
                      ? '💵 Cash'
                      : method === 'Credit'
                      ? '📒 Credit (उधारी)'
                      : '📱 UPI'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Charges (Optional Mandi Commission & Hamali) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>7. Commission & Mandi Charges (Optional)</Text>
          <View style={styles.chargesRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.chargeLabel}>Commission (%):</Text>
              <TextInput
                style={styles.chargeInput}
                keyboardType="numeric"
                placeholder="0"
                value={commissionRate}
                onChangeText={setCommissionRate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.chargeLabel}>Hamali / Cess (₹):</Text>
              <TextInput
                style={styles.chargeInput}
                keyboardType="numeric"
                placeholder="0"
                value={otherCharges}
                onChangeText={setOtherCharges}
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes / Vehicle # (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Loading into tempo KA-04-E-1122"
            placeholderTextColor="#888888"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Real-Time Billing Breakdown Box */}
        <View style={styles.billBreakdownBox}>
          <Text style={styles.billTitle}>Sale Bill Summary</Text>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>
              {qtyNum} {selectedProduct?.unit} × ₹{priceNum}:
            </Text>
            <Text style={styles.billVal}>₹ {subtotal.toLocaleString()}</Text>
          </View>

          {commRateNum > 0 && (
            <View style={styles.billLine}>
              <Text style={styles.billLabel}>Commission ({commRateNum}%):</Text>
              <Text style={styles.billVal}>+ ₹ {commissionAmount.toLocaleString()}</Text>
            </View>
          )}

          {otherChargesNum > 0 && (
            <View style={styles.billLine}>
              <Text style={styles.billLabel}>Hamali / Cess:</Text>
              <Text style={styles.billVal}>+ ₹ {otherChargesNum.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.billLine}>
            <Text style={styles.billTotalLabel}>Final Payable Amount:</Text>
            <Text style={styles.billTotalVal}>₹ {netTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Save / Dispatch Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Processing Sale...' : `Confirm Sale • ₹ ${netTotal.toLocaleString()}`}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    fontSize: 16,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16834A',
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 4,
  },
  customerChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  customerChipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  customerChipTextSelected: {
    color: '#FFFFFF',
  },
  productChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  productChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  productChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productChipTextSelected: {
    color: '#FFFFFF',
  },
  productChipSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productChipSubSelected: {
    color: '#E0F2FE',
  },
  noGradesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeSelectCard: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  gradeSelectCardActive: {
    backgroundColor: '#E8F4EC',
    borderColor: '#16834A',
  },
  gradeSelectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gradeSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gradeSelectNameActive: {
    color: '#16834A',
  },
  gradeSelectStock: {
    fontSize: 11,
    color: '#555555',
  },
  gradeSelectDefPrice: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appliedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appliedTagCustom: {
    backgroundColor: '#FEF3C7',
  },
  appliedTagDefault: {
    backgroundColor: '#E8F4EC',
  },
  appliedTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  appliedTagTextCustom: {
    color: '#B45309',
  },
  appliedTagTextDefault: {
    color: '#16834A',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#16834A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  rupeePrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unitSuffix: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockNoticeText: {
    fontSize: 12,
    color: '#16834A',
    fontWeight: '700',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  qtyStepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  qtyStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    height: 44,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  paymentMethodBtnActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  paymentMethodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  paymentMethodBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chargesRow: {
    flexDirection: 'row',
  },
  chargeLabel: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 4,
  },
  chargeInput: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  textInput: {
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  billBreakdownBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 6,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  billTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16834A',
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
