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
import { useLanguage } from '../context/LanguageContext';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function QuickActionModal({
  visible,
  onClose,
  navigation,
}: QuickActionModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const handleAction = (route: string, params?: any) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route, params);
    }, 150);
  };

  const actions = [
    {
      id: 'arrival',
      title: t('recordArrival', 'Record Inward Arrival'),
      subtitle: t('recordArrivalSub', 'Log incoming farmer produce'),
      icon: 'arrow-down-circle' as const,
      color: '#16834A',
      bgColor: isDark ? '#143823' : '#DCFCE7',
      route: 'RecordArrival',
    },
    {
      id: 'sale',
      title: t('recordSale', 'Record Sale'),
      subtitle: t('recordSaleSub', 'Dispatch to buyers & create bill'),
      icon: 'arrow-up-circle' as const,
      color: '#0284C7',
      bgColor: isDark ? '#082F49' : '#E0F2FE',
      route: 'RecordSale',
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
          {/* Header indicator */}
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
                {t('quickActions', 'Quick Actions')}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                {t('selectActionToPerform', 'Choose an operation to proceed')}
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

          <View style={styles.actionsList}>
            {actions.map((act) => (
              <TouchableOpacity
                key={act.id}
                style={[
                  styles.actionItem,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
                    borderColor: isDark ? colors.border : '#E2E8F0',
                  },
                ]}
                onPress={() => handleAction(act.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: act.bgColor }]}>
                  <Ionicons name={act.icon} size={24} color={act.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    {act.title}
                  </Text>
                  <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                    {act.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
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
  actionsList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
  },
});
