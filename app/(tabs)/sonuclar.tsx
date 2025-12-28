import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Surface, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function ResultCard({ match, onPress, styles, theme }: { match: Match; onPress: () => void; styles: any; theme: typeof Colors.light }) {
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
                            <MaterialCommunityIcons name="shield" size={24} color={theme.primary} />
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
                            <MaterialCommunityIcons name="shield" size={24} color={theme.primary} />
                            <Text style={[styles.teamName, awayWin && styles.winnerText]} numberOfLines={2}>
                                {match.awayTeam}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.matchInfo}>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="calendar" size={14} color={theme.textSecondary} />
                            <Text style={styles.infoText}>{match.date}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="map-marker" size={14} color={theme.textSecondary} />
                            <Text style={styles.infoText}>{match.venue}</Text>
                        </View>
                    </View>

                    {/* View Details Hint */}
                    <View style={styles.detailHint}>
                        <Text style={styles.detailHintText}>Detaylar için dokun</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
}

function EmptyState({ styles, theme }: { styles: any; theme: typeof Colors.light }) {
    return (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="trophy-broken" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyTitle}>Henüz Sonuç Yok</Text>
            <Text style={styles.emptySubtitle}>
                Tamamlanan maçlar burada görünecek.
            </Text>
        </View>
    );
}

export default function SonuclarScreen() {
    const router = useRouter();
    const { getCompletedMatches, settings, isLoading, theme } = useAppContext();
    const completedMatches = getCompletedMatches();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const styles = useMemo(() => createStyles(theme), [theme]);

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
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Surface style={styles.headerSurface} elevation={0}>
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
                    left={<TextInput.Icon icon="magnify" color={theme.textSecondary} />}
                    right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} color={theme.textSecondary} /> : null}
                    dense
                    outlineColor={theme.border}
                    activeOutlineColor={theme.primary}
                    textColor={theme.text}
                    placeholderTextColor={theme.textSecondary}
                    theme={{ colors: { background: theme.card, text: theme.text } }}
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
                            mode={selectedCategory === null ? 'flat' : 'outlined'}
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
                                mode={selectedCategory === cat ? 'flat' : 'outlined'}
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
                    <ResultCard match={item} onPress={() => handleViewDetail(item.id)} styles={styles} theme={theme} />
                )}
                contentContainerStyle={[
                    styles.listContent,
                    filteredMatches.length === 0 && styles.emptyListContent
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState styles={styles} theme={theme} />}
            />
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
    searchInput: {
        marginTop: 12,
        backgroundColor: theme.card,
        borderRadius: 12,
    },
    filterScrollView: {
        marginTop: 12,
    },
    filterContainer: {
        gap: 8,
    },
    filterChip: {
        backgroundColor: 'rgba(255,255,255,0.15)', // Glassy effect on blue header
        borderRadius: 20,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    filterChipText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
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
    leagueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    leagueChip: {
        backgroundColor: theme.tagBackground,
        borderRadius: 20,
        borderColor: theme.tagBorder,
        borderWidth: 1,
    },
    completedChip: {
        backgroundColor: theme.successLight, // Keep pastel or adapt
        borderRadius: 20,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.tagText,
    },
    completedChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.success, // #10B981
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
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        marginTop: 8,
    },
    winnerTeam: {
        color: theme.success,
        fontWeight: '700',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreText: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.text,
    },
    drawText: {
        fontSize: 11,
        color: theme.warning,
        fontWeight: '600',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    shareButton: {
        marginTop: 16,
        backgroundColor: theme.primary,
        borderRadius: 12,
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
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    // Result Card styles
    scoreBoard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    teamSection: {
        flex: 1,
        alignItems: 'center',
    },
    winnerText: {
        color: theme.success,
        fontWeight: '700',
    },
    scoreSection: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    score: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.text,
    },
    winnerScore: {
        color: theme.success,
    },
    scoreSeparator: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.textLight,
        marginHorizontal: 8,
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    detailHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    detailHintText: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '600',
    },
});
