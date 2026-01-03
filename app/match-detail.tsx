import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { Match, MatchEvent } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Surface, Text } from 'react-native-paper';

// Generate match report text for sharing
// Generate match report text for sharing
function generateMatchReport(match: Match): string {
    const formatDate = (dateStr: string): string => {
        if (!dateStr || !dateStr.includes('-')) return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

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
        const timeText = event.addedTime ? `${event.minute}+${event.addedTime}` : `${event.minute}`;

        let eventDesc = '';
        if (event.type === 'goal') eventDesc = 'Gol';
        else if (event.type === 'yellowCard') eventDesc = 'Sarı Kart';
        else if (event.type === 'redCard') eventDesc = 'Kırmızı Kart';
        else if (event.type === 'substitution') eventDesc = 'Oyuncu Değişikliği';
        else eventDesc = event.type;

        if (event.type === 'substitution') {
            const subInfo = event.playerIn && event.playerOut
                ? `(Çıkan: ${event.playerOut} ➡️ Giren: ${event.playerIn})`
                : event.player ? `(${event.player})` : '';
            return `${timeText}' ${icon} ${teamName} - ${subInfo}`;
        }

        const playerInfo = event.player ? ` - ${event.player}` : '';
        return `${timeText}' ${icon} ${teamName}${playerInfo} (${eventDesc})`;
    };

    const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);

    // Sort events: Goals first, then others
    const goals = sortedEvents.filter(e => e.type === 'goal');

    // MÜSABAKA RAPORU HEADER
    let report = `-MÜSABAKA RAPORU- 📋\n\n`;
    report += `💥 *${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}* ⚽\n\n`;
    report += `🗓️ *TARİH*: ${formatDate(match.date)}\n`;
    report += `⏱️ *SAAT*: ${match.time}\n`;
    report += `🏟️ *STADYUM*: ${match.venue || 'Belirtilmedi'}\n`;
    report += `🏆 *KLASMAN*: ${match.league || 'Belirtilmedi'}\n`;
    report += `🏷️ *KATEGORİ*: ${match.category || 'Belirtilmedi'}\n\n`;

    // REFEREES & OFFICIALS
    report += `👱 *HAKEMLER*:\n`;
    report += ` * *1. Hakem (Orta)*: ${match.referee || '---'}\n`;
    report += ` * *2. Hakem (Yardımcı)*: ${match.assistantRef1 || '---'}\n`;
    report += ` * *3. Hakem (Yardımcı)*: ${match.assistantRef2 || '---'}\n`;
    report += ` * *4. Hakem*: ${match.fourthOfficial || '---'}\n\n`;

    report += `👀 *GÖZLEMCİ*: ${match.observer || '---'}\n\n`;
    report += `👀 *TEMSİLCİ*: ${match.representative || '---'}\n\n`;

    // GOAL DETAILS (Optional addition to match the spirit of "Score - Score")
    if (goals.length > 0) {
        report += `⚽ *GOL DAKİKALARI*:\n`;
        goals.forEach(g => {
            const time = g.addedTime ? `${g.minute}+${g.addedTime}` : `${g.minute}`;
            const player = g.player || 'Belirsiz';
            const team = g.team === 'home' ? match.homeTeam : match.awayTeam;
            report += ` * ${time}' ${player} (${team})\n`;
        });
        report += `\n`;
    }

    // ALL EVENTS
    if (sortedEvents.length > 0) {
        report += `📝 *TÜM OYUN HAREKETLERİ*:\n`;
        report += sortedEvents.map(e => getEventText(e, match)).join('\n');
    }

    return report;
}

