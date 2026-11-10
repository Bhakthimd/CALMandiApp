import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';

export default function PattiReceiptScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { pattiId, saleId, invoiceId, type = 'PATTI' } = route.params || {};
  const {
    pattis,
    sales,
    dispatchInvoices,
    cancelDispatch,
    isOwner,
    currentUser,
  } = useMandi();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const targetId = invoiceId || saleId;
  const isInvoiceMode = type === 'INVOICE' || !!targetId;

  // Resolve DispatchInvoice record (multi-item)
  const invoice = useMemo(() => {
    if (!targetId) return undefined;
    return dispatchInvoices.find(
      (inv) => inv.id === targetId || inv.invoiceNumber === targetId
    );
  }, [dispatchInvoices, targetId]);

  // Fallback to legacy single-item sale record only if matching ID exists
  const legacySale = useMemo(() => {
    if (!targetId || invoice) return undefined;
    return sales.find((s) => s.id === targetId);
  }, [sales, targetId, invoice]);

  // Resolve Farmer Patti record
  const patti = useMemo(() => {
    if (pattiId) {
      return pattis.find((p) => p.id === pattiId || p.pattiNumber === pattiId);
    }
    // Only fallback if explicitly in PATTI mode without an invalid ID
    if (type === 'PATTI' && !targetId && pattis.length > 0) {
      return pattis[0];
    }
    return undefined;
  }, [pattis, pattiId, type, targetId]);

  const isNotFound = isInvoiceMode ? (!invoice && !legacySale) : !patti;

  const handlePrint = () => {
    const slipLabel =
      type === 'PATTI'
        ? `Farmer Patti #${patti?.pattiNumber || ''}`
        : `Buyer Invoice #${invoice?.invoiceNumber || legacySale?.id || ''}`;
    Alert.alert(
      'Print Receipt',
      `Sending ${slipLabel} to APMC Bluetooth receipt printer...`,
      [{ text: 'OK' }]
    );
  };

  const handleShareWhatsApp = () => {
    if (type === 'PATTI' && patti) {
      Alert.alert(
        'WhatsApp Share',
        `Formatted patti slip ready to send to ${patti.farmerName} (₹${patti.netPayable.toLocaleString('en-IN')}).`,
        [{ text: 'Share' }]
      );
    } else if (invoice) {
      Alert.alert(
        'WhatsApp Share',
        `Formatted invoice #${invoice.invoiceNumber} ready to send to ${invoice.customerName} (Total: ₹${invoice.totalAmount.toLocaleString('en-IN')}, Remaining Debt: ₹${invoice.outstandingDebt.toLocaleString('en-IN')}).`,
        [{ text: 'Share' }]
      );
    } else if (legacySale) {
      Alert.alert(
        'WhatsApp Share',
        `Formatted bill ready to send to ${legacySale.customerName} (₹${legacySale.totalAmount.toLocaleString('en-IN')}).`,
        [{ text: 'Share' }]
      );
    }
  };

  const handleConfirmCancellation = async () => {
    if (!invoice) return;
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a clear reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    try {
      await cancelDispatch(invoice.id, cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason('');
      Alert.alert(
        'Dispatch Cancelled ✅',
        `Invoice #${invoice.invoiceNumber} has been reversed.\n\n• Line items returned to physical stock\n• Ledger debit/credit balance reversed.`
      );
    } catch (err: any) {
      Alert.alert('Cancellation Blocked', err?.message || 'Could not cancel dispatch.');
    } finally {
      setIsCancelling(false);
    }
  };

  // NOT FOUND STATE: Do not silently fallback to mock sales
  if (isNotFound) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {isInvoiceMode ? 'Buyer Invoice' : 'Farmer Patti'}
            </Text>
            <Text style={styles.headerSubtitle}>Record Not Found</Text>
          </View>
        </View>

        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#DC2626" />
          <Text style={styles.notFoundTitle}>
            {isInvoiceMode ? 'Invoice Not Found' : 'Patti Not Found'}
          </Text>
          <Text style={styles.notFoundDesc}>
            {isInvoiceMode
              ? `No dispatch invoice was found matching identifier "${targetId || 'unknown'}". It may have been removed or an invalid ID was requested.`
              : `No farmer settlement patti was found matching identifier "${pattiId || 'unknown'}".`}
          </Text>
          <TouchableOpacity
            style={styles.notFoundBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.notFoundBtnText}>Return to Mandi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>
            {type === 'PATTI' ? 'Farmer Patti (किसान पट्टी)' : 'Buyer Bill (बिक्री रसीद)'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {type === 'PATTI'
              ? patti?.pattiNumber
              : invoice
              ? `INVOICE-${invoice.invoiceNumber}`
              : `BILL-${legacySale?.id}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color={isDark ? '#4ADE80' : '#16834A'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 50) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Printable Bill / Patti Slip Card */}
        <View style={styles.slipCard}>
          {/* Mandi Letterhead */}
          <View style={styles.letterhead}>
            <Text style={styles.mandiName}>
              {currentUser?.business || 'PATEL KRISHI MANDI'}
            </Text>
            <Text style={styles.mandiSub}>
              APMC Market Yard, Bangalore • Lic # KA-APMC-8821
            </Text>
            <Text style={styles.slipBadgeTitle}>
              {type === 'PATTI'
                ? 'FARMER SETTLEMENT PATTI (कच्ची पर्ची)'
                : 'TAX INVOICE & DISPATCH MEMO'}
            </Text>
          </View>

          {/* Cancelled / Reversed Banner */}
          {invoice?.isReversed && (
            <View style={styles.cancelledBanner}>
              <View style={styles.cancelledBadgeHeader}>
                <Ionicons name="close-circle" size={18} color="#DC2626" />
                <Text style={styles.cancelledBadgeText}>
                  DISPATCH CANCELLED / REVERSED
                </Text>
              </View>
              <Text style={styles.cancelledReasonText}>
                Reason: {invoice.reversalReason || 'No reason specified'}
              </Text>
              {invoice.reversedAt && (
                <Text style={styles.cancelledTimeText}>
                  Reversed on: {new Date(invoice.reversedAt).toLocaleString()}
                </Text>
              )}
              <Text style={styles.cancelledStockNotice}>
                • All line items restored to inventory stock{'\n'}• Customer balance adjusted
              </Text>
            </View>
          )}

          <View style={styles.dottedDivider} />

          {/* Farmer Patti Section */}
          {type === 'PATTI' && patti ? (
            <>
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Patti No:</Text>
                  <Text style={styles.metaValue}>{patti.pattiNumber}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>{patti.date}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Farmer:</Text>
                  <Text style={styles.metaValue}>{patti.farmerName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Mobile:</Text>
                  <Text style={styles.metaValue}>{patti.farmerMobile || '-'}</Text>
                </View>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Commodity (Grade)</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Gross</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2, fontWeight: '700' }]}>
                  {patti.productName} ({patti.gradeName || 'Standard'})
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {patti.quantity} {patti.unit}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                  ₹ {patti.rate}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                  ₹ {patti.grossAmount}
                </Text>
              </View>

              <View style={styles.dottedDivider} />

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Gross Value (सकल मूल्य):</Text>
                <Text style={styles.calcVal}>₹ {patti.grossAmount.toLocaleString()}</Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>
                  Less: Mandi Commission ({patti.commissionRate}%):
                </Text>
                <Text style={[styles.calcVal, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  - ₹ {patti.commissionAmount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Less: Hamali / Labor Charges:</Text>
                <Text style={[styles.calcVal, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  - ₹ {patti.laborCharges.toLocaleString()}
                </Text>
              </View>

              {patti.otherCharges ? (
                <View style={styles.calcLine}>
                  <Text style={styles.calcLabel}>Less: Market Cess / Weighment:</Text>
                  <Text style={[styles.calcVal, { color: isDark ? '#F87171' : '#DC2626' }]}>
                    - ₹ {patti.otherCharges.toLocaleString()}
                  </Text>
                </View>
              ) : null}

              <View style={styles.solidDivider} />

              <View style={styles.netLine}>
                <Text style={styles.netLabel}>NET PAYABLE TO FARMER (देय राशि):</Text>
                <Text style={styles.netVal}>₹ {patti.netPayable.toLocaleString()}</Text>
              </View>
            </>
          ) : invoice ? (
            /* Multi-item DispatchInvoice Section */
            <>
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Invoice No:</Text>
                  <Text style={styles.metaValue}>#{invoice.invoiceNumber}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(invoice.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Buyer:</Text>
                  <Text style={styles.metaValue}>{invoice.customerName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Mobile:</Text>
                  <Text style={styles.metaValue}>{invoice.customerMobile || '-'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Payment Mode:</Text>
                  <Text style={styles.metaValue}>{invoice.paymentMethod || 'Split'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Created By:</Text>
                  <Text style={styles.metaValue}>{invoice.createdBy || 'Staff'}</Text>
                </View>
              </View>

              {/* Multi-item Table */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2.2 }]}>Commodity (Grade)</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
              </View>

              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.tableRow}>
                    <View style={{ flex: 2.2 }}>
                      <Text style={[styles.td, { fontWeight: '700' }]}>
                        {item.productName}
                      </Text>
                      <Text style={styles.gradeSubtitle}>
                        {item.gradeName || 'Standard'}
                      </Text>
                    </View>
                    <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                      {item.quantity} {item.unit}
                    </Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                      ₹ {item.unitPrice}
                    </Text>
                    <Text style={[styles.td, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>
                      ₹ {item.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1, textAlign: 'center', color: '#888888' }]}>
                    No line items recorded
                  </Text>
                </View>
              )}

              <View style={styles.dottedDivider} />

              {/* Subtotal & Charges */}
              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Items Subtotal (माल का मूल्य):</Text>
                <Text style={styles.calcVal}>₹ {invoice.subtotal.toLocaleString('en-IN')}</Text>
              </View>

              {invoice.commissionAmount && invoice.commissionAmount > 0 ? (
                <View style={styles.calcLine}>
                  <Text style={styles.calcLabel}>
                    Mandi Commission ({invoice.commissionRate || 0}%):
                  </Text>
                  <Text style={[styles.calcVal, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                    + ₹ {invoice.commissionAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}

              {invoice.otherCharges && invoice.otherCharges > 0 ? (
                <View style={styles.calcLine}>
                  <Text style={styles.calcLabel}>Hamali / Other Charges:</Text>
                  <Text style={[styles.calcVal, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                    + ₹ {invoice.otherCharges.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.solidDivider} />

              <View style={styles.netLine}>
                <Text style={styles.netLabel}>TOTAL BILL AMOUNT:</Text>
                <Text style={styles.netVal}>₹ {invoice.totalAmount.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Cash Received (नकद):</Text>
                <Text style={[styles.calcVal, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                  ₹ {invoice.cashPaid.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>UPI / Online Received:</Text>
                <Text style={[styles.calcVal, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                  ₹ {invoice.upiPaid.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={[styles.netLine, { marginTop: 6 }]}>
                <Text
                  style={[
                    styles.netLabel,
                    { color: invoice.outstandingDebt > 0 ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#4ADE80' : '#16834A') },
                  ]}
                >
                  OUTSTANDING DEBT (उधारी):
                </Text>
                <Text
                  style={[
                    styles.netVal,
                    {
                      color: invoice.outstandingDebt > 0 ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#4ADE80' : '#16834A'),
                      fontSize: 16,
                    },
                  ]}
                >
                  ₹ {invoice.outstandingDebt.toLocaleString('en-IN')}
                </Text>
              </View>
            </>
          ) : legacySale ? (
            /* Legacy Single-Item Sale Section */
            <>
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Bill No:</Text>
                  <Text style={styles.metaValue}>{legacySale.id}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(legacySale.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Buyer:</Text>
                  <Text style={styles.metaValue}>{legacySale.customerName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Payment:</Text>
                  <Text style={styles.metaValue}>{legacySale.paymentMethod}</Text>
                </View>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Commodity (Grade)</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2, fontWeight: '700' }]}>
                  {legacySale.productName} ({legacySale.gradeName || 'Standard'})
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {legacySale.quantity} {legacySale.unit}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                  ₹ {legacySale.unitPrice}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                  ₹ {legacySale.totalAmount}
                </Text>
              </View>

              <View style={styles.solidDivider} />

              <View style={styles.netLine}>
                <Text style={styles.netLabel}>TOTAL BILL AMOUNT:</Text>
                <Text style={styles.netVal}>₹ {legacySale.totalAmount.toLocaleString()}</Text>
              </View>
            </>
          ) : null}

          {/* Footer Signatures */}
          <View style={styles.signatureRow}>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>Farmer / Buyer Signature</Text>
            </View>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>Authorized Mandi Agent</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnWhatsApp]}
            onPress={handleShareWhatsApp}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Share on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.btnPrint]}
            onPress={handlePrint}
            activeOpacity={0.8}
          >
            <Ionicons name="print" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Print Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Owner-Only Safe Dispatch Cancellation Button */}
        {isOwner && invoice && !invoice.isReversed && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowCancelModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color={isDark ? '#F87171' : '#DC2626'} />
            <Text style={styles.cancelBtnText}>Cancel Dispatch (Owner Only)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isCancelling) setShowCancelModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={24} color={isDark ? '#F87171' : '#DC2626'} />
              <Text style={styles.modalTitle}>Cancel Dispatch #{invoice?.invoiceNumber}</Text>
            </View>

            <Text style={styles.modalWarningText}>
              This will atomically return all line items back into physical stock and
              reverse ₹{invoice?.outstandingDebt?.toLocaleString('en-IN') || 0} customer debt
              from the ledger.
            </Text>

            <Text style={styles.inputLabel}>Reason for cancellation (Mandatory):</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Buyer rejected lot, rate discrepancy, order cancelled"
              placeholderTextColor={colors.inputPlaceholder}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Keep Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  (!cancelReason.trim() || isCancelling) && { opacity: 0.5 },
                ]}
                onPress={handleConfirmCancellation}
                disabled={!cancelReason.trim() || isCancelling}
                activeOpacity={0.8}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Reversal</Text>
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
    iconBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#143823' : '#E8F4EC',
    },
    content: {
      padding: 16,
    },
    slipCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      marginBottom: 16,
    },
    letterhead: {
      alignItems: 'center',
      marginBottom: 10,
    },
    mandiName: {
      fontSize: 18,
      fontWeight: '900',
      color: isDark ? '#4ADE80' : '#16834A',
      letterSpacing: 0.5,
    },
    mandiSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    slipBadgeTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : colors.textPrimary,
      backgroundColor: isDark ? '#143823' : '#E8F4EC',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 8,
    },
    cancelledBanner: {
      backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
      borderColor: isDark ? '#7F1D1D' : '#F87171',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginTop: 10,
      marginBottom: 4,
    },
    cancelledBadgeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    cancelledBadgeText: {
      color: isDark ? '#F87171' : '#DC2626',
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.4,
    },
    cancelledReasonText: {
      fontSize: 12,
      color: isDark ? '#FCA5A5' : '#991B1B',
      fontWeight: '600',
    },
    cancelledTimeText: {
      fontSize: 11,
      color: isDark ? '#F87171' : '#B91C1C',
      marginTop: 2,
    },
    cancelledStockNotice: {
      fontSize: 11,
      color: isDark ? '#FECACA' : '#7F1D1D',
      marginTop: 4,
      lineHeight: 16,
    },
    dottedDivider: {
      height: 1,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 12,
    },
    solidDivider: {
      height: 1.5,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    metaCol: {
      width: '48%',
    },
    metaLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    metaValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 6,
      marginTop: 4,
    },
    th: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    gradeSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    td: {
      fontSize: 12,
      color: colors.textPrimary,
    },
    calcLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 3,
    },
    calcLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    calcVal: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    netLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    netLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    netVal: {
      fontSize: 18,
      fontWeight: '900',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    signatureRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 36,
      paddingTop: 10,
    },
    sigBox: {
      width: '45%',
      alignItems: 'center',
    },
    sigLine: {
      width: '100%',
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 4,
    },
    sigText: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 6,
      elevation: 3,
    },
    btnWhatsApp: {
      backgroundColor: '#25D366',
    },
    btnPrint: {
      backgroundColor: '#16834A',
    },
    btnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      marginTop: 14,
      gap: 6,
    },
    cancelBtnText: {
      color: isDark ? '#F87171' : '#DC2626',
      fontSize: 13,
      fontWeight: '700',
    },
    notFoundContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    notFoundTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 14,
      marginBottom: 6,
    },
    notFoundDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    notFoundBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#16834A',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    notFoundBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.modalBackground,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalWarningText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: isDark ? colors.inputBackground : '#FFFFFF',
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalBtnRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    modalCancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    },
    modalCancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    modalConfirmBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#DC2626',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalConfirmBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
