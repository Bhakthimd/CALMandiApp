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
import { UserProfile, UserRole } from '../types';

export default function RegistrationScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { loginUser } = useMandi();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(route?.params?.mobile || '');
  const [business, setBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<UserRole>(route?.params?.role || 'Owner');

  // Registration validation and navigation
  const handleRegister = () => {
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

    const userProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanedName,
      mobile: cleanedMobile,
      business: cleanedBusiness,
      location: cleanedLocation,
      role,
    };

    loginUser(userProfile);

    Alert.alert(
      'Registration Successful!',
      `Welcome to CALMandi, ${cleanedName}!\nRegistered as ${role}.`,
      [
        {
          text: 'Open Mandi Dashboard',
          onPress: () => {
            navigation.replace('Home');
          },
        },
      ]
    );
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
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerLogo}>CALMandi</Text>
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
          placeholderTextColor="#999999"
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
          placeholderTextColor="#999999"
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
          placeholderTextColor="#999999"
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
          placeholderTextColor="#999999"
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 6,
    paddingRight: 10,
  },

  backButtonText: {
    fontSize: 16,
    color: '#16834A',
    fontWeight: '600',
  },

  headerLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },

  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#16834A',
    textAlign: 'center',
    marginBottom: 25,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#777777',
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#222222',
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
    borderColor: '#DDDDDD',
    borderRadius: 10,
    alignItems: 'center',
  },

  selectedRole: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },

  roleText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },

  selectedRoleText: {
    color: '#FFFFFF',
  },

  button: {
    backgroundColor: '#16834A',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
