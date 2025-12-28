import { useAppContext } from '@/context/AppContext';
import { Match } from '@/types/match';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Chip, FAB, IconButton, Surface, Text } from 'react-native-paper';

function MatchCard({ match, onDelete }: { match: Match; onDelete: (id: string) => void }) {
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
          <IconButton
            icon="delete"
            size={20}
            iconColor="#ef4444"
            onPress={() => onDelete(match.id)}
            style={styles.deleteButton}
          />
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
        renderItem={({ item }) => <MatchCard match={item} onDelete={handleDeleteMatch} />}
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
    paddingBottom: 80,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leagueRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  deleteButton: {
    margin: -8,
    marginRight: -4,
  },
  leagueChip: {
    backgroundColor: '#e8f0fe',
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
  },
  chipText: {
    fontSize: 11,
  },
  teamsContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  vs: {
    fontSize: 12,
    color: '#9ca3af',
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a73e8',
  },
});
