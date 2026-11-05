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
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { StockMovementType, MandiSlip } from '../types';

export default function CreateSlipScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
  const [notes, setNotes] = useState('');

  // Slip preview modal
  const [createdSlip, setCreatedSlip] = useState<MandiSlip | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const activeRate = customRate ? parseFloat(customRate) || 0 : parseFloat(selectedProduct?.price || '0') || 0;
  const qtyNumber = parseFloat(quantity) || 0;
  const totalAmount = qtyNumber * activeRate;
  const paidNumber = paidAmount ? parseFloat(paidAmount) || 0 : totalAmount;
  const balanceDue = Math.max(0, totalAmount - paidNumber);

  const handleSelectCustomer = (custName: string, custMobile: string) => {
    setPartyName(custName);
    setPartyMobile(custMobile);
  };

  const handleQuickAddQty = (step: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + step).toString());
  };

  const handleSaveSlip = () => {
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

    const doSave = () => {
      const newSlip = recordSlip({
        type,
        partyName: cleanParty,
        partyMobile: partyMobile.replace(/\D/g, '') || '9876543210',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        quantity: qtyNumber,
        unit: selectedProduct.unit,
        ratePerUnit: activeRate,
        totalAmount,
        paidAmount: paidNumber,
        balanceAmount: balanceDue,
        notes: notes.trim(),
      });

      setCreatedSlip(newSlip);
      setPreviewVisible(true);
    };

    if (type === 'OUT') {
      Alert.alert(
        'Confirm Dispatch Transaction',
        `Buyer: ${cleanParty}\n` +
        `Commodity: ${selectedProduct.name}\n` +
        `Quantity: ${qtyNumber} ${selectedProduct.unit} @ ₹${activeRate}\n` +
        `Total Bill: ₹${totalAmount.toLocaleString('en-IN')}\n` +
        `Upfront Paid: ₹${paidNumber.toLocaleString('en-IN')}\n` +
        (balanceDue > 0
          ? `Remaining Added to Customer Debt: ₹${balanceDue.toLocaleString('en-IN')}`
          : 'Status: Fully Paid Upfront'),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm & Dispatch', onPress: doSave },
        ]
      );
    } else {
      doSave();
    }
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
*Amount Paid:* ₹${slip.paidAmount.toLocaleString('en-IN')}
*Balance Due:* ₹${slip.balanceAmount.toLocaleString('en-IN')}
${slip.notes ? `*Notes:* ${slip.notes}\n` : ''}-----------------------------
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
            Record arrival or dispatch and generate an instant WhatsApp slip.
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
                📤 Stock OUT (Sale)
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

          {/* Quick Customer Chips */}
          {type === 'OUT' && customers.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipHeader}>Frequent Buyers:</Text>
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionLabel}>Mobile Number (For WhatsApp Receipt)</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
            value={partyMobile}
            onChangeText={(v) => setPartyMobile(v.replace(/\D/g, ''))}
          />

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

            {type === 'OUT' && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cash Paid Now:</Text>
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
                    <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>
                      Balance Due (Udhaar):
                    </Text>
                    <Text style={[styles.totalValue, { color: '#DC2626' }]}>
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
            style={styles.saveSlipBtn}
            activeOpacity={0.8}
            onPress={handleSaveSlip}
          >
            <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
            <Text style={styles.saveSlipBtnText}>
              Save & Generate WhatsApp Slip
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
              <Text style={styles.slipDetailLabel}>Amount Paid:</Text>
              <Text style={styles.slipDetailValue}>
                ₹{createdSlip?.paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            {createdSlip && createdSlip.balanceAmount > 0 && (
              <View style={styles.slipDetailRow}>
                <Text style={[styles.slipDetailLabel, { color: '#DC2626' }]}>
                  Balance Due:
                </Text>
                <Text style={[styles.slipDetailValueBold, { color: '#DC2626' }]}>
                  ₹{createdSlip.balanceAmount.toLocaleString('en-IN')}
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
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    fontSize: 18,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
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
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
  },
  inBtn: {
    borderColor: '#16834A',
  },
  inBtnActive: {
    backgroundColor: '#16834A',
  },
  outBtn: {
    borderColor: '#0284C7',
  },
  outBtnActive: {
    backgroundColor: '#0284C7',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  largeNumberInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#16834A',
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipHeader: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  customerChip: {
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C7E8D3',
  },
  customerChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  customerChipText: {
    fontSize: 13,
    color: '#16834A',
    fontWeight: '600',
  },
  customerChipTextActive: {
    color: '#FFFFFF',
  },
  productChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  productChip: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    minWidth: 100,
    alignItems: 'center',
  },
  productChipActive: {
    borderColor: '#16834A',
    backgroundColor: '#E8F5EC',
  },
  productChipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  productChipTitleActive: {
    color: '#16834A',
  },
  productChipUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  productChipUnitActive: {
    color: '#16834A',
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  billSummaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rateInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 90,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16834A',
  },
  saveSlipBtn: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveSlipBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  slipCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  slipHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  slipLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  slipMandiName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16834A',
    marginLeft: 6,
  },
  slipBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 2,
    marginBottom: 4,
  },
  slipNumberText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  slipDottedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginVertical: 12,
  },
  slipDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  slipDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  slipDetailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  slipDetailValueBold: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  slipTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  slipTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16834A',
  },
  slipNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 8,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  whatsAppShareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  doneBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
