import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SupportedLanguage } from '../types';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelectorModal({
  visible,
  onClose,
}: LanguageSelectorModalProps) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

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
            styles.modalCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleWrap}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDark ? '#143823' : '#DCFCE7' },
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={22}
                  color={isDark ? '#4ADE80' : '#16834A'}
                />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {t('selectLanguage', 'Select Language')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  6 Languages • भाषाएं • ಭಾಷೆಗಳು • மொழிகள்
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Language Options List */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {availableLanguages.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#143823'
                          : '#F0FDF4'
                        : isDark
                        ? colors.surfaceElevated
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? isDark
                          ? colors.primary
                          : '#16834A'
                        : isDark
                        ? colors.border
                        : '#E2E8F0',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(opt.code)}
                >
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagEmoji}>{opt.flagEmoji}</Text>
                  </View>

                  <View style={styles.optionTextContainer}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.nativeName,
                          {
                            color: isSelected
                              ? isDark
                                ? '#4ADE80'
                                : '#16834A'
                              : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.nativeName}
                      </Text>
                      {opt.nativeName !== opt.name && (
                        <Text
                          style={[
                            styles.englishName,
                            { color: colors.textSecondary },
                          ]}
                        >
                          ({opt.name})
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected
                          ? isDark
                            ? colors.primary
                            : '#16834A'
                          : isDark
                          ? colors.textMuted
                          : '#94A3B8',
                        backgroundColor: isSelected
                          ? isDark
                            ? colors.primary
                            : '#16834A'
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer note */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              💡 Instant update across all screens without reloading
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    maxHeight: 380,
  },
  optionsContent: {
    padding: 16,
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  flagContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flagEmoji: {
    fontSize: 24,
  },
  optionTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nativeName: {
    fontSize: 16,
  },
  englishName: {
    fontSize: 13,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
