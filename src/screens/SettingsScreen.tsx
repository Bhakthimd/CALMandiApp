import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { SupportedLanguage } from '../types';
import BottomNavBar from '../components/BottomNavBar';

type SettingsThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, currentLanguageOption, availableLanguages, t } = useLanguage();
  const { currentUser, isOwner, switchRole, logout } = useMandi();
  const { themeMode, setThemeMode, isDark } = useTheme();

  const handleSelectTheme = (mode: SettingsThemeMode) => {
    setThemeMode(mode);
  };

  // High-contrast, fully visible theme palette tailored for SettingsScreen
  const colors = useMemo(() => {
    return isDark
      ? {
          bg: '#121212',
          headerBg: '#1E1E1E',
          cardBg: '#1E1E1E',
          cardBorder: '#383838',
          border: '#383838',
          textPrimary: '#FFFFFF',
          textSecondary: '#BDBDBD',
          textMuted: '#757575',
          primaryGreen: '#22C55E',
          greenText: '#4ADE80',
          greenBadgeBg: '#143823',
          greenBadgeBorder: '#22C55E',
          greenWrapBg: '#143823',
          activeOptionBg: '#143823',
          activeOptionBorder: '#22C55E',
          activeOptionText: '#4ADE80',
          unselectedOptionBg: '#252525',
          unselectedOptionBorder: '#383838',
          unselectedOptionText: '#FFFFFF',
          goldWrapBg: '#3B2904',
          goldIcon: '#FBBF24',
          purpleWrapBg: '#2E1065',
          purpleIcon: '#A78BFA',
          roleBtnBg: '#252525',
          roleBtnBorder: '#383838',
          roleBtnText: '#FFFFFF',
          logoutBtnBg: '#3B1515',
          logoutBtnBorder: '#5C1D1D',
          logoutBtnText: '#FCA5A5',
          logoutIcon: '#F87171',
          syncBtnBg: '#143823',
          syncBtnBorder: '#22C55E',
          syncBtnText: '#4ADE80',
          divider: '#383838',
          chevron: '#BDBDBD',
        }
      : {
          bg: '#F8FAF8',
          headerBg: '#FFFFFF',
          cardBg: '#FFFFFF',
          cardBorder: '#E2E8F0',
          border: '#E2E8F0',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          textMuted: '#64748B',
          primaryGreen: '#16864B',
          greenText: '#15803D',
          greenBadgeBg: '#DCFCE7',
          greenBadgeBorder: '#BBF7D0',
          greenWrapBg: '#DCFCE7',
          activeOptionBg: '#F0FDF4',
          activeOptionBorder: '#16864B',
          activeOptionText: '#15803D',
          unselectedOptionBg: '#F8FAFC',
          unselectedOptionBorder: '#E2E8F0',
          unselectedOptionText: '#334155',
          goldWrapBg: '#FEF3C7',
          goldIcon: '#D97706',
          purpleWrapBg: '#E0E7FF',
          purpleIcon: '#4F46E5',
          roleBtnBg: '#F1F5F9',
          roleBtnBorder: '#CBD5E1',
          roleBtnText: '#0F172A',
          logoutBtnBg: '#FEE2E2',
          logoutBtnBorder: '#FECACA',
          logoutBtnText: '#DC2626',
          logoutIcon: '#DC2626',
          syncBtnBg: '#DCFCE7',
          syncBtnBorder: '#BBF7D0',
          syncBtnText: '#15803D',
          divider: '#E2E8F0',
          chevron: '#64748B',
        };
  }, [isDark]);

  const handleToggleRole = () => {
    const nextRole = isOwner ? 'Operator' : 'Owner';
    switchRole(nextRole);
    Alert.alert(
      t('roleSwitched', 'Role Switched'),
      t(
        'roleSwitchedMsg',
        `You are now viewing as ${nextRole}. Dashboard metrics and permissions updated.`,
        { role: nextRole }
      )
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle', 'Logout'),
      t('logoutConfirmMsg', 'Are you sure you want to log out of CAL Mandi?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('logout', 'Logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 34),
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#252525' : '#F1F5F9' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('settingsTitle', 'Settings & Preferences')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('settingsSubtitle', 'Appearance, language & mandi configuration')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION A: LANGUAGE SETTINGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.greenWrapBg }]}>
              <Ionicons name="globe-outline" size={18} color={isDark ? '#4ADE80' : '#16834A'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('languageSectionTitle', 'Language Settings')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {t('languageSectionSub', 'Select your preferred language')}
              </Text>
            </View>
            <View
              style={[
                styles.currentLangPill,
                {
                  backgroundColor: colors.greenBadgeBg,
                  borderColor: colors.greenBadgeBorder,
                },
              ]}
            >
              <Text style={styles.currentLangEmoji}>{currentLanguageOption.flagEmoji}</Text>
              <Text style={[styles.currentLangText, { color: colors.greenText }]}>
                {currentLanguageOption.nativeName}
              </Text>
            </View>
          </View>

          {/* Compact 2-Column Language Grid */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.languageGrid}>
              {availableLanguages.map((opt) => {
                const isSelected = opt.code === language;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    style={[
                      styles.langGridItem,
                      {
                        backgroundColor: isSelected
                          ? colors.activeOptionBg
                          : colors.unselectedOptionBg,
                        borderColor: isSelected
                          ? colors.activeOptionBorder
                          : colors.unselectedOptionBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setLanguage(opt.code as SupportedLanguage)}
                  >
                    <Text style={styles.langGridEmoji}>{opt.flagEmoji}</Text>
                    <Text
                      style={[
                        styles.langGridName,
                        {
                          color: isSelected
                            ? colors.activeOptionText
                            : colors.unselectedOptionText,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {opt.nativeName}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primaryGreen}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION B: AI MANDI OPERATIONS ASSISTANT */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.aiCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: isDark ? '#2E4B37' : '#BBF7D0',
              },
            ]}
            onPress={() => navigation.navigate('Chatbot')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.aiIconWrap,
                { backgroundColor: isDark ? '#22C55E' : '#16864B' },
              ]}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.aiTitleRow}>
                <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                  AI Mandi Operations Assistant
                </Text>
                <View
                  style={[
                    styles.aiBadge,
                    {
                      backgroundColor: colors.greenBadgeBg,
                      borderColor: colors.greenBadgeBorder,
                    },
                  ]}
                >
                  <Text style={[styles.aiBadgeText, { color: colors.greenText }]}>AI</Text>
                </View>
              </View>
              <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
                Chatbot help, natural voice commands, & multilingual APMC support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </TouchableOpacity>
        </View>

        {/* SECTION C: APPEARANCE (ONLY LIGHT & DARK - SETTINGS SCOPED) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.goldWrapBg }]}>
              <Ionicons name="color-palette-outline" size={18} color={colors.goldIcon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('appearanceTitle', 'Appearance (थीम)')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {t('appearanceSub', 'Light or Dark mode for entire application')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.themeOptionsRow}>
              {/* Option 1: Light Mode */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'light' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: themeMode === 'light'
                      ? colors.activeOptionBg
                      : colors.unselectedOptionBg,
                    borderColor: themeMode === 'light'
                      ? colors.activeOptionBorder
                      : colors.unselectedOptionBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectTheme('light')}
              >
                <Ionicons
                  name={themeMode === 'light' ? 'sunny' : 'sunny-outline'}
                  size={20}
                  color={themeMode === 'light' ? colors.activeOptionText : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themeMode === 'light'
                        ? colors.activeOptionText
                        : colors.unselectedOptionText,
                      fontWeight: themeMode === 'light' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeLight', 'Light')}
                </Text>
                {themeMode === 'light' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={colors.primaryGreen}
                    style={styles.themeCheckIcon}
                  />
                )}
              </TouchableOpacity>

              {/* Option 2: Dark Mode */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'dark' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: themeMode === 'dark'
                      ? colors.activeOptionBg
                      : colors.unselectedOptionBg,
                    borderColor: themeMode === 'dark'
                      ? colors.activeOptionBorder
                      : colors.unselectedOptionBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectTheme('dark')}
              >
                <Ionicons
                  name={themeMode === 'dark' ? 'moon' : 'moon-outline'}
                  size={20}
                  color={themeMode === 'dark' ? colors.activeOptionText : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themeMode === 'dark'
                        ? colors.activeOptionText
                        : colors.unselectedOptionText,
                      fontWeight: themeMode === 'dark' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeDark', 'Dark')}
                </Text>
                {themeMode === 'dark' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={colors.primaryGreen}
                    style={styles.themeCheckIcon}
                  />
                )}
              </TouchableOpacity>

              {/* Option 3: System Auto Mode */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'system' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: themeMode === 'system'
                      ? colors.activeOptionBg
                      : colors.unselectedOptionBg,
                    borderColor: themeMode === 'system'
                      ? colors.activeOptionBorder
                      : colors.unselectedOptionBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelectTheme('system')}
              >
                <Ionicons
                  name={themeMode === 'system' ? 'phone-portrait' : 'phone-portrait-outline'}
                  size={20}
                  color={themeMode === 'system' ? colors.activeOptionText : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themeMode === 'system'
                        ? colors.activeOptionText
                        : colors.unselectedOptionText,
                      fontWeight: themeMode === 'system' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeSystem', 'System')}
                </Text>
                {themeMode === 'system' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={colors.primaryGreen}
                    style={styles.themeCheckIcon}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION D: ACTIVE USER PROFILE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.purpleWrapBg }]}>
              <Ionicons name="person-outline" size={18} color={colors.purpleIcon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('profileSectionTitle', 'Active Profile')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {currentUser?.mobile || 'Mandi Account'}
              </Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isOwner ? colors.greenBadgeBg : colors.goldWrapBg,
                  borderColor: isOwner ? colors.greenBadgeBorder : colors.goldIcon,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isOwner ? colors.greenText : colors.goldIcon },
                ]}
              >
                {isOwner ? 'Mandi Owner' : 'Operator'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.profileInfoRow}>
              <View style={styles.profileMetaBlock}>
                <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>
                  User Name
                </Text>
                <Text style={[styles.profileMetaVal, { color: colors.textPrimary }]}>
                  {currentUser?.name || 'Mandi User'}
                </Text>
              </View>

              <View style={styles.profileMetaBlock}>
                <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>
                  Mandi Business
                </Text>
                <Text style={[styles.profileMetaVal, { color: colors.textPrimary }]}>
                  {currentUser?.business || 'CAL Mandi APMC'}
                </Text>
              </View>

              <View style={styles.profileMetaBlock}>
                <Text style={[styles.profileMetaLabel, { color: colors.textMuted }]}>
                  Location
                </Text>
                <Text style={[styles.profileMetaVal, { color: colors.textPrimary }]}>
                  {currentUser?.location || 'Bangalore'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={[
                  styles.switchRoleButton,
                  {
                    backgroundColor: colors.roleBtnBg,
                    borderColor: colors.roleBtnBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleToggleRole}
              >
                <Ionicons name="swap-horizontal" size={16} color={colors.textSecondary} />
                <Text style={[styles.switchRoleText, { color: colors.roleBtnText }]}>
                  {isOwner
                    ? t('testAsOperator', 'Test as Operator')
                    : t('testAsOwner', 'Test as Owner')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: colors.logoutBtnBg,
                    borderColor: colors.logoutBtnBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.logoutIcon} />
                <Text style={[styles.logoutBtnText, { color: colors.logoutBtnText }]}>
                  {t('logout', 'Logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION E: OFFLINE STORAGE & DATABASE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.greenWrapBg }]}>
              <Ionicons
                name="cloud-offline-outline"
                size={18}
                color={isDark ? '#4ADE80' : '#16834A'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('storageSectionTitle', 'Offline Storage & Database')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                Local SQLite database engine
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.storageStatusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.storageStatusTitle, { color: colors.textPrimary }]}>
                Local SQLite Active • Offline-Ready
              </Text>
            </View>

            <Text style={[styles.storageText, { color: colors.textSecondary }]}>
              {t(
                'storageStatusText',
                'Mandi transactions, customer ledger and stock persist locally without internet.'
              )}
            </Text>

            <TouchableOpacity
              style={[
                styles.openSyncCenterBtn,
                {
                  backgroundColor: colors.syncBtnBg,
                  borderColor: colors.syncBtnBorder,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SyncCenter')}
            >
              <Ionicons name="sync" size={16} color={colors.syncBtnText} />
              <Text style={[styles.openSyncCenterText, { color: colors.syncBtnText }]}>
                {t('openSyncCenter', 'Open Sync Center')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.syncBtnText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION F: APP INFORMATION */}
        <View style={styles.section}>
          <View
            style={[
              styles.aboutCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.aboutRow}>
              <View
                style={[
                  styles.aboutLogoWrap,
                  { backgroundColor: isDark ? '#143823' : '#DCFCE7' },
                ]}
              >
                <Ionicons
                  name="leaf"
                  size={20}
                  color={isDark ? '#4ADE80' : '#16834A'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
                  CAL Mandi Mobile
                </Text>
                <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
                  Version 1.0.0 • APMC Mandi Edition
                </Text>
              </View>
            </View>
            <Text style={[styles.aboutDesc, { color: colors.textMuted }]}>
              {t(
                'aboutAppDesc',
                'Empowering APMC Mandi traders, commission agents, and farmers with instant inventory & khata management.'
              )}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab="More"
        navigation={navigation}
        backgroundColor={colors.headerBg}
        borderColor={colors.border}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
  currentLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  currentLangEmoji: {
    fontSize: 14,
  },
  currentLangText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langGridItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  langGridEmoji: {
    fontSize: 18,
  },
  langGridName: {
    fontSize: 13,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  aiSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
    position: 'relative',
  },
  themeOptionBtnActive: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 13,
  },
  themeCheckIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileMetaBlock: {
    flex: 1,
    minWidth: '28%',
  },
  profileMetaLabel: {
    fontSize: 11,
  },
  profileMetaVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  switchRoleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchRoleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  storageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  storageStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  storageText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  openSyncCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  openSyncCenterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  aboutLogoWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 11,
    marginTop: 1,
  },
  aboutDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
});
