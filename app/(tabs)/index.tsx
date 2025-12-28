import { useAppContext } from '@/context/AppContext';
import { Match } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Chip, FAB, IconButton, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function MatchCard({ match, onDelete, onEdit }: { match: Match; onDelete: (id: string) => void; onEdit: (id: string) => void }) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.headerRow}>
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
              icon="tag"
              mode="flat"
              compact
              textStyle={styles.chipText}
              style={styles.categoryChip}
            >
              {match.category}
            </Chip>
          </View>
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#1a73e8"
              onPress={() => onEdit(match.id)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#ef4444"
              onPress={() => onDelete(match.id)}
              style={styles.actionButton}
            />
          </View>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <MaterialCommunityIcons name="shield" size={20} color="#1a73e8" />
            <Text style={styles.teamName}>{match.homeTeam}</Text>
          </View>
          <Text style={styles.vs}>vs</Text>
          <View style={styles.teamRow}>
            <MaterialCommunityIcons name="shield" size={20} color="#1a73e8" />
            <Text style={styles.teamName}>{match.awayTeam}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{match.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{match.time}</Text>
          </View>
        </View>

        <View style={styles.venueRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
          <Text style={styles.venueText}>{match.venue}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-blank" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>Planlanmış Maç Yok</Text>
      <Text style={styles.emptySubtitle}>
        Yeni bir maç eklemek için "+" butonuna basın.
      </Text>
    </View>
  );
}

export default function MaclarScreen() {
  const router = useRouter();
  const { getScheduledMatches, deleteMatch, isLoading } = useAppContext();
  const scheduledMatches = getScheduledMatches();

  const handleDeleteMatch = (id: string) => {
    const match = scheduledMatches.find(m => m.id === id);
    Alert.alert(
      'Maç Sil',
      `"${match?.homeTeam} vs ${match?.awayTeam}" maçını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMatch(id);
            } catch (error) {
              Alert.alert('Hata', 'Maç silinemedi');
            }
          },
        },
      ]
    );
  };

  const handleEditMatch = (id: string) => {
    router.push(`/match-form?matchId=${id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.headerSurface} elevation={0}>
        <Text style={styles.headerTitle}>Yaklaşan Maçlar</Text>
        <Text style={styles.headerSubtitle}>
          {scheduledMatches.length > 0
            ? `${scheduledMatches.length} maç planlandı`
            : 'Henüz planlanmış maç yok'}
        </Text>
      </Surface>

      <FlatList
        data={scheduledMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} onDelete={handleDeleteMatch} onEdit={handleEditMatch} />}
        contentContainerStyle={[
          styles.listContent,
          scheduledMatches.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="#ffffff"
        onPress={() => router.push('/match-form')}
      />
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
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leagueRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: -4,
  },
  deleteButton: {
    margin: -8,
    marginRight: -4,
  },
  leagueChip: {
    backgroundColor: '#E8F0FE',
    borderRadius: 20,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamsContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121212',
  },
  vs: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginVertical: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  venueText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#2962FF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#2962FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
