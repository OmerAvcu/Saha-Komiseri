import { useAppContext } from '@/context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Divider, List, Surface, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AyarlarScreen() {
    const router = useRouter();
    const {
        settings,
        exportData,
        importData,
        clearAllData,
        updateSettings,
        isDarkMode,
        toggleDarkMode,
        theme
    } = useAppContext();

    const categoryCount = settings?.categories?.length || 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Surface style={[styles.headerSurface, { backgroundColor: theme.headerBackground }]} elevation={4}>
                <Text style={[styles.headerTitle, { color: theme.headerText }]}>Ayarlar</Text>
                <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>Uygulama tercihleri ve araçlar</Text>
            </Surface>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Kategori Yönetimi */}
                <Surface style={[styles.section, { backgroundColor: theme.card }]} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Kategori Yönetimi</Text>
                    <List.Item
                        title="Kategoriler"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description={`${categoryCount} kategori tanımlı - Devre süresi ve değişiklik hakları`}
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="tag-multiple" color={theme.primary} />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                        )}
                        onPress={() => router.push('/categories')}
                    />
                </Surface>

                {/* Ligler */}
                <Surface style={[styles.section, { backgroundColor: theme.card }]} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Ligler</Text>
                    <List.Item
                        title="Lig Yönetimi"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description="Ligleri görüntüle ve düzenle"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="format-list-bulleted" color={theme.primary} />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                        )}
                        onPress={() => router.push('/leagues')}
                    />
                </Surface>

                {/* Uygulama Ayarları */}
                <Surface style={[styles.section, { backgroundColor: theme.card }]} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Uygulama</Text>
                    <List.Item
                        title="Karanlık Mod"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description={isDarkMode ? "Açık temaya geç" : "Koyu temaya geç"}
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="theme-light-dark" color={theme.primary} />
                        )}
                        right={() => (
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleDarkMode}
                                color={theme.primary}
                            />
                        )}
                    />
                    <Divider style={{ backgroundColor: theme.border }} />
                    <List.Item
                        title="Bildirimler"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description="Maç hatırlatıcıları"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="bell-outline" color={theme.primary} />
                        )}
                        right={() => (
                            <Switch
                                value={settings?.notificationsEnabled ?? true}
                                onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
                                color={theme.primary}
                            />
                        )}
                    />
                    <Divider style={{ backgroundColor: theme.border }} />
                    <List.Item
                        title="Hakkında"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description="Saha Komiseri v1.0.0"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="information-outline" color={theme.primary} />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                        )}
                    />
                </Surface>

                {/* Veri Yönetimi */}
                <Surface style={[styles.section, { backgroundColor: theme.card, marginTop: 16 }]} elevation={0}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>Veri Yönetimi</Text>
                    <List.Item
                        title="Yedek Al (Dışa Aktar)"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description="Tüm verileri dosyaya kaydet"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="database-export" color={theme.primary} />
                        )}
                        onPress={exportData}
                    />
                    <Divider style={{ backgroundColor: theme.border }} />
                    <List.Item
                        title="Yedeği Geri Yükle"
                        titleStyle={[styles.listTitle, { color: theme.text }]}
                        description="Dosyadan verileri geri yükle"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="database-import" color={theme.primary} />
                        )}
                        onPress={importData}
                    />
                    <Divider style={{ backgroundColor: theme.border }} />
                    <List.Item
                        title="Tüm Verileri Temizle"
                        titleStyle={[styles.listTitle, { color: theme.error }]}
                        description="Uygulamayı sıfırla (Geri alınamaz)"
                        descriptionStyle={[styles.listDescription, { color: theme.textSecondary }]}
                        left={(props) => (
                            <List.Icon {...props} icon="delete-forever" color={theme.error} />
                        )}
                        onPress={clearAllData}
                    />
                </Surface>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    listDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    headerSurface: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
});
