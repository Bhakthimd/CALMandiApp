import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useMandi } from '../context/MandiContext';
import { useLanguage } from '../context/LanguageContext';

interface MoreMenuModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  onOpenLanguage?: () => void;
}

export default function MoreMenuModal({
  visible,
  onClose,
  navigation,
  onOpenLanguage,
}: MoreMenuModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { reminderSummary } = useMandi();

  const handleNavigate = (route: string, params?: any) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route, params);
    }, 150);
  };

  const menuItems = [
    {
      id: 'payment-reminders',
      title:
        reminderSummary.overdueCount > 0
          ? `Payment Reminders (${reminderSummary.overdueCount} Overdue)`
          : 'Payment Reminders',
      desc:
        reminderSummary.totalCount > 0
          ? `${reminderSummary.pendingBuyerCount} buyer dues • ${reminderSummary.pendingFarmerCount} farmer payouts`
          : 'Flag overdue buyer dues & pending farmer settlements',
      icon: 'notifications-outline' as const,
      color: '#DC2626',
      bgColor: isDark ? '#450A0A' : '#FEE2E2',
      onPress: () => handleNavigate('PaymentReminders'),
    },
    {
      id: 'inventory',
      title: t('inventory', 'Inventory Management'),
      desc: t('inventoryDesc', 'Track stock levels, units & low-stock alerts'),
      icon: 'cube-outline' as const,
      color: '#16834A',
      bgColor: isDark ? '#143823' : '#DCFCE7',
      onPress: () => handleNavigate('Inventory'),
    },
    {
      id: 'reports',
      title: t('reports', 'Reports & Analytics'),
      desc: t('reportsDesc', 'Sales charts, revenue & patti summaries'),
      icon: 'bar-chart-outline' as const,
      color: '#0284C7',
      bgColor: isDark ? '#082F49' : '#E0F2FE',
      onPress: () => handleNavigate('Reports'),
    },
    {
      id: 'history',
      title: t('transactionHistory', 'Transaction History'),
      desc: t('transactionHistoryDesc', 'Delivery slips, patti bills & invoices'),
      icon: 'receipt-outline' as const,
      color: '#EA580C',
      bgColor: isDark ? '#431407' : '#FFEDD5',
      onPress: () => handleNavigate('Slips'),
    },
    {
      id: 'settings',
      title: t('settings', 'Settings'),
      desc: t('settingsDesc', 'Business profile, light/dark theme & account'),
      icon: 'settings-outline' as const,
      color: '#64748B',
      bgColor: isDark ? '#1E293B' : '#F1F5F9',
      onPress: () => handleNavigate('Settings'),
    },
    {
      id: 'language',
      title: t('language', 'Language (ಭಾಷೆ / भाषा)'),
      desc: t('languageDesc', 'Choose English, Kannada, Hindi, etc.'),
      icon: 'language-outline' as const,
      color: '#D97706',
      bgColor: isDark ? '#3B2904' : '#FEF3C7',
      onPress: () => {
        onClose();
        if (onOpenLanguage) {
          setTimeout(onOpenLanguage, 150);
        } else {
          handleNavigate('Settings');
        }
      },
    },
    {
      id: 'assistant',
      title: t('aiAssistant', 'Help & AI Assistant'),
      desc: t('aiAssistantDesc', 'Ask questions, get help & voice assistant'),
      icon: 'chatbubble-ellipses-outline' as const,
      color: '#7C3AED',
      bgColor: isDark ? '#2E1065' : '#F3E8FF',
      onPress: () => handleNavigate('Chatbot'),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom + 16, 24),
              backgroundColor: colors.modalBackground,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isDark ? colors.border : '#CBD5E1' },
            ]}
          />

          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? colors.border : '#F1F5F9' },
            ]}
          >
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                {t('moreOptions', 'More Options')}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                {t('secondaryFeatures', 'Management tools & preferences')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? colors.textSecondary : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0',
                  },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.menuItemDesc, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.desc}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? colors.textMuted : '#94A3B8'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGrid: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  menuItemDesc: {
    fontSize: 11,
  },
});
