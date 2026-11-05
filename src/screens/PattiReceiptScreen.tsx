import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  const { pattiId, saleId, type = 'PATTI' } = route.params || {};
  const { pattis, sales, currentUser } = useMandi();

  const patti = useMemo(() => {
    if (pattiId) return pattis.find((p) => p.id === pattiId);
    return pattis[0];
  }, [pattis, pattiId]);

  const sale = useMemo(() => {
    if (saleId) return sales.find((s) => s.id === saleId);
    return sales[0];
  }, [sales, saleId]);

  const handlePrint = () => {
    Alert.alert(
      'Print Receipt',
      `Sending ${type === 'PATTI' ? 'Farmer Patti' : 'Buyer Invoice'} to APMC Bluetooth receipt printer...`,
      [{ text: 'OK' }]
    );
  };

  const handleShareWhatsApp = () => {
    Alert.alert(
      'WhatsApp Share',
      `Formatted bill ready to send to ${
        type === 'PATTI' ? patti?.farmerName : sale?.customerName
      }.`,
      [{ text: 'Share' }]
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
          <Text style={styles.headerTitle}>
            {type === 'PATTI' ? 'Farmer Patti (किसान पट्टी)' : 'Buyer Bill (बिक्री रसीद)'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {type === 'PATTI' ? patti?.pattiNumber : `BILL-${sale?.id}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color="#16834A" />
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
              {type === 'PATTI' ? 'FARMER SETTLEMENT PATTI (कच्ची पर्ची)' : 'TAX INVOICE & DISPATCH MEMO'}
            </Text>
          </View>

          <View style={styles.dottedDivider} />

          {/* Metadata Row */}
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

              {/* Deductions */}
              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Gross Value (सकल मूल्य):</Text>
                <Text style={styles.calcVal}>₹ {patti.grossAmount.toLocaleString()}</Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>
                  Less: Mandi Commission ({patti.commissionRate}%):
                </Text>
                <Text style={[styles.calcVal, { color: '#DC2626' }]}>
                  - ₹ {patti.commissionAmount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Less: Hamali / Labor Charges:</Text>
                <Text style={[styles.calcVal, { color: '#DC2626' }]}>
                  - ₹ {patti.laborCharges.toLocaleString()}
                </Text>
              </View>

              {patti.otherCharges ? (
                <View style={styles.calcLine}>
                  <Text style={styles.calcLabel}>Less: Market Cess / Weighment:</Text>
                  <Text style={[styles.calcVal, { color: '#DC2626' }]}>
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
          ) : sale ? (
            <>
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Bill No:</Text>
                  <Text style={styles.metaValue}>{sale.id}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(sale.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Buyer:</Text>
                  <Text style={styles.metaValue}>{sale.customerName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Payment:</Text>
                  <Text style={styles.metaValue}>{sale.paymentMethod}</Text>
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
                  {sale.productName} ({sale.gradeName || 'Standard'})
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {sale.quantity} {sale.unit}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                  ₹ {sale.unitPrice}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                  ₹ {sale.totalAmount}
                </Text>
              </View>

              <View style={styles.solidDivider} />

              <View style={styles.netLine}>
                <Text style={styles.netLabel}>TOTAL BILL AMOUNT:</Text>
                <Text style={styles.netVal}>₹ {sale.totalAmount.toLocaleString()}</Text>
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
    color: '#666666',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F4EC',
  },
  content: {
    padding: 16,
  },
  slipCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DDDDDD',
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
    color: '#16834A',
    letterSpacing: 0.5,
  },
  mandiSub: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  slipBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  dottedDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginVertical: 12,
  },
  solidDivider: {
    height: 1.5,
    backgroundColor: '#222222',
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
    color: '#777777',
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
    color: '#555555',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#555555',
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
    color: '#16834A',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 10,
  },
  sigBox: {
    width: '45%',
    alignItems: 'center',
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#888888',
    marginBottom: 4,
  },
  sigText: {
    fontSize: 10,
    color: '#666666',
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
});
