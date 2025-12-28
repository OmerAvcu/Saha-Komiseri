import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent, MatchEventType } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    startTime: number; // Unix timestamp when match started
    pausedAt: number | null; // Elapsed seconds when paused
    isRunning: boolean;
    match: Match;
}

export default function CanliTakipScreen() {
    const { getScheduledMatches, getLiveMatches, getMatchById, updateMatch, isLoading } = useAppContext();

    // Active match state
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);

    // Stopwatch state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const matchStartTimeRef = useRef<number | null>(null);
    const pausedSecondsRef = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const scheduledMatches = getScheduledMatches();
    const liveMatches = getLiveMatches();

    // Load persisted live match on mount
    useEffect(() => {
        loadPersistedMatch();
    }, []);

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active' && activeMatch && isRunning) {
                // App came to foreground, recalculate elapsed time
                const stored = await AsyncStorage.getItem(LIVE_MATCH_STORAGE_KEY);
                if (stored) {
                    const state: LiveMatchState = JSON.parse(stored);
                    if (state.isRunning && state.startTime) {
                        const now = Date.now();
                        const realElapsed = Math.floor((now - state.startTime) / 1000);
                        const matchElapsed = realElapsed * TEST_SPEED_MULTIPLIER;
                        setElapsedSeconds(matchElapsed + (state.pausedAt || 0));
                    }
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [activeMatch, isRunning]);

    const loadPersistedMatch = async () => {
        try {
            const stored = await AsyncStorage.getItem(LIVE_MATCH_STORAGE_KEY);
            if (stored) {
                const state: LiveMatchState = JSON.parse(stored);
                const match = getMatchById(state.matchId);
                if (match && match.status === 'live') {
                    setActiveMatch(state.match);
                    matchStartTimeRef.current = state.startTime;
                    pausedSecondsRef.current = state.pausedAt || 0;

                    if (state.isRunning) {
                        const now = Date.now();
                        const realElapsed = Math.floor((now - state.startTime) / 1000);
                        const matchElapsed = realElapsed * TEST_SPEED_MULTIPLIER;
                        setElapsedSeconds(matchElapsed + pausedSecondsRef.current);
                        setIsRunning(true);
                    } else {
                        setElapsedSeconds(state.pausedAt || 0);
                    }
                } else {
                    await AsyncStorage.removeItem(LIVE_MATCH_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error loading persisted match:', error);
        }
    };

    const persistLiveMatch = async (running: boolean, elapsed: number, matchToSave?: Match) => {
        const matchData = matchToSave || activeMatch;
        if (!matchData) return;
        try {
            const state: LiveMatchState = {
                matchId: matchData.id,
                startTime: running ? Date.now() : (matchStartTimeRef.current || Date.now()),
                pausedAt: running ? 0 : elapsed,
                isRunning: running,
                match: matchData,
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

    // Stopwatch logic - simpler approach with speed multiplier
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + TEST_SPEED_MULTIPLIER);
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
        matchStartTimeRef.current = null;
        pausedSecondsRef.current = 0;
        setIsRunning(false);
        // Pass the new match directly to avoid race condition
        persistLiveMatch(false, 0, newMatch);
    };

    // Toggle stopwatch
    const toggleStopwatch = () => {
        const newRunning = !isRunning;
        if (newRunning) {
            matchStartTimeRef.current = Date.now();
            persistLiveMatch(true, elapsedSeconds);
        } else {
            pausedSecondsRef.current = elapsedSeconds;
            persistLiveMatch(false, elapsedSeconds);
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
                            matchStartTimeRef.current = null;
                        } catch (error) {
                            console.error('Error ending match:', error);
                            Alert.alert('Hata', 'Maç bitirilemedi');
                        }
                    },
                },
            ]
        );
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
                        matchStartTimeRef.current = null;
                    },
                },
            ]
        );
    };

    // Get event icon and color
    const getEventDisplay = (event: MatchEvent) => {
        switch (event.type) {
            case 'goal':
                return { icon: 'soccer', color: '#10b981', label: 'GOL' };
            case 'yellowCard':
                return { icon: 'card', color: '#f59e0b', label: 'SARI KART' };
            case 'redCard':
                return { icon: 'card', color: '#ef4444', label: 'KIRMIZI KART' };
            case 'substitution':
                return { icon: 'swap-horizontal', color: '#3b82f6', label: 'DEĞİŞİKLİK' };
            default:
                return { icon: 'circle', color: '#6b7280', label: event.type };
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
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
                        <MaterialCommunityIcons name="whistle" size={64} color="#9ca3af" />
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
                    <Text style={styles.stopwatch}>{formatTime(elapsedSeconds)}</Text>
                    <Chip
                        mode={isRunning ? 'flat' : 'outlined'}
                        style={[styles.statusChip, isRunning && styles.liveChip]}
                        textStyle={styles.statusChipText}
                    >
                        {isRunning ? '● CANLI' : 'DURDURULDU'}
                    </Chip>
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
                    onPress={handleCancelMatch}
                    icon="arrow-left"
                    style={styles.backButton}
                    textColor="#6b7280"
                >
                    Geri
                </Button>
                <Button
                    mode={isRunning ? 'outlined' : 'contained'}
                    onPress={toggleStopwatch}
                    icon={isRunning ? 'pause' : 'play'}
                    style={styles.controlButton}
                >
                    {isRunning ? 'Durdur' : 'Başlat'}
                </Button>
                <Button
                    mode="outlined"
                    onPress={handleEndMatch}
                    icon="flag-checkered"
                    style={styles.controlButton}
                    textColor="#ef4444"
                >
                    Bitir
                </Button>
            </View>

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
                                        iconColor="#EF4444"
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
                        textColor="#000000"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
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
                                textColor="#000000"
                                placeholderTextColor="#666666"
                                outlineColor="#cccccc"
                                activeOutlineColor="#1a73e8"
                            />
                            <TextInput
                                label="Giren Oyuncu"
                                value={formData.playerIn}
                                onChangeText={(text) => setFormData({ ...formData, playerIn: text })}
                                style={styles.input}
                                mode="outlined"
                                placeholder="Forma No / Ad"
                                textColor="#000000"
                                placeholderTextColor="#666666"
                                outlineColor="#cccccc"
                                activeOutlineColor="#1a73e8"
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
                            textColor="#000000"
                            placeholderTextColor="#666666"
                            outlineColor="#cccccc"
                            activeOutlineColor="#1a73e8"
                        />
                    )}

                    <View style={styles.modalActions}>
                        <Button
                            mode="outlined"
                            onPress={() => setModalVisible(false)}
                            style={styles.modalButton}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    headerSurface: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#2962FF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
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
        backgroundColor: '#FFFFFF',
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
        color: '#121212',
    },
    matchDetails: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 6,
        fontWeight: '500',
    },
    startButton: {
        backgroundColor: '#2962FF',
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
        color: '#121212',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#6B7280',
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
        backgroundColor: '#2962FF',
        ...Platform.select({
            ios: {
                shadowColor: '#2962FF',
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
        backgroundColor: '#EF4444',
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
        backgroundColor: '#FFFFFF',
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
        color: '#6B7280',
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
        height: 80,
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
        backgroundColor: '#D1FAE5',
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
        fontSize: 32,
        marginBottom: 6,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#121212',
    },
    // Event log
    eventLogContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
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
        color: '#6B7280',
        marginBottom: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    eventLogScroll: {
        flex: 1,
    },
    noEventsText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 24,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
        color: '#121212',
    },
    eventInfo: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 3,
    },
    // Modal
    modalContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#121212',
        marginBottom: 20,
    },
    input: {
        marginBottom: 14,
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
    },
    teamSelectLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
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
        borderColor: '#E5E7EB',
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
    },
    teamSelectActive: {
        borderColor: '#2962FF',
        backgroundColor: '#E8F0FE',
    },
    teamSelectText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        textAlign: 'center',
    },
    teamSelectTextActive: {
        color: '#2962FF',
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
        backgroundColor: '#2962FF',
    },
});
