import {
    initializeDefaultData,
    loadMatches,
    loadSettings,
    saveMatches,
    saveSettings,
} from '@/services/storage';
import { Match, NewMatch, UpdateMatch } from '@/types/match';
import { CategoryRule, Settings } from '@/types/settings';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
// @ts-ignore
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

// Context type definition
interface AppContextType {
    // State
    matches: Match[];
    settings: Settings | null;
    isLoading: boolean;
    error: string | null;

    // Match CRUD operations
    addMatch: (match: NewMatch) => Promise<Match>;
    updateMatch: (id: string, updates: UpdateMatch) => Promise<void>;
    deleteMatch: (id: string) => Promise<void>;
    getMatchById: (id: string) => Match | undefined;

    // Filter helpers
    getScheduledMatches: () => Match[];
    getLiveMatches: () => Match[];
    getCompletedMatches: () => Match[];

    // Settings operations
    updateSettings: (updates: Partial<Settings>) => Promise<void>;

    // Category CRUD operations
    addCategory: (category: Omit<CategoryRule, 'id'>) => Promise<CategoryRule>;
    updateCategory: (id: string, updates: Partial<CategoryRule>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    getCategoryById: (id: string) => CategoryRule | undefined;

    // Refresh data
    refreshData: () => Promise<void>;

    // Backup/Restore operations
    exportData: () => Promise<void>;
    importData: () => Promise<boolean>;
    clearAllData: () => Promise<void>;

    // Notifications
    scheduleMatchNotification: (match: Match) => Promise<void>;
}

// Create context with undefined default
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider props
interface AppProviderProps {
    children: ReactNode;
}

// Provider component
export function AppProvider({ children }: AppProviderProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize data on mount
    useEffect(() => {
        initializeData();
        setupNotifications();
    }, []);

    const setupNotifications = async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('match-reminders', {
                name: 'Maç Hatırlatıcıları',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
    };

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    const initializeData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await initializeDefaultData();
            setMatches(data.matches);
            setSettings(data.settings);
        } catch (e) {
            setError('Veriler yüklenirken hata oluştu');
            console.error('Error initializing data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh data from storage
    const refreshData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [loadedMatches, loadedSettings] = await Promise.all([
                loadMatches(),
                loadSettings(),
            ]);
            setMatches(loadedMatches);
            setSettings(loadedSettings);
        } catch (e) {
            setError('Veriler yenilenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ============ MATCH CRUD ============

    const addMatch = useCallback(async (matchData: NewMatch): Promise<Match> => {
        const now = new Date().toISOString();
        const newMatch: Match = {
            ...matchData,
            id: uuidv4(),
            homeScore: matchData.homeScore ?? 0,
            awayScore: matchData.awayScore ?? 0,
            events: matchData.events ?? [],
            createdAt: now,
            updatedAt: now,
        };

        const updatedMatches = [...matches, newMatch];
        setMatches(updatedMatches);
        await saveMatches(updatedMatches);

        return newMatch;
    }, [matches]);

    const updateMatch = useCallback(async (id: string, updates: UpdateMatch): Promise<void> => {
        const updatedMatches = matches.map(match => {
            if (match.id === id) {
                return {
                    ...match,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };
            }
            return match;
        });

        setMatches(updatedMatches);
        await saveMatches(updatedMatches);
    }, [matches]);

    const deleteMatch = useCallback(async (id: string): Promise<void> => {
        const updatedMatches = matches.filter(match => match.id !== id);
        setMatches(updatedMatches);
        await saveMatches(updatedMatches);
    }, [matches]);

    const getMatchById = useCallback((id: string): Match | undefined => {
        return matches.find(match => match.id === id);
    }, [matches]);

    // ============ FILTER HELPERS ============

    const getScheduledMatches = useCallback((): Match[] => {
        return matches.filter(match => match.status === 'scheduled');
    }, [matches]);

    const getLiveMatches = useCallback((): Match[] => {
        return matches.filter(match => match.status === 'live');
    }, [matches]);

    const getCompletedMatches = useCallback((): Match[] => {
        return matches.filter(match => match.status === 'completed');
    }, [matches]);

    // ============ SETTINGS ============

    const updateSettings = useCallback(async (updates: Partial<Settings>): Promise<void> => {
        if (!settings) return;

        const updatedSettings: Settings = {
            ...settings,
            ...updates,
            lastUpdated: new Date().toISOString(),
        };

        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
    }, [settings]);

    // ============ CATEGORY CRUD ============

    const addCategory = useCallback(async (categoryData: Omit<CategoryRule, 'id'>): Promise<CategoryRule> => {
        if (!settings) throw new Error('Settings not loaded');

        const newCategory: CategoryRule = {
            ...categoryData,
            id: uuidv4(),
        };

        const updatedSettings: Settings = {
            ...settings,
            categories: [...settings.categories, newCategory],
            lastUpdated: new Date().toISOString(),
        };

        setSettings(updatedSettings);
        await saveSettings(updatedSettings);

        return newCategory;
    }, [settings]);

    const updateCategory = useCallback(async (id: string, updates: Partial<CategoryRule>): Promise<void> => {
        if (!settings) return;

        const updatedCategories = settings.categories.map(category => {
            if (category.id === id) {
                return { ...category, ...updates };
            }
            return category;
        });

        const updatedSettings: Settings = {
            ...settings,
            categories: updatedCategories,
            lastUpdated: new Date().toISOString(),
        };

        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
    }, [settings]);

    const deleteCategory = useCallback(async (id: string): Promise<void> => {
        if (!settings) return;

        const updatedCategories = settings.categories.filter(category => category.id !== id);

        const updatedSettings: Settings = {
            ...settings,
            categories: updatedCategories,
            lastUpdated: new Date().toISOString(),
        };

        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
    }, [settings]);

    const getCategoryById = useCallback((id: string): CategoryRule | undefined => {
        return settings?.categories.find(category => category.id === id);
    }, [settings]);

    // Export all data as JSON and share
    const exportData = useCallback(async (): Promise<void> => {
        try {
            const backupData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                matches,
                settings,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const fileName = `saha-komiseri-backup-${new Date().toISOString().split('T')[0]}.json`;

            // Helper to share/save via standard method
            const shareFile = async () => {
                try {
                    const filePath = `${FileSystem.documentDirectory}${fileName}`;
                    await FileSystem.writeAsStringAsync(filePath, jsonString, {
                        encoding: FileSystem.EncodingType.UTF8,
                    });

                    const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                        await Sharing.shareAsync(filePath, {
                            mimeType: 'application/json',
                            dialogTitle: 'Maç Verilerini Paylaş/Kaydet',
                            UTI: 'public.json',
                        });
                    } else {
                        Alert.alert('Hata', 'Paylaşım özelliği kullanılamıyor.');
                    }
                } catch (err) {
                    Alert.alert('Hata', 'Dosya paylaşılırken hata oluştu.');
                }
            };

            // Android: Use StorageAccessFramework first, fallback to Share
            if (Platform.OS === 'android') {
                try {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        const directoryUri = permissions.directoryUri;
                        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                            directoryUri,
                            fileName,
                            'application/json'
                        );

                        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                            encoding: FileSystem.EncodingType.UTF8,
                        });
                        Alert.alert('Başarılı', 'Yedek dosyası seçilen klasöre kaydedildi.');
                    } else {
                        // User canceled picker, ask if they want to share instead
                        Alert.alert(
                            'Klasör Seçilmedi',
                            'Dosyayı farklı bir yöntemle (Paylaş/Kaydet) kaydetmek ister misiniz?',
                            [
                                { text: 'Hayır', style: 'cancel' },
                                { text: 'Evet', onPress: shareFile }
                            ]
                        );
                    }
                } catch (e) {
                    console.log('SAF Error handled:', e);
                    // Fallback to share if SAF fails (e.g. Downloads folder not writable)
                    Alert.alert(
                        'Klasör Hatası',
                        'Seçilen klasöre yazma izni alınamadı (Android kısıtlaması olabilir). Alternatif paylaşım ekranı açılıyor.',
                        [{ text: 'Tamam', onPress: shareFile }]
                    );
                }
            } else {
                // iOS
                await shareFile();
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Hata', `Veriler dışa aktarılırken bir hata oluştu: ${error}`);
        }
    }, [matches, settings]);

