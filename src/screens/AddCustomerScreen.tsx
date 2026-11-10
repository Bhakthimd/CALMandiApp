import React, { useState, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { CustomerType } from '../types';

interface TypeOption {
  type: CustomerType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CUSTOMER_TYPE_OPTIONS: TypeOption[] = [
  { type: 'Buyer', label: 'Buyer', icon: 'cart-outline' },
  { type: 'Farmer', label: 'Farmer', icon: 'leaf-outline' },
  { type: 'Supplier', label: 'Supplier', icon: 'cube-outline' },
  { type: 'Trader', label: 'Trader', icon: 'swap-horizontal-outline' },
];

export default function AddCustomerScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { customers, addCustomer, updateCustomer } = useMandi();

  const customerToEdit = route?.params?.customer;
  const isEditing = !!customerToEdit;

  // Initial types mapping: if existing customer was 'Both', pre-select ['Buyer', 'Supplier']
  const initialTypes: CustomerType[] = useMemo(() => {
    if (customerToEdit?.customerRoles && customerToEdit.customerRoles.length > 0) {
      return customerToEdit.customerRoles;
    }
    if (customerToEdit?.customerType === 'Both') {
      return ['Buyer', 'Supplier'];
    }
    if (customerToEdit?.customerType) {
      return [customerToEdit.customerType];
    }
    return ['Buyer'];
  }, [customerToEdit]);

  // Form states
  const [selectedTypes, setSelectedTypes] = useState<CustomerType[]>(initialTypes);
  const [name, setName] = useState(customerToEdit?.name || '');
  const [mobile, setMobile] = useState(customerToEdit?.mobile || '');
  const [business, setBusiness] = useState(customerToEdit?.business || '');

  // Opening balance states
  const [openingBalance, setOpeningBalance] = useState(
    customerToEdit?.openingBalance && Math.abs(customerToEdit.openingBalance) > 0
      ? Math.abs(customerToEdit.openingBalance).toString()
      : ''
  );
  const [balanceDirection, setBalanceDirection] = useState<'RECEIVABLE' | 'PAYABLE'>(
    customerToEdit?.openingBalance && customerToEdit.openingBalance < 0 ? 'PAYABLE' : 'RECEIVABLE'
  );

  // Optional collapsible details
  const [address, setAddress] = useState(customerToEdit?.address || '');
  const [notes, setNotes] = useState(customerToEdit?.notes || '');
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(
    !!(customerToEdit?.address || customerToEdit?.notes)
  );

  // Toggle customer type selection
  const handleToggleType = (type: CustomerType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      } else {
        Alert.alert(
          'Role Required',
          'Please keep at least one customer type selected.'
        );
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Determine primary CustomerType for storage
  const resolveCustomerType = (types: CustomerType[]): CustomerType => {
    if (types.includes('Buyer') && types.includes('Supplier')) {
      return 'Both';
    }
    if (types.includes('Farmer')) return 'Farmer';
    if (types.includes('Trader')) return 'Trader';
    if (types.includes('Supplier')) return 'Supplier';
    if (types.includes('Buyer')) return 'Buyer';
    return types[0] || 'Buyer';
  };

  const handleSave = () => {
    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanBusiness = business.trim() || cleanName;

    // Validation: Name is required
    if (!cleanName) {
      Alert.alert(
        'Full Name Required',
        'Please enter the customer / farmer full name.'
      );
      return;
    }

    // Validation: 10-digit mobile is required
    if (cleanMobile.length !== 10) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    // Duplicate mobile check across existing contacts
    const duplicate = customers.find(
      (c) =>
        c.mobile.replace(/\D/g, '') === cleanMobile &&
        (!isEditing || c.id !== customerToEdit?.id)
    );
    if (duplicate) {
      Alert.alert(
        'Customer Already Exists',
        `A contact named "${duplicate.name}" is already registered with mobile number +91 ${cleanMobile}.`
      );
      return;
    }

    // Calculate final opening balance:
    // Positive = Customer owes Mandi (Receivable); Negative = Mandi owes Customer (Payable)
    const parsedAmount = parseFloat(openingBalance) || 0;
    const finalOpeningBal =
      parsedAmount > 0
        ? balanceDirection === 'PAYABLE'
          ? -parsedAmount
          : parsedAmount
        : 0;

    const primaryType = resolveCustomerType(selectedTypes);

    Keyboard.dismiss();

    if (isEditing && customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name: cleanName,
        mobile: cleanMobile,
        business: cleanBusiness,
        customerType: primaryType,
        customerRoles: selectedTypes,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Customer Updated',
        `${cleanName} details have been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    const success = addCustomer({
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
      customerType: primaryType,
      customerRoles: selectedTypes,
      openingBalance: finalOpeningBal,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (success) {
      Alert.alert(
        'Customer Saved',
        `${cleanName} has been registered successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not save customer. Please check the details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top + 8, 34),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEditing ? 'Edit Customer' : 'Add Customer'}
          </Text>
          <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {isEditing ? 'Update customer information' : 'Register a new buyer or farmer'}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 28, 36),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SECTION 1: BASIC INFORMATION ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Basic Information
          </Text>

          {/* 1. Customer Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Customer Type <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {CUSTOMER_TYPE_OPTIONS.map((item) => {
                const isSelected = selectedTypes.includes(item.type);
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? '#143823' : '#F0FDF4')
                          : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: isSelected
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#334155' : '#E2E8F0'),
                      },
                    ]}
                    onPress={() => handleToggleType(item.type)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={isSelected ? (isDark ? '#4ADE80' : '#16834A') : (isDark ? '#94A3B8' : '#64748B')}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: isSelected
                            ? (isDark ? '#4ADE80' : '#16834A')
                            : (isDark ? '#CBD5E1' : '#475569'),
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={isDark ? '#4ADE80' : '#16834A'}
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Full Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Full Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.mandatoryBadge}>Mandatory</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={isDark ? '#94A3B8' : '#64748B'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="e.g. Rameshwar Patel"
                placeholderTextColor={colors.inputPlaceholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* 3. Mobile Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Mobile Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.mandatoryBadge}>Mandatory (10 digits)</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <View
                style={[
                  styles.phonePrefixBadge,
                  {
                    backgroundColor: isDark ? '#143823' : '#DCFCE7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.phonePrefixText,
                    { color: isDark ? '#4ADE80' : '#16834A' },
                  ]}
                >
                  +91
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(val) => setMobile(val.replace(/\D/g, ''))}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* 4. Business / Farm Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Business / Farm Name
              </Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={isDark ? '#94A3B8' : '#64748B'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="e.g. Patel Traders / Green Farm"
                placeholderTextColor={colors.inputPlaceholder}
                value={business}
                onChangeText={setBusiness}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        {/* ================= SECTION 2: ACCOUNT INFORMATION ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.labelRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Account Information
            </Text>
            <Text style={styles.optionalBadge}>Default ₹0</Text>
          </View>

          {/* Opening Balance */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Opening Balance (₹)
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <View
                style={[
                  styles.currencyBadge,
                  {
                    backgroundColor: isDark ? '#143823' : '#DCFCE7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: isDark ? '#4ADE80' : '#16834A' },
                  ]}
                >
                  ₹
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}
                placeholder="0"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                value={openingBalance}
                onChangeText={setOpeningBalance}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Balance Type (Who Owes Whom) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Balance Type
            </Text>
            <View style={styles.directionRow}>
              {/* Option A: Customer Owes Mandi */}
              <TouchableOpacity
                style={[
                  styles.directionBtn,
                  balanceDirection === 'RECEIVABLE' && {
                    backgroundColor: isDark ? '#142E1F' : '#F0FDF4',
                    borderColor: isDark ? '#4ADE80' : '#16834A',
                  },
                  balanceDirection !== 'RECEIVABLE' && {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                onPress={() => setBalanceDirection('RECEIVABLE')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={18}
                  color={balanceDirection === 'RECEIVABLE' ? (isDark ? '#4ADE80' : '#16834A') : '#94A3B8'}
                />
                <View style={styles.dirTextCol}>
                  <Text
                    style={[
                      styles.dirMainText,
                      {
                        color: balanceDirection === 'RECEIVABLE'
                          ? (isDark ? '#4ADE80' : '#16834A')
                          : (isDark ? '#94A3B8' : '#475569'),
                        fontWeight: balanceDirection === 'RECEIVABLE' ? '700' : '500',
                      },
                    ]}
                  >
                    Customer Owes Mandi
                  </Text>
                  <Text style={[styles.dirSubText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Receivable from customer
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option B: Mandi Owes Customer */}
              <TouchableOpacity
                style={[
                  styles.directionBtn,
                  balanceDirection === 'PAYABLE' && {
                    backgroundColor: isDark ? '#2D1616' : '#FEF2F2',
                    borderColor: isDark ? '#F87171' : '#DC2626',
                  },
                  balanceDirection !== 'PAYABLE' && {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                onPress={() => setBalanceDirection('PAYABLE')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={18}
                  color={balanceDirection === 'PAYABLE' ? (isDark ? '#F87171' : '#DC2626') : '#94A3B8'}
                />
                <View style={styles.dirTextCol}>
                  <Text
                    style={[
                      styles.dirMainText,
                      {
                        color: balanceDirection === 'PAYABLE'
                          ? (isDark ? '#F87171' : '#DC2626')
                          : (isDark ? '#94A3B8' : '#475569'),
                        fontWeight: balanceDirection === 'PAYABLE' ? '700' : '500',
                      },
                    ]}
                  >
                    Mandi Owes Customer
                  </Text>
                  <Text style={[styles.dirSubText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Payable to customer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= SECTION 3: ADDITIONAL INFORMATION (Collapsible) ================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowAdditionalDetails(!showAdditionalDetails)}
            activeOpacity={0.7}
          >
            <View style={styles.accordionLeft}>
              <View
                style={[
                  styles.accordionIconCircle,
                  { backgroundColor: isDark ? '#143823' : '#F0FDF4' },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={isDark ? '#4ADE80' : '#16834A'}
                />
              </View>
              <View>
                <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                  Additional Information
                </Text>
                <Text style={[styles.accordionSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Address, APMC shop location & remarks (Optional)
                </Text>
              </View>
            </View>

            <Ionicons
              name={showAdditionalDetails ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </TouchableOpacity>

          {showAdditionalDetails && (
            <View style={styles.accordionBody}>
              {/* Address / Location */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Address / APMC Shop Location
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                >
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. Stall #14, APMC Yard Gate 2"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Notes / Reference */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Notes / Reference
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. Reference through Suresh Bhai"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={notes}
                    onChangeText={setNotes}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ================= PRIMARY ACTION BUTTON ================= */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update Customer' : 'Save Customer'}
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
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E2E8F0',
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      flex: 1,
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    headerSub: {
      fontSize: 12,
      marginTop: 1,
    },
    headerRightSpacer: {
      width: 38,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    sectionCard: {
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 14,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    requiredStar: {
      color: '#DC2626',
      fontWeight: '700',
    },
    mandatoryBadge: {
      fontSize: 11,
      color: '#DC2626',
      fontWeight: '600',
    },
    optionalBadge: {
      fontSize: 11,
      color: '#94A3B8',
      fontWeight: '500',
    },

    /* Customer Type Selector */
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
    },
    typeChipText: {
      fontSize: 13,
    },

    /* Inputs */
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    fieldIcon: {
      marginRight: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 10,
    },
    phonePrefixBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 8,
    },
    phonePrefixText: {
      fontSize: 13,
      fontWeight: '700',
    },
    currencyBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    currencySymbol: {
      fontSize: 15,
      fontWeight: '800',
    },

    /* Direction Selector */
    directionRow: {
      gap: 8,
    },
    directionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      gap: 10,
    },
    dirTextCol: {
      flex: 1,
    },
    dirMainText: {
      fontSize: 13,
    },
    dirSubText: {
      fontSize: 11,
      marginTop: 1,
    },

    /* Collapsible Accordion */
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accordionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 8,
    },
    accordionIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accordionTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    accordionSubtitle: {
      fontSize: 11,
      marginTop: 1,
    },
    accordionBody: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },

    /* Save Button */
    saveButton: {
      backgroundColor: '#16834A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      borderRadius: 12,
      gap: 8,
      marginTop: 4,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });
