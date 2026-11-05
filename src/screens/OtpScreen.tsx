import React, { useState, useEffect, useRef } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { demoOwnerProfile, demoOperatorProfile } from '../data/mockData';

export default function OtpScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { loginUser } = useMandi();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const mobile = route?.params?.mobile || '';
  const initialOtp = route?.params?.demoOtp || '1234';
  const detectedRole = route?.params?.detectedRole;

  const [expectedOtp, setExpectedOtp] = useState<string>(initialOtp);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [isFocused, setIsFocused] = useState<boolean>(true);

  const inputRef = useRef<any>(null);

  // 30-second countdown for resend timer
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle Resend Demo OTP
  const handleResend = () => {
    if (timer > 0) return;

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedOtp(newCode);
    setEnteredOtp('');
    setTimer(30);

    Alert.alert(
      'New OTP Generated',
      `Your new 4-digit demo verification code is: ${newCode}`,
      [{ text: 'OK', onPress: () => inputRef.current?.focus() }]
    );
  };

  // Quick auto-fill helper for smooth testing
  const handleAutoFill = () => {
    setEnteredOtp(expectedOtp);
    Keyboard.dismiss();
  };

  // Verify OTP handler
  const handleVerify = () => {
    Keyboard.dismiss();

    if (enteredOtp.length !== 4) {
      Alert.alert(
        'Incomplete OTP',
        'Please enter all 4 digits of the verification code.'
      );
      return;
    }

    if (enteredOtp !== expectedOtp) {
      Alert.alert(
        'Incorrect OTP',
        `The code you entered does not match.\n\nDemo Hint: The correct code is ${expectedOtp}`,
        [{ text: 'Try Again', onPress: () => inputRef.current?.focus() }]
      );
      return;
    }

    // Success -> proceed to Home if known account or Registration for new account
    if (detectedRole) {
      const profile = detectedRole === 'Owner' ? demoOwnerProfile : demoOperatorProfile;
      Alert.alert(
        'Verification Successful!',
        `Welcome back, ${profile.name}!\nLogging in as ${detectedRole}.`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => {
              loginUser(profile);
              navigation.replace('Home');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Mobile Verified!',
        'Your phone number has been verified successfully. Please set up your Mandi profile.',
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.navigate('Registration', {
                mobile,
              });
            },
          },
        ]
      );
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
            paddingBottom: Math.max(insets.bottom + 20, 30),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Change Number</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.logo}>CALMandi</Text>

        <Text style={styles.title}>Verify Phone Number</Text>

        <Text style={styles.subtitle}>
          We have sent a 4-digit verification code to{' '}
          <Text style={styles.boldText}>+91 {mobile}</Text>
        </Text>

        {/* Demo Notice Banner */}
        <View style={styles.demoBanner}>
          <View style={styles.demoBannerHeader}>
            <Ionicons name="information-circle" size={20} color="#16834A" />
            <Text style={styles.demoBannerTitle}>Demo Mode</Text>
          </View>
          <Text style={styles.demoBannerText}>
            Your 4-digit demo OTP is{' '}
            <Text style={styles.demoOtpCode}>{expectedOtp}</Text>
          </Text>
          <TouchableOpacity
            style={styles.autoFillButton}
            activeOpacity={0.7}
            onPress={handleAutoFill}
          >
            <Ionicons name="flash-outline" size={16} color="#16834A" />
            <Text style={styles.autoFillText}>Tap to Auto-fill</Text>
          </TouchableOpacity>
        </View>

        {/* 4-Digit Input Boxes Container */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpBoxesContainer}
          onPress={() => inputRef.current?.focus()}
        >
          {[0, 1, 2, 3].map((index) => {
            const digit = enteredOtp[index] || '';
            const isActive = isFocused && enteredOtp.length === index;

            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  isActive && styles.otpBoxActive,
                  digit ? styles.otpBoxFilled : null,
                ]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Hidden TextInput for native keyboard integration */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={4}
          value={enteredOtp}
          onChangeText={(val) => setEnteredOtp(val.replace(/\D/g, ''))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={true}
        />

        {/* Resend OTP Section */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResend}
              style={styles.resendButton}
            >
              <Ionicons name="refresh-outline" size={18} color="#16834A" />
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            enteredOtp.length < 4 && styles.verifyButtonDisabled,
          ]}
          activeOpacity={0.7}
          onPress={handleVerify}
        >
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  backText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  themeToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  demoBanner: {
    backgroundColor: isDark ? colors.surfaceElevated : '#E8F4EC',
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#C2E5CD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 30,
    alignItems: 'center',
  },
  demoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBannerText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  demoOtpCode: {
    fontWeight: '900',
    fontSize: 18,
    color: isDark ? '#4ADE80' : '#0E5C32',
    letterSpacing: 2,
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  autoFillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: isDark ? colors.surfaceElevated : '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  otpDigit: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
    minHeight: 30,
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timerCount: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: isDark ? '#1C3E2B' : '#A0D2B4',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});