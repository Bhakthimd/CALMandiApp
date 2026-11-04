import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { demoOwnerProfile, demoOperatorProfile } from '../data/mockData';
import CALMandiLogo from '../components/CALMandiLogo';

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { loginUser } = useMandi();
  const { isDark, colors, setThemeMode, theme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Owner');

  const handleLogin = () => {
    navigation.navigate('Login', { role: selectedRole });
  };

  const handleRegister = () => {
    navigation.navigate('Registration', { role: selectedRole });
  };

  const handleInstantDemo = (role: UserRole) => {
    const profile = role === 'Owner' ? demoOwnerProfile : demoOperatorProfile;
    loginUser(profile);
    navigation.replace('Home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Atmospheric Mandi Background Image */}
      <ImageBackground
        source={require('../../assets/mandi_bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Multi-layered Dynamic Translucent Overlay for Theme-aware Contrast */}
        <View style={[styles.overlayGradientTop, { backgroundColor: colors.overlayTop }]} />
        <View style={[styles.overlayDimmer, { backgroundColor: colors.overlayDimmer }]} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 16, 44),
              paddingBottom: Math.max(insets.bottom + 20, 36),
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Bar: APMC Tag & Theme Switcher */}
          <View style={styles.topControlRow}>
            <View
              style={[
                styles.tagBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(23, 36, 28, 0.92)'
                    : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.6)',
                },
              ]}
            >
              <Ionicons name="sparkles" size={13} color={colors.gold} />
              <Text style={[styles.tagBadgeText, { color: colors.primaryDark }]}>
                Smart Krishi APMC
              </Text>
            </View>

            {/* Interactive Light / Dark Theme Segmented Switcher */}
            <View
              style={[
                styles.themeSegmentContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(15, 25, 20, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? colors.border : '#E2E8F0',
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
                  name="sunny"
                  size={13}
                  color={!isDark ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    !isDark
                      ? styles.themeSegmentTextActiveLight
                      : { color: colors.textSecondary },
                  ]}
                >
                  Light
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
                  size={13}
                  color={isDark ? '#0B130E' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    isDark
                      ? styles.themeSegmentTextActiveDark
                      : { color: colors.textSecondary },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Official CALMandi Logo & Tagline Header */}
          <View style={styles.headerSection}>
            <CALMandiLogo size="large" showTagline={false} forceLightText={true} />

            {/* Mandatory Tagline */}
            <View style={styles.taglineContainer}>
              <Text style={styles.taglineText}>
                {theme.typography.tagline}
              </Text>
              <Text style={styles.subTaglineText}>
                Daily auctions, live crate tally, digital khata & slips
              </Text>
            </View>
          </View>

          {/* Role Selection Container */}
          <View
            style={[
              styles.selectionCard,
              {
                backgroundColor: colors.cardSelectionBg,
                borderColor: colors.cardSelectionBorder,
              },
            ]}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Select Your Role
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Tailored experience for business owners & floor staff
            </Text>

            {/* Owner Role Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleCard,
                {
                  backgroundColor: colors.roleCardBg,
                  borderColor: colors.roleCardBorder,
                },
                selectedRole === 'Owner' && {
                  borderColor: colors.primary,
                  backgroundColor: colors.roleCardActiveOwnerBg,
                },
              ]}
              onPress={() => setSelectedRole('Owner')}
            >
              <View style={styles.roleCardLeft}>
                <View
                  style={[
                    styles.roleIconCircle,
                    selectedRole === 'Owner'
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.roleIconInactiveBg },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={24}
                    color={selectedRole === 'Owner' ? '#FFFFFF' : colors.primary}
                  />
                </View>

                <View style={styles.roleTextGroup}>
                  <View style={styles.roleHeaderRow}>
                    <Text
                      style={[
                        styles.roleTitle,
                        { color: colors.textPrimary },
                        selectedRole === 'Owner' && { color: colors.primaryDark },
                      ]}
                    >
                      Owner / Vyapari
                    </Text>
                    <View
                      style={[
                        styles.roleBadgeOwner,
                        { backgroundColor: colors.ownerBadgeBg },
                      ]}
                    >
                      <Text style={[styles.roleBadgeOwnerText, { color: colors.ownerBadgeText }]}>
                        मंडी आढ़ती
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                    Complete business control: Khata, udhaar ledger, profit & staff management.
                  </Text>
                </View>
              </View>

              <View style={styles.radioContainer}>
                <Ionicons
                  name={
                    selectedRole === 'Owner'
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={
                    selectedRole === 'Owner'
                      ? colors.primary
                      : colors.border
                  }
                />
              </View>
            </TouchableOpacity>

            {/* Operator Role Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleCard,
                {
                  backgroundColor: colors.roleCardBg,
                  borderColor: colors.roleCardBorder,
                },
                selectedRole === 'Operator' && {
                  borderColor: colors.operatorPrimary,
                  backgroundColor: colors.roleCardActiveOperatorBg,
                },
              ]}
              onPress={() => setSelectedRole('Operator')}
            >
              <View style={styles.roleCardLeft}>
                <View
                  style={[
                    styles.roleIconCircle,
                    selectedRole === 'Operator'
                      ? { backgroundColor: colors.operatorPrimary }
                      : { backgroundColor: colors.roleIconInactiveBg },
                  ]}
                >
                  <Ionicons
                    name="cube"
                    size={24}
                    color={
                      selectedRole === 'Operator'
                        ? '#FFFFFF'
                        : colors.operatorPrimary
                    }
                  />
                </View>

                <View style={styles.roleTextGroup}>
                  <View style={styles.roleHeaderRow}>
                    <Text
                      style={[
                        styles.roleTitle,
                        { color: colors.textPrimary },
                        selectedRole === 'Operator' && { color: colors.operatorBadgeText },
                      ]}
                    >
                      Floor Operator
                    </Text>
                    <View
                      style={[
                        styles.roleBadgeOperator,
                        { backgroundColor: colors.operatorBadgeBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeOperatorText,
                          { color: colors.operatorBadgeText },
                        ]}
                      >
                        मुनीम / स्टाफ
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
                    Fast floor operations: Live crate clicker, gate in/out slips & cash drawer.
                  </Text>
                </View>
              </View>

              <View style={styles.radioContainer}>
                <Ionicons
                  name={
                    selectedRole === 'Operator'
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={
                    selectedRole === 'Operator'
                      ? colors.operatorPrimary
                      : colors.border
                  }
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Primary Action Buttons: Register & Login */}
          <View style={styles.actionsContainer}>
            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
                selectedRole === 'Operator' && {
                  backgroundColor: colors.operatorPrimary,
                  shadowColor: colors.operatorPrimary,
                },
              ]}
              onPress={handleLogin}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                Login as {selectedRole}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: colors.secondaryBtnBg,
                  borderColor: colors.secondaryBtnBorder,
                },
              ]}
              onPress={handleRegister}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={colors.secondaryBtnText}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.secondaryBtnText, { color: colors.secondaryBtnText }]}>
                Register New Mandi Account
              </Text>
            </TouchableOpacity>

            {/* Quick 1-Tap Demo Shortcuts for Fast Evaluation */}
            <View style={styles.demoBar}>
              <Text style={styles.demoBarLabel}>Or test instantly:</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[
                    styles.demoChip,
                    {
                      backgroundColor: colors.demoChipBg,
                      borderColor: colors.demoChipBorder,
                    },
                  ]}
                  onPress={() => handleInstantDemo('Owner')}
                >
                  <Text style={[styles.demoChipText, { color: colors.primaryDark }]}>
                    👑 Owner Demo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[
                    styles.demoChip,
                    {
                      backgroundColor: colors.demoChipBg,
                      borderColor: colors.demoChipBorderOperator,
                    },
                  ]}
                  onPress={() => handleInstantDemo('Operator')}
                >
                  <Text
                    style={[
                      styles.demoChipTextOperator,
                      { color: colors.operatorBadgeText },
                    ]}
                  >
                    👷 Operator Demo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            CALMandi v1.0 • Built for Indian APMC & Krishi Mandi Mandals
          </Text>
        </ScrollView>
      </ImageBackground>
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
  overlayGradientTop: {
    ...StyleSheet.absoluteFill,
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
    marginBottom: 16,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  themeSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  themeSegmentActiveLight: {
    backgroundColor: '#16834A',
  },
  themeSegmentActiveDark: {
    backgroundColor: '#22C55E',
  },
  themeSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  themeSegmentTextActiveLight: {
    color: '#FFFFFF',
  },
  themeSegmentTextActiveDark: {
    color: '#0B130E',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  taglineText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.2,
  },
  subTaglineText: {
    fontSize: 13,
    color: '#E8F5EC',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  selectionCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleTextGroup: {
    flex: 1,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadgeOwner: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleBadgeOwnerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleBadgeOperator: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleBadgeOperatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioContainer: {
    marginLeft: 4,
  },
  actionsContainer: {
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  demoBar: {
    alignItems: 'center',
    marginTop: 2,
  },
  demoBarLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  demoChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoChipTextOperator: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
