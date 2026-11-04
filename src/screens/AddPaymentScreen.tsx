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
import { PaymentMethod, LedgerTransactionType } from '../types';

export default function AddPaymentScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { customerId: initialCustomerId, defaultType } = route.params || {};
  const { customers, addLedgerTransaction, getCustomerBalance } = useMandi();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [direction, setDirection] = useState<'RECEIVE' | 'PAY'>(
    defaultType === 'PAY' ? 'PAY' : 'RECEIVE'
  );
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [txType, setTxType] = useState<LedgerTransactionType>(
    direction === 'RECEIVE' ? 'CASH_RECEIVED' : 'CASH_PAID'
  );
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const customerBalance = useMemo(() => {
    if (!selectedCustomerId) return { currentBalance: 0 };
    return getCustomerBalance(selectedCustomerId);
  }, [selectedCustomerId, getCustomerBalance]);

  const parsedAmount = parseFloat(amount) || 0;

  // Calculate preview balance
  const projectedBalance = useMemo(() => {
    const cur = customerBalance.currentBalance;
    if (direction === 'RECEIVE') {
      // Receiving money reduces receivable / debt
      return cur - parsedAmount;
    } else {
      // Paying money reduces payable (or increases receivable if debit)
      return cur + parsedAmount;
    }
  }, [customerBalance.currentBalance, direction, parsedAmount]);

  const handleSelectDirection = (newDir: 'RECEIVE' | 'PAY') => {
    setDirection(newDir);
    setTxType(newDir === 'RECEIVE' ? 'CASH_RECEIVED' : 'CASH_PAID');
  };

  const handleFillFullBalance = () => {
    const absBal = Math.abs(customerBalance.currentBalance);
    if (absBal > 0) {
      setAmount(String(absBal));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Required Field', 'Please select a customer.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount greater than zero.');
      return;
    }

    // Prevent duplicate submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isReceive = direction === 'RECEIVE';
      await addLedgerTransaction({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerType: selectedCustomer.customerType || 'Buyer',
        date: new Date().toISOString().split('T')[0],
        type: txType,
        category: isReceive ? 'CREDIT' : 'DEBIT',
        amount: parsedAmount,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Payment Recorded Successfully',
        `₹ ${parsedAmount.toLocaleString()} ${
          isReceive ? 'received from' : 'paid to'
        } ${selectedCustomer.name}.\nNew Balance: ₹ ${Math.abs(projectedBalance).toLocaleString()} ${
          projectedBalance > 0 ? 'Owed to Mandi' : projectedBalance < 0 ? 'Mandi Owes' : 'Settled'
        }`,
        [
          {
            text: 'View Ledger',
            onPress: () =>
              navigation.replace('CustomerLedger', { customerId: selectedCustomer.id }),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to save payment record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods: PaymentMethod[] = [
    'Cash',
    'UPI / Online',
    'Bank Transfer',
    'Cheque',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Record Payment / Dues</Text>
          <Text style={styles.headerSubtitle}>भुगतान प्रविष्टि (नकद / बैंक)</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Direction Selector (Receive vs Pay) */}
        <View style={styles.directionToggleContainer}>
          <TouchableOpacity
            style={[
              styles.directionTab,
              direction === 'RECEIVE' && styles.directionTabReceiveActive,
            ]}
            onPress={() => handleSelectDirection('RECEIVE')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={direction === 'RECEIVE' ? '#FFFFFF' : '#16834A'}
            />
            <View>
              <Text
                style={[
                  styles.directionText,
                  direction === 'RECEIVE' && styles.directionTextActive,
                ]}
              >
                Payment Received (जमा)
              </Text>
              <Text
                style={[
                  styles.directionSubText,
                  direction === 'RECEIVE' && styles.directionSubTextActive,
                ]}
              >
                Customer paid money to Mandi
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.directionTab,
              direction === 'PAY' && styles.directionTabPayActive,
            ]}
            onPress={() => handleSelectDirection('PAY')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up-circle"
              size={20}
              color={direction === 'PAY' ? '#FFFFFF' : '#0284C7'}
            />
            <View>
              <Text
                style={[
                  styles.directionText,
                  direction === 'PAY' && styles.directionTextActive,
                ]}
              >
                Make Payment (निकासी)
              </Text>
              <Text
                style={[
                  styles.directionSubText,
                  direction === 'PAY' && styles.directionSubTextActive,
                ]}
              >
                Mandi paying Farmer / Trader
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Customer Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Select Customer (ग्राहक / किसान चुनें)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.customerScroll}
          >
            {customers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              const bal = getCustomerBalance(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.customerSelectCard,
                    isSelected && styles.customerSelectCardActive,
                  ]}
                  onPress={() => setSelectedCustomerId(c.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.custSelectName,
                      isSelected && styles.custSelectNameActive,
                    ]}
                  >
                    {c.name}
                  </Text>
                  <Text style={styles.custSelectBiz}>{c.business}</Text>
                  <Text
                    style={[
                      styles.custSelectBal,
                      bal.currentBalance > 0
                        ? { color: '#DC2626' }
                        : bal.currentBalance < 0
                        ? { color: '#16834A' }
                        : { color: '#888888' },
                    ]}
                  >
                    {bal.currentBalance > 0
                      ? `Owes ₹${bal.currentBalance.toLocaleString()}`
                      : bal.currentBalance < 0
                      ? `Due ₹${Math.abs(bal.currentBalance).toLocaleString()}`
                      : 'Settled'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Transaction Type Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Transaction Type (प्रकार)</Text>
          <View style={styles.chipRow}>
            {direction === 'RECEIVE' ? (
              <>
                {[
                  { id: 'CASH_RECEIVED', label: 'Payment Received' },
                  { id: 'PARTIAL_PAYMENT', label: 'Partial Payment' },
                  { id: 'ADVANCE_PAYMENT', label: 'Advance Payment' },
                  { id: 'ADJUSTMENT', label: 'Adjustment' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeChip,
                      txType === item.id && styles.typeChipActive,
                    ]}
                    onPress={() => setTxType(item.id as any)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        txType === item.id && styles.typeChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                {[
                  { id: 'CASH_PAID', label: 'Farmer Payment' },
                  { id: 'PARTIAL_PAYMENT', label: 'Partial Settlement' },
                  { id: 'ADVANCE_PAYMENT', label: 'Farmer Advance' },
                  { id: 'ADJUSTMENT', label: 'Adjustment' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeChip,
                      txType === item.id && styles.typeChipActive,
                    ]}
                    onPress={() => setTxType(item.id as any)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        txType === item.id && styles.typeChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.formGroup}>
          <View style={styles.amountLabelRow}>
            <Text style={styles.inputLabel}>Payment Amount (राशि ₹)</Text>
            {Math.abs(customerBalance.currentBalance) > 0 && (
              <TouchableOpacity onPress={handleFillFullBalance}>
                <Text style={styles.fillFullText}>Fill Full Outstanding</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.amountInputWrap}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Quick Amount Suggestion Chips */}
          <View style={styles.quickAmountRow}>
            {[500, 1000, 2000, 5000, 10000].map((quickVal) => (
              <TouchableOpacity
                key={quickVal}
                style={styles.quickValChip}
                onPress={() => setAmount(String(quickVal))}
              >
                <Text style={styles.quickValText}>+₹{quickVal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Payment Method (माध्यम)</Text>
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodCard,
                    isSelected && styles.methodCardActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      method === 'Cash'
                        ? 'cash-outline'
                        : method === 'UPI / Online'
                        ? 'phone-portrait-outline'
                        : method === 'Bank Transfer'
                        ? 'business-outline'
                        : 'document-text-outline'
                    }
                    size={20}
                    color={isSelected ? '#16834A' : '#666666'}
                  />
                  <Text
                    style={[
                      styles.methodText,
                      isSelected && styles.methodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reference / Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Reference No. (Optional UTR / Cheque / Slip #)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. UTR-98234190 or CHQ-0021"
            placeholderTextColor="#888888"
            value={referenceNo}
            onChangeText={setReferenceNo}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Notes / Remarks (टिप्पणी)</Text>
          <TextInput
            style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
            placeholder="e.g. Settlement for Tuesday morning tomato lot"
            placeholderTextColor="#888888"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Real-Time Balance Preview Box */}
        {selectedCustomer && parsedAmount > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Balance Calculation Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Current Balance:</Text>
              <Text style={styles.previewValue}>
                ₹ {Math.abs(customerBalance.currentBalance).toLocaleString()}{' '}
                {customerBalance.currentBalance > 0
                  ? '(Owed to Mandi)'
                  : customerBalance.currentBalance < 0
                  ? '(Mandi Owes)'
                  : ''}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>
                {direction === 'RECEIVE' ? 'Payment Received (-):' : 'Payment Made (+):'}
              </Text>
              <Text
                style={[
                  styles.previewValue,
                  direction === 'RECEIVE' ? { color: '#16834A' } : { color: '#0284C7' },
                ]}
              >
                ₹ {parsedAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewRow}>
              <Text style={styles.previewTotalLabel}>Projected Balance After:</Text>
              <Text
                style={[
                  styles.previewTotalValue,
                  projectedBalance > 0
                    ? { color: '#DC2626' }
                    : projectedBalance < 0
                    ? { color: '#16834A' }
                    : { color: '#4B5563' },
                ]}
              >
                ₹ {Math.abs(projectedBalance).toLocaleString()}{' '}
                {projectedBalance > 0
                  ? '(Owes Mandi)'
                  : projectedBalance < 0
                  ? '(Mandi Owes)'
                  : '(Settled)'}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            direction === 'RECEIVE' ? styles.submitBtnReceive : styles.submitBtnPay,
            isSubmitting && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isSubmitting
              ? 'Saving Payment...'
              : direction === 'RECEIVE'
              ? `Confirm & Receive ₹ ${parsedAmount || 0}`
              : `Confirm & Pay ₹ ${parsedAmount || 0}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
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
    color: '#222222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  content: {
    padding: 16,
  },
  directionToggleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  directionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  directionTabReceiveActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  directionTabPayActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  directionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  directionTextActive: {
    color: '#FFFFFF',
  },
  directionSubText: {
    fontSize: 9,
    color: '#777777',
  },
  directionSubTextActive: {
    color: '#E0F2FE',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  customerScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  customerSelectCard: {
    width: 140,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  customerSelectCardActive: {
    borderColor: '#16834A',
    backgroundColor: '#E8F4EC',
  },
  custSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  custSelectNameActive: {
    color: '#16834A',
  },
  custSelectBiz: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  custSelectBal: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  typeChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fillFullText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16834A',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16834A',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  rupeePrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickValChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E8F4EC',
  },
  quickValText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16834A',
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    gap: 4,
  },
  methodCardActive: {
    borderColor: '#16834A',
    backgroundColor: '#E8F4EC',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  methodTextActive: {
    color: '#16834A',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222222',
  },
  previewBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666666',
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
  },
  previewTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  previewTotalValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  submitBtnReceive: {
    backgroundColor: '#16834A',
  },
  submitBtnPay: {
    backgroundColor: '#0284C7',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
