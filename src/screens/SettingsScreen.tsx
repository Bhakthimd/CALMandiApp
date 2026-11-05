import React, { useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useMandi } from '../context/MandiContext';
import { SupportedLanguage } from '../types';
import LanguageSelectorModal from '../components/LanguageSelectorModal';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, currentLanguageOption, availableLanguages, t } = useLanguage();
  const { currentUser, isOwner, switchRole, logout } = useMandi();
  const [modalVisible, setModalVisible] = useState(false);

  const handleToggleRole = () => {
    const nextRole = isOwner ? 'Operator' : 'Owner';
    switchRole(nextRole);
    Alert.alert(
      t('roleSwitched', 'Role Switched'),
      t('roleSwitchedMsg', `You are now viewing as ${nextRole}. Dashboard metrics and permissions updated.`, { role: nextRole })
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle', 'Logout'),
      t('logoutConfirmMsg', 'Are you sure you want to log out of CALMandi?'),
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 10, 36),
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('settingsTitle', 'Settings & Preferences')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('settingsSubtitle', 'Configure language, display mode, and offline mandi preferences')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: LANGUAGE SETTINGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="globe-outline" size={20} color="#16834A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('languageSectionTitle', 'Language Settings')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {t('languageSectionSub', 'Select your preferred language for CALMandi')}
              </Text>
            </View>
          </View>

          {/* Active Language Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.activeLangRow}>
              <View style={styles.langLeftInfo}>
                <Text style={styles.langEmoji}>{currentLanguageOption.flagEmoji}</Text>
                <View>
                  <Text style={[styles.activeLangTitle, { color: colors.textPrimary }]}>
                    {currentLanguageOption.nativeName}
                    {currentLanguageOption.nativeName !== currentLanguageOption.name &&
                      ` (${currentLanguageOption.name})`}
                  </Text>
                  <Text style={[styles.activeLangDesc, { color: colors.textSecondary }]}>
                    {currentLanguageOption.subText}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.changeLangBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeLangBtnText}>Change</Text>
                <Ionicons name="chevron-forward" size={16} color="#16834A" />
              </TouchableOpacity>
            </View>

            {/* Quick Language Selector Chips */}
            <View style={styles.chipsContainer}>
              {availableLanguages.map((opt) => {
                const isSelected = opt.code === language;
                return (
                  <TouchableOpacity
                    key={opt.code}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: isSelected
                          ? '#16834A'
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isSelected
                          ? '#16834A'
                          : isDark
                          ? '#334155'
                          : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setLanguage(opt.code as SupportedLanguage)}
                  >
                    <Text style={styles.chipEmoji}>{opt.flagEmoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.nativeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION 2: THEME & DISPLAY */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="color-palette-outline" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('appearanceTitle', 'Appearance & Display (थीम)')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {t('appearanceSub', 'Choose Light or Dark mode')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.themeOptionsRow}>
              {/* Light Mode */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'light' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: themeMode === 'light' ? '#16834A' : colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons
                  name="sunny"
                  size={24}
                  color={themeMode === 'light' ? '#16834A' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        themeMode === 'light' ? '#16834A' : colors.textSecondary,
                      fontWeight: themeMode === 'light' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeLight', 'Light Mode')}
                </Text>
                {themeMode === 'light' && (
                  <View style={styles.activeThemeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#16834A" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Dark Mode */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'dark' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: themeMode === 'dark' ? '#16834A' : colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={themeMode === 'dark' ? '#16834A' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        themeMode === 'dark' ? '#16834A' : colors.textSecondary,
                      fontWeight: themeMode === 'dark' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeDark', 'Dark Mode')}
                </Text>
                {themeMode === 'dark' && (
                  <View style={styles.activeThemeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#16834A" />
                  </View>
                )}
              </TouchableOpacity>

              {/* System */}
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  themeMode === 'system' && styles.themeOptionBtnActive,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: themeMode === 'system' ? '#16834A' : colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setThemeMode('system')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={themeMode === 'system' ? '#16834A' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        themeMode === 'system' ? '#16834A' : colors.textSecondary,
                      fontWeight: themeMode === 'system' ? '700' : '500',
                    },
                  ]}
                >
                  {t('themeSystem', 'System')}
                </Text>
                {themeMode === 'system' && (
                  <View style={styles.activeThemeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#16834A" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 3: USER PROFILE & ROLE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="person-outline" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {t('profileSectionTitle', 'Active User Profile')}
              </Text>
              <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                {currentUser?.name || 'Mandi User'} ({isOwner ? 'Owner' : 'Operator'})
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.profileDetailsRow}>
              <View style={styles.profileMetaItem}>
                <Text style={[styles.profileMetaLabel, { color: colors.textSecondary }]}>
                  Mandi Business
                </Text>
                <Text style={[styles.profileMetaVal, { color: colors.textPrimary }]}>
                  {currentUser?.business || 'CALMandi APMC'}
                </Text>
              </View>

              <View style={styles.profileMetaItem}>
                <Text style={[styles.profileMetaLabel, { color: colors.textSecondary }]}>
                  Location
                </Text>
                <Text style={[styles.profileMetaVal, { color: colors.textPrimary }]}>
                  {currentUser?.location || 'Bangalore'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={styles.switchRoleButton}
                activeOpacity={0.7}
                onPress={handleToggleRole}
              >
                <Ionicons name="swap-horizontal" size={18} color="#16834A" />
                <Text style={styles.switchRoleText}>
                  {isOwner ? t('testAsOperator', 'Test as Operator') : t('testAsOwner', 'Test as Owner')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                activeOpacity={0.7}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                <Text style={styles.logoutBtnText}>{t('logout', 'Logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 4: OFFLINE DATA & STORAGE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cloud-offline-outline" size={20} color="#16834A" />
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
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.storageText, { color: colors.textSecondary }]}>
              {t(
                'storageStatusText',
                'Local SQLite engine is active and tracking mandi records offline.'
              )}
            </Text>

            <TouchableOpacity
              style={styles.openSyncCenterBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SyncCenter')}
            >
              <Ionicons name="sync" size={18} color="#16834A" />
              <Text style={styles.openSyncCenterText}>
                {t('openSyncCenter', 'Open Sync Center')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#16834A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 5: ABOUT APP */}
        <View style={styles.section}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.aboutRow}>
              <View style={styles.aboutLogoWrap}>
                <Ionicons name="leaf" size={26} color="#16834A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
                  CALMandi Mobile
                </Text>
                <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
                  Version 1.0.0 • APMC Mandi Edition
                </Text>
              </View>
            </View>

            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
              {t(
                'aboutAppDesc',
                'Empowering APMC Mandi traders, commission agents, and farmers with instant tactile inventory & khata management.'
              )}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selector Bottom Sheet Modal */}
      <LanguageSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtext: {
    fontSize: 12,
    marginTop: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  activeLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  langLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  langEmoji: {
    fontSize: 28,
  },
  activeLangTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeLangDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  changeLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
  },
  changeLangBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16834A',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  themeOptionBtnActive: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 12,
  },
  activeThemeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  profileDetailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  profileMetaItem: {
    flex: 1,
  },
  profileMetaLabel: {
    fontSize: 12,
  },
  profileMetaVal: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  switchRoleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16834A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  storageText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  openSyncCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
  },
  openSyncCenterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16834A',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  aboutLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
