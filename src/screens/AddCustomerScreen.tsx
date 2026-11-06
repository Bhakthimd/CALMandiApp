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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { CustomerType } from '../types';

export default function AddCustomerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { addCustomer } = useMandi();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [business, setBusiness] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Buyer');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceDirection, setBalanceDirection] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [address, setAddress] = useState('');

  const customerTypes: { type: CustomerType; label: string; sub: string }[] = [
    { type: 'Buyer', label: 'Buyer', sub: 'खरीदार' },
    { type: 'Farmer', label: 'Farmer', sub: 'किसान' },
    { type: 'Trader', label: 'Trader', sub: 'व्यापारी' },
    { type: 'Other', label: 'Other', sub: 'अन्य' },
  ];

  const handleSave = () => {
    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanBusiness = business.trim();

    if (!cleanName || !cleanMobile || !cleanBusiness) {
      Alert.alert('Missing Details', 'Please fill customer name, mobile, and business name.');
      return;
    }

    if (cleanMobile.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    const numBal = parseFloat(openingBalance) || 0;
    // If PAYABLE (Mandi owes customer), store as negative opening balance
    const finalOpeningBal = balanceDirection === 'PAYABLE' ? -numBal : numBal;

    const success = addCustomer({
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
      customerType,
      openingBalance: finalOpeningBal,
      address: address.trim() || undefined,
    });

    if (success) {
      Keyboard.dismiss();
      Alert.alert(
        'Success',
        `${cleanName} (${customerType}) has been added to your Mandi directory.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not add customer. Please check the details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 35),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Customers</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleBtn}
              activeOpacity={0.7}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.gold} />
            </TouchableOpacity>
            <Text style={styles.logo}>CAL Mandi</Text>
          </View>
        </View>

        <Text style={styles.title}>Add Customer / Farmer</Text>

        <Text style={styles.subtitle}>
          Register a buyer, farmer, or commission trader with initial ledger balance.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Customer Type Selector */}
          <Text style={styles.label}>Customer Type (प्रकार) *</Text>
          <View style={styles.typeGrid}>
            {customerTypes.map((item) => {
              const isSelected = customerType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeChip,
                    isSelected && styles.typeChipActive,
                  ]}
                  onPress={() => setCustomerType(item.type)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeChipLabel,
                      isSelected && styles.typeChipLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.typeChipSub,
                      isSelected && styles.typeChipSubActive,
                    ]}
                  >
                    {item.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Full Name (नाम) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rameshwar Reddy"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Mobile Number (मोबाइल) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, ''))
            }
            returnKeyType="next"
          />

          <Text style={styles.label}>Business / Shop / Farm Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Reddy Farm / Sri Lakshmi Fruits"
            placeholderTextColor={colors.textMuted}
            value={business}
            onChangeText={setBusiness}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Opening Balance */}
          <Text style={styles.label}>Opening Balance (प्रारंभिक शेष ₹)</Text>
          <View style={styles.balanceDirectionRow}>
            <TouchableOpacity
              style={[
                styles.balDirBtn,
                balanceDirection === 'RECEIVABLE' && styles.balDirBtnRecActive,
              ]}
              onPress={() => setBalanceDirection('RECEIVABLE')}
            >
              <Text
                style={[
                  styles.balDirText,
                  balanceDirection === 'RECEIVABLE' && styles.balDirTextActive,
                ]}
              >
                Customer Owes Mandi (लेने)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.balDirBtn,
                balanceDirection === 'PAYABLE' && styles.balDirBtnPayActive,
              ]}
              onPress={() => setBalanceDirection('PAYABLE')}
            >
              <Text
                style={[
                  styles.balDirText,
                  balanceDirection === 'PAYABLE' && styles.balDirTextActive,
                ]}
              >
                Mandi Owes (देने)
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="0 (Enter 0 if account is settled)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={openingBalance}
            onChangeText={setOpeningBalance}
            returnKeyType="next"
          />

          <Text style={styles.label}>Address / APMC Shop Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Stall #4, APMC Block B"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            returnKeyType="done"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.7}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Customer & Ledger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },
  backText: {
    color: '#16834A',
    fontSize: 17,
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  typeChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeChipLabelActive: {
    color: '#FFFFFF',
  },
  typeChipSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typeChipSubActive: {
    color: '#E8F4EC',
  },
  balanceDirectionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  balDirBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  balDirBtnRecActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  balDirBtnPayActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  balDirText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  balDirTextActive: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
  },
  saveButton: {
    backgroundColor: '#16834A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