    // Import data from JSON file
    const importData = useCallback(async (): Promise<boolean> => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return false;
            }

            const fileUri = result.assets[0].uri;
            let fileContent;

            // Try to use legacy method via require to avoid deprecation error
            try {
                // @ts-ignore
                const legacy = require('expo-file-system/build/legacy');
                if (legacy && legacy.readAsStringAsync) {
                    fileContent = await legacy.readAsStringAsync(fileUri, {
                        encoding: 'utf8',
                    });
                } else {
                    fileContent = await (FileSystem as any).readAsStringAsync(fileUri, {
                        encoding: 'utf8',
                    });
                }
            } catch (e) {
                fileContent = await (FileSystem as any).readAsStringAsync(fileUri, {
                    encoding: 'utf8',
                });
            }

            const backupData = JSON.parse(fileContent);

            // Validate backup structure
            if (!backupData.matches || !backupData.settings) {
                Alert.alert('Hata', 'Geçersiz yedek dosyası formatı.');
                return false;
            }

            // Save to storage
            await saveMatches(backupData.matches);
            await saveSettings(backupData.settings);

            // Update state
            setMatches(backupData.matches);
            setSettings(backupData.settings);

            Alert.alert('Başarılı', 'Veriler başarıyla geri yüklendi!', [
                { text: 'Tamam' }
            ]);

