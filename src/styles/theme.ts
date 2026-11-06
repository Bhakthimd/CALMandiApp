export const lightColors = {
  // Primary Mandi Harvest Greens
  primary: '#16834A',
  primaryLight: '#E8F5EC',
  primaryDark: '#0E5C32',
  primarySubtle: '#F0FDF4',
  primaryHover: '#13723F',

  // Harvest Gold / Mustard Accents (Mandi Prosperity)
  gold: '#D97706',
  goldLight: '#FEF3C7',
  goldDark: '#B45309',
  goldAccent: '#F59E0B',

  // Role-specific Branding
  ownerPrimary: '#16834A',
  ownerBadgeBg: '#DCFCE7',
  ownerBadgeText: '#15803D',
  operatorPrimary: '#D97706',
  operatorBadgeBg: '#FEF3C7',
  operatorBadgeText: '#B45309',

  // Backgrounds & Surfaces
  background: '#F8FAF8',
  backgroundWarm: '#FAF9F6',
  cardBackground: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F5F2',

  // Typography
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textGold: '#B45309',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#EDF2F0',
  inputBorder: '#CBD5E1',
  inputFocusBorder: '#16834A',

  // Status & Feedback
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#2563EB',
  infoLight: '#EFF6FF',

  // Welcome Screen Specifics
  cardSelectionBg: 'rgba(255, 255, 255, 0.96)',
  cardSelectionBorder: 'rgba(255, 255, 255, 0.45)',
  roleCardBg: '#FFFFFF',
  roleCardBorder: '#E2E8F0',
  roleCardActiveOwnerBg: '#F0FDF4',
  roleCardActiveOperatorBg: '#FFFBEB',
  roleIconInactiveBg: '#F1F5F9',
  secondaryBtnBg: '#FFFFFF',
  secondaryBtnText: '#0E5C32',
  secondaryBtnBorder: '#E2E8F0',
  demoChipBg: 'rgba(255, 255, 255, 0.94)',
  demoChipBorder: '#DCFCE7',
  demoChipBorderOperator: '#FEF3C7',
  overlayTop: 'rgba(14, 92, 50, 0.40)',
  overlayDimmer: 'rgba(15, 23, 42, 0.40)',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  overlayDark: 'rgba(15, 23, 42, 0.65)',
  overlayLight: 'rgba(255, 255, 255, 0.85)',
  chipSelectedText: '#FFFFFF',
  isDark: false,
};

export const darkColors: typeof lightColors = {
  // Primary Mandi Harvest Greens (vibrant & luminous for dark background)
  primary: '#22C55E',
  primaryLight: '#143823',
  primaryDark: '#16A34A',
  primarySubtle: '#0F291A',
  primaryHover: '#4ADE80',

  // Harvest Gold / Mustard Accents
  gold: '#F59E0B',
  goldLight: '#3D2800',
  goldDark: '#D97706',
  goldAccent: '#FBBF24',

  // Role-specific Branding
  ownerPrimary: '#22C55E',
  ownerBadgeBg: '#0F3820',
  ownerBadgeText: '#4ADE80',
  operatorPrimary: '#F59E0B',
  operatorBadgeBg: '#3B2904',
  operatorBadgeText: '#FBBF24',

  // Backgrounds & Surfaces (deep night emerald/slate)
  background: '#0B130E',
  backgroundWarm: '#0E1712',
  cardBackground: '#131E17',
  surface: '#17241C',
  surfaceElevated: '#1D2D23',
  surfaceMuted: '#24372C',

  // Typography (high readability slate)
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0B130E',
  textGold: '#FBBF24',

  // Borders & Dividers
  border: '#283C30',
  borderLight: '#1E2F26',
  inputBorder: '#375242',
  inputFocusBorder: '#22C55E',

  // Status & Feedback
  success: '#34D399',
  successLight: '#0B3322',
  warning: '#FBBF24',
  warningLight: '#3B2904',
  error: '#F87171',
  errorLight: '#3B1212',
  info: '#60A5FA',
  infoLight: '#11294D',

  // Welcome Screen Specifics
  cardSelectionBg: 'rgba(19, 30, 23, 0.95)',
  cardSelectionBorder: 'rgba(55, 82, 66, 0.55)',
  roleCardBg: '#17241C',
  roleCardBorder: '#283C30',
  roleCardActiveOwnerBg: '#143823',
  roleCardActiveOperatorBg: '#352405',
  roleIconInactiveBg: '#24372C',
  secondaryBtnBg: '#17241C',
  secondaryBtnText: '#4ADE80',
  secondaryBtnBorder: '#283C30',
  demoChipBg: 'rgba(23, 36, 28, 0.94)',
  demoChipBorder: '#16A34A',
  demoChipBorderOperator: '#D97706',
  overlayTop: 'rgba(5, 20, 12, 0.75)',
  overlayDimmer: 'rgba(0, 0, 0, 0.72)',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  overlayDark: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.15)',
  chipSelectedText: '#FFFFFF',
  isDark: true,
};

export const commonTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 26,
    xxl: 36,
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    round: 28,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#16834A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
    card: {
      shadowColor: '#16834A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  },
  typography: {
    tagline: 'Mandi operations made easy',
    appName: 'CAL Mandi',
    fontSizes: {
      xs: 11,
      sm: 13,
      body: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      display: 30,
      hero: 36,
    },
  },
};

// Default export uses light colors for backwards compatibility
export const theme = {
  colors: lightColors,
  ...commonTheme,
};

export type ThemeColors = typeof lightColors;
export type Theme = typeof theme;

export function getTheme(isDark: boolean): Theme {
  return {
    colors: isDark ? darkColors : lightColors,
    ...commonTheme,
  };
}
