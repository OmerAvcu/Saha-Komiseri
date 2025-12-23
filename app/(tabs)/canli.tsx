import { useAppContext } from '@/context/AppContext';
import { Match } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Surface, Text } from 'react-native-paper';

function LiveMatchCard({ match }: { match: Match }) {
    return (
        <Card style={styles.liveCard} mode="elevated">
            <Card.Content>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>CANLI</Text>
                </View>

                <View style={styles.leagueRow}>
                    <Chip
                        icon="trophy"
                        mode="outlined"
                        compact
                        textStyle={styles.chipText}
                        style={styles.leagueChip}
                    >
                        {match.league}
                    </Chip>
                </View>

                <View style={styles.scoreContainer}>
                    <View style={styles.teamColumn}>
                        <MaterialCommunityIcons name="shield" size={48} color="#1a73e8" />
                        <Text style={styles.teamNameLive}>{match.homeTeam}</Text>
                    </View>

                    <View style={styles.scoreColumn}>
                        <Text style={styles.scoreText}>
                            {match.homeScore} - {match.awayScore}
                        </Text>
                        <Text style={styles.timeText}>{match.currentMinute || 0}'</Text>
                    </View>

                    <View style={styles.teamColumn}>
                        <MaterialCommunityIcons name="shield" size={48} color="#1a73e8" />
                        <Text style={styles.teamNameLive}>{match.awayTeam}</Text>
                    </View>
                </View>

                <View style={styles.venueRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                    <Text style={styles.venueText}>{match.venue}</Text>
                </View>

                <Button
                    mode="contained"
                    style={styles.trackButton}
                    icon="whistle"
                >
                    Maçı Yönet
                </Button>
            </Card.Content>
        </Card>
    );
}

function NoLiveMatch() {
    return (
        <Card style={styles.noMatchCard} mode="elevated">
            <Card.Content style={styles.noMatchContent}>
                <MaterialCommunityIcons name="broadcast-off" size={64} color="#9ca3af" />
                <Text style={styles.noMatchTitle}>Canlı Maç Yok</Text>
                <Text style={styles.noMatchSubtitle}>
                    Şu an devam eden bir maç bulunmuyor.
                </Text>
                <Text style={styles.noMatchSubtitle}>
                    Planlanan maçlardan birini başlatmak için Maçlar sekmesine gidin.
                </Text>
            </Card.Content>
        </Card>
    );
}

export default function CanliScreen() {
    const { getLiveMatches, isLoading } = useAppContext();
    const liveMatches = getLiveMatches();
    const liveMatch = liveMatches.length > 0 ? liveMatches[0] : null;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Surface style={styles.headerSurface} elevation={1}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Canlı Takip</Text>
                    {liveMatch && (
                        <View style={styles.headerLive}>
                            <View style={styles.liveDotSmall} />
                            <Text style={styles.headerLiveText}>{liveMatches.length} maç devam ediyor</Text>
                        </View>
                    )}
                </View>
            </Surface>

            <View style={styles.content}>
                {liveMatch ? <LiveMatchCard match={liveMatch} /> : <NoLiveMatch />}
            </View>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerLive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    headerLiveText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    liveCard: {
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    liveDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ef4444',
    },
    liveText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
        letterSpacing: 2,
    },
    leagueRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    leagueChip: {
        backgroundColor: '#e8f0fe',
    },
    chipText: {
        fontSize: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginVertical: 16,
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
    },
    scoreColumn: {
        alignItems: 'center',
    },
    teamNameLive: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
        marginTop: 8,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    timeText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '600',
        marginTop: 4,
    },
    venueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    venueText: {
        fontSize: 12,
        color: '#6b7280',
    },
    trackButton: {
        marginTop: 16,
        backgroundColor: '#1a73e8',
        borderRadius: 8,
    },
    noMatchCard: {
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: '#ffffff',
    },
    noMatchContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noMatchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 16,
    },
    noMatchSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 24,
    },
});
