import {
    initializeDefaultData,
    loadMatches,
    loadSettings,
    saveMatches,
    saveSettings,
} from '@/services/storage';
import { Match, NewMatch, UpdateMatch } from '@/types/match';
import { CategoryRule, Settings } from '@/types/settings';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
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
    }, []);

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

    // Context value
    const value: AppContextType = {
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
    };

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

