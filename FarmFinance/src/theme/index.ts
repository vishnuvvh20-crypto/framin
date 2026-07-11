import { TextStyle } from 'react-native';

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  background: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  card: string;
  text: string;
  textLight: string;
  border: string;
  outline: string;
  error: string;
  success: string;
  inputBackground: string;
  statusBar: 'light' | 'dark';
};

export const lightColors: ThemeColors = {
  primary: '#1A643B', // M3 Forest Green
  onPrimary: '#FFFFFF',
  primaryContainer: '#D2E8D4',
  onPrimaryContainer: '#042111',
  secondary: '#FFB300',
  background: '#F4FBF7', // Very soft green-white background
  surface: '#FFFFFF',
  onSurface: '#191C19',
  surfaceVariant: '#DEE5DE',
  onSurfaceVariant: '#424943',
  card: '#FFFFFF',
  text: '#191C19',
  textLight: '#5C635D',
  border: '#DEE5DE',
  outline: '#727972',
  error: '#BA1A1A',
  success: '#1A643B',
  inputBackground: '#F0F5F1',
  statusBar: 'dark',
};

export const darkColors: ThemeColors = {
  primary: '#85D4A3', // Bright M3 Green for Dark Mode
  onPrimary: '#00391F',
  primaryContainer: '#005230',
  onPrimaryContainer: '#A0F1BE',
  secondary: '#FFB300',
  background: '#0F1511', // Dark charcoal/green
  surface: '#111D15',
  onSurface: '#E1E3DF',
  surfaceVariant: '#424943',
  onSurfaceVariant: '#C2C9C2',
  card: '#18251D',
  text: '#E1E3DF',
  textLight: '#8C938D',
  border: '#2C352F',
  outline: '#8C938D',
  error: '#FFB4AB',
  success: '#85D4A3',
  inputBackground: '#1D2A22',
  statusBar: 'light',
};

export const colors = lightColors;

export const createTypography = (themeColors: ThemeColors): Record<string, TextStyle> => ({
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: themeColors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    color: themeColors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    color: themeColors.textLight,
    letterSpacing: 0.5,
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
