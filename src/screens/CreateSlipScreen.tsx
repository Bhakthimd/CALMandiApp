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
  Modal,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { StockMovementType, MandiSlip, PaymentMode } from '../types';

export default function CreateSlipScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { products, customers, recordSlip } = useMandi();

  const initialType: StockMovementType = route?.params?.type || 'OUT';
  const initialProductId: string = route?.params?.productId || (products[0]?.id || '');

  const [type, setType] = useState<StockMovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [customRate, setCustomRate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  // Confirmation dialog modal on dispatch transaction
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Slip preview modal
  const [createdSlip, setCreatedSlip] = useState<MandiSlip | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const activeRate = customRate ? parseFloat(customRate) || 0 : parseFloat(selectedProduct?.price || '0') || 0;
  const qtyNumber = parseFloat(quantity) || 0;
  const totalAmount = qtyNumber * activeRate;

  // Upfront payment calculation
  const paidNumber = paidAmount !== '' ? Math.min(totalAmount, Math.max(0, parseFloat(paidAmount) || 0)) : totalAmount;
  const balanceDue = Math.max(0, totalAmount - paidNumber);

  // Find if customer already exists for customer-level debt management
  const cleanPartyMobile = partyMobile.replace(/\D/g, '');
  const cleanPartyName = partyName.trim().toLowerCase();
  const matchedCustomer = customers.find(
    (c) =>
      (cleanPartyMobile.length === 10 && c.mobile === cleanPartyMobile) ||
      (cleanPartyName.length > 0 && c.name.trim().toLowerCase() === cleanPartyName)
  );
  const existingCustomerDebt = matchedCustomer?.pendingAmount || 0;
  const newCustomerTotalDebt = existingCustomerDebt + balanceDue;

  const handleSelectCustomer = (custName: string, custMobile: string) => {
    setPartyName(custName);
    setPartyMobile(custMobile);
  };

  const handleQuickAddQty = (step: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + step).toString());
  };

  const handleSetPaidPreset = (fraction: number) => {
    if (fraction === 1) {
      setPaidAmount(totalAmount.toString());
    } else if (fraction === 0.5) {
      setPaidAmount(Math.round(totalAmount * 0.5).toString());
    } else if (fraction === 0) {
      setPaidAmount('0');
    }
  };

  const handleValidateAndProceed = () => {
    const cleanParty = partyName.trim();
    if (!cleanParty) {
      Alert.alert('Missing Party Name', 'Please enter farmer or buyer name.');
      return;
    }

    if (qtyNumber <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    if (!selectedProduct) {
      Alert.alert('Missing Commodity', 'Please select a commodity.');
      return;
    }

    Keyboard.dismiss();

    if (type === 'OUT') {
      // Show Confirmation Dialog on Dispatch Transaction
      setConfirmModalVisible(true);
    } else {
      // Inward farmer stock can be saved directly
      executeSaveSlip();
    }
  };

  const executeSaveSlip = () => {
    setConfirmModalVisible(false);

    const cleanParty = partyName.trim();
    const newSlip = recordSlip({
      type,
      partyName: cleanParty,
      partyMobile: cleanPartyMobile || '9876543210',
      customerId: matchedCustomer?.id,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      quantity: qtyNumber,
      unit: selectedProduct.unit,
      ratePerUnit: activeRate,
      totalAmount,
      paidAmount: paidNumber,
      balanceAmount: balanceDue,
      paymentMode,
      commissionAmount: Math.round(totalAmount * 0.05),
      notes: notes.trim(),
    });

    setCreatedSlip(newSlip);
    setPreviewVisible(true);
  };

  const generateWhatsAppMessage = (slip: MandiSlip) => {
    const isOut = slip.type === 'OUT';
    return `*CALMandi Delivery Slip*
-----------------------------
*Slip No:* #${slip.slipNumber}
*Date:* ${slip.date}
*Type:* ${isOut ? '📤 Sale / Dispatch' : '📥 Farmer Arrival (Aawak)'}
*Party:* ${slip.partyName} (${slip.partyMobile})
-----------------------------
*Commodity:* ${slip.productName} (${slip.category})
*Quantity:* ${slip.quantity} ${slip.unit}
*Rate:* ₹${slip.ratePerUnit} / ${slip.unit}
*Total Amount:* ₹${slip.totalAmount.toLocaleString('en-IN')}
*Upfront Paid:* ₹${slip.paidAmount.toLocaleString('en-IN')} (${slip.paymentMode || 'Cash'})
*Added to Debt:* ₹${slip.balanceAmount.toLocaleString('en-IN')}
${isOut ? `*Total Customer Debt Balance:* ₹${newCustomerTotalDebt.toLocaleString('en-IN')}\n` : ''}${slip.notes ? `*Notes:* ${slip.notes}\n` : ''}-----------------------------
_Thank you for your business!_
*CALMandi APMC Market Yard*`;
  };

  const handleShareWhatsApp = async () => {
    if (!createdSlip) return;
    const msg = generateWhatsAppMessage(createdSlip);
    const cleanPhone = createdSlip.partyMobile.replace(/\D/g, '');
    const url = `whatsapp://send?phone=+91${cleanPhone}&text=${encodeURIComponent(msg)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: msg });
      }
    } catch {
      await Share.share({ message: msg });
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top + 16, 40),
              paddingBottom: Math.max(insets.bottom + 25, 35),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.logo}>CALMandi</Text>
          </View>

          <Text style={styles.title}>Fast Stock Entry & Bill</Text>
          <Text style={styles.subtitle}>
            Record arrival or dispatch, collect upfront cash/UPI, and manage customer debt.
          </Text>

          {/* 1. Big Toggle: Stock IN vs Stock OUT */}
          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                styles.inBtn,
                type === 'IN' && styles.inBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setType('IN')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={22}
                color={type === 'IN' ? '#FFFFFF' : '#16834A'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'IN' && styles.typeBtnTextActive,
                ]}
              >
                📥 Stock IN (Farmer)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                styles.outBtn,
                type === 'OUT' && styles.outBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setType('OUT')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={type === 'OUT' ? '#FFFFFF' : '#0284C7'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'OUT' && styles.typeBtnTextActive,
                ]}
              >
                📤 Stock OUT (Dispatch)
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Select / Enter Party Name */}
          <Text style={styles.sectionLabel}>
            {type === 'IN' ? 'Farmer / Supplier Name' : 'Buyer / Customer Name'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'IN' ? 'e.g. Basavaraj (Farmer)' : 'e.g. Ravi Traders'}
            value={partyName}
            onChangeText={setPartyName}
          />

          {/* Quick Customer Chips for Dispatch */}
          {type === 'OUT' && customers.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipHeader}>Frequent Wholesale Buyers:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.customerChip,
                      partyName === c.name && styles.customerChipActive,
                    ]}
                    onPress={() => handleSelectCustomer(c.name, c.mobile)}
                  >
                    <Text
                      style={[
                        styles.customerChipText,
                        partyName === c.name && styles.customerChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {c.pendingAmount && c.pendingAmount > 0 ? (
                      <View style={styles.chipDebtBadge}>
                        <Text style={styles.chipDebtText}>
                          ₹{(c.pendingAmount / 1000).toFixed(0)}k
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionLabel}>Mobile Number (For WhatsApp Receipt & Khata)</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
            value={partyMobile}
            onChangeText={(v) => setPartyMobile(v.replace(/\D/g, ''))}
          />

          {/* Customer Debt Banner - Explicit Per-Customer Debt Info */}
          {type === 'OUT' && (
            <View style={styles.customerDebtCard}>
              <View style={styles.customerDebtHeader}>
                <Ionicons name="person-circle" size={24} color="#0284C7" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.customerDebtTitle}>
                    {matchedCustomer ? matchedCustomer.name : (partyName || 'Customer')} Ledger
                  </Text>
                  <Text style={styles.customerDebtSubtitle}>
                    {matchedCustomer
                      ? `Existing Account Balance: ₹ ${existingCustomerDebt.toLocaleString('en-IN')} Pending`
                      : 'New Customer: Debt will be managed on customer account'}
                  </Text>
                </View>
              </View>
              <Text style={styles.customerDebtNote}>
                📌 Debt is maintained per customer across all products (not separated per item).
              </Text>
            </View>
          )}

          {/* 3. Commodity Selection */}
          <Text style={styles.sectionLabel}>Select Commodity</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productChipsRow}
          >
            {products.map((p) => {
              const isSelected = p.id === selectedProductId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productChip,
                    isSelected && styles.productChipActive,
                  ]}
                  onPress={() => setSelectedProductId(p.id)}
                >
                  <Text
                    style={[
                      styles.productChipTitle,
                      isSelected && styles.productChipTitleActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.productChipUnit,
                      isSelected && styles.productChipUnitActive,
                    ]}
                  >
                    ₹{p.price || '0'}/{p.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. Quantity Stepper & Quick Add */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>
              Quantity ({selectedProduct?.unit || 'Units'})
            </Text>
            <View style={styles.quickAddRow}>
              {[5, 10, 20, 50].map((step) => (
                <TouchableOpacity
                  key={step}
                  style={styles.stepChip}
                  onPress={() => handleQuickAddQty(step)}
                >
                  <Text style={styles.stepChipText}>+{step}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.largeNumberInput]}
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(v) => setQuantity(v.replace(/\D/g, ''))}
          />

          {/* 5. Rate Per Unit & Total Calculation Card */}
          <View style={styles.billSummaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate per {selectedProduct?.unit}:</Text>
              <TextInput
                style={styles.rateInput}
                placeholder={selectedProduct?.price || '0'}
                keyboardType="numeric"
                value={customRate}
                onChangeText={setCustomRate}
              />
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Bill Amount:</Text>
              <Text style={styles.totalValue}>
                ₹ {totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Upfront Cash / UPI Payment & Customer Debt Breakdown */}
            {type === 'OUT' && (
              <>
                <View style={styles.summaryDivider} />

                {/* Payment Mode Selector */}
                <Text style={styles.paymentModeLabel}>Upfront Payment Method:</Text>
                <View style={styles.paymentModeRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentModeBtn,
                      paymentMode === 'Cash' && styles.paymentModeBtnActiveCash,
                    ]}
                    onPress={() => setPaymentMode('Cash')}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={paymentMode === 'Cash' ? '#FFFFFF' : '#16834A'}
                    />
                    <Text
                      style={[
                        styles.paymentModeBtnText,
                        paymentMode === 'Cash' && styles.paymentModeBtnTextActive,
                      ]}
                    >
                      💵 Cash
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentModeBtn,
                      paymentMode === 'UPI' && styles.paymentModeBtnActiveUpi,
                    ]}
                    onPress={() => setPaymentMode('UPI')}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={18}
                      color={paymentMode === 'UPI' ? '#FFFFFF' : '#0284C7'}
                    />
                    <Text
                      style={[
                        styles.paymentModeBtnText,
                        paymentMode === 'UPI' && styles.paymentModeBtnTextActive,
                      ]}
                    >
                      📱 UPI
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsRow}>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleSetPaidPreset(1)}
                  >
                    <Text style={styles.presetChipText}>Full Upfront (₹{totalAmount})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleSetPaidPreset(0.5)}
                  >
                    <Text style={styles.presetChipText}>50% Upfront</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetChip, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleSetPaidPreset(0)}
                  >
                    <Text style={[styles.presetChipText, { color: '#DC2626' }]}>
                      ₹0 (Full Debt)
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Upfront Paid ({paymentMode}):
                  </Text>
                  <TextInput
                    style={[styles.rateInput, { borderColor: '#16834A', fontWeight: 'bold' }]}
                    placeholder={`₹ ${totalAmount}`}
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                  />
                </View>

                <View style={styles.debtBreakdownCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#DC2626', fontWeight: '600' }]}>
                      Added to Customer Debt:
                    </Text>
                    <Text style={[styles.totalValue, { color: '#DC2626' }]}>
                      + ₹ {balanceDue.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.debtSubLabel}>Previous Customer Debt:</Text>
                    <Text style={styles.debtSubValue}>
                      ₹ {existingCustomerDebt.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.debtSubLabel, { fontWeight: 'bold', color: '#1F2937' }]}>
                      New Total Customer Debt:
                    </Text>
                    <Text style={[styles.debtSubValue, { fontWeight: 'bold', color: '#DC2626' }]}>
                      ₹ {newCustomerTotalDebt.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Inward Farmer Payment */}
            {type === 'IN' && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cash/UPI Paid to Farmer:</Text>
                  <TextInput
                    style={styles.rateInput}
                    placeholder={`₹ ${totalAmount}`}
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                  />
                </View>

                {balanceDue > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#D97706' }]}>
                      Pending Farmer Payment:
                    </Text>
                    <Text style={[styles.totalValue, { color: '#D97706' }]}>
                      ₹ {balanceDue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* 6. Vehicle / Note */}
          <Text style={styles.sectionLabel}>Vehicle / Remarks (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tractor KA-04-1234 or Tempo"
            value={notes}
            onChangeText={setNotes}
          />

          {/* 7. Action Button */}
          <TouchableOpacity
            style={[
              styles.saveSlipBtn,
              type === 'OUT' ? styles.saveDispatchBtn : styles.saveArrivalBtn,
            ]}
            activeOpacity={0.8}
            onPress={handleValidateAndProceed}
          >
            <Ionicons
              name={type === 'OUT' ? 'arrow-up-circle-outline' : 'receipt-outline'}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.saveSlipBtnText}>
              {type === 'OUT' ? 'Verify & Dispatch Transaction' : 'Save & Generate Inward Slip'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CONFIRMATION DIALOG MODAL ON DISPATCH TRANSACTION */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialogCard}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="alert-circle" size={42} color="#0284C7" />
            </View>

            <Text style={styles.confirmTitle}>Confirm Dispatch Transaction</Text>
            <Text style={styles.confirmSubtitle}>
              Please verify the transaction details and customer debt addition before dispatching.
            </Text>

            <View style={styles.confirmDetailsBox}>
              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>Buyer / Customer:</Text>
                <Text style={styles.confirmValueBold}>{partyName}</Text>
              </View>

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>Commodity:</Text>
                <Text style={styles.confirmValue}>
                  {selectedProduct?.name} ({selectedProduct?.category})
                </Text>
              </View>

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>Quantity & Rate:</Text>
                <Text style={styles.confirmValue}>
                  {qtyNumber} {selectedProduct?.unit} @ ₹{activeRate}/{selectedProduct?.unit}
                </Text>
              </View>

              <View style={styles.confirmDivider} />

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>Total Sale Value:</Text>
                <Text style={styles.confirmValueBold}>
                  ₹ {totalAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>Upfront Payment ({paymentMode}):</Text>
                <Text style={[styles.confirmValueBold, { color: '#16834A' }]}>
                  ₹ {paidNumber.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmDetailRow}>
                <Text style={[styles.confirmLabel, { color: '#DC2626' }]}>
                  Added to Customer Debt:
                </Text>
                <Text style={[styles.confirmValueBold, { color: '#DC2626' }]}>
                  + ₹ {balanceDue.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmDetailRow}>
                <Text style={styles.confirmLabel}>New Customer Balance:</Text>
                <Text style={[styles.confirmValueBold, { color: '#B45309' }]}>
                  ₹ {newCustomerTotalDebt.toLocaleString('en-IN')} Pending
                </Text>
              </View>
            </View>

            <View style={styles.confirmWarningBox}>
              <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
              <Text style={styles.confirmWarningText}>
                Inventory will be reduced by {qtyNumber} {selectedProduct?.unit}. Debt will be debited to {partyName}'s khata account.
              </Text>
            </View>

            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                activeOpacity={0.7}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmProceedBtn}
                activeOpacity={0.8}
                onPress={executeSaveSlip}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmProceedBtnText}>Confirm & Dispatch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Slip Receipt Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.slipCard}>
            {/* Header */}
            <View style={styles.slipHeader}>
              <View style={styles.slipLogoRow}>
                <Ionicons name="leaf" size={20} color="#16834A" />
                <Text style={styles.slipMandiName}>CALMandi APMC Yard</Text>
              </View>
              <Text style={styles.slipBadge}>
                {createdSlip?.type === 'OUT' ? '📤 SALE / DISPATCH' : '📥 FARMER INWARD'}
              </Text>
              <Text style={styles.slipNumberText}>
                #{createdSlip?.slipNumber} • {createdSlip?.date}
              </Text>
            </View>

            <View style={styles.slipDottedLine} />

            {/* Slip Details */}
            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>Party Name:</Text>
              <Text style={styles.slipDetailValue}>{createdSlip?.partyName}</Text>
            </View>

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>Mobile:</Text>
              <Text style={styles.slipDetailValue}>{createdSlip?.partyMobile}</Text>
            </View>

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>Commodity:</Text>
              <Text style={styles.slipDetailValue}>
                {createdSlip?.productName} ({createdSlip?.category})
              </Text>
            </View>

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>Quantity:</Text>
              <Text style={styles.slipDetailValueBold}>
                {createdSlip?.quantity} {createdSlip?.unit}
              </Text>
            </View>

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>Rate:</Text>
              <Text style={styles.slipDetailValue}>
                ₹{createdSlip?.ratePerUnit} / {createdSlip?.unit}
              </Text>
            </View>

            <View style={styles.slipDottedLine} />

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipTotalLabel}>Total Amount:</Text>
              <Text style={styles.slipTotalValue}>
                ₹{createdSlip?.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.slipDetailRow}>
              <Text style={styles.slipDetailLabel}>
                Upfront Paid ({createdSlip?.paymentMode || 'Cash'}):
              </Text>
              <Text style={[styles.slipDetailValue, { color: '#16834A', fontWeight: 'bold' }]}>
                ₹{createdSlip?.paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            {createdSlip && createdSlip.balanceAmount > 0 && (
              <View style={styles.slipDetailRow}>
                <Text style={[styles.slipDetailLabel, { color: '#DC2626' }]}>
                  Added to Customer Debt:
                </Text>
                <Text style={[styles.slipDetailValueBold, { color: '#DC2626' }]}>
                  ₹{createdSlip.balanceAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {createdSlip?.type === 'OUT' && (
              <View style={styles.slipDetailRow}>
                <Text style={styles.slipDetailLabel}>Updated Total Debt:</Text>
                <Text style={[styles.slipDetailValueBold, { color: '#B45309' }]}>
                  ₹{newCustomerTotalDebt.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {createdSlip?.notes ? (
              <Text style={styles.slipNotesText}>Note: {createdSlip.notes}</Text>
            ) : null}

            {/* Actions */}
            <TouchableOpacity
              style={styles.whatsAppShareBtn}
              activeOpacity={0.8}
              onPress={handleShareWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
              <Text style={styles.whatsAppShareBtnText}>Share on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setPreviewVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
    lineHeight: 18,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  inBtn: {
    borderColor: '#16834A',
    backgroundColor: '#E8F5EC',
  },
  inBtnActive: {
    backgroundColor: '#16834A',
  },
  outBtn: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  outBtnActive: {
    backgroundColor: '#0284C7',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  largeNumberInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
    color: '#16834A',
  },
  chipsContainer: {
    marginTop: 8,
    marginBottom: 6,
  },
  chipHeader: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    gap: 6,
  },
  customerChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  customerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  customerChipTextActive: {
    color: '#0284C7',
  },
  chipDebtBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chipDebtText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  customerDebtCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 10,
    marginBottom: 8,
  },
  customerDebtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerDebtTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  customerDebtSubtitle: {
    fontSize: 11,
    color: '#1D4ED8',
    marginTop: 1,
  },
  customerDebtNote: {
    fontSize: 10.5,
    color: '#4B5563',
    marginTop: 6,
    fontStyle: 'italic',
  },
  productChipsRow: {
    marginBottom: 10,
  },
  productChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  productChipActive: {
    backgroundColor: '#E8F5EC',
    borderColor: '#16834A',
  },
  productChipTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  productChipTitleActive: {
    color: '#16834A',
  },
  productChipUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  productChipUnitActive: {
    color: '#16834A',
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  billSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    minWidth: 100,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16834A',
  },
  paymentModeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  paymentModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  paymentModeBtnActiveCash: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  paymentModeBtnActiveUpi: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  paymentModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  paymentModeBtnTextActive: {
    color: '#FFFFFF',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16834A',
  },
  debtBreakdownCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  debtSubLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  debtSubValue: {
    fontSize: 11,
    color: '#374151',
  },
  saveSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveDispatchBtn: {
    backgroundColor: '#0284C7',
  },
  saveArrivalBtn: {
    backgroundColor: '#16834A',
  },
  saveSlipBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  confirmDetailsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  confirmLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  confirmValue: {
    fontSize: 12,
    color: '#1F2937',
  },
  confirmValueBold: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  confirmWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    gap: 6,
  },
  confirmWarningText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 15,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmProceedBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmProceedBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  slipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  slipHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  slipLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slipMandiName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16834A',
  },
  slipBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 4,
  },
  slipNumberText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  slipDottedLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#D1D5DB',
    marginVertical: 12,
  },
  slipDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  slipDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  slipDetailValue: {
    fontSize: 13,
    color: '#1F2937',
  },
  slipDetailValueBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  slipTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  slipTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16834A',
  },
  slipNotesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
    marginTop: 6,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  whatsAppShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  doneBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
