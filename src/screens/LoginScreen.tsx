import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { demoOwnerProfile, demoOperatorProfile } from '../data/mockData';
import NetworkStatusBanner from '../components/NetworkStatusBanner';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const { loginUser } = useMandi();

  const handleContinue = () => {
    const cleanedMobile = mobile.replace(/\D/g, '');

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    Keyboard.dismiss();

    const demoOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Pass detected demo role if mobile matches known profiles
    let detectedRole: 'Owner' | 'Operator' | undefined = undefined;
    if (cleanedMobile === demoOwnerProfile.mobile) {
      detectedRole = 'Owner';
    } else if (cleanedMobile === demoOperatorProfile.mobile) {
      detectedRole = 'Operator';
    }

    navigation.navigate('Otp', {
      mobile: cleanedMobile,
      demoOtp,
      detectedRole,
    });
  };

  const handleQuickLogin = (role: 'Owner' | 'Operator') => {
    Keyboard.dismiss();
    const profile = role === 'Owner' ? demoOwnerProfile : demoOperatorProfile;
    loginUser(profile);
    navigation.replace('Home');
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
            paddingTop: Math.max(insets.top + 20, 40),
            paddingBottom: Math.max(insets.bottom + 20, 30),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Text style={styles.logo}>CALMandi</Text>

          <Text style={styles.title}>Welcome!</Text>

          <Text style={styles.subtitle}>
            Manage your mandi business with role-based operations.
          </Text>

          {/* Network Status & Offline Simulator Banner */}
          <NetworkStatusBanner />

          {/* Quick Demo Role Logins */}
          <View style={styles.quickLoginCard}>
            <View style={styles.quickLoginHeader}>
              <Ionicons name="flash-outline" size={18} color="#16834A" />
              <Text style={styles.quickLoginTitle}>Quick Role Login</Text>
            </View>
            <Text style={styles.quickLoginSubtitle}>
              Tap a role below to explore role-specific features immediately:
            </Text>

            <View style={styles.roleButtonsRow}>
              {/* Login as Owner */}
              <TouchableOpacity
                style={[styles.roleSelectCard, styles.ownerCard]}
                activeOpacity={0.7}
                onPress={() => handleQuickLogin('Owner')}
              >
                <View style={styles.roleIconCircleOwner}>
                  <Ionicons name="shield-checkmark" size={20} color="#16834A" />
                </View>
                <Text style={styles.roleCardTitle}>Owner Login</Text>
                <Text style={styles.roleCardDesc}>Full Control & Reports</Text>
              </TouchableOpacity>

              {/* Login as Operator */}
              <TouchableOpacity
                style={[styles.roleSelectCard, styles.operatorCard]}
                activeOpacity={0.7}
                onPress={() => handleQuickLogin('Operator')}
              >
                <View style={styles.roleIconCircleOperator}>
                  <Ionicons name="briefcase" size={20} color="#0284C7" />
                </View>
                <Text style={styles.roleCardTitle}>Operator Login</Text>
                <Text style={styles.roleCardDesc}>Stock & Daily Entry</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR LOGIN WITH OTP</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Mobile Number</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor="#999999"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, ''))
            }
          />

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue with OTP</Text>
          </TouchableOpacity>

          {/* Direct Link to Registration */}
          <View style={styles.registerPromptRow}>
            <Text style={styles.registerPromptText}>New to CALMandi? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Registration')}
            >
              <Text style={styles.registerLinkText}>Create Account / Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  form: {
    width: '100%',
  },

  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16834A',
    textAlign: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 22,
    lineHeight: 22,
  },

  quickLoginCard: {
    backgroundColor: '#F7FDF9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#D1EAD8',
    marginBottom: 24,
  },

  quickLoginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  quickLoginTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16834A',
    marginLeft: 6,
  },

  quickLoginSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 14,
  },

  roleButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  roleSelectCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  ownerCard: {
    borderColor: '#A7F3D0',
  },

  operatorCard: {
    borderColor: '#BAE6FD',
  },

  roleIconCircleOwner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  roleIconCircleOperator: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  roleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  roleCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222222',
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#222222',
    backgroundColor: '#FAFAFA',
  },

  button: {
    backgroundColor: '#16834A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  registerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 8,
  },

  registerPromptText: {
    fontSize: 14,
    color: '#666666',
  },

  registerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16834A',
  },
});
