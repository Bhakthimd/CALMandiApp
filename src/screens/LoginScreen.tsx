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
import { useTheme } from '../context/ThemeContext';
import { demoOwnerProfile, demoOperatorProfile } from '../data/mockData';
import { UserRole } from '../types';
import CALMandiLogo from '../components/CALMandiLogo';

export default function LoginScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const { colors, isDark, toggleTheme } = useTheme();
  const targetRole: UserRole = route?.params?.role || 'Owner';

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

    let detectedRole: UserRole | undefined = undefined;
    if (cleanedMobile === demoOwnerProfile.mobile) {
      detectedRole = 'Owner';
    } else if (cleanedMobile === demoOperatorProfile.mobile) {
      detectedRole = 'Operator';
    } else {
      detectedRole = targetRole;
    }

    navigation.navigate('Otp', {
      mobile: cleanedMobile,
      demoOtp,
      detectedRole,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Header Back Button */}
      <View
        style={[
          styles.topNavBar,
          {
            paddingTop: Math.max(insets.top + 10, 20),
            backgroundColor: colors.background,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Welcome')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Home</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.gold} />
          </TouchableOpacity>

        {/* Role Pill Indicator */}
        <View
          style={[
            styles.rolePill,
            targetRole === 'Operator'
              ? { backgroundColor: colors.operatorBadgeBg, borderColor: colors.operatorPrimary }
              : { backgroundColor: colors.ownerBadgeBg, borderColor: colors.primary },
          ]}
        >
          <Ionicons
            name={targetRole === 'Owner' ? 'shield-checkmark' : 'cube'}
            size={14}
            color={targetRole === 'Owner' ? colors.primaryDark : colors.operatorBadgeText}
          />
          <Text
            style={[
              styles.rolePillText,
              {
                color: targetRole === 'Owner' ? colors.primaryDark : colors.operatorBadgeText,
              },
            ]}
          >
            {targetRole === 'Owner' ? 'Owner Login' : 'Operator Login'}
          </Text>
        </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: 10,
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
            <CALMandiLogo size="medium" showTagline={true} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Enter Mobile Number
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We will send you a 4-digit verification code.
            </Text>
          </View>

          
          {/* Mobile Number Input */}
          <Text style={[styles.label, { color: colors.textPrimary }]}>Mobile Number</Text>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.prefixContainer,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRightColor: colors.border,
                },
              ]}
            >
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={[styles.prefixText, { color: colors.textPrimary }]}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                mobile.length > 0 ? styles.inputWithText : styles.inputPlaceholder,
                { color: colors.textPrimary },
              ]}
              placeholder="enter your phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(value) =>
                setMobile(value.replace(/\D/g, ''))
              }
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: targetRole === 'Operator' ? colors.operatorPrimary : colors.primary,
                shadowColor: targetRole === 'Operator' ? colors.operatorPrimary : colors.primary,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerPromptRow}>
            <Text style={[styles.registerPromptText, { color: colors.textSecondary }]}>
              New to CAL Mandi?{' '}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Registration', { role: targetRole })}
            >
              <Text style={[styles.registerLinkText, { color: colors.primary }]}>
                Register here
              </Text>
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
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 22,
    overflow: 'hidden',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
  },
  flagText: {
    fontSize: 16,
    marginRight: 4,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  inputPlaceholder: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
  },
  inputWithText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  registerLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
