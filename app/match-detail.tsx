import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
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

    const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);

    let eventsText = '';
    if (sortedEvents.length > 0) {
        eventsText = sortedEvents.map(event => getEventText(event, match)).join('\n');
    } else {
        eventsText = '• Olay kaydı girilmedi';
    }

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

export default function MatchDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ matchId: string }>();
    const { getMatchById, isLoading } = useAppContext();

    const match = params.matchId ? getMatchById(params.matchId) : null;

    const handleShareMatch = async () => {
        if (!match) return;
        try {
            const report = generateMatchReport(match);
            await Share.share({ message: report });
        } catch (error) {
            console.error('Error sharing match:', error);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'goal': return { icon: 'soccer', color: '#10b981', label: 'Gol' };
            case 'yellowCard': return { icon: 'card', color: '#f59e0b', label: 'Sarı Kart' };
            case 'redCard': return { icon: 'card', color: '#ef4444', label: 'Kırmızı Kart' };
            case 'substitution': return { icon: 'swap-horizontal', color: '#3b82f6', label: 'Değişiklik' };
            default: return { icon: 'circle', color: '#6b7280', label: type };
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    if (!match) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
                <Text style={styles.errorText}>Maç bulunamadı</Text>
                <Button mode="contained" onPress={() => router.back()}>Geri Dön</Button>
            </View>
        );
    }

    const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Maç Detayı',
                    headerStyle: { backgroundColor: '#1a73e8' },
                    headerTintColor: '#ffffff',
                }}
            />

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Score Header */}
                <Surface style={styles.scoreHeader} elevation={2}>
                    <View style={styles.teamsRow}>
                        <View style={styles.teamContainer}>
                            <MaterialCommunityIcons name="shield" size={32} color="#1a73e8" />
                            <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam}</Text>
                        </View>

                        <View style={styles.scoreContainer}>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreText}>{match.homeScore}</Text>
                                <Text style={styles.scoreSeparator}>-</Text>
                                <Text style={styles.scoreText}>{match.awayScore}</Text>
                            </View>
                            <Chip icon="check-circle" style={styles.completedChip} textStyle={styles.completedChipText}>
                                Tamamlandı
                            </Chip>
                        </View>

                        <View style={styles.teamContainer}>
                            <MaterialCommunityIcons name="shield" size={32} color="#1a73e8" />
                            <Text style={styles.teamName} numberOfLines={2}>{match.awayTeam}</Text>
                        </View>
                    </View>

                    <View style={styles.categoryRow}>
                        <Chip icon="trophy" style={styles.categoryChip}>{match.league}</Chip>
                        <Chip icon="tag" style={styles.categoryChip}>{match.category}</Chip>
                    </View>
                </Surface>

                {/* Match Info Card */}
                <Card style={styles.card}>
                    <Card.Title title="Maç Bilgileri" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="information" size={24} color="#1a73e8" />} />
                    <Card.Content>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                            <Text style={styles.infoLabel}>Tarih:</Text>
                            <Text style={styles.infoValue}>{match.date}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#6b7280" />
                            <Text style={styles.infoLabel}>Saat:</Text>
                            <Text style={styles.infoValue}>{match.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="stadium" size={20} color="#6b7280" />
                            <Text style={styles.infoLabel}>Stadyum:</Text>
                            <Text style={styles.infoValue}>{match.venue || 'Belirtilmedi'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Referee Staff Card */}
                <Card style={styles.card}>
                    <Card.Title title="Hakem Kadrosu" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="whistle" size={24} color="#1a73e8" />} />
                    <Card.Content>
                        <View style={styles.infoRow}>
                            <Text style={styles.refLabel}>Orta Hakem:</Text>
                            <Text style={styles.refValue}>{match.referee || 'Belirtilmedi'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.refLabel}>1. Yardımcı:</Text>
                            <Text style={styles.refValue}>{match.assistantRef1 || 'Belirtilmedi'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.refLabel}>2. Yardımcı:</Text>
                            <Text style={styles.refValue}>{match.assistantRef2 || 'Belirtilmedi'}</Text>
                        </View>
                        {match.fourthOfficial && (
                            <View style={styles.infoRow}>
                                <Text style={styles.refLabel}>4. Hakem:</Text>
                                <Text style={styles.refValue}>{match.fourthOfficial}</Text>
                            </View>
                        )}
                        {match.observer && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="eye" size={16} color="#6b7280" />
                                <Text style={styles.refLabel}>Gözlemci:</Text>
                                <Text style={styles.refValue}>{match.observer}</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Event Timeline Card */}
                <Card style={styles.card}>
                    <Card.Title title="Olay Akışı" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="timeline-clock" size={24} color="#1a73e8" />} />
                    <Card.Content>
                        {sortedEvents.length > 0 ? (
                            sortedEvents.map((event, index) => {
                                const { icon, color, label } = getEventIcon(event.type);
                                const teamName = event.team === 'home' ? match.homeTeam : match.awayTeam;

                                return (
                                    <View key={event.id || index} style={styles.eventRow}>
                                        <View style={styles.eventMinute}>
                                            <Text style={styles.eventMinuteText}>{event.minute}'</Text>
                                        </View>
                                        <View style={[styles.eventIcon, { backgroundColor: color + '20' }]}>
                                            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                                        </View>
                                        <View style={styles.eventDetails}>
                                            <Text style={styles.eventLabel}>{label}</Text>
                                            {event.player && <Text style={styles.eventPlayer}>{event.player}</Text>}
                                            {event.type === 'substitution' && event.playerIn && event.playerOut && (
                                                <Text style={styles.eventSubstitution}>
                                                    🔼 {event.playerIn} / 🔽 {event.playerOut}
                                                </Text>
                                            )}
                                            <Text style={styles.eventTeam}>{teamName}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.noEventsContainer}>
                                <MaterialCommunityIcons name="text-box-remove-outline" size={48} color="#9ca3af" />
                                <Text style={styles.noEventsText}>Bu maçta olay kaydı girilmemiştir.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Share Button */}
                <Button
                    mode="contained"
                    onPress={handleShareMatch}
                    icon="share-variant"
                    style={styles.shareButton}
                    labelStyle={styles.shareButtonLabel}
                >
                    WhatsApp Raporunu Paylaş
                </Button>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </>
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
    errorText: {
        marginTop: 12,
        marginBottom: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
    },
    scoreHeader: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        paddingVertical: 24,
        paddingHorizontal: 20,
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
    teamsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamContainer: {
        flex: 1,
        alignItems: 'center',
    },
    teamName: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: 10,
    },
    scoreContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 56,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scoreSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        marginHorizontal: 12,
    },
    completedChip: {
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    completedChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    categoryChip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    card: {
        marginHorizontal: 16,
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#121212',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 10,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#121212',
    },
    refLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    refValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#121212',
    },
    // Timeline Event Row
    eventRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        marginLeft: 20,
        borderLeftWidth: 2,
        borderLeftColor: '#E5E7EB',
        paddingLeft: 20,
    },
    eventMinute: {
        position: 'absolute',
        left: -11,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#2962FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventMinuteText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    eventIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventDetails: {
        flex: 1,
    },
    eventLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#121212',
    },
    eventPlayer: {
        fontSize: 13,
        color: '#4B5563',
        marginTop: 3,
    },
    eventSubstitution: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 3,
    },
    eventTeam: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 3,
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noEventsText: {
        marginTop: 14,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    shareButton: {
        marginHorizontal: 16,
        marginTop: 8,
        backgroundColor: '#25D366',
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#25D366',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    shareButtonLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: 40,
    },
});