            return true;
        } catch (error) {
            console.error('Import error:', error);
            Alert.alert('Hata', 'Veriler içe aktarılırken bir hata oluştu. Dosya formatını kontrol edin.');
            return false;
        }
    }, []);

    // Clear all data
    const clearAllData = useCallback(async (): Promise<void> => {
        return new Promise((resolve) => {
            Alert.alert(
                'Tüm Verileri Sil',
                'Bu işlem tüm maç kayıtlarını ve ayarları silecektir. Bu işlem geri alınamaz!\n\nDevam etmek istediğinize emin misiniz?',
                [
                    { text: 'İptal', style: 'cancel', onPress: () => resolve() },
                    {
                        text: 'Tümünü Sil',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await AsyncStorage.multiRemove([
                                    '@SahaKomiseri:matches',
                                    '@SahaKomiseri:settings',
                                    '@SahaKomiseri:initialized',
                                    '@SahaKomiseri:liveMatch'
                                ]);

                                // Re-initialize with defaults
                                const data = await initializeDefaultData();
                                setMatches(data.matches);
                                setSettings(data.settings);

                                Alert.alert('Başarılı', 'Tüm veriler silindi ve uygulama sıfırlandı.');
                            } catch (error) {
                                console.error('Clear data error:', error);
                                Alert.alert('Hata', 'Veriler silinirken bir hata oluştu.');
                            }
                            resolve();
                        },
                    },
                ]
            );
        });
    }, []);

    // Schedule notification for a match
    const scheduleMatchNotification = useCallback(async (match: Match) => {
        if (!settings?.notificationsEnabled) return;

        try {
            // Parse match date and time
            // match.date format: YYYY-MM-DD
            // match.time format: HH:mm
            const dateParts = match.date.split('-').map(Number);
            const timeParts = match.time.split(':').map(Number);

            if (dateParts.length !== 3 || timeParts.length < 2) return;

            const matchDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);

            // Trigger 1 hour (60 minutes) before
            const triggerDate = new Date(matchDate.getTime() - 60 * 60 * 1000);
            const now = new Date();

            if (triggerDate > now) {
                const seconds = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Maç Saati Yaklaşıyor! ⚽',
                        body: `${match.homeTeam} vs ${match.awayTeam} maçı 1 saat sonra başlayacak.`,
                        data: { matchId: match.id },
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds,
                        repeats: false,
                    },
                });
                console.log(`Notification scheduled for ${triggerDate.toISOString()} (${seconds} seconds)`);
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }, [settings]);

    // Context value
    const value: AppContextType = React.useMemo(() => ({
        matches,
        settings,
        isLoading,
        error,
        addMatch,
        updateMatch,
        deleteMatch,
        getMatchById,
        getScheduledMatches,
        getLiveMatches,
        getCompletedMatches,
        updateSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        refreshData,
        exportData,
        importData,
        clearAllData,
        scheduleMatchNotification,
    }), [
        matches,
        settings,
        isLoading,
        error,
        addMatch,
        updateMatch,
        deleteMatch,
        getMatchById,
        getScheduledMatches,
        getLiveMatches,
        getCompletedMatches,
        updateSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        refreshData,
        exportData,
        importData,
        clearAllData,
        scheduleMatchNotification
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// Custom hook for using context
export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

// Export context for testing purposes
export { AppContext };

