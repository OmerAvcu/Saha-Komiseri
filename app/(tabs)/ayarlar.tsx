import { useAppContext } from '@/context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Surface, Switch, Text } from 'react-native-paper';

export default function AyarlarScreen() {
    const router = useRouter();
    const { settings } = useAppContext();
    const [darkMode, setDarkMode] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

    const categoryCount = settings?.categories?.length || 0;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Kategori Yönetimi */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Kategori Yönetimi</Text>
                    <List.Item
                        title="Kategoriler"
                        titleStyle={styles.listTitle}
                        description={`${categoryCount} kategori tanımlı - Devre süresi ve değişiklik hakları`}
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="tag-multiple" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                        onPress={() => router.push('/categories')}
                    />
                </Surface>

                {/* Ligler */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Ligler</Text>
                    <List.Item
                        title="Lig Yönetimi"
                        titleStyle={styles.listTitle}
                        description="Ligleri görüntüle ve düzenle"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="format-list-bulleted" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Takımlar"
                        titleStyle={styles.listTitle}
                        description="Takım bilgilerini yönet"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="shield-outline" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                </Surface>

                {/* Kurallar */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Kurallar</Text>
                    <List.Item
                        title="Oyun Kuralları"
                        titleStyle={styles.listTitle}
                        description="FIFA Oyun Kuralları 2024"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="book-open-variant" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Disiplin Talimatları"
                        titleStyle={styles.listTitle}
                        description="Sarı/Kırmızı kart kuralları"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="card-bulleted" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="VAR Protokolü"
                        titleStyle={styles.listTitle}
                        description="Video yardımcı hakem kuralları"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="video" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                </Surface>

                {/* Uygulama Ayarları */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Uygulama</Text>
                    <List.Item
                        title="Karanlık Mod"
                        titleStyle={styles.listTitle}
                        description="Koyu tema kullan"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="theme-light-dark" color="#1a73e8" />
                        )}
                        right={() => (
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                color="#1a73e8"
                            />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Bildirimler"
                        titleStyle={styles.listTitle}
                        description="Maç hatırlatıcıları"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="bell-outline" color="#1a73e8" />
                        )}
                        right={() => (
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                color="#1a73e8"
                            />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Hakkında"
                        titleStyle={styles.listTitle}
                        description="Saha Komiseri v1.0.0"
                        descriptionStyle={styles.listDescription}
                        left={(props) => (
                            <List.Icon {...props} icon="information-outline" color="#1a73e8" />
                        )}
                        right={() => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
                        )}
                    />
                </Surface>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    section: {
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a73e8',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    listDescription: {
        fontSize: 13,
        color: '#4a4a4a',
        marginTop: 2,
    },
});
