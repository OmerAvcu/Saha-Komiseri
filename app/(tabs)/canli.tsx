import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent, MatchEventType } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput,
} from 'react-native-paper';
import { v4 as uuidv4 } from 'uuid';

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

export default function CanliTakipScreen() {
    const { getScheduledMatches, getLiveMatches, updateMatch, isLoading } = useAppContext();

    // Active match state
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);

    // Stopwatch state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const startTimeRef = useRef<number | null>(null);
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

    // Stopwatch logic using timestamp for accuracy
    useEffect(() => {
        if (isRunning) {
            if (startTimeRef.current === null) {
                startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
            }

            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const newElapsed = Math.floor((now - startTimeRef.current!) / 1000);
                setElapsedSeconds(newElapsed);
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
        setActiveMatch({ ...match, status: 'live', homeScore: 0, awayScore: 0, events: [] });
        setElapsedSeconds(0);
        startTimeRef.current = null;
        setIsRunning(false);
    };

    // Toggle stopwatch
    const toggleStopwatch = () => {
        if (!isRunning) {
            // Starting
            startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
        }
        setIsRunning(!isRunning);
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

        const minute = parseInt(formData.minute) || getCurrentMinute();

        const newEvent: MatchEvent = {
            id: uuidv4(),
            minute,
            type: currentAction as MatchEventType,
            team: formData.team,
            player: formData.player.trim() || undefined,
            playerOut: formData.playerOut?.trim() || undefined,
            playerIn: formData.playerIn?.trim() || undefined,
        };

        // Update scores if goal
        let homeScore = activeMatch.homeScore;
        let awayScore = activeMatch.awayScore;

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
            events: [newEvent, ...activeMatch.events],
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
                            setActiveMatch(null);
                            setElapsedSeconds(0);
                            startTimeRef.current = null;
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
                    onPress: () => {
                        setIsRunning(false);
                        setActiveMatch(null);
                        setElapsedSeconds(0);
                        startTimeRef.current = null;
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
            <View style={styles.container}>
                <Surface style={styles.headerSurface} elevation={1}>
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
            </View>
        );
    }

    // Live match view
    return (
        <View style={styles.container}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    headerSurface: {
        padding: 16,
        backgroundColor: '#ffffff',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    matchCard: {
        marginVertical: 8,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    matchInfo: {
        marginBottom: 8,
    },
    matchTeams: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    matchDetails: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    startButton: {
        backgroundColor: '#1a73e8',
        flex: 1,
        marginHorizontal: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    // Scoreboard
    scoreboard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        marginBottom: 8,
        borderRadius: 16,
        backgroundColor: '#1a73e8',
    },
    teamSection: {
        flex: 1,
        alignItems: 'center',
    },
    teamName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    score: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    centerSection: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    stopwatch: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        fontFamily: 'monospace',
    },
    statusChip: {
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    liveChip: {
        backgroundColor: '#ef4444',
    },
    statusChipText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Controls
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
        gap: 12,
    },
    controlButton: {
        flex: 1,
    },
    backButton: {
        flex: 0.8,
    },
    // Actions
    actionsContainer: {
        margin: 16,
        marginTop: 8,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    actionsTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6b7280',
        marginBottom: 12,
        letterSpacing: 1,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        height: 70,
        marginBottom: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalButton: {
        backgroundColor: '#d1fae5',
    },
    yellowButton: {
        backgroundColor: '#fef3c7',
    },
    redButton: {
        backgroundColor: '#fee2e2',
    },
    subButton: {
        backgroundColor: '#dbeafe',
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    // Event log
    eventLogContainer: {
        flex: 1,
        margin: 16,
        marginTop: 8,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    eventLogTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6b7280',
        marginBottom: 12,
        letterSpacing: 1,
    },
    eventLogScroll: {
        flex: 1,
    },
    noEventsText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        paddingVertical: 20,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    eventMinute: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventMinuteText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    eventDetails: {
        flex: 1,
    },
    eventLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    eventInfo: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    // Modal
    modalContainer: {
        backgroundColor: '#ffffff',
        margin: 20,
        padding: 20,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    teamSelectLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 8,
        marginLeft: 4,
    },
    teamSelectRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    teamSelectButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cccccc',
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
    },
    teamSelectActive: {
        borderColor: '#1a73e8',
        backgroundColor: '#e8f0fe',
    },
    teamSelectText: {
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'center',
    },
    teamSelectTextActive: {
        color: '#1a73e8',
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        minWidth: 100,
    },
    saveButton: {
        backgroundColor: '#1a73e8',
    },
});
