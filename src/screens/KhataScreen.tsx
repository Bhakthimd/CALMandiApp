import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { Customer } from '../types';

export default function KhataScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { customers, totalUdhaar, settleCustomerBalance, isOwner } = useMandi();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // If accessed by non-owner, guard
  if (!isOwner) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, padding: 20 }]}>
        <Text style={styles.title}>🔒 Owner Privilege Required</Text>
        <Text style={styles.subtitle}>
          Customer Khata and credit ledger is confidential and accessible only by the Mandi Owner.
        </Text>
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleOpenSettle = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSettleAmount((customer.pendingAmount || 0).toString());
    setModalVisible(true);
  };

  const handleConfirmSettlement = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(settleAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    settleCustomerBalance(selectedCustomer.id, amount);
    setModalVisible(false);
    Alert.alert(
      'Payment Recorded',
      `Received ₹${amount.toLocaleString('en-IN')} from ${selectedCustomer.name}. Ledger updated.`
    );
  };

  const handleSendReminder = async (customer: Customer) => {
    const pending = customer.pendingAmount || 0;
    const msg = `*CALMandi Payment Reminder*
-----------------------------
Dear *${customer.name}* (${customer.business}),
Your current pending balance at our Mandi shop is *₹${pending.toLocaleString('en-IN')}*.
Kindly clear the balance at your earliest convenience.

Thank you,
*Patel Krishi Mandi, APMC Yard*`;

    const cleanPhone = customer.mobile.replace(/\D/g, '');
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹ Home</Text>
          </TouchableOpacity>

          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>👑 OWNER ONLY</Text>
          </View>
        </View>

        <Text style={styles.title}>Buyer Khata & Credit Ledger</Text>
        <Text style={styles.subtitle}>
          Track market credit (Udhaar), collect payments, and send WhatsApp payment reminders.
        </Text>

        {/* Total Outstanding Card */}
        <View style={styles.totalUdhaarCard}>
          <View style={styles.udhaarIconBox}>
            <Ionicons name="alert-circle" size={28} color="#DC2626" />
          </View>
          <View style={styles.udhaarTextBox}>
            <Text style={styles.udhaarLabel}>Total Market Credit (Pending Udhaar)</Text>
            <Text style={styles.udhaarValue}>
              ₹ {totalUdhaar.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.udhaarSub}>Owed by wholesale buyers</Text>
          </View>
        </View>

        {/* Customer Accounts */}
        <Text style={styles.sectionTitle}>Buyer Credit Accounts</Text>

        {customers.map((c) => {
          const isPending = (c.pendingAmount || 0) > 0;
          return (
            <View key={c.id} style={styles.khataCard}>
              <View style={styles.khataHeader}>
                <View>
                  <Text style={styles.buyerName}>{c.name}</Text>
                  <Text style={styles.businessName}>{c.business}</Text>
                  <Text style={styles.mobileText}>
                    <Ionicons name="call-outline" size={12} color="#666666" />{' '}
                    {c.mobile}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isPending ? styles.pendingPill : styles.settledPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isPending ? styles.pendingPillText : styles.settledPillText,
                    ]}
                  >
                    {isPending ? `₹ ${(c.pendingAmount || 0).toLocaleString('en-IN')} Due` : 'Settled'}
                  </Text>
                </View>
              </View>

              {isPending && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.reminderBtn}
                    activeOpacity={0.7}
                    onPress={() => handleSendReminder(c)}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#16834A" />
                    <Text style={styles.reminderBtnText}>WhatsApp Reminder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settleBtn}
                    activeOpacity={0.7}
                    onPress={() => handleOpenSettle(c)}
                  >
                    <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.settleBtnText}>Receive Cash</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Settle Payment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Payment Settlement</Text>
            <Text style={styles.modalSub}>
              Receiving cash from {selectedCustomer?.name} ({selectedCustomer?.business})
            </Text>

            <Text style={styles.modalLabel}>Payment Amount (₹)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={settleAmount}
              onChangeText={setSettleAmount}
              placeholder="Enter amount paid"
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSettleBtn}
                onPress={handleConfirmSettlement}
              >
                <Text style={styles.confirmSettleBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
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
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    fontSize: 18,
    color: '#16834A',
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ownerBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  backHomeBtn: {
    backgroundColor: '#16834A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalUdhaarCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  udhaarIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  udhaarTextBox: {
    flex: 1,
  },
  udhaarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  udhaarValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#DC2626',
    marginVertical: 2,
  },
  udhaarSub: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  khataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  khataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  buyerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  businessName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 1,
  },
  mobileText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingPill: {
    backgroundColor: '#FEE2E2',
  },
  pendingPillText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: 'bold',
  },
  settledPill: {
    backgroundColor: '#DCFCE7',
  },
  settledPillText: {
    color: '#16834A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16834A',
    marginLeft: 6,
  },
  settleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 10,
    borderRadius: 8,
  },
  settleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#16834A',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmSettleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#16834A',
    borderRadius: 8,
  },
  confirmSettleBtnText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
