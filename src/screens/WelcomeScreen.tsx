import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelectorModal from '../components/LanguageSelectorModal';

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, setThemeMode } = useTheme();
  const { currentLanguageOption, t } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Owner');

  const handleContinue = () => {
    navigation.navigate('Login', { role: selectedRole });
  };

  const handleRegister = () => {
    navigation.navigate('Registration', { role: selectedRole });
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0F1D' : '#0F172A' }]}>
      <StatusBar style="light" />

      {/* Atmospheric Indian Wholesale Vegetable Mandi Background */}
      <ImageBackground
        source={require('../../assets/mandi_bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Translucent Overlay so text and controls remain readable */}
        <View
          style={[
            styles.overlayDimmer,
            {
              backgroundColor: isDark
                ? 'rgba(10, 15, 29, 0.78)'
                : 'rgba(15, 23, 42, 0.42)',
            },
          ]}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 12, 40),
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Bar: Light/Dark Switcher & Language Selector */}
          <View style={styles.topControlRow}>
            {/* Segmented Theme Switcher */}
            <View
              style={[
                styles.themeSegmentContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 41, 59, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.themeSegmentBtn,
                  !isDark && styles.themeSegmentActiveLight,
                ]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons
                  name="sparkles"
                  size={12}
                  color={!isDark ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    !isDark
                      ? styles.themeSegmentTextActive
                      : { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('lightMode', 'Light')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.themeSegmentBtn,
                  isDark && styles.themeSegmentActiveDark,
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons
                  name="moon"
                  size={12}
                  color={isDark ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    isDark
                      ? styles.themeSegmentTextActive
                      : { color: '#64748B' },
                  ]}
                >
                  {t('darkMode', 'Dark')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Language Selector Pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.langPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 41, 59, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              onPress={() => setLangModalVisible(true)}
            >
              <Ionicons
                name="globe-outline"
                size={14}
                color={isDark ? '#4ADE80' : '#16834A'}
              />
              <Text
                style={[
                  styles.langPillText,
                  { color: isDark ? '#FFFFFF' : '#1E293B' },
                ]}
              >
                {currentLanguageOption.name || 'English'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          {/* Logo & Brand Identity */}
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.logoSquircle,
                {
                  borderColor: isDark ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 255, 255, 0.35)',
                  backgroundColor: isDark ? '#020617' : '#0F172A',
                },
              ]}
            >
              <Image
                source={require('../../assets/app_logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.appTitle}>CAL Mandi</Text>
            <Text style={styles.appSubtitle}>{t('tagline', 'Mandi operations made easy')}</Text>
          </View>

          {/* Role Selection Card */}
          <View
            style={[
              styles.selectionCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#F1F5F9',
                borderWidth: isDark ? 1.5 : 0,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="globe-outline"
                size={18}
                color={isDark ? '#4ADE80' : '#16834A'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? '#FFFFFF' : '#1E293B' },
                ]}
              >
                {t('chooseYourRole', 'Choose your role')}
              </Text>
            </View>

            {/* Option 1: Mandi Owner */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleOptionCard,
                selectedRole === 'Owner'
                  ? [
                      styles.roleOptionSelected,
                      {
                        backgroundColor: isDark ? '#143823' : '#F0FDF4',
                        borderColor: isDark ? '#4ADE80' : '#16834A',
                      },
                    ]
                  : [
                      styles.roleOptionUnselected,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ],
              ]}
              onPress={() => setSelectedRole('Owner')}
            >
              <View style={styles.roleLeft}>
                <View
                  style={[
                    styles.roleIconCircle,
                    {
                      backgroundColor: selectedRole === 'Owner'
                        ? '#16834A'
                        : isDark
                        ? '#1E293B'
                        : '#DCFCE7',
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={selectedRole === 'Owner' ? '#FFFFFF' : isDark ? '#4ADE80' : '#16834A'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabelText,
                    { color: isDark ? '#FFFFFF' : '#1E293B' },
                  ]}
                >
                  {t('ownerRoleTitle', 'Mandi Owner')}
                </Text>
              </View>

              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === 'Owner'
                    ? [styles.radioOuterActive, { borderColor: isDark ? '#4ADE80' : '#16834A' }]
                    : [styles.radioOuterInactive, { borderColor: isDark ? '#475569' : '#CBD5E1' }],
                ]}
              >
                {selectedRole === 'Owner' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: isDark ? '#4ADE80' : '#16834A' },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Option 2: Floor Operator */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleOptionCard,
                selectedRole === 'Operator'
                  ? [
                      styles.roleOptionSelected,
                      {
                        backgroundColor: isDark ? '#143823' : '#F0FDF4',
                        borderColor: isDark ? '#4ADE80' : '#16834A',
                      },
                    ]
                  : [
                      styles.roleOptionUnselected,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ],
              ]}
              onPress={() => setSelectedRole('Operator')}
            >
              <View style={styles.roleLeft}>
                <View
                  style={[
                    styles.roleIconCircle,
                    {
                      backgroundColor: isDark ? '#3B2904' : '#FFEDD5',
                    },
                  ]}
                >
                  <Ionicons
                    name="cube"
                    size={18}
                    color={isDark ? '#FBBF24' : '#EA580C'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabelText,
                    { color: isDark ? '#FFFFFF' : '#1E293B' },
                  ]}
                >
                  {t('operatorRoleTitle', 'Floor Operator')}
                </Text>
              </View>

              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === 'Operator'
                    ? [styles.radioOuterActive, { borderColor: isDark ? '#4ADE80' : '#16834A' }]
                    : [styles.radioOuterInactive, { borderColor: isDark ? '#475569' : '#CBD5E1' }],
                ]}
              >
                {selectedRole === 'Operator' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: isDark ? '#4ADE80' : '#16834A' },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.continueBtn}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>
                {selectedRole === 'Owner'
                  ? t('continueAsOwner', 'Continue as Owner')
                  : t('continueAsOperator', 'Continue as Operator')}
              </Text>
            </TouchableOpacity>

            {/* Secondary Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.registerBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handleRegister}
            >
              <Text
                style={[
                  styles.registerBtnText,
                  { color: isDark ? '#FFFFFF' : '#1E293B' },
                ]}
              >
                {t('registerButtonText', 'Register New Mandi Account')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Footer Note */}
          <Text style={styles.footerNote}>
            {t('appPlatformFooter', 'CAL Mandi v1.0 • Built for Indian APMC & Krishi Mandi Marketplace')}
          </Text>
        </ScrollView>
      </ImageBackground>

      {/* Floating Settings Gear Icon */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.floatingSettingsBtn,
          {
            bottom: Math.max(insets.bottom + 12, 20),
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
        onPress={handleOpenSettings}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color={isDark ? '#FFFFFF' : '#1E293B'}
        />
      </TouchableOpacity>

      {/* Language Modal */}
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayDimmer: {
    ...StyleSheet.absoluteFill,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  themeSegmentActiveLight: {
    backgroundColor: '#16834A',
  },
  themeSegmentActiveDark: {
    backgroundColor: '#16834A',
  },
  themeSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  themeSegmentTextActive: {
    color: '#FFFFFF',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  logoSquircle: {
    width: 78,
    height: 78,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  logoImage: {
    width: 78,
    height: 78,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  appSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F1F5F9',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  selectionCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginVertical: 4,
  },
  roleOptionSelected: {
    borderWidth: 1.5,
  },
  roleOptionUnselected: {
    borderWidth: 1,
  },
  roleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderWidth: 2,
  },
  radioOuterInactive: {
    borderWidth: 1.5,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionsContainer: {
    width: '100%',
  },
  continueBtn: {
    backgroundColor: '#16834A',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floatingSettingsBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
