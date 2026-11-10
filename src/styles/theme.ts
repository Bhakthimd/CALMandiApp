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
  textHeading: '#1E293B',
  textLabel: '#475569',
  textDisabled: '#94A3B8',

  // Inputs
  inputBackground: '#FFFFFF',
  inputPlaceholder: '#94A3B8',
  inputBorder: '#CBD5E1',
  inputFocusBorder: '#16834A',

  // Modals & Bottom Sheets
  modalBackground: '#FFFFFF',
  modalOverlay: 'rgba(15, 23, 42, 0.40)',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#EDF2F0',

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
  // Primary Mandi Harvest Greens (Preserve CALMandi brand green for primary actions)
  primary: '#16834A',
  primaryLight: '#143823',
  primaryDark: '#4ADE80', // luminous/readable green for text (never dark green on dark backgrounds)
  primarySubtle: '#102A1A',
  primaryHover: '#1E9E5A',

  // Harvest Gold / Mustard Accents
  gold: '#F59E0B',
  goldLight: '#3D2800',
  goldDark: '#FBBF24',
  goldAccent: '#FBBF24',

  // Role-specific Branding
  ownerPrimary: '#16834A',
  ownerBadgeBg: '#143823',
  ownerBadgeText: '#4ADE80',
  operatorPrimary: '#D97706',
  operatorBadgeBg: '#3B2904',
  operatorBadgeText: '#FBBF24',

  // Backgrounds & Surfaces (Required Consistent Dark Color System)
  background: '#121212',           // Main screen background: #121212
  backgroundWarm: '#181818',
  cardBackground: '#1E1E1E',       // Cards and panels: #1E1E1E
  surface: '#1E1E1E',              // Cards and panels: #1E1E1E
  surfaceElevated: '#252525',      // Elevated cards: #252525
  surfaceMuted: '#2A2A2A',         // Secondary surfaces / tabs

  // Typography (Required High Readability Dark Color System)
  textPrimary: '#FFFFFF',          // Primary text: White (#FFFFFF)
  textSecondary: '#BDBDBD',        // Secondary text: Light grey (#BDBDBD)
  textMuted: '#757575',            // Disabled/Muted text: Medium/Muted grey
  textInverse: '#121212',
  textGold: '#FBBF24',
  textHeading: '#FFFFFF',          // Headings: White (#FFFFFF)
  textLabel: '#BDBDBD',            // Labels: Light grey (#BDBDBD)
  textDisabled: '#616161',         // Disabled text: Muted grey

  // Inputs
  inputBackground: '#2A2A2A',      // Input backgrounds: #2A2A2A
  inputPlaceholder: '#757575',     // Placeholder text: Medium grey
  inputBorder: '#383838',          // Dividers and borders: #383838
  inputFocusBorder: '#16834A',

  // Modals & Bottom Sheets
  modalBackground: '#1E1E1E',      // Modal and bottom-sheet backgrounds: #1E1E1E
  modalOverlay: 'rgba(0, 0, 0, 0.75)',

  // Borders & Dividers
  border: '#383838',               // Dividers and borders: #383838
  borderLight: '#2E2E2E',

  // Status & Feedback
  success: '#22C55E',              // Success: readable green
  successLight: '#143823',
  warning: '#F59E0B',              // Warning: readable amber
  warningLight: '#3B2904',
  error: '#EF4444',                // Error: readable red
  errorLight: '#3B1212',
  info: '#3B82F6',                 // Information: readable blue
  infoLight: '#1E293B',

  // Welcome Screen Specifics
  cardSelectionBg: '#1E1E1E',
  cardSelectionBorder: '#383838',
  roleCardBg: '#1E1E1E',
  roleCardBorder: '#383838',
  roleCardActiveOwnerBg: '#143823',
  roleCardActiveOperatorBg: '#3B2904',
  roleIconInactiveBg: '#2A2A2A',
  secondaryBtnBg: '#252525',
  secondaryBtnText: '#FFFFFF',
  secondaryBtnBorder: '#383838',
  demoChipBg: '#252525',
  demoChipBorder: '#16834A',
  demoChipBorderOperator: '#F59E0B',
  overlayTop: 'rgba(0, 0, 0, 0.70)',
  overlayDimmer: 'rgba(0, 0, 0, 0.75)',

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
