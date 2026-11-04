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

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const { loginUser } = useMandi();

  const handleContinue = () => {
    const cleanedMobile = mobile.replace(/\D/g, '');

    if (cleanedMobile.length !== 10) {
      Alert.alert(
        'Invalid Mobile',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    Keyboard.dismiss();

    const demoOtp = Math.floor(1000 + Math.random() * 9000).toString();

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

  const handleQuickDemo = (role: 'Owner' | 'Operator') => {
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
            paddingTop: Math.max(insets.top + 30, 50),
            paddingBottom: Math.max(insets.bottom + 20, 30),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Logo & Welcome */}
          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.logo}>CALMandi</Text>
            <Text style={styles.title}>Enter Mobile Number</Text>
            <Text style={styles.subtitle}>
              We will send you a 4-digit verification code.
            </Text>
          </View>

          {/* Mobile Number Input */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(value) =>
                setMobile(value.replace(/\D/g, ''))
              }
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerPromptRow}>
            <Text style={styles.registerPromptText}>New to CALMandi? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Registration')}
            >
              <Text style={styles.registerLinkText}>Register here</Text>
            </TouchableOpacity>
          </View>

          {/* Subtle Quick Demo Bar for Testing */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>1-Tap Demo Test:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoChip}
                activeOpacity={0.7}
                onPress={() => handleQuickDemo('Owner')}
              >
                <Text style={styles.demoChipText}>👑 Owner Demo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoChip, styles.demoChipOperator]}
                activeOpacity={0.7}
                onPress={() => handleQuickDemo('Operator')}
              >
                <Text style={styles.demoChipTextOperator}>👷 Operator Demo</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 24,
  },
  form: {
    width: '100%',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16834A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16834A',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 22,
    overflow: 'hidden',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#EEEEEE',
    borderRightWidth: 1,
    borderRightColor: '#CCCCCC',
  },
  flagText: {
    fontSize: 18,
    marginRight: 6,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    letterSpacing: 1,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16834A',
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
  registerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  registerPromptText: {
    fontSize: 15,
    color: '#666666',
  },
  registerLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16834A',
  },
  demoSection: {
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 10,
    fontWeight: '600',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoChip: {
    backgroundColor: '#E8F5EC',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7E8D3',
  },
  demoChipText: {
    color: '#16834A',
    fontSize: 13,
    fontWeight: '600',
  },
  demoChipOperator: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  demoChipTextOperator: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
});
