import { Platform, StyleSheet } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Modern Sports App Color Palette
export const PRIMARY_ROYAL_BLUE = '#2962FF';
export const PRIMARY_BLUE_LIGHT = '#768FFF';
export const PRIMARY_BLUE_DARK = '#0039CB';

export const Colors = {
    // Primary
    primary: PRIMARY_ROYAL_BLUE,
    primaryLight: PRIMARY_BLUE_LIGHT,
    primaryDark: PRIMARY_BLUE_DARK,

    // Backgrounds
    background: '#F5F7FA', // Soft gray background
    surface: '#FFFFFF',
    cardBackground: '#FFFFFF',

    // Text
    text: '#121212', // Dark anthracite
    textSecondary: '#6B7280', // Medium gray
    textLight: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    // Borders & Dividers
    border: '#E5E7EB',
    divider: '#F3F4F6',

    // Semantic
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    live: '#EF4444',
    liveLight: '#FEE2E2',

    // Category/Tag colors
    tagBackground: '#E8F0FE',
    tagText: '#2962FF',

    // WhatsApp green
    whatsapp: '#25D366',
};

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

// Typography
export const Typography = {
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        color: Colors.text,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: Colors.textSecondary,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        color: Colors.textLight,
    },
    score: {
        fontSize: 48,
        fontWeight: '700' as const,
        color: Colors.text,
    },
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: PRIMARY_ROYAL_BLUE,
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
        primaryContainer: PRIMARY_ROYAL_BLUE,
        secondary: PRIMARY_BLUE_LIGHT,
        background: '#0F172A',
        surface: '#1E293B',
        error: Colors.error,
    },
};

export default Colors;
