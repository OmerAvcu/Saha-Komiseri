import { Match } from '@/types/match';
import { DEFAULT_SETTINGS, Settings } from '@/types/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    MATCHES: '@SahaKomiseri:matches',
    SETTINGS: '@SahaKomiseri:settings',
    INITIALIZED: '@SahaKomiseri:initialized',
};

// Default demo matches for first launch
const DEFAULT_MATCHES: Match[] = [
    {
        id: 'demo-1',
        homeTeam: 'Galatasaray U19',
        awayTeam: 'Fenerbahçe U19',
        date: '2024-12-28',
        time: '14:00',
        venue: 'Florya Metin Oktay Tesisleri',
        league: 'U19 Ligi',
        category: 'U19',
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'demo-2',
        homeTeam: 'Beşiktaş U17',
        awayTeam: 'Trabzonspor U17',
        date: '2024-12-29',
        time: '11:00',
        venue: 'BJK Nevzat Demir Tesisleri',
        league: 'U17 Ligi',
        category: 'U17',
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'demo-3',
        homeTeam: 'Kadıköy Spor',
        awayTeam: 'Üsküdar SK',
        date: '2024-12-23',
        time: '15:30',
        venue: 'Kadıköy Stadyumu',
        league: 'Bölgesel Amatör Lig',
        category: 'Amatör',
        status: 'completed',
        homeScore: 2,
        awayScore: 1,
        events: [
            { id: 'e1', minute: 23, type: 'goal', team: 'home', player: 'Ahmet Yılmaz' },
            { id: 'e2', minute: 45, type: 'halfTime', team: 'home' },
            { id: 'e3', minute: 67, type: 'goal', team: 'away', player: 'Mehmet Demir' },
            { id: 'e4', minute: 78, type: 'goal', team: 'home', player: 'Ali Kaya' },
            { id: 'e5', minute: 90, type: 'fullTime', team: 'home' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// ============ MATCHES ============

export async function loadMatches(): Promise<Match[]> {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.MATCHES);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error loading matches:', e);
        return [];
    }
}

export async function saveMatches(matches: Match[]): Promise<void> {
    try {
        const jsonValue = JSON.stringify(matches);
        await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, jsonValue);
    } catch (e) {
        console.error('Error saving matches:', e);
        throw e;
    }
}

// ============ SETTINGS ============

export async function loadSettings(): Promise<Settings> {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (jsonValue != null) {
            const parsedSettings = JSON.parse(jsonValue);
            // Merge with default settings to ensure new fields (like leagues) are present
            return {
                ...DEFAULT_SETTINGS,
                ...parsedSettings,
                // Ensure array fields are not undefined if they were missing in old data
                leagues: parsedSettings.leagues || DEFAULT_SETTINGS.leagues,
                categories: parsedSettings.categories || DEFAULT_SETTINGS.categories,
            };
        }
        return DEFAULT_SETTINGS;
    } catch (e) {
        console.error('Error loading settings:', e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        const jsonValue = JSON.stringify(settings);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
    } catch (e) {
        console.error('Error saving settings:', e);
        throw e;
    }
}

// ============ INITIALIZATION ============

export async function isFirstLaunch(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
        return value === null;
    } catch (e) {
        console.error('Error checking first launch:', e);
        return true;
    }
}

export async function markAsInitialized(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } catch (e) {
        console.error('Error marking as initialized:', e);
    }
}

export async function initializeDefaultData(): Promise<{ matches: Match[]; settings: Settings }> {
    try {
        const firstLaunch = await isFirstLaunch();

        if (firstLaunch) {
            // First launch - save default data
            await saveMatches(DEFAULT_MATCHES);
            await saveSettings(DEFAULT_SETTINGS);
            await markAsInitialized();

            return {
                matches: DEFAULT_MATCHES,
                settings: DEFAULT_SETTINGS,
            };
        } else {
            // Load existing data
            const [matches, settings] = await Promise.all([
                loadMatches(),
                loadSettings(),
            ]);

            return { matches, settings };
        }
    } catch (e) {
        console.error('Error initializing data:', e);
        return {
            matches: DEFAULT_MATCHES,
            settings: DEFAULT_SETTINGS,
        };
    }
}

// ============ CLEAR ALL DATA (for development) ============

export async function clearAllData(): Promise<void> {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.MATCHES,
            STORAGE_KEYS.SETTINGS,
            STORAGE_KEYS.INITIALIZED,
        ]);
    } catch (e) {
        console.error('Error clearing data:', e);
    }
}
