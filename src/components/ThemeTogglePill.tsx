import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ThemeTogglePillProps {
  style?: object;
}

export default function ThemeTogglePill({ style }: ThemeTogglePillProps) {
  const { isDark, setThemeMode, colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? colors.cardBackground
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.btn, !isDark && styles.btnActiveLight]}
        onPress={() => setThemeMode('light')}
        accessibilityLabel="Light Mode"
      >
        <Ionicons
          name="sunny"
          size={14}
          color={!isDark ? '#FFFFFF' : isDark ? colors.textSecondary : '#475569'}
        />
        <Text
          style={[
            styles.btnText,
            !isDark ? styles.textActive : isDark ? { color: colors.textSecondary } : styles.textInactiveLight,
          ]}
        >
          Light
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.btn, isDark && [styles.btnActiveDark, { backgroundColor: colors.primary }]]}
        onPress={() => setThemeMode('dark')}
        accessibilityLabel="Dark Mode"
      >
        <Ionicons
          name="moon"
          size={13}
          color={isDark ? '#FFFFFF' : '#475569'}
        />
        <Text
          style={[
            styles.btnText,
            isDark ? styles.textActive : styles.textInactiveLight,
          ]}
        >
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  btnActiveLight: {
    backgroundColor: '#16834A',
  },
  btnActiveDark: {
    backgroundColor: '#16834A',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  textActive: {
    color: '#FFFFFF',
  },
  textInactiveLight: {
    color: '#334155', // High contrast dark slate in light mode
  },
  textInactiveDark: {
    color: '#E2E8F0', // High contrast light gray in dark mode
  },
});
