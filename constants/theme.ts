import { Colors } from '@/constants/Colors';
import { Platform, StyleSheet } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Shadow styles for cards and elevated surfaces
export const Shadows = StyleSheet.create({
    card: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardLarge: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    button: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
});

// Common spacing values
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
};

// Common border radius values
export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: Colors.light.primary,
        onPrimary: '#FFFFFF',
        primaryContainer: '#BFDBFE', // Light blue container
        secondary: '#2563EB',
        background: Colors.light.background,
        surface: Colors.light.surface,
        error: Colors.light.error,
        onSurface: Colors.light.text,
        outline: Colors.light.border,
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: Colors.dark.primary,
        onPrimary: '#FFFFFF',
        primaryContainer: '#1E40AF', // Darker blue container
        secondary: '#60A5FA',
        background: Colors.dark.background,
        surface: Colors.dark.surface,
        error: Colors.dark.error,
        onSurface: Colors.dark.text,
        outline: Colors.dark.border,
    },
};

export default Colors;
