import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { lightColors, darkColors, createTypography, spacing, ThemeColors } from '../theme';
import { TextStyle } from 'react-native';

type ThemeContextType = {
  isDark: boolean;
  toggleDarkMode: () => void;
  colors: ThemeColors;
  typography: Record<string, TextStyle>;
  spacing: typeof spacing;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDarkMode: () => {},
  colors: lightColors,
  typography: createTypography(lightColors),
  spacing,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const value = useMemo(() => {
    const currentColors = isDark ? darkColors : lightColors;
    return {
      isDark,
      toggleDarkMode,
      colors: currentColors,
      typography: createTypography(currentColors),
      spacing,
    };
  }, [isDark, toggleDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
