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
import { useLanguage } from '../context/LanguageContext';
import { demoOwnerProfile, demoOperatorProfile } from '../data/mockData';

export default function OtpScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { loginUser } = useMandi();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const mobile = route?.params?.mobile || '9876543210';
  const initialOtp = route?.params?.demoOtp || '1234';
  const userProfile = route?.params?.userProfile;
  const detectedRole = route?.params?.detectedRole;

  const [expectedOtp, setExpectedOtp] = useState<string>(initialOtp);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const inputRef = useRef<any>(null);

  // 30-second countdown timer
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

  const handleResend = () => {
    if (timer > 0) return;
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedOtp(newCode);
    setEnteredOtp('');
    setTimer(30);
    Alert.alert(
      t('newOtpGenerated', 'New Code Generated'),
      `Your demo verification code is: ${newCode}`
    );
    inputRef.current?.focus();
  };

  const handleAutoFill = () => {
    setEnteredOtp(expectedOtp);
    Keyboard.dismiss();
  };

  const handleVerify = () => {
    Keyboard.dismiss();

    if (enteredOtp.length !== 4) {
      Alert.alert(
        t('incompleteCode', 'Incomplete Code'),
        'Please enter all 4 digits of the verification code.'
      );
      return;
    }

    if (enteredOtp !== expectedOtp) {
      Alert.alert(
        t('incorrectOtp', 'Incorrect Code'),
        `The code entered does not match.\nDemo code: ${expectedOtp}`
      );
      return;
    }

    setIsVerifying(true);

    const profileToLogin =
      userProfile ||
      (detectedRole === 'Operator' ? demoOperatorProfile : demoOwnerProfile);

    loginUser(profileToLogin);

    Alert.alert(
      `✅ ${t('loginSuccessful', 'Verification Successful')}`,
      `Welcome, ${profileToLogin.name}! Logged in as ${profileToLogin.role}.`,
      [
        {
          text: t('goToDashboard', 'Go to Dashboard'),
          onPress: () => navigation.replace('Home'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8FAF8' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 20, 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back / Change Mobile Link */}
        <TouchableOpacity
          style={styles.changeMobileRow}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={[styles.changeMobileText, { color: colors.textPrimary }]}>
            Change Mobile Number
          </Text>
        </TouchableOpacity>

        {/* Verification Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#16834A" />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Enter Verification Code
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 4-digit verification code to
          </Text>
          <Text style={[styles.phoneHighlight, { color: colors.textPrimary }]}>
            +91 {mobile}
          </Text>

          {/* Hidden or styled TextInput with 4 digit boxes */}
          <TouchableOpacity
            style={styles.otpBoxesRow}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            {[0, 1, 2, 3].map((idx) => {
              const char = enteredOtp[idx] || '';
              const isCurrent = enteredOtp.length === idx;
              return (
                <View
                  key={`box_${idx}`}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: isCurrent
                        ? '#16834A'
                        : isDark
                        ? colors.border
                        : '#CBD5E1',
                    },
                    char ? styles.otpBoxFilled : null,
                  ]}
                >
                  <Text style={[styles.otpDigit, { color: colors.textPrimary }]}>
                    {char}
                  </Text>
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Hidden native input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={4}
            value={enteredOtp}
            onChangeText={(text) => setEnteredOtp(text.replace(/\D/g, ''))}
            autoFocus
          />

          {/* Quick Demo Autofill Pill */}
          <TouchableOpacity
            style={[
              styles.autoFillBtn,
              { backgroundColor: isDark ? '#143823' : '#F0FDF4' },
            ]}
            activeOpacity={0.7}
            onPress={handleAutoFill}
          >
            <Ionicons name="sparkles" size={14} color="#16834A" />
            <Text style={styles.autoFillText}>
              Auto-fill Demo Code ({expectedOtp})
            </Text>
          </TouchableOpacity>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              (enteredOtp.length !== 4 || isVerifying) && styles.verifyBtnDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleVerify}
            disabled={enteredOtp.length !== 4 || isVerifying}
          >
            <Text style={styles.verifyBtnText}>
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>

          {/* Resend Row */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                Resend code in <Text style={{ fontWeight: '700' }}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendBtnText}>Resend Code</Text>
              </TouchableOpacity>
            )}
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
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  changeMobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  changeMobileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  phoneHighlight: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 20,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  otpBox: {
    width: 54,
    height: 58,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#16834A',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  autoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16834A',
  },
  verifyBtn: {
    backgroundColor: '#16834A',
    borderRadius: 14,
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  verifyBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
  },
  resendBtnText: {
    color: '#16834A',
    fontSize: 13,
    fontWeight: '800',
  },
});
