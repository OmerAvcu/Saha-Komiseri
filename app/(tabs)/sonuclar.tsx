import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Share, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Surface, Text } from 'react-native-paper';

// Generate match report text for sharing
function generateMatchReport(match: Match): string {
    const getEventIcon = (type: string): string => {
        switch (type) {
            case 'goal': return '⚽';
            case 'yellowCard': return '🟨';
            case 'redCard': return '🟥';
            case 'substitution': return '🔄';
            default: return '•';
        }
    };

    const getEventText = (event: MatchEvent, match: Match): string => {
        const teamName = event.team === 'home' ? match.homeTeam : match.awayTeam;
        const icon = getEventIcon(event.type);

        switch (event.type) {
            case 'goal':
                return `• ${event.minute}' ${icon} Gol${event.player ? ` (${event.player} - ${teamName})` : ` (${teamName})`}`;
            case 'yellowCard':
                return `• ${event.minute}' ${icon} Sarı Kart${event.player ? ` (${event.player} - ${teamName})` : ` (${teamName})`}`;
            case 'redCard':
                return `• ${event.minute}' ${icon} Kırmızı Kart${event.player ? ` (${event.player} - ${teamName})` : ` (${teamName})`}`;
            case 'substitution':
                const subInfo = event.playerIn && event.playerOut
                    ? `(Giren: ${event.playerIn}, Çıkan: ${event.playerOut})`
                    : event.player ? `(${event.player})` : '';
                return `• ${event.minute}' ${icon} Değişiklik ${subInfo} - ${teamName}`;
            default:
                return `• ${event.minute}' ${event.type}`;
        }
    };

    // Sort events by minute (chronological order)
    const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);

    let eventsText = '';
    if (sortedEvents.length > 0) {
        eventsText = sortedEvents.map(event => getEventText(event, match)).join('\n');
    } else {
        eventsText = '• Olay kaydı girilmedi';
    }

    // Build referee staff section
    let refereeStaff = '👤 HAKEM KADROSU:\n';
    refereeStaff += `Orta Hakem: ${match.referee || 'Belirtilmedi'}\n`;
    refereeStaff += `1. Yrd. Hakem: ${match.assistantRef1 || 'Belirtilmedi'}\n`;
    refereeStaff += `2. Yrd. Hakem: ${match.assistantRef2 || 'Belirtilmedi'}`;
    if (match.fourthOfficial) {
        refereeStaff += `\n4. Hakem: ${match.fourthOfficial}`;
    }
    if (match.observer) {
        refereeStaff += `\n👀 Gözlemci: ${match.observer}`;
    }

    const report = `📋 MÜSABAKA RAPORU

🏆 ${match.category}
🏟 ${match.venue}
🗓 ${match.date} - ${match.time}

⚔️ ${match.homeTeam}  ${match.homeScore} - ${match.awayScore}  ${match.awayTeam}
--------------------------------
⏱ DAKİKALAR & OLAYLAR:
${eventsText}
--------------------------------
${refereeStaff}
--------------------------------
📱 Saha Komiseri Uygulaması ile oluşturuldu.`;

    return report;
}

// Handle share action
async function handleShareMatch(match: Match) {
    try {
        const report = generateMatchReport(match);
        await Share.share({
            message: report,
        });
    } catch (error) {
        console.error('Error sharing match:', error);
    }
}

function ResultCard({ match }: { match: Match }) {
    const homeWin = match.homeScore > match.awayScore;
    const awayWin = match.awayScore > match.homeScore;
    const isDraw = match.homeScore === match.awayScore;

    return (
        <Card style={styles.card} mode="elevated">
            <Card.Content>
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
                    <Chip
                        icon="check-circle"
                        mode="flat"
                        compact
                        textStyle={styles.completedChipText}
                        style={styles.completedChip}
                    >
                        Tamamlandı
                    </Chip>
                </View>

                <View style={styles.resultContainer}>
                    <View style={styles.teamResult}>
                        <MaterialCommunityIcons
                            name="shield"
                            size={32}
                            color={homeWin ? '#10b981' : '#9ca3af'}
                        />
                        <Text style={[
                            styles.teamName,
                            homeWin && styles.winnerTeam,
                        ]}>
                            {match.homeTeam}
                        </Text>
                    </View>

                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>
                            {match.homeScore} - {match.awayScore}
                        </Text>
                        {isDraw && <Text style={styles.drawText}>Berabere</Text>}
                    </View>

                    <View style={styles.teamResult}>
                        <MaterialCommunityIcons
                            name="shield"
                            size={32}
                            color={awayWin ? '#10b981' : '#9ca3af'}
                        />
                        <Text style={[
                            styles.teamName,
                            awayWin && styles.winnerTeam,
                        ]}>
                            {match.awayTeam}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
                        <Text style={styles.infoText}>{match.date}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
                        <Text style={styles.infoText}>{match.venue}</Text>
                    </View>
                </View>

                {/* Share Button */}
                <Button
                    mode="contained"
                    onPress={() => handleShareMatch(match)}
                    icon="share-variant"
                    style={styles.shareButton}
                    labelStyle={styles.shareButtonLabel}
                >
                    Raporu Paylaş
                </Button>
            </Card.Content>
        </Card>
    );
}

function EmptyState() {
    return (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="trophy-broken" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Henüz Sonuç Yok</Text>
            <Text style={styles.emptySubtitle}>
                Tamamlanan maçlar burada görünecek.
            </Text>
        </View>
    );
}

export default function SonuclarScreen() {
    const { getCompletedMatches, isLoading } = useAppContext();
    const completedMatches = getCompletedMatches();

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
                <Text style={styles.headerTitle}>Maç Sonuçları</Text>
                <Text style={styles.headerSubtitle}>
                    {completedMatches.length > 0
                        ? `${completedMatches.length} maç tamamlandı`
                        : 'Henüz tamamlanmış maç yok'}
                </Text>
            </Surface>

            <FlatList
                data={completedMatches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ResultCard match={item} />}
                contentContainerStyle={[
                    styles.listContent,
                    completedMatches.length === 0 && styles.emptyListContent
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState />}
            />
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
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        marginVertical: 8,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    leagueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    leagueChip: {
        backgroundColor: '#e8f0fe',
    },
    completedChip: {
        backgroundColor: '#d1fae5',
    },
    chipText: {
        fontSize: 11,
    },
    completedChipText: {
        fontSize: 11,
        color: '#10b981',
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
        paddingHorizontal: 8,
    },
    teamResult: {
        flex: 1,
        alignItems: 'center',
    },
    teamName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 6,
    },
    winnerTeam: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    scoreContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    drawText: {
        fontSize: 11,
        color: '#f59e0b',
        fontWeight: '600',
        marginTop: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 11,
        color: '#6b7280',
    },
    shareButton: {
        marginTop: 16,
        backgroundColor: '#1a73e8',
        borderRadius: 8,
    },
    shareButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
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
        marginTop: 8,
    },
});
