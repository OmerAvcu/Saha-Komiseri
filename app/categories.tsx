import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import { CategoryRule } from '@/types/settings';
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


export default function CategoriesScreen() {
    const router = useRouter();
    const { settings, isLoading, addCategory, updateCategory, deleteCategory, theme } = useAppContext();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRule | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        halfDuration: '',
        substitutionLimit: '',
        description: '',
    });

    const categories = settings?.categories || [];
    const styles = useMemo(() => createStyles(theme), [theme]);

    const inputTheme = useMemo(() => ({
        colors: {
            background: theme.inputBackground,
            text: theme.text,
            placeholder: theme.textSecondary,
        }
    }), [theme]);

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            halfDuration: '45',
            substitutionLimit: '5',
            description: '',
        });
        setModalVisible(true);
    };

    const openEditModal = (category: CategoryRule) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            halfDuration: category.halfDuration.toString(),
            substitutionLimit: category.substitutionLimit.toString(),
            description: category.description || '',
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Hata', 'Kategori adı gerekli');
            return;
        }

        const halfDuration = parseInt(formData.halfDuration) || 45;
        const substitutionLimit = parseInt(formData.substitutionLimit) || 5;

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: formData.name.trim(),
                    halfDuration,
                    substitutionLimit,
                    description: formData.description.trim() || `${formData.name} maçları - 2x${halfDuration} dakika`,
                });
            } else {
                await addCategory({
                    name: formData.name.trim(),
                    halfDuration,
                    substitutionLimit,
                    description: formData.description.trim() || `${formData.name} maçları - 2x${halfDuration} dakika`,
                });
            }
            setModalVisible(false);
        } catch (error: any) {
            console.error('Error saving category:', error);
            Alert.alert('Hata', `Kategori kaydedilemedi: ${error?.message || 'Bilinmeyen hata'}`);
        }
    };

    const handleDelete = (category: CategoryRule) => {
        Alert.alert(
            'Kategori Sil',
            `"${category.name}" kategorisini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(category.id);
                        } catch (error) {
                            Alert.alert('Hata', 'Kategori silinemedi');
                        }
                    }
                },
            ]
        );
    };

    const renderCategoryItem = ({ item }: { item: CategoryRule }) => (
        <Card style={styles.card} mode="elevated" onPress={() => openEditModal(item)}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="tag" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.categoryName}>{item.name}</Text>
                        <Text style={styles.categoryRules}>
                            {item.halfDuration} dk / {item.substitutionLimit} Oyuncu Değişikliği
                        </Text>
                        {item.description && (
                            <Text style={styles.categoryDescription} numberOfLines={1}>
                                {item.description}
                            </Text>
                        )}
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
                    title: 'Kategoriler',
                    headerStyle: { backgroundColor: theme.primary },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: { color: '#ffffff' },
                }}
            />

            <View style={styles.container}>
                <Surface style={styles.headerSurface} elevation={1}>
                    <Text style={styles.headerTitle}>Kategori Yönetimi</Text>
                    <Text style={styles.headerSubtitle}>
                        {categories.length} kategori tanımlı
                    </Text>
                </Surface>

                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCategoryItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="tag-off" size={64} color={theme.textSecondary} />
                            <Text style={styles.emptyTitle}>Kategori Yok</Text>
                            <Text style={styles.emptySubtitle}>
                                Yeni kategori eklemek için + butonuna basın.
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
                            {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
                        </Text>

                        <TextInput
                            label="Kategori Adı"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            style={styles.input}
                            mode="outlined"
                            placeholder="Örn: U14"
                            textColor={theme.text}
                            placeholderTextColor={theme.textSecondary}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            theme={inputTheme}
                        />

                        <TextInput
                            label="Devre Süresi (dakika)"
                            value={formData.halfDuration}
                            onChangeText={(text) => setFormData({ ...formData, halfDuration: text })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="numeric"
                            placeholder="Örn: 35"
                            textColor={theme.text}
                            placeholderTextColor={theme.textSecondary}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            theme={inputTheme}
                        />

                        <TextInput
                            label="Oyuncu Değişikliği Hakkı"
                            value={formData.substitutionLimit}
                            onChangeText={(text) => setFormData({ ...formData, substitutionLimit: text })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="numeric"
                            placeholder="Örn: 5"
                            textColor={theme.text}
                            placeholderTextColor={theme.textSecondary}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            theme={inputTheme}
                        />

                        <TextInput
                            label="Açıklama (Opsiyonel)"
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            style={styles.input}
                            mode="outlined"
                            placeholder="Örn: 14 yaş altı maçlar"
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
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    categoryRules: {
        fontSize: 14,
        color: theme.primary,
        marginTop: 2,
    },
    categoryDescription: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
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
