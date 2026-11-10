import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types';

export default function RegistrationScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { registerOwner, registerOperator } = useMandi();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(route?.params?.mobile || '');
  const [business, setBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<UserRole>(route?.params?.role || 'Owner');

  // Registration validation and navigation
  const handleRegister = async () => {
    const cleanedName = name.trim();
    const cleanedMobile = mobile.replace(/\D/g, '');
    const cleanedBusiness = business.trim();
    const cleanedLocation = location.trim();

    if (
      !cleanedName ||
      !cleanedMobile ||
      !cleanedBusiness ||
      !cleanedLocation
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill all fields.'
      );
      return;
    }

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        'Invalid Mobile',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    Keyboard.dismiss();

    try {
      if (role === 'Owner') {
        await registerOwner({
          name: cleanedName,
          mobile: cleanedMobile,
          business: cleanedBusiness,
          location: cleanedLocation,
        });
      } else {
        await registerOperator({
          name: cleanedName,
          mobile: cleanedMobile,
          business: cleanedBusiness,
          location: cleanedLocation,
        });
      }

      Alert.alert(
        'Registration Successful!',
        `Welcome to CAL Mandi, ${cleanedName}!\nRegistered as ${role}.`,
        [
          {
            text: 'Open Mandi Dashboard',
            onPress: () => {
              navigation.replace('Home');
            },
          },
        ]
      );
    } catch {
      Alert.alert('Registration Failed', 'Could not save profile. Please try again.');
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
            paddingTop: Math.max(insets.top + 20, 45),
            paddingBottom: Math.max(insets.bottom + 25, 40),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Welcome')}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? colors.textPrimary : colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerLogo}>CAL Mandi</Text>
        </View>

        <Text style={styles.title}>
          Create Your Account
        </Text>

        <Text style={styles.subtitle}>
          Enter your details to get started.
        </Text>

        {/* Owner Name */}
        <Text style={styles.label}>Owner Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter owner / trader name"
          placeholderTextColor={colors.inputPlaceholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Mobile Number */}
        <Text style={styles.label}>Mobile Number</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter mobile number"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(value) =>
            setMobile(value.replace(/\D/g, ''))
          }
          returnKeyType="next"
        />

        {/* Business Name */}
        <Text style={styles.label}>Mandi / Business Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter business name"
          placeholderTextColor={colors.inputPlaceholder}
          value={business}
          onChangeText={setBusiness}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Location */}
        <Text style={styles.label}>Location</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your location"
          placeholderTextColor={colors.inputPlaceholder}
          value={location}
          onChangeText={setLocation}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {/* Role Selection */}
        <Text style={styles.label}>Select Your Role</Text>

        <View style={styles.roleContainer}>
          {(['Owner', 'Operator'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.7}
              style={[
                styles.roleButton,
                role === item && styles.selectedRole,
              ]}
              onPress={() => {
                Keyboard.dismiss();
                setRole(item);
              }}
            >
              <Text
                style={[
                  styles.roleText,
                  role === item && styles.selectedRoleText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>
            Register
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles
const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 25,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 10,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: isDark ? colors.textPrimary : colors.primary,
    fontWeight: '600',
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : colors.primary,
  },
  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : colors.primary,
    textAlign: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 5,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
  },
  selectedRole: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  selectedRoleText: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});