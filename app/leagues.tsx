import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    FAB,
    IconButton,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput
} from 'react-native-paper';

export default function LeagueSettingsScreen() {
    const router = useRouter();
    const { settings, isLoading, updateSettings, theme, isDarkMode } = useAppContext();

    const [modalVisible, setModalVisible] = useState(false);
    const [originalLeagueName, setOriginalLeagueName] = useState<string | null>(null); // For editing
    const [leagueName, setLeagueName] = useState('');

    const leagues = settings?.leagues || [];
    const styles = useMemo(() => createStyles(theme), [theme]);

    const inputTheme = useMemo(() => ({
        colors: {
            background: theme.inputBackground,
            text: theme.text,
            placeholder: theme.textSecondary,
        }
    }), [theme]);

    const openAddModal = () => {
        setOriginalLeagueName(null);
        setLeagueName('');
        setModalVisible(true);
    };

    const openEditModal = (name: string) => {
        setOriginalLeagueName(name);
        setLeagueName(name);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!leagueName.trim()) {
            Alert.alert('Hata', 'Lig adı gerekli');
            return;
        }

        const name = leagueName.trim();

        try {
            let newLeagues = [...leagues];

            if (originalLeagueName) {
                // Edit existing
                const index = newLeagues.indexOf(originalLeagueName);
                if (index !== -1) {
                    newLeagues[index] = name;
                }
            } else {
                // Add new
                if (newLeagues.includes(name)) {
                    Alert.alert('Hata', 'Bu lig zaten listede mevcut.');
                    return;
                }
                newLeagues.push(name);
            }

            await updateSettings({ leagues: newLeagues });
            setModalVisible(false);
        } catch (error: any) {
            console.error('Error saving league:', error);
            Alert.alert('Hata', 'Lig kaydedilemedi');
        }
    };

    const handleDelete = (name: string) => {
        Alert.alert(
            'Ligi Sil',
            `"${name}" ligini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const newLeagues = leagues.filter(l => l !== name);
                            await updateSettings({ leagues: newLeagues });
                        } catch (error) {
                            Alert.alert('Hata', 'Lig silinemedi');
                        }
                    }
                },
            ]
        );
    };

    const renderLeagueItem = ({ item }: { item: string }) => (
        <Card style={styles.card} mode="elevated" onPress={() => openEditModal(item)}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="trophy-outline" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.leagueName}>{item}</Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <IconButton
                        icon="pencil"
                        size={20}
                        iconColor={theme.textSecondary}
                        onPress={() => openEditModal(item)}
                    />
                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor={theme.error}
                        onPress={() => handleDelete(item)}
                    />
                </View>
            </Card.Content>
        </Card>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Lig Yönetimi',
                    headerStyle: { backgroundColor: theme.primary },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: { color: '#ffffff' },
                }}
            />

            <View style={styles.container}>
                <Surface style={styles.headerSurface} elevation={1}>
                    <Text style={styles.headerTitle}>Ligler</Text>
                    <Text style={styles.headerSubtitle}>
                        {leagues.length} lig tanımlı
                    </Text>
                </Surface>

                <FlatList
                    data={leagues}
                    keyExtractor={(item) => item}
                    renderItem={renderLeagueItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="trophy-broken" size={64} color={theme.textSecondary} />
                            <Text style={styles.emptyTitle}>Lig Bulunamadı</Text>
                            <Text style={styles.emptySubtitle}>
                                Yeni lig eklemek için + butonuna basın.
                            </Text>
                        </View>
                    }
                />

                <FAB
                    icon="plus"
                    style={styles.fab}
                    color="#ffffff"
                    onPress={openAddModal}
                />

                {/* Add/Edit Modal */}
                <Portal>
                    <Modal
                        visible={modalVisible}
                        onDismiss={() => setModalVisible(false)}
                        contentContainerStyle={styles.modalContainer}
                    >
                        <Text style={styles.modalTitle}>
                            {originalLeagueName ? 'Ligi Düzenle' : 'Yeni Lig Ekle'}
                        </Text>

                        <TextInput
                            label="Lig Adı"
                            value={leagueName}
                            onChangeText={setLeagueName}
                            style={styles.input}
                            mode="outlined"
                            placeholder="Örn: Süper Amatör Ligi"
                            textColor={theme.text}
                            placeholderTextColor={theme.textSecondary}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            theme={inputTheme}
                        />

                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => setModalVisible(false)}
                                style={styles.modalButton}
                                textColor={theme.textSecondary}
                            >
                                İptal
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={[styles.modalButton, styles.saveButton]}
                            >
                                Kaydet
                            </Button>
                        </View>
                    </Modal>
                </Portal>
            </View>
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
    headerSurface: {
        padding: 16,
        backgroundColor: theme.card,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    separator: {
        height: 8,
    },
    card: {
        borderRadius: 12,
        backgroundColor: theme.card,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.tagBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    leagueName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: theme.primary,
    },
    modalContainer: {
        backgroundColor: theme.card,
        margin: 20,
        padding: 20,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: theme.inputBackground,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        minWidth: 100,
        borderColor: theme.border,
    },
    saveButton: {
        backgroundColor: theme.primary,
    },
});