export default function MatchDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ matchId: string }>();
    const { getMatchById, isLoading, theme } = useAppContext();

    const match = params.matchId ? getMatchById(params.matchId) : null;
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

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
            default: return { icon: 'circle', color: theme.textSecondary, label: type };
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    if (!match) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={theme.error} />
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
                    headerStyle: { backgroundColor: theme.primary },
                    headerTintColor: '#ffffff',
                }}
            />

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Score Header */}
                <Surface style={styles.scoreHeader} elevation={2}>
                    <View style={styles.teamsRow}>
                        <View style={styles.teamContainer}>
                            <MaterialCommunityIcons name="shield" size={32} color="#ffffff" />
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
                            <MaterialCommunityIcons name="shield" size={32} color="#ffffff" />
                            <Text style={styles.teamName} numberOfLines={2}>{match.awayTeam}</Text>
                        </View>
                    </View>

                    <View style={styles.categoryRow}>
                        <Chip icon="trophy" style={styles.categoryChip} textStyle={{ color: '#fff' }}>{match.league}</Chip>
                        <Chip icon="tag" style={styles.categoryChip} textStyle={{ color: '#fff' }}>{match.category}</Chip>
                    </View>
                </Surface>

                {/* Match Info Card */}
                <Card style={styles.card}>
                    <Card.Title title="Maç Bilgileri" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="information" size={24} color={theme.primary} />} />
                    <Card.Content>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
                            <Text style={styles.infoLabel}>Tarih:</Text>
                            <Text style={styles.infoValue}>{match.date}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSecondary} />
                            <Text style={styles.infoLabel}>Saat:</Text>
                            <Text style={styles.infoValue}>{match.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="stadium" size={20} color={theme.textSecondary} />
                            <Text style={styles.infoLabel}>Stadyum:</Text>
                            <Text style={styles.infoValue}>{match.venue || 'Belirtilmedi'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Referee Staff Card */}
                <Card style={styles.card}>
                    <Card.Title title="Hakem Kadrosu" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="whistle" size={24} color={theme.primary} />} />
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
                        <View style={styles.infoRow}>
                            <Text style={styles.refLabel}>4. Hakem:</Text>
                            <Text style={styles.refValue}>{match.fourthOfficial || '---'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="eye" size={16} color={theme.textSecondary} />
                            <Text style={styles.refLabel}>Gözlemci:</Text>
                            <Text style={styles.refValue}>{match.observer || '---'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="account-tie" size={16} color={theme.textSecondary} />
                            <Text style={styles.refLabel}>Temsilci:</Text>
                            <Text style={styles.refValue}>{match.representative || '---'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Event Timeline Card */}
                <Card style={styles.card}>
                    <Card.Title title="Olay Akışı" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="timeline-clock" size={24} color={theme.primary} />} />
                    <Card.Content>
                        {sortedEvents.length > 0 ? (
                            sortedEvents.map((event, index) => {
                                const { icon, color, label } = getEventIcon(event.type);
                                const teamName = event.team === 'home' ? match.homeTeam : match.awayTeam;

                                return (
                                    <View key={event.id || index} style={styles.eventRow}>
                                        <View style={[styles.eventMinute, event.addedTime ? { width: 42, left: -21 } : {}]}>
                                            <Text style={styles.eventMinuteText}>
                                                {event.addedTime ? `${event.minute}+${event.addedTime}` : event.minute}'
                                            </Text>
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
                                <MaterialCommunityIcons name="text-box-remove-outline" size={48} color={theme.textSecondary} />
                                <Text style={styles.noEventsText}>Bu maçta olay kaydı girilmemiştir.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Esame Photos Card */}
                {match.esamePhotos && match.esamePhotos.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Title title="Esame Listeleri" titleStyle={styles.cardTitle} left={(props) => <MaterialCommunityIcons name="image-multiple" size={24} color={theme.primary} />} />
                        <Card.Content>
                            <View style={styles.esamePhotoGrid}>
                                {match.esamePhotos.map((uri, index) => (
                                    <TouchableOpacity key={index} onPress={() => { setSelectedImageUri(uri); setImageViewerVisible(true); }}>
                                        <Image source={{ uri }} style={styles.esamePhoto} resizeMode="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Share Button */}
                <Button
                    mode="contained"
                    onPress={handleShareMatch}
                    icon="share-variant"
                    style={styles.shareButton}
                    labelStyle={styles.shareButtonLabel}
                    textColor="#ffffff"
                >
                    WhatsApp Raporunu Paylaş
                </Button>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal visible={imageViewerVisible} transparent animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
                <View style={styles.imageViewerOverlay}>
                    <TouchableOpacity style={styles.imageViewerCloseButton} onPress={() => setImageViewerVisible(false)}>
                        <Text style={styles.imageViewerCloseText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageViewerSaveButton} onPress={async () => {
                        if (!selectedImageUri) return;
                        try {
                            const { status } = await MediaLibrary.requestPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('İzin Gerekli', 'Galeriye erişim izni gerekiyor.');
                                return;
                            }
                            await MediaLibrary.saveToLibraryAsync(selectedImageUri);
                            Alert.alert('Başarılı', 'Fotoğraf galeriye kaydedildi.');
                        } catch (error) {
                            Alert.alert('Hata', 'Fotoğraf kaydedilemedi.');
                        }
                    }}>
                        <Text style={styles.imageViewerSaveText}>📥</Text>
                    </TouchableOpacity>
                    {selectedImageUri && (
                        <Image source={{ uri: selectedImageUri }} style={styles.imageViewerImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </>
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
    errorText: {
        marginTop: 12,
        marginBottom: 20,
        fontSize: 18,
        fontWeight: '600',
        color: theme.error,
    },
    scoreHeader: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: theme.primary,
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
    },
    infoLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        marginLeft: 10,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    refLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        flex: 1,
    },
    refValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    // Timeline Event Row
    eventRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        marginLeft: 20,
        borderLeftWidth: 2,
        borderLeftColor: theme.divider,
        paddingLeft: 20,
    },
    eventMinute: {
        position: 'absolute',
        left: -11,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.primary,
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
        color: theme.text,
    },
    eventPlayer: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 3,
    },
    eventSubstitution: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 3,
    },
    eventTeam: {
        fontSize: 12,
        color: theme.textLight,
        marginTop: 3,
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noEventsText: {
        marginTop: 14,
        fontSize: 14,
        color: theme.textSecondary,
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
    dateDisplay: {
        color: theme.text,
        fontSize: 16
    },
    esamePhotoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    esamePhoto: {
        width: 150,
        height: 200,
        borderRadius: 8,
        backgroundColor: theme.inputBackground,
    },
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerCloseButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageViewerCloseText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    imageViewerSaveButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageViewerSaveText: {
        fontSize: 24,
    },
    imageViewerImage: {
        width: '100%',
        height: '80%',
    },
});
