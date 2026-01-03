import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent, MatchEventType } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, FlatList, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    IconButton,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const LIVE_MATCH_STORAGE_KEY = '@SahaKomiseri:liveMatch';

// Types
type ActionType = 'goal' | 'yellowCard' | 'redCard' | 'substitution';
type TeamType = 'home' | 'away';

interface EventFormData {
    minute: string;
    team: TeamType;
    player: string;
    playerOut?: string;
    playerIn?: string;
}

interface LiveMatchState {
    matchId: string;
    periodStartTime: number; // Unix timestamp when current period's play session started
    periodBaseSeconds: number; // Base seconds for current period (e.g., 0 for P1, halfDuration*60 for P2)
    accumulatedSeconds: number; // Seconds accumulated before current play session (for pause/resume)
    isRunning: boolean;
    match: Match;
    period: 1 | 2 | 3 | 4;
    injuryTime: number;
}

export default function CanliTakipScreen() {
    const { getScheduledMatches, getLiveMatches, getMatchById, updateMatch, isLoading, theme, isDarkMode, settings } = useAppContext();

    // Active match state
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);

    // Stopwatch state - TIMESTAMP BASED
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    // periodStartTime: when the current play session started (Date.now())
    const periodStartTimeRef = useRef<number | null>(null);
    // periodBaseSeconds: base offset for current period (0 for P1, halfDuration*60 for P2, etc.)
    const periodBaseSecondsRef = useRef<number>(0);
    // accumulatedSeconds: seconds accumulated before current play session (for pause/resume within same period)
    const accumulatedSecondsRef = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeMatchRef = useRef<Match | null>(null);
    const isRunningRef = useRef<boolean>(false);

    // Injury Time & Period State
    const [period, setPeriod] = useState<1 | 2 | 3 | 4>(1);
    const [injuryTime, setInjuryTime] = useState(0);
    const [showInjuryModal, setShowInjuryModal] = useState(false);

    // Keep refs in sync for the AppState listener to avoid effect re-runs
    useEffect(() => {
        activeMatchRef.current = activeMatch;
        isRunningRef.current = isRunning;
    }, [activeMatch, isRunning]);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
    const [formData, setFormData] = useState<EventFormData>({
        minute: '0',
        team: 'home',
        player: '',
        playerOut: '',
        playerIn: '',
    });

    // Dynamic styles
    const styles = useMemo(() => createStyles(theme), [theme]);

    const scheduledMatches = useMemo(() => getScheduledMatches(), [getScheduledMatches]);
    const liveMatches = useMemo(() => getLiveMatches(), [getLiveMatches]);

    // Load persisted live match on mount
    useEffect(() => {
        loadPersistedMatch();
    }, []);

    // Handle app state changes (background/foreground) - TIMESTAMP BASED
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active' && activeMatchRef.current) {
                // App came to foreground, recalculate elapsed time from stored timestamp
                const stored = await AsyncStorage.getItem(LIVE_MATCH_STORAGE_KEY);
                if (stored) {
                    const state: LiveMatchState = JSON.parse(stored);
                    if (state.isRunning && state.periodStartTime) {
                        // Recalculate elapsed time based on real wall clock
                        const now = Date.now();
                        const sessionSeconds = Math.floor((now - state.periodStartTime) / 1000) * TEST_SPEED_MULTIPLIER;
                        const totalSeconds = state.periodBaseSeconds + state.accumulatedSeconds + sessionSeconds;
                        setElapsedSeconds(totalSeconds);
                        // Update refs
                        periodStartTimeRef.current = state.periodStartTime;
                        periodBaseSecondsRef.current = state.periodBaseSeconds;
                        accumulatedSecondsRef.current = state.accumulatedSeconds;
                    }
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, []); // Only on mount

    const loadPersistedMatch = async () => {
        try {
            const stored = await AsyncStorage.getItem(LIVE_MATCH_STORAGE_KEY);
            if (stored) {
                const state: LiveMatchState = JSON.parse(stored);
                const match = getMatchById(state.matchId);
                if (match && match.status === 'live') {
                    setActiveMatch(state.match);
                    periodStartTimeRef.current = state.periodStartTime;
                    periodBaseSecondsRef.current = state.periodBaseSeconds;
                    accumulatedSecondsRef.current = state.accumulatedSeconds;

                    if (state.isRunning && state.periodStartTime) {
                        // Calculate current elapsed time from timestamp
                        const now = Date.now();
                        const sessionSeconds = Math.floor((now - state.periodStartTime) / 1000) * TEST_SPEED_MULTIPLIER;
                        const totalSeconds = state.periodBaseSeconds + state.accumulatedSeconds + sessionSeconds;
                        setElapsedSeconds(totalSeconds);
                        setIsRunning(true);
                    } else {
                        // Paused: show accumulated time
                        const totalSeconds = state.periodBaseSeconds + state.accumulatedSeconds;
                        setElapsedSeconds(totalSeconds);
                    }
                    if (state.period) setPeriod(state.period);
                    if (state.injuryTime) setInjuryTime(state.injuryTime);
                } else {
                    await AsyncStorage.removeItem(LIVE_MATCH_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error loading persisted match:', error);
        }
    };

    const persistLiveMatch = async (running: boolean, baseSeconds: number, accumulated: number, matchToSave?: Match, newPeriod?: 1 | 2 | 3 | 4) => {
        const matchData = matchToSave || activeMatch;
        if (!matchData) return;
        try {
            const state: LiveMatchState = {
                matchId: matchData.id,
                periodStartTime: running ? (periodStartTimeRef.current || Date.now()) : 0,
                periodBaseSeconds: baseSeconds,
                accumulatedSeconds: accumulated,
                isRunning: running,
                match: matchData,
                period: newPeriod || period,
                injuryTime,
            };
            await AsyncStorage.setItem(LIVE_MATCH_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Error persisting match:', error);
        }
    };

    const clearPersistedMatch = async () => {
        try {
            await AsyncStorage.removeItem(LIVE_MATCH_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing persisted match:', error);
        }
    };

    // TEST MODE: 90x speed (90 match minutes = 1 real minute)
    // Set to 1 for normal speed in production
    const TEST_SPEED_MULTIPLIER = 90;

    // Stopwatch logic - TIMESTAMP BASED: recalculate from periodStartTime on each tick
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                if (periodStartTimeRef.current) {
                    const now = Date.now();
                    const sessionSeconds = Math.floor((now - periodStartTimeRef.current) / 1000) * TEST_SPEED_MULTIPLIER;
                    const totalSeconds = periodBaseSecondsRef.current + accumulatedSecondsRef.current + sessionSeconds;
                    setElapsedSeconds(totalSeconds);
                }
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    // Format time as MM:SS
    const formatTime = useCallback((totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    // Get current minute (rounded up)
    const getCurrentMinute = useCallback((): number => {
        return Math.ceil(elapsedSeconds / 60) || 1;
    }, [elapsedSeconds]);

    // Start match
    const handleStartMatch = (match: Match) => {
        const newMatch = { ...match, status: 'live' as const, homeScore: 0, awayScore: 0, events: [] };
        setActiveMatch(newMatch);
        setElapsedSeconds(0);
        setPeriod(1);
        setInjuryTime(0);
        periodStartTimeRef.current = null;
        periodBaseSecondsRef.current = 0;
        accumulatedSecondsRef.current = 0;
        setIsRunning(false);
        // Pass the new match directly to avoid race condition
        persistLiveMatch(false, 0, 0, newMatch, 1);
    };

    const handleAddInjuryTime = (minutes: number) => {
        setInjuryTime(minutes);
        setShowInjuryModal(false);
        // Persist current state with same values
        persistLiveMatch(isRunning, periodBaseSecondsRef.current, accumulatedSecondsRef.current);
    };

    // Get the half duration for the current match from category settings
    const getHalfDuration = useCallback((): number => {
        if (!activeMatch || !settings?.categories) return 45; // Default to 45
        const category = settings.categories.find(
            cat => cat.name === activeMatch.category || cat.id === activeMatch.category
        );
        return category?.halfDuration || 45;
    }, [activeMatch, settings]);

    // Get extra time half duration (default 15 minutes)
    const getExtraTimeHalfDuration = useCallback((): number => {
        if (!activeMatch || !settings?.categories) return 15; // Default to 15
        const category = settings.categories.find(
            cat => cat.name === activeMatch.category || cat.id === activeMatch.category
        );
        return category?.extraTimeHalfDuration || 15;
    }, [activeMatch, settings]);

    const handleNextPeriod = () => {
        const halfDuration = getHalfDuration();
        const fullMatchDuration = halfDuration * 2; // e.g., 70 for U16 (35*2), 90 for professional (45*2)
        const extraTimeHalf = getExtraTimeHalfDuration();
        const firstExtraEnd = fullMatchDuration + extraTimeHalf; // e.g., 105 for professional

        if (period === 1) {
            Alert.alert(
                '2. Devreye Geç',
                `İkinci devreye geçmek istediğinize emin misiniz? Süre ${halfDuration}:00'dan devam edecek.`,
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Evet, Başlat',
                        onPress: () => {
                            const newBaseSeconds = halfDuration * 60;
                            setPeriod(2);
                            setInjuryTime(0);
                            setElapsedSeconds(newBaseSeconds);
                            periodBaseSecondsRef.current = newBaseSeconds;
                            accumulatedSecondsRef.current = 0;
                            periodStartTimeRef.current = null;
                            setIsRunning(false);
                            persistLiveMatch(false, newBaseSeconds, 0, undefined, 2);
                        }
                    }
                ]
            );
        } else if (period === 2) {
            Alert.alert(
                '1. Uzatma Devresine Geç',
                `Uzatma devrelerini başlatmak istediğinize emin misiniz? Süre ${fullMatchDuration}:00'dan devam edecek.`,
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Evet, Başlat',
                        onPress: () => {
                            const newBaseSeconds = fullMatchDuration * 60;
                            setPeriod(3);
                            setInjuryTime(0);
                            setElapsedSeconds(newBaseSeconds);
                            periodBaseSecondsRef.current = newBaseSeconds;
                            accumulatedSecondsRef.current = 0;
                            periodStartTimeRef.current = null;
                            setIsRunning(false);
                            persistLiveMatch(false, newBaseSeconds, 0, undefined, 3);
                        }
                    }
                ]
            );
        } else if (period === 3) {
            Alert.alert(
                '2. Uzatma Devresine Geç',
                `İkinci uzatma devresine geçmek istediğinize emin misiniz? Süre ${firstExtraEnd}:00'dan devam edecek.`,
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Evet, Başlat',
                        onPress: () => {
                            const newBaseSeconds = firstExtraEnd * 60;
                            setPeriod(4);
                            setInjuryTime(0);
                            setElapsedSeconds(newBaseSeconds);
                            periodBaseSecondsRef.current = newBaseSeconds;
                            accumulatedSecondsRef.current = 0;
                            periodStartTimeRef.current = null;
                            setIsRunning(false);
                            persistLiveMatch(false, newBaseSeconds, 0, undefined, 4);
                        }
                    }
                ]
            );
        }
    };

    // Toggle stopwatch - TIMESTAMP BASED
    const toggleStopwatch = () => {
        const newRunning = !isRunning;
        if (newRunning) {
            // Starting: record the current timestamp
            periodStartTimeRef.current = Date.now();
            persistLiveMatch(true, periodBaseSecondsRef.current, accumulatedSecondsRef.current);
        } else {
            // Pausing: calculate how much time has passed in this session and add to accumulated
            if (periodStartTimeRef.current) {
                const now = Date.now();
                const sessionSeconds = Math.floor((now - periodStartTimeRef.current) / 1000) * TEST_SPEED_MULTIPLIER;
                accumulatedSecondsRef.current += sessionSeconds;
            }
            periodStartTimeRef.current = null;
            persistLiveMatch(false, periodBaseSecondsRef.current, accumulatedSecondsRef.current);
        }
        setIsRunning(newRunning);
    };

    // Open action modal with auto-filled minute
    const openActionModal = (action: ActionType) => {
        const currentMin = getCurrentMinute();
        setCurrentAction(action);
        setFormData({
            minute: currentMin.toString(),
            team: 'home',
            player: '',
            playerOut: '',
            playerIn: '',
        });
        setModalVisible(true);
    };

    // Save event
    const handleSaveEvent = async () => {
        if (!activeMatch || !currentAction) return;

        try {
            const minute = parseInt(formData.minute) || getCurrentMinute();

            const newEvent: MatchEvent = {
                id: uuidv4(),
                minute,
                type: currentAction as MatchEventType,
                team: formData.team,
                player: formData.player?.trim() || undefined,
                playerOut: formData.playerOut?.trim() || undefined,
                playerIn: formData.playerIn?.trim() || undefined,
            };

            // Calculate added time (injury time logic) with dynamic thresholds
            const halfDur = getHalfDuration();
            const fullDur = halfDur * 2;
            const extraHalf = getExtraTimeHalfDuration();
            const firstExtraEnd = fullDur + extraHalf;
            const secondExtraEnd = fullDur + extraHalf * 2;

            if (period === 1 && minute > halfDur) {
                newEvent.minute = halfDur;
                newEvent.addedTime = minute - halfDur;
            } else if (period === 2 && minute > fullDur) {
                newEvent.minute = fullDur;
                newEvent.addedTime = minute - fullDur;
            } else if (period === 3 && minute > firstExtraEnd) {
                newEvent.minute = firstExtraEnd;
                newEvent.addedTime = minute - firstExtraEnd;
            } else if (period === 4 && minute > secondExtraEnd) {
                newEvent.minute = secondExtraEnd;
                newEvent.addedTime = minute - secondExtraEnd;
            }

            // Update scores if goal
            let homeScore = activeMatch.homeScore || 0;
            let awayScore = activeMatch.awayScore || 0;

            if (currentAction === 'goal') {
                if (formData.team === 'home') {
                    homeScore += 1;
                } else {
                    awayScore += 1;
                }
            }

            const updatedMatch: Match = {
                ...activeMatch,
                homeScore,
                awayScore,
                events: [newEvent, ...(activeMatch.events || [])],
                currentMinute: minute,
            };

            setActiveMatch(updatedMatch);

            // Persist to context
            try {
                await updateMatch(activeMatch.id, {
                    status: 'live',
                    homeScore,
                    awayScore,
                    events: updatedMatch.events,
                    currentMinute: minute,
                });
            } catch (error) {
                console.error('Error updating match:', error);
            }

            setModalVisible(false);
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Hata', 'Olay kaydedilemedi');
        }
    };

    // Delete event
    const handleDeleteEvent = (event: MatchEvent) => {
        Alert.alert(
            'Olayı Sil',
            'Bu olayı silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        if (!activeMatch) return;

                        try {
                            // Calculate new scores if goal is deleted
                            let homeScore = activeMatch.homeScore || 0;
                            let awayScore = activeMatch.awayScore || 0;

                            if (event.type === 'goal') {
                                if (event.team === 'home') {
                                    homeScore = Math.max(0, homeScore - 1);
                                } else {
                                    awayScore = Math.max(0, awayScore - 1);
                                }
                            }

                            // Remove event from list
                            const updatedEvents = activeMatch.events.filter(e => e.id !== event.id);

                            const updatedMatch: Match = {
                                ...activeMatch,
                                homeScore,
                                awayScore,
                                events: updatedEvents,
                            };

                            setActiveMatch(updatedMatch);

                            // Persist updates
                            try {
                                await updateMatch(activeMatch.id, {
                                    status: 'live',
                                    homeScore,
                                    awayScore,
                                    events: updatedEvents,
                                });
                            } catch (error) {
                                console.error('Error updating match:', error);
                            }
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert('Hata', 'Olay silinemedi');
                        }
                    },
                },
            ]
        );
    };

    // End match
    const handleEndMatch = () => {
        Alert.alert(
            'Maçı Bitir',
            'Maçı bitirmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Bitir',
                    onPress: async () => {
                        if (!activeMatch) return;
                        await performEndMatch();
                    },
                },
            ]
        );
    };

    const performEndMatch = async () => {
        if (!activeMatch) return;

        setIsRunning(false);

        try {
            await updateMatch(activeMatch.id, {
                status: 'completed',
                homeScore: activeMatch.homeScore,
                awayScore: activeMatch.awayScore,
                events: activeMatch.events,
            });
            await clearPersistedMatch();
            setActiveMatch(null);
            setElapsedSeconds(0);
            periodStartTimeRef.current = null;
            periodBaseSecondsRef.current = 0;
            accumulatedSecondsRef.current = 0;
        } catch (error) {
            console.error('Error ending match:', error);
            Alert.alert('Hata', 'Maç bitirilemedi');
        }
    };

    const confirmEndMatchOrExtra = () => {
        if (period === 2) {
            Alert.alert(
                'Normal Süre Bitti',
                'Maçı bitirmek mi istiyorsunuz yoksa uzatma devrelerine mi geçilecek?',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Uzatmaya Geç',
                        onPress: () => handleNextPeriod() // Will trigger P2 -> P3 alert
                    },
                    {
                        text: 'Maçı Bitir',
                        style: 'destructive',
                        onPress: performEndMatch
                    }
                ]
            );
        } else {
            handleEndMatch();
        }
    };

    // Cancel match - exit without saving
    const handleCancelMatch = () => {
        Alert.alert(
            'Takibi İptal Et',
            'Tüm kayıtlar silinecek ve maç seçim ekranına döneceksiniz. Emin misiniz?',
            [
                { text: 'Hayır', style: 'cancel' },
                {
                    text: 'Evet, Çık',
                    style: 'destructive',
                    onPress: async () => {
                        // Restore match to scheduled status
                        if (activeMatch) {
                            try {
                                await updateMatch(activeMatch.id, {
                                    status: 'scheduled',
                                    homeScore: 0,
                                    awayScore: 0,
                                    events: [],
                                });
                            } catch (error) {
                                console.error('Error restoring match:', error);
                            }
                        }
                        await clearPersistedMatch();
                        setIsRunning(false);
                        setActiveMatch(null);
                        setElapsedSeconds(0);
                        periodStartTimeRef.current = null;
                        periodBaseSecondsRef.current = 0;
                        accumulatedSecondsRef.current = 0;
                    },
                },
            ]
        );
    };

    // Get event icon and color
    const getEventDisplay = (event: MatchEvent) => {
        switch (event.type) {
            case 'goal':
                return { icon: 'soccer', color: theme.success, label: 'GOL' }; // Using theme.success
            case 'yellowCard':
                return { icon: 'card', color: theme.warning, label: 'SARI KART' }; // Using theme.warning
            case 'redCard':
                return { icon: 'card', color: theme.error, label: 'KIRMIZI KART' }; // Using theme.error
            case 'substitution':
                return { icon: 'swap-horizontal', color: theme.primary, label: 'DEĞİŞİKLİK' };
            default:
                return { icon: 'circle', color: theme.textSecondary, label: event.type };
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    // Match selection view (no active match)
    if (!activeMatch) {
        const availableMatches = [...scheduledMatches, ...liveMatches];

        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Surface style={styles.headerSurface} elevation={0}>
                    <Text style={styles.headerTitle}>Canlı Takip</Text>
                    <Text style={styles.headerSubtitle}>
                        Takip etmek istediğiniz maçı seçin
                    </Text>
                </Surface>

                {availableMatches.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="whistle" size={64} color={theme.textSecondary} />
                        <Text style={styles.emptyTitle}>Maç Bulunamadı</Text>
                        <Text style={styles.emptySubtitle}>
                            Önce "Maçlar" sekmesinden yeni bir maç ekleyin.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={availableMatches}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <Card style={styles.matchCard} mode="elevated">
                                <Card.Content>
                                    <View style={styles.matchInfo}>
                                        <Text style={styles.matchTeams}>
                                            {item.homeTeam} vs {item.awayTeam}
                                        </Text>
                                        <Text style={styles.matchDetails}>
                                            {item.date} • {item.time} • {item.category}
                                        </Text>
                                    </View>
                                </Card.Content>
                                <Card.Actions>
                                    <Button
                                        mode="contained"
                                        onPress={() => handleStartMatch(item)}
                                        style={styles.startButton}
                                        icon="play"
                                        labelStyle={{ color: '#FFFFFF' }} // Always white text on primary button
                                    >
                                        Canlı Takibi Başlat
                                    </Button>
                                </Card.Actions>
                            </Card>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    // Live match view
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Scoreboard */}
            <Surface style={styles.scoreboard} elevation={2}>
                <View style={styles.teamSection}>
                    <Text style={styles.teamName} numberOfLines={2}>{activeMatch.homeTeam}</Text>
                    <Text style={styles.score}>{activeMatch.homeScore}</Text>
                </View>

                <View style={styles.centerSection}>
                    <Text style={[
                        styles.stopwatch,
                        (() => {
                            const halfDur = getHalfDuration();
                            const fullDur = halfDur * 2;
                            const extraHalf = getExtraTimeHalfDuration();
                            const firstExtraEnd = fullDur + extraHalf;
                            const secondExtraEnd = fullDur + extraHalf * 2;
                            return (period === 1 && elapsedSeconds > halfDur * 60) ||
                                (period === 2 && elapsedSeconds > fullDur * 60) ||
                                (period === 3 && elapsedSeconds > firstExtraEnd * 60) ||
                                (period === 4 && elapsedSeconds > secondExtraEnd * 60)
                                ? { color: '#fb923c' } // Orange for injury time
                                : {};
                        })()
                    ]}>
                        {formatTime(elapsedSeconds)}
                        {injuryTime > 0 && (
                            <Text style={{ fontSize: 24, color: '#fb923c' }}>
                                {` / +${injuryTime}`}
                            </Text>
                        )}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Chip
                            mode={isRunning ? 'flat' : 'outlined'}
                            style={[styles.statusChip, isRunning && styles.liveChip]}
                            textStyle={styles.statusChipText}
                        >
                            {isRunning ? '● CANLI' : 'DURDURULDU'}
                        </Chip>
                        <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                            {period === 1 ? '1. DEVRE' : period === 2 ? '2. DEVRE' : period === 3 ? '1. UZATMA' : '2. UZATMA'}
                        </Chip>
                    </View>
                </View>

                <View style={styles.teamSection}>
                    <Text style={styles.teamName} numberOfLines={2}>{activeMatch.awayTeam}</Text>
                    <Text style={styles.score}>{activeMatch.awayScore}</Text>
                </View>
            </Surface>

            {/* Control Buttons */}
            <View style={styles.controlRow}>
                <Button
                    mode="outlined"
                    onPress={() => setShowInjuryModal(true)}
                    icon="timer-plus"
                    style={[styles.controlButton, { borderColor: '#fb923c' }]}
                    textColor="#fb923c"
                >
                    +{injuryTime > 0 ? injuryTime : ''} Uzatma
                </Button>

                {period === 1 ? (
                    <Button
                        mode="outlined"
                        onPress={handleNextPeriod}
                        icon="skip-next"
                        style={styles.controlButton}
                        textColor={theme.primary}
                    >
                        2. Devre
                    </Button>
                ) : period === 3 ? (
                    <Button
                        mode="outlined"
                        onPress={handleNextPeriod}
                        icon="skip-next"
                        style={styles.controlButton}
                        textColor={theme.primary}
                    >
                        2. Uzatma
                    </Button>
                ) : (
                    <Button
                        mode="outlined"
                        onPress={confirmEndMatchOrExtra}
                        icon="flag-checkered"
                        style={styles.controlButton}
                        textColor={theme.error}
                    >
                        Bitir
                    </Button>
                )}

                <Button
                    mode={isRunning ? 'outlined' : 'contained'}
                    onPress={toggleStopwatch}
                    icon={isRunning ? 'pause' : 'play'}
                    textColor={isRunning ? theme.primary : '#FFFFFF'}
                    style={[styles.controlButton, !isRunning && { backgroundColor: theme.primary }]}
                >
                    {isRunning ? 'Durdur' : 'Başlat'}
                </Button>
            </View>

            {/* Injury Time Modal */}
            <Portal>
                <Modal visible={showInjuryModal} onDismiss={() => setShowInjuryModal(false)} contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Uzatma Süresi Ekle</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(min => (
                            <Button
                                key={min}
                                mode="outlined"
                                onPress={() => handleAddInjuryTime(min)}
                                style={{ borderColor: theme.primary, minWidth: 60 }}
                            >
                                +{min}
                            </Button>
                        ))}
                    </View>
                    <Button onPress={() => setShowInjuryModal(false)} style={{ marginTop: 16 }}>İptal</Button>
                </Modal>
            </Portal>

            {/* Action Buttons */}
            <Surface style={styles.actionsContainer} elevation={1}>
                <Text style={styles.actionsTitle}>OLAY KAYDET</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.goalButton]}
                        onPress={() => openActionModal('goal')}
                    >
                        <Text style={styles.actionIcon}>⚽</Text>
                        <Text style={styles.actionLabel}>GOL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.yellowButton]}
                        onPress={() => openActionModal('yellowCard')}
                    >
                        <Text style={styles.actionIcon}>🟨</Text>
                        <Text style={styles.actionLabel}>SARI KART</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.redButton]}
                        onPress={() => openActionModal('redCard')}
                    >
                        <Text style={styles.actionIcon}>🟥</Text>
                        <Text style={styles.actionLabel}>KIRMIZI KART</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.subButton]}
                        onPress={() => openActionModal('substitution')}
                    >
                        <Text style={styles.actionIcon}>🔄</Text>
                        <Text style={styles.actionLabel}>DEĞİŞİKLİK</Text>
                    </TouchableOpacity>
                </View>
            </Surface>

            {/* Event Log */}
            <Surface style={styles.eventLogContainer} elevation={1}>
                <Text style={styles.eventLogTitle}>OLAY GEÇMİŞİ</Text>
                <ScrollView style={styles.eventLogScroll}>
                    {activeMatch.events.length === 0 ? (
                        <Text style={styles.noEventsText}>Henüz olay kaydedilmedi</Text>
                    ) : (
                        activeMatch.events.map((event) => {
                            const display = getEventDisplay(event);
                            const teamName = event.team === 'home' ? activeMatch.homeTeam : activeMatch.awayTeam;
                            return (
                                <View key={event.id} style={styles.eventItem}>
                                    <View style={[styles.eventMinute, { backgroundColor: display.color }]}>
                                        <Text style={styles.eventMinuteText}>{event.minute}'</Text>
                                    </View>
                                    <View style={styles.eventDetails}>
                                        <Text style={styles.eventLabel}>{display.label}</Text>
                                        <Text style={styles.eventInfo}>
                                            {event.player ? `${event.player} - ` : ''}{teamName}
                                        </Text>
                                    </View>
                                    <IconButton
                                        icon="delete"
                                        size={20}
                                        iconColor={theme.error}
                                        onPress={() => handleDeleteEvent(event)}
                                    />
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </Surface>

            {/* Event Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text style={styles.modalTitle}>
                        {currentAction === 'goal' && '⚽ Gol Kaydı'}
                        {currentAction === 'yellowCard' && '🟨 Sarı Kart'}
                        {currentAction === 'redCard' && '🟥 Kırmızı Kart'}
                        {currentAction === 'substitution' && '🔄 Oyuncu Değişikliği'}
                    </Text>

                    <TextInput
                        label="Dakika"
                        value={formData.minute}
                        onChangeText={(text) => setFormData({ ...formData, minute: text })}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="numeric"
                        textColor={theme.text}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={{ colors: { background: theme.inputBackground, text: theme.text } }} // Override Paper input theme
                    />

                    <Text style={styles.teamSelectLabel}>Takım Seçin</Text>
                    <View style={styles.teamSelectRow}>
                        <TouchableOpacity
                            style={[
                                styles.teamSelectButton,
                                formData.team === 'home' && styles.teamSelectActive
                            ]}
                            onPress={() => setFormData({ ...formData, team: 'home' })}
                        >
                            <Text style={[
                                styles.teamSelectText,
                                formData.team === 'home' && styles.teamSelectTextActive
                            ]}>
                                {activeMatch.homeTeam}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.teamSelectButton,
                                formData.team === 'away' && styles.teamSelectActive
                            ]}
                            onPress={() => setFormData({ ...formData, team: 'away' })}
                        >
                            <Text style={[
                                styles.teamSelectText,
                                formData.team === 'away' && styles.teamSelectTextActive
                            ]}>
                                {activeMatch.awayTeam}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {currentAction === 'substitution' ? (
                        <>
                            <TextInput
                                label="Çıkan Oyuncu"
                                value={formData.playerOut}
                                onChangeText={(text) => setFormData({ ...formData, playerOut: text })}
                                style={styles.input}
                                mode="outlined"
                                placeholder="Forma No / Ad"
                                textColor={theme.text}
                                placeholderTextColor={theme.textSecondary}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                theme={{ colors: { background: theme.inputBackground, text: theme.text } }}
                            />
                            <TextInput
                                label="Giren Oyuncu"
                                value={formData.playerIn}
                                onChangeText={(text) => setFormData({ ...formData, playerIn: text })}
                                style={styles.input}
                                mode="outlined"
                                placeholder="Forma No / Ad"
                                textColor={theme.text}
                                placeholderTextColor={theme.textSecondary}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                theme={{ colors: { background: theme.inputBackground, text: theme.text } }}
                            />
                        </>
                    ) : (
                        <TextInput
                            label="Oyuncu"
                            value={formData.player}
                            onChangeText={(text) => setFormData({ ...formData, player: text })}
                            style={styles.input}
                            mode="outlined"
                            placeholder="Forma No / Ad"
                            textColor={theme.text}
                            placeholderTextColor={theme.textSecondary}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            theme={{ colors: { background: theme.inputBackground, text: theme.text } }}
                        />
                    )}

                    <View style={styles.modalActions}>
                        <Button
                            mode="outlined"
                            onPress={() => setModalVisible(false)}
                            style={styles.modalButton}
                            textColor={theme.textSecondary}
                        >
                            İptal
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSaveEvent}
                            style={[styles.modalButton, styles.saveButton]}
                        >
                            Kaydet
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.textSecondary,
    },
    headerSurface: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: theme.headerBackground || theme.primary,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.headerText || '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    matchCard: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: theme.card,
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
    matchInfo: {
        marginBottom: 12,
    },
    matchTeams: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
    },
    matchDetails: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 6,
        fontWeight: '500',
    },
    startButton: {
        backgroundColor: theme.primary,
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    // TV-Style Scoreboard
    scoreboard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: theme.headerBackground || theme.primary,
        ...Platform.select({
            ios: {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    teamSection: {
        flex: 1,
        alignItems: 'center',
    },
    teamName: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginBottom: 10,
    },
    score: {
        fontSize: 56,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    centerSection: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    stopwatch: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    statusChip: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    liveChip: {
        backgroundColor: theme.error,
    },
    statusChipText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    // Controls
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 12,
    },
    controlButton: {
        flex: 1,
        borderRadius: 12,
    },
    backButton: {
        flex: 0.8,
    },
    // Actions Grid
    actionsContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.card,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    actionsTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textSecondary,
        marginBottom: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        height: 100,
        marginBottom: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    goalButton: {
        backgroundColor: '#D1FAE5', // Keep these light pastel for contrast, or adapt? Dark mode these might be too bright.
        // For dark mode, maybe darker shades?
        // Let's use hardcoded for now, or use theme mix.
        // If theme is dark, use different? 
        // For safety, I'll valid check.
        // But for now, let's keep pastel as buttons often have fixed nice colors. 
        // Better: use theme specific logic or opacity.
    },
    yellowButton: {
        backgroundColor: '#FEF3C7',
    },
    redButton: {
        backgroundColor: '#FEE2E2',
    },
    subButton: {
        backgroundColor: '#DBEAFE',
    },
    actionIcon: {
        fontSize: 48,
        marginBottom: 8,
        color: '#000000', // Icons on pastel buttons usually black
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#121212',
    },
    // Event log
    eventLogContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.card,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    eventLogTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textSecondary,
        marginBottom: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    eventLogScroll: {
        flex: 1,
    },
    noEventsText: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        paddingVertical: 24,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
    },
    eventMinute: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    eventMinuteText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    eventDetails: {
        flex: 1,
    },
    eventLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    eventInfo: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 3,
    },
    // Modal
    modalContainer: {
        backgroundColor: theme.surface,
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 20,
    },
    input: {
        marginBottom: 14,
        backgroundColor: theme.inputBackground,
        borderRadius: 12,
        fontSize: 18,
        height: 60,
    },
    teamSelectLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
        marginBottom: 10,
        marginLeft: 4,
    },
    teamSelectRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    teamSelectButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
        alignItems: 'center',
    },
    teamSelectActive: {
        borderColor: theme.primary,
        backgroundColor: theme.inputBackground, // Or a tinted background if possible, but keep simple
    },
    teamSelectText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
        textAlign: 'center',
    },
    teamSelectTextActive: {
        color: theme.primary,
        fontWeight: '700',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 12,
    },
    modalButton: {
        minWidth: 100,
        borderRadius: 12,
    },
    saveButton: {
        backgroundColor: theme.primary,
    },
});
