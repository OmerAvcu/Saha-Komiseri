import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Surface, Text, TextInput } from 'react-native-paper';

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

function ResultCard({ match, onPress }: { match: Match; onPress: () => void }) {
    const homeWin = match.homeScore > match.awayScore;
    const awayWin = match.awayScore > match.homeScore;
    const isDraw = match.homeScore === match.awayScore;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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

                    <View style={styles.scoreBoard}>
                        <View style={styles.teamSection}>
                            <MaterialCommunityIcons name="shield" size={24} color="#1a73e8" />
                            <Text style={[styles.teamName, homeWin && styles.winnerText]} numberOfLines={2}>
                                {match.homeTeam}
                            </Text>
                        </View>

                        <View style={styles.scoreSection}>
                            <View style={styles.scoreContainer}>
                                <Text style={[styles.score, homeWin && styles.winnerScore]}>
                                    {match.homeScore}
                                </Text>
                                <Text style={styles.scoreSeparator}>-</Text>
                                <Text style={[styles.score, awayWin && styles.winnerScore]}>
                                    {match.awayScore}
                                </Text>
                            </View>
                            {isDraw && <Text style={styles.drawText}>Berabere</Text>}
                        </View>

                        <View style={styles.teamSection}>
                            <MaterialCommunityIcons name="shield" size={24} color="#1a73e8" />
                            <Text style={[styles.teamName, awayWin && styles.winnerText]} numberOfLines={2}>
                                {match.awayTeam}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.matchInfo}>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
                            <Text style={styles.infoText}>{match.date}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
                            <Text style={styles.infoText}>{match.venue}</Text>
                        </View>
                    </View>

                    {/* View Details Hint */}
                    <View style={styles.detailHint}>
                        <Text style={styles.detailHintText}>Detaylar için dokun</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#9ca3af" />
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
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
    const router = useRouter();
    const { getCompletedMatches, settings, isLoading } = useAppContext();
    const completedMatches = getCompletedMatches();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleViewDetail = (matchId: string) => {
        router.push({ pathname: '/match-detail' as any, params: { matchId } });
    };

    // Get unique categories from completed matches
    const categories = useMemo(() => {
        const cats = new Set<string>();
        completedMatches.forEach(match => {
            if (match.category) cats.add(match.category);
        });
        return Array.from(cats);
    }, [completedMatches]);

    // Filter matches based on search and category
    const filteredMatches = useMemo(() => {
        return completedMatches.filter(match => {
            const searchLower = searchQuery.toLowerCase().trim();
            const matchesSearch = searchLower === '' ||
                match.homeTeam.toLowerCase().includes(searchLower) ||
                match.awayTeam.toLowerCase().includes(searchLower) ||
                match.venue?.toLowerCase().includes(searchLower) ||
                match.referee?.toLowerCase().includes(searchLower) ||
                match.date?.includes(searchLower);

            const matchesCategory = selectedCategory === null ||
                match.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [completedMatches, searchQuery, selectedCategory]);

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
                    {filteredMatches.length > 0
                        ? `${filteredMatches.length} maç gösteriliyor`
                        : 'Sonuç bulunamadı'}
                </Text>

                {/* Search Bar */}
                <TextInput
                    placeholder="Takım, tarih veya mekan ara..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="magnify" />}
                    right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
                    dense
                    outlineColor="#e5e7eb"
                    activeOutlineColor="#1a73e8"
                />

                {/* Category Filter */}
                {categories.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScrollView}
                        contentContainerStyle={styles.filterContainer}
                    >
                        <Chip
                            selected={selectedCategory === null}
                            onPress={() => setSelectedCategory(null)}
                            style={styles.filterChip}
                            textStyle={styles.filterChipText}
                        >
                            Tümü
                        </Chip>
                        {categories.map(cat => (
                            <Chip
                                key={cat}
                                selected={selectedCategory === cat}
                                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                style={styles.filterChip}
                                textStyle={styles.filterChipText}
                            >
                                {cat}
                            </Chip>
                        ))}
                    </ScrollView>
                )}
            </Surface>

            <FlatList
                data={filteredMatches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ResultCard match={item} onPress={() => handleViewDetail(item.id)} />
                )}
                contentContainerStyle={[
                    styles.listContent,
                    filteredMatches.length === 0 && styles.emptyListContent
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
    searchInput: {
        marginTop: 12,
        backgroundColor: '#ffffff',
    },
    filterScrollView: {
        marginTop: 12,
    },
    filterContainer: {
        gap: 8,
    },
    filterChip: {
        backgroundColor: '#e8f0fe',
    },
    filterChipText: {
        fontSize: 12,
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
    // New styles for updated ResultCard
    scoreBoard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
        paddingHorizontal: 8,
    },
    teamSection: {
        flex: 1,
        alignItems: 'center',
    },
    winnerText: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    scoreSection: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    score: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    winnerScore: {
        color: '#10b981',
    },
    scoreSeparator: {
        fontSize: 20,
        color: '#9ca3af',
        marginHorizontal: 8,
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    detailHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 8,
    },
    detailHintText: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
