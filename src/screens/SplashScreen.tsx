import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import CALMandiLogo from '../components/CALMandiLogo';

export default function SplashScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Smooth fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : '#F8FAF8',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
        <CALMandiLogo size="large" showTagline={true} />

        <View style={styles.loaderWrap}>
          <ActivityIndicator
            size="large"
            color={isDark ? '#4ADE80' : colors.primary}
          />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? colors.textSecondary : '#475569' },
            ]}
          >
            Loading Mandi Dashboard...
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footerWrap}>
        <Text
          style={[
            styles.footerText,
            { color: isDark ? colors.textMuted : '#94A3B8' },
          ]}
        >
          CAL Mandi v1.0 • APMC Krishi Platform
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loaderWrap: {
    alignItems: 'center',
    marginTop: 36,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footerWrap: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
