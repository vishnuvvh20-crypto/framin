import { TextStyle } from 'react-native';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textLight: string;
  border: string;
  error: string;
  success: string;
  inputBackground: string;
  statusBar: 'light' | 'dark';
};

export const lightColors: ThemeColors = {
  primary: '#2E7D32',
  secondary: '#FFB300',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#212121',
  textLight: '#757575',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
  inputBackground: '#FFFFFF',
  statusBar: 'dark',
};

export const darkColors: ThemeColors = {
  primary: '#4CAF50',
  secondary: '#FFB300',
  background: '#121212',
  card: '#1E1E1E',
  text: '#E0E0E0',
  textLight: '#9E9E9E',
  border: '#333333',
  error: '#EF5350',
  success: '#66BB6A',
  inputBackground: '#2C2C2C',
  statusBar: 'light',
};

// Keep a default export for backward compat (used by static StyleSheet definitions)
// but screens should use the useTheme() hook for dynamic colors
export const colors = lightColors;

export const createTypography = (themeColors: ThemeColors): Record<string, TextStyle> => ({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
  },
  body: {
    fontSize: 16,
    color: themeColors.text,
  },
  caption: {
    fontSize: 12,
    color: themeColors.textLight,
  },
});

export const typography: Record<string, TextStyle> = createTypography(lightColors);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
