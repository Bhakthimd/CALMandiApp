import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import QuickActionModal from './QuickActionModal';
import MoreMenuModal from './MoreMenuModal';
import LanguageSelectorModal from './LanguageSelectorModal';

export type BottomNavTab = 'Home' | 'Customers' | 'Products' | 'Reports' | 'Profile' | 'More' | 'none';

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  navigation: any;
  backgroundColor?: string;
  borderColor?: string;
  isDark?: boolean;
}

export default function BottomNavBar({
  activeTab,
  navigation,
  backgroundColor,
  borderColor,
  isDark: isDarkProp,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark: themeIsDark, colors } = useTheme();
  const { t } = useLanguage();
  const isDark = isDarkProp !== undefined ? isDarkProp : themeIsDark;
  const [isQuickActionVisible, setIsQuickActionVisible] = useState(false);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const activeColor = isDark ? colors.primaryDark : '#16834A';
  const inactiveColor = isDark ? colors.textSecondary : '#64748B';

  const handleTabPress = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8),
            backgroundColor: backgroundColor || (isDark ? colors.cardBackground : '#FFFFFF'),
            borderTopColor: borderColor || (isDark ? colors.border : '#E2E8F0'),
          },
        ]}
      >
        {/* 1. HOME */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.7}
        >
          {activeTab === 'Home' && (
            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
          )}
          <Ionicons
            name={activeTab === 'Home' ? 'home' : 'home-outline'}
            size={23}
            color={activeTab === 'Home' ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'Home' ? activeColor : inactiveColor },
              activeTab === 'Home' && styles.navLabelActive,
            ]}
          >
            {t('navHome', 'Home')}
          </Text>
        </TouchableOpacity>

        {/* 2. CUSTOMERS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Customers')}
          activeOpacity={0.7}
        >
          {activeTab === 'Customers' && (
            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
          )}
          <Ionicons
            name={activeTab === 'Customers' ? 'people' : 'people-outline'}
            size={23}
            color={activeTab === 'Customers' ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'Customers' ? activeColor : inactiveColor },
              activeTab === 'Customers' && styles.navLabelActive,
            ]}
          >
            {t('navCustomers', 'Customers')}
          </Text>
        </TouchableOpacity>

        {/* 3. CENTRAL ADD (+) ACTION BUTTON */}
        <View style={styles.centerAddWrap}>
          <TouchableOpacity
            style={[
              styles.centerAddBtn,
              { backgroundColor: isDark ? colors.primary : '#16834A' },
            ]}
            onPress={() => setIsQuickActionVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 4. PRODUCTS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Products')}
          activeOpacity={0.7}
        >
          {activeTab === 'Products' && (
            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
          )}
          <Ionicons
            name={activeTab === 'Products' ? 'cube' : 'cube-outline'}
            size={23}
            color={activeTab === 'Products' ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.navLabel,
              { color: activeTab === 'Products' ? activeColor : inactiveColor },
              activeTab === 'Products' && styles.navLabelActive,
            ]}
          >
            {t('navProducts', 'Products')}
          </Text>
        </TouchableOpacity>

        {/* 5. MORE */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setIsMoreMenuVisible(true)}
          activeOpacity={0.7}
        >
          {(activeTab === 'More' || activeTab === 'Profile') && (
            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
          )}
          <Ionicons
            name="ellipsis-horizontal"
            size={23}
            color={(activeTab === 'More' || activeTab === 'Profile') ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.navLabel,
              { color: (activeTab === 'More' || activeTab === 'Profile') ? activeColor : inactiveColor },
              (activeTab === 'More' || activeTab === 'Profile') && styles.navLabelActive,
            ]}
          >
            {t('navMore', 'More')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Bottom Sheet Menu */}
      <QuickActionModal
        visible={isQuickActionVisible}
        onClose={() => setIsQuickActionVisible(false)}
        navigation={navigation}
      />

      {/* More Options Bottom Sheet Menu */}
      <MoreMenuModal
        visible={isMoreMenuVisible}
        onClose={() => setIsMoreMenuVisible(false)}
        navigation={navigation}
        onOpenLanguage={() => setIsLanguageModalVisible(true)}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    zIndex: 100,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#16834A',
    fontWeight: '700',
  },
  centerAddWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16834A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    marginTop: -8,
  },
});
