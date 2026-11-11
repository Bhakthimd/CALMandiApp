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

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColors } from '../styles/theme';
import SmartProductImage from '../components/SmartProductImage';

const COMMON_UNITS = ['Kg', 'Crate', 'Box', 'Bag', 'Quintal'];

type PaymentMode = 'CASH' | 'UPI' | 'CREDIT';

export default function RecordSaleScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    products,
    customers,
    recordDispatchInvoice,
    getCustomerPrice,
  } = useMandi();

  const initialProductId = route?.params?.productId;
  const initialCustomerId = route?.params?.customerId;

  const initialProd = products.find((p) => p.id === initialProductId) || products[0];
  const initialCust = customers.find((c) => c.id === initialCustomerId);

  // Customer Selection
  const registeredBuyers = useMemo(() => {
    return customers.filter((c) => {
      const type = c.customerType || 'Buyer';
      return type === 'Buyer' || type === 'Trader' || type === 'Both';
    });
  }, [customers]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCust?.id || (registeredBuyers.length > 0 ? registeredBuyers[0].id : '')
  );
  const [customBuyerName, setCustomBuyerName] = useState<string>('');
  const [isNewBuyer, setIsNewBuyer] = useState<boolean>(registeredBuyers.length === 0);

  // Product Selection
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProd ? initialProd.id : ''
  );
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [quantity, setQuantity] = useState<string>('10');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    selectedProduct?.unit || 'Crate'
  );
  const [ratePerUnit, setRatePerUnit] = useState<string>(() => {
    const custId = initialCust?.id || (registeredBuyers.length > 0 ? registeredBuyers[0].id : '');
    const prodId = initialProd ? initialProd.id : '';
    if (prodId) {
      const priceInfo = getCustomerPrice(custId, prodId);
      if (priceInfo?.price) return String(priceInfo.price);
    }
    if (initialProd?.price) return String(initialProd.price);
    return '50';
  });

  // Payment & Dispatch
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const priceInfo = getCustomerPrice(id, selectedProductId);
    if (priceInfo?.price) {
      setRatePerUnit(String(priceInfo.price));
    } else if (selectedProduct?.price) {
      setRatePerUnit(String(selectedProduct.price));
    }
  };

  const handleToggleNewBuyer = (newBuyerVal: boolean) => {
    setIsNewBuyer(newBuyerVal);
    const priceInfo = getCustomerPrice(newBuyerVal ? '' : selectedCustomerId, selectedProductId);
    if (priceInfo?.price) {
      setRatePerUnit(String(priceInfo.price));
    } else if (selectedProduct?.price) {
      setRatePerUnit(String(selectedProduct.price));
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activeBuyerName = isNewBuyer
    ? customBuyerName.trim()
    : selectedCustomer?.name || 'Customer / Buyer';

  // Available stock of selected product
  const availableStock = parseFloat(selectedProduct?.quantity || '0') || 0;

  // Real-time calculations
  const qtyNum = parseFloat(quantity) || 0;
  const rateNum = parseFloat(ratePerUnit) || 0;
  const lineAmount = Math.round(qtyNum * rateNum);
  const grandTotal = lineAmount;

  const paidNum = parseFloat(amountPaid) || 0;
  const outstandingDebt = Math.max(0, grandTotal - paidNum);

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
    const priceInfo = getCustomerPrice(
      isNewBuyer ? '' : selectedCustomerId,
      prod.id
    );
    if (priceInfo?.price) {
      setRatePerUnit(String(priceInfo.price));
    } else if (prod.price) {
      setRatePerUnit(String(prod.price));
    }
  };

  const handleSetQuickPayment = (type: 'FULL' | 'ZERO') => {
    if (type === 'FULL') {
      setAmountPaid(String(grandTotal));
    } else {
      setAmountPaid('0');
    }
  };

  const handleConfirmSale = async () => {
    if (!activeBuyerName) {
      Alert.alert(
        t('missingBuyer', 'Customer Name Required'),
        'Please select a customer or enter buyer name.'
      );
      return;
    }

    if (qtyNum <= 0) {
      Alert.alert(
        t('invalidQuantity', 'Invalid Quantity'),
        'Please enter a dispatch quantity greater than 0.'
      );
      return;
    }

    if (qtyNum > availableStock) {
      Alert.alert(
        t('insufficientStock', 'Insufficient Stock'),
        `Only ${availableStock} ${selectedUnit} available in stock. Cannot dispatch ${qtyNum} ${selectedUnit}.`
      );
      return;
    }

    if (rateNum <= 0) {
      Alert.alert(
        t('invalidRate', 'Invalid Rate'),
        'Please enter a valid rate per unit.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const cashPaid = paymentMode === 'CASH' ? paidNum : 0;
      const upiPaid = paymentMode === 'UPI' ? paidNum : 0;

      const invoice = await recordDispatchInvoice({
        customerId: isNewSupplierId(isNewBuyer, selectedCustomerId),
        customerName: activeBuyerName,
        customerMobile: selectedCustomer?.mobile || undefined,
        items: [
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            category: selectedProduct.category,
            quantity: qtyNum,
            unit: selectedUnit,
            unitPrice: rateNum,
            totalAmount: lineAmount,
          },
        ],
        cashPaid,
        upiPaid,
        notes: vehicleNo.trim() ? `Vehicle: ${vehicleNo.trim()}` : 'Floor Direct',
      });

      setIsSaving(false);

      navigation.replace('TransactionConfirmation', {
        transactionNumber: invoice.invoiceNumber,
        transactionType: 'SALE',
        partyName: activeBuyerName,
        partyType: 'Buyer',
        items: [
          {
            name: selectedProduct.name,
            quantity: qtyNum,
            unit: selectedUnit,
            rate: rateNum,
            amount: lineAmount,
            productId: selectedProduct.id,
          },
        ],
        totalBill: grandTotal,
        amountPaid: paidNum,
        remainingBalance: outstandingDebt,
        receiptId: invoice.id,
      });
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Sale Blocked', err?.message || 'Could not record sale dispatch.');
    }
  };

  const isNewSupplierId = (isNew: boolean, id: string) => {
    return isNew ? undefined : id || undefined;
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
            paddingTop: Math.max(insets.top + 12, 34),
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
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>{t('back', 'Back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('recordSale', 'Dispatch Products')}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ================= GROUP 1: CUSTOMER SELECTION ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
              <Ionicons name="person" size={15} color={isDark ? '#4ADE80' : '#16834A'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              1. Customer / Buyer
            </Text>
          </View>

          {!isNewBuyer && registeredBuyers.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                Select Registered Customer:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.buyerScroll}
              >
                {registeredBuyers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  return (
                    <TouchableOpacity
                      key={cust.id}
                      style={[
                        styles.buyerChip,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? '#143823' : '#F0FDF4')
                            : (isDark ? '#1E293B' : '#F8FAFC'),
                          borderColor: isSelected
                            ? (isDark ? '#4ADE80' : '#16834A')
                            : (isDark ? '#334155' : '#E2E8F0'),
                        },
                      ]}
                      onPress={() => handleSelectCustomer(cust.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color={isSelected ? (isDark ? '#4ADE80' : '#16834A') : (isDark ? '#94A3B8' : '#64748B')}
                      />
                      <Text
                        style={[
                          styles.buyerChipText,
                          {
                            color: isSelected
                              ? (isDark ? '#4ADE80' : '#16834A')
                              : (isDark ? '#CBD5E1' : '#475569'),
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cust.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                Customer / Buyer Full Name *
              </Text>
              <TextInput
                style={[
                  styles.largeTextInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                placeholder="e.g. Ramesh Traders"
                placeholderTextColor={colors.inputPlaceholder}
                value={customBuyerName}
                onChangeText={setCustomBuyerName}
              />
            </View>
          )}

          {/* Toggle New Customer Option */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={styles.toggleCustomerBtn}
              onPress={() => handleToggleNewBuyer(!isNewBuyer)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isNewBuyer ? 'people-outline' : 'person-add-outline'}
                size={14}
                color={isDark ? '#4ADE80' : '#16834A'}
              />
              <Text style={[styles.toggleCustomerText, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                {isNewBuyer ? 'Select Registered Customer' : '+ Add Walk-in Buyer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('AddCustomer')}
              activeOpacity={0.7}
            >
              <Text style={[styles.fullRegisterLink, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Register New Customer ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= GROUP 2: PRODUCT SELECTION & QUANTITY ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
              <Ionicons name="cube" size={15} color={isDark ? '#4ADE80' : '#16834A'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              2. Product & Rates
            </Text>
          </View>

          {/* Product Selection Tiles */}
          <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
            Select Product:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {products.map((p) => {
              const isSelected = p.id === selectedProductId;
              const stock = parseFloat(p.quantity || '0') || 0;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productTile,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#143823' : '#F0FDF4')
                        : (isDark ? '#1E293B' : '#F8FAFC'),
                      borderColor: isSelected
                        ? (isDark ? '#4ADE80' : '#16834A')
                        : (isDark ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  onPress={() => handleProductSelect(p)}
                  activeOpacity={0.7}
                >
                  <SmartProductImage name={p.name} category={p.category} image={p.image} emojiSize={22}

                    style={styles.productTileThumb}
                  />
                  <Text
                    style={[
                      styles.productTileName,
                      {
                        color: isSelected
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#CBD5E1' : '#334155'),
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text style={[styles.productTileStock, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {stock} {p.unit || 'Crate'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quantity & Stepper */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Dispatch Quantity *
            </Text>
            <View
              style={[
                styles.largeStepperContainer,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}
                onPress={() => handleStepQuantity(-1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>-1</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.largeQtyInput, { color: colors.textPrimary }]}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}
                onPress={() => handleStepQuantity(1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Unit (Kg / Crate / etc.)
            </Text>
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
                      {
                        backgroundColor: isUnitSelected
                          ? (isDark ? '#143823' : '#DCFCE7')
                          : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: isUnitSelected
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#334155' : '#E2E8F0'),
                      },
                    ]}
                    onPress={() => setSelectedUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        {
                          color: isUnitSelected
                            ? (isDark ? '#4ADE80' : '#16834A')
                            : (isDark ? '#CBD5E1' : '#475569'),
                          fontWeight: isUnitSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Sale Rate (₹ per unit) & Automatic Total Calculation */}
          <View style={styles.rateCalculationRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                Sale Rate (₹ per {selectedUnit})
              </Text>
              <View
                style={[
                  styles.rateInputWrap,
                  {
                    backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Text style={[styles.currencyPrefix, { color: isDark ? '#4ADE80' : '#16834A' }]}>₹</Text>
                <TextInput
                  style={[styles.largeRateInput, { color: colors.textPrimary }]}
                  keyboardType="numeric"
                  value={ratePerUnit}
                  onChangeText={setRatePerUnit}
                  placeholder="0"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
            </View>

            {/* Calculated Line Amount */}
            <View
              style={[
                styles.lineAmountBox,
                {
                  backgroundColor: isDark ? '#143823' : '#F0FDF4',
                  borderColor: isDark ? '#166534' : '#BBF7D0',
                },
              ]}
            >
              <Text style={[styles.lineAmountLabel, { color: isDark ? '#4ADE80' : '#166534' }]}>
                Subtotal
              </Text>
              <Text style={[styles.lineAmountValue, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                ₹{lineAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Stock Availability Indicator */}
          <Text
            style={[
              styles.stockAlert,
              { color: qtyNum > availableStock ? '#DC2626' : (isDark ? '#4ADE80' : '#16834A') },
            ]}
          >
            {qtyNum > availableStock
              ? `⚠️ Exceeds physical stock! Only ${availableStock} ${selectedUnit} available.`
              : `✓ ${availableStock} ${selectedUnit} available in inventory.`}
          </Text>
        </View>

        {/* ================= GROUP 3: PAYMENT & BILL SUMMARY ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}>
              <Ionicons name="cash" size={15} color={isDark ? '#4ADE80' : '#16834A'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              3. Payment & Settlement
            </Text>
          </View>

          {/* Payment Method Selector */}
          <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
            Payment Method
          </Text>
          <View style={styles.paymentModeRow}>
            {(['CASH', 'UPI', 'CREDIT'] as PaymentMode[]).map((mode) => {
              const isSelected = paymentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.paymentModePill,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#143823' : '#DCFCE7')
                        : (isDark ? '#1E293B' : '#F8FAFC'),
                      borderColor: isSelected
                        ? (isDark ? '#4ADE80' : '#16834A')
                        : (isDark ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  onPress={() => {
                    setPaymentMode(mode);
                    if (mode === 'CREDIT') {
                      setAmountPaid('0');
                    } else if (paidNum === 0) {
                      setAmountPaid(String(grandTotal));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.paymentModeText,
                      {
                        color: isSelected
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#CBD5E1' : '#475569'),
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {mode === 'CASH' ? 'Cash' : mode === 'UPI' ? 'UPI' : 'Full Credit'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount Paid Field */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                Amount Paid Upfront (₹)
              </Text>
              <View style={styles.quickPayRow}>
                <TouchableOpacity
                  style={[styles.quickPayChip, { backgroundColor: isDark ? '#143823' : '#DCFCE7' }]}
                  onPress={() => handleSetQuickPayment('FULL')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPayText, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                    Full Paid
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickPayChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                  onPress={() => handleSetQuickPayment('ZERO')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPayText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    ₹0 Credit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.rateInputWrap,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: isDark ? '#4ADE80' : '#16834A' }]}>₹</Text>
              <TextInput
                style={[styles.largeRateInput, { color: colors.textPrimary }]}
                keyboardType="numeric"
                value={amountPaid}
                onChangeText={setAmountPaid}
                placeholder="0"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          </View>

          {/* PROMINENT BILL SUMMARY CARD */}
          <View
            style={[
              styles.billSummaryCard,
              {
                backgroundColor: isDark ? '#0A0F1D' : '#F8FAF8',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            {/* Total Bill Amount (Prominent) */}
            <View style={styles.billSummaryRow}>
              <Text style={[styles.billSummaryLabel, { color: colors.textPrimary }]}>
                Total Bill Amount:
              </Text>
              <Text style={[styles.billSummaryTotal, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                ₹ {grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Paid Upfront */}
            <View style={styles.billSummaryRow}>
              <Text style={[styles.billSummarySubLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Paid Upfront:
              </Text>
              <Text style={[styles.billSummarySubVal, { color: colors.textPrimary }]}>
                ₹ {paidNum.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Remaining Balance (Easy to identify) */}
            <View
              style={[
                styles.remainingBalanceBox,
                {
                  backgroundColor: outstandingDebt > 0
                    ? (isDark ? '#2D1616' : '#FEF2F2')
                    : (isDark ? '#142E1F' : '#F0FDF4'),
                  borderColor: outstandingDebt > 0
                    ? (isDark ? '#991B1B' : '#FECACA')
                    : (isDark ? '#166534' : '#BBF7D0'),
                },
              ]}
            >
              <Text
                style={[
                  styles.remainingBalanceLabel,
                  { color: outstandingDebt > 0 ? '#DC2626' : (isDark ? '#4ADE80' : '#16834A') },
                ]}
              >
                {outstandingDebt > 0 ? 'Remaining Balance (Due):' : 'Bill Status:'}
              </Text>
              <Text
                style={[
                  styles.remainingBalanceVal,
                  { color: outstandingDebt > 0 ? '#DC2626' : (isDark ? '#4ADE80' : '#16834A') },
                ]}
              >
                {outstandingDebt > 0
                  ? `₹ ${outstandingDebt.toLocaleString('en-IN')}`
                  : '✓ Fully Paid'}
              </Text>
            </View>
          </View>

          {/* Vehicle / Tempo Number (Optional) */}
          <View style={[styles.formGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              Vehicle / Tempo Number (Optional)
            </Text>
            <TextInput
              style={[
                styles.largeTextInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              placeholder="e.g. KA-04-E-5678"
              placeholderTextColor={colors.inputPlaceholder}
              value={vehicleNo}
              onChangeText={setVehicleNo}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* ================= CONFIRM & DISPATCH BUTTON ================= */}
        <TouchableOpacity
          style={[
            styles.dispatchButton,
            (isSaving || qtyNum > availableStock) && styles.dispatchButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleConfirmSale}
          disabled={isSaving || qtyNum > availableStock}
        >
          <Ionicons name="arrow-up-circle" size={22} color="#FFFFFF" />
          <Text style={styles.dispatchButtonText}>
            {isSaving
              ? 'Dispatching...'
              : `Confirm & Dispatch (₹${grandTotal.toLocaleString('en-IN')})`}
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
      backgroundColor: isDark ? '#0A0F1D' : '#F8FAF8',
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
      fontSize: 15,
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
    },

    /* Section Cards */
    sectionCard: {
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
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
      fontSize: 15,
      fontWeight: '700',
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    formGroup: {
      marginBottom: 10,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },

    /* Customer Selection */
    buyerScroll: {
      gap: 8,
      paddingVertical: 4,
    },
    buyerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    buyerChipText: {
      fontSize: 13,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    toggleCustomerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    toggleCustomerText: {
      fontSize: 13,
      fontWeight: '700',
    },
    fullRegisterLink: {
      fontSize: 12,
      fontWeight: '600',
    },

    /* Large Inputs */
    largeTextInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      minHeight: 48,
      fontSize: 15,
    },

    /* Product Selection Tiles */
    productScroll: {
      gap: 8,
      paddingVertical: 4,
      marginBottom: 10,
    },
    productTile: {
      width: 82,
      padding: 8,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
    },
    productTileThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      marginBottom: 4,
    },
    productTileName: {
      fontSize: 12,
      textAlign: 'center',
    },
    productTileStock: {
      fontSize: 10,
      marginTop: 2,
    },

    /* Quantity Stepper */
    largeStepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      overflow: 'hidden',
      minHeight: 48,
    },
    stepBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepBtnText: {
      fontSize: 14,
      fontWeight: '700',
    },
    largeQtyInput: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      paddingVertical: 10,
    },

    /* Unit Selector */
    unitScroll: {
      gap: 8,
      paddingVertical: 2,
    },
    unitPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    unitPillText: {
      fontSize: 13,
    },

    /* Rate & Subtotal */
    rateCalculationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    rateInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    currencyPrefix: {
      fontSize: 16,
      fontWeight: '700',
      marginRight: 4,
    },
    largeRateInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      paddingVertical: 8,
    },
    lineAmountBox: {
      flex: 1.1,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    lineAmountLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    lineAmountValue: {
      fontSize: 17,
      fontWeight: '800',
      marginTop: 2,
    },
    stockAlert: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },

    /* Payment Methods */
    paymentModeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    paymentModePill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
    },
    paymentModeText: {
      fontSize: 13,
    },
    quickPayRow: {
      flexDirection: 'row',
      gap: 6,
    },
    quickPayChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    quickPayText: {
      fontSize: 11,
      fontWeight: '700',
    },

    /* Prominent Bill Summary Card */
    billSummaryCard: {
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      marginTop: 6,
    },
    billSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billSummaryLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    billSummaryTotal: {
      fontSize: 20,
      fontWeight: '800',
    },
    billSummarySubLabel: {
      fontSize: 13,
    },
    billSummarySubVal: {
      fontSize: 14,
      fontWeight: '600',
    },
    remainingBalanceBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
    },
    remainingBalanceLabel: {
      fontSize: 13,
      fontWeight: '700',
    },
    remainingBalanceVal: {
      fontSize: 16,
      fontWeight: '800',
    },

    /* Primary Dispatch Button */
    dispatchButton: {
      flexDirection: 'row',
      backgroundColor: '#16834A',
      borderRadius: 12,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
    },
    dispatchButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    dispatchButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
