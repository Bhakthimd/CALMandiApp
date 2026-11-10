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
import { useMandi } from '../context/MandiContext';
import CALMandiLogo from '../components/CALMandiLogo';

export default function SplashScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useMandi();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (currentUser) {
        navigation.replace('Home');
      } else {
        navigation.replace('Welcome');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, currentUser]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : '#F8FAF8',
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom + 20, 28),
        },
      ]}
    >
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
        <CALMandiLogo size="large" showTagline={true} />

        <View style={styles.loaderWrap}>
          <ActivityIndicator
            size="small"
            color={isDark ? '#4ADE80' : colors.primary}
          />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? colors.textSecondary : '#64748B' },
            ]}
          >
            Loading Mandi Workspace...
          </Text>
        </View>
      </Animated.View>

      <Text
        style={[
          styles.footerText,
          { color: isDark ? colors.textMuted : '#94A3B8' },
        ]}
      >
        CAL Mandi v1.0 • APMC Krishi Platform
      </Text>
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
    marginTop: 28,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
