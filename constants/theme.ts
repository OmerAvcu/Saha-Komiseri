import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Primary blue color from HTML reference
export const PRIMARY_BLUE = '#1a73e8';
export const PRIMARY_BLUE_LIGHT = '#4a90e8';
export const PRIMARY_BLUE_DARK = '#1557b0';

export const Colors = {
    primary: PRIMARY_BLUE,
    primaryLight: PRIMARY_BLUE_LIGHT,
    primaryDark: PRIMARY_BLUE_DARK,
    white: '#ffffff',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    border: '#e5e7eb',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    live: '#ef4444',
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: PRIMARY_BLUE,
        primaryContainer: PRIMARY_BLUE_LIGHT,
        secondary: PRIMARY_BLUE_DARK,
        background: Colors.background,
        surface: Colors.surface,
        error: Colors.error,
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: PRIMARY_BLUE_LIGHT,
        primaryContainer: PRIMARY_BLUE,
        secondary: PRIMARY_BLUE_LIGHT,
        background: '#111827',
        surface: '#1f2937',
        error: Colors.error,
    },
};

export default Colors;
