import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, getTheme, Theme, ThemeColors } from '../styles/theme';
import { getMetaValue, setMetaValue } from '../services/offlineStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_THEME_KEY = 'app_theme_preference';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const saved = await getMetaValue(STORAGE_THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (err) {
        console.warn('[ThemeContext] Could not load saved theme:', err);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setMetaValue(STORAGE_THEME_KEY, mode).catch((err) => {
      console.warn('[ThemeContext] Failed to save theme:', err);
    });
  };

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;
  const currentTheme = getTheme(isDark);

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        theme: currentTheme,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside ThemeProvider
    const defaultTheme = getTheme(false);
    return {
      themeMode: 'light' as ThemeMode,
      isDark: false,
      colors: defaultTheme.colors,
      theme: defaultTheme,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
