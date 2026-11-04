import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CALMandiLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  style?: ViewStyle;
  forceLightText?: boolean;
}

export default function CALMandiLogo({
  size = 'medium',
  showTagline = true,
  style,
  forceLightText = false,
}: CALMandiLogoProps) {
  const { colors, isDark, theme } = useTheme();

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return { width: 44, height: 44, borderRadius: 12 };
      case 'large':
        return { width: 92, height: 92, borderRadius: 24 };
      case 'medium':
      default:
        return { width: 68, height: 68, borderRadius: 18 };
    }
  };

  const getTitleSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      case 'medium':
      default:
        return 26;
    }
  };

  const iconDims = getIconSize();

  const calColor = forceLightText
    ? '#FFFFFF'
    : isDark
    ? '#4ADE80'
    : colors.primaryDark;

  const mandiColor = forceLightText
    ? colors.primaryLight
    : colors.primary;

  const taglineColor = forceLightText
    ? '#E8F5EC'
    : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      {/* Logo Graphic Container */}
      <View
        style={[
          styles.imageWrapper,
          iconDims,
          {
            borderColor: isDark ? colors.border : '#E8F5EC',
            backgroundColor: isDark ? '#17241C' : '#FFFFFF',
            shadowColor: colors.primary,
          },
        ]}
      >
        <Image
          source={require('../../assets/calmandi_logo.png')}
          style={[styles.logoImage, iconDims]}
          resizeMode="cover"
        />
      </View>

      {/* Brand Title */}
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandPartCal, { fontSize: getTitleSize(), color: calColor }]}>
            CAL
          </Text>
          <Text style={[styles.brandPartMandi, { fontSize: getTitleSize(), color: mandiColor }]}>
            Mandi
          </Text>
        </View>

        {showTagline && (
          <Text
            style={[
              styles.tagline,
              size === 'small' && styles.taglineSmall,
              { color: taglineColor },
            ]}
          >
            {theme.typography.tagline}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandPartCal: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandPartMandi: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  taglineSmall: {
    fontSize: 11,
  },
});
