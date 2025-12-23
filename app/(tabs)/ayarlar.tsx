import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Surface, Switch, Text } from 'react-native-paper';

export default function AyarlarScreen() {
    const [darkMode, setDarkMode] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Kategoriler */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Kategoriler</Text>
                    <List.Item
                        title="Profesyonel"
                        description="Süper Lig, TFF 1. Lig"
                        left={(props) => (
                            <List.Icon {...props} icon="medal" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Amatör"
                        description="Bölgesel Ligler, İl Ligleri"
                        left={(props) => (
                            <List.Icon {...props} icon="soccer" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Altyapı"
                        description="U21, U19, U17, U15 Ligleri"
                        left={(props) => (
                            <List.Icon {...props} icon="account-group" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                </Surface>

                {/* Ligler */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Ligler</Text>
                    <List.Item
                        title="Lig Yönetimi"
                        description="Ligleri görüntüle ve düzenle"
                        left={(props) => (
                            <List.Icon {...props} icon="format-list-bulleted" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Takımlar"
                        description="Takım bilgilerini yönet"
                        left={(props) => (
                            <List.Icon {...props} icon="shield-outline" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                </Surface>

                {/* Kurallar */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Kurallar</Text>
                    <List.Item
                        title="Oyun Kuralları"
                        description="FIFA Oyun Kuralları 2024"
                        left={(props) => (
                            <List.Icon {...props} icon="book-open-variant" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Disiplin Talimatları"
                        description="Sarı/Kırmızı kart kuralları"
                        left={(props) => (
                            <List.Icon {...props} icon="card-bulleted" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="VAR Protokolü"
                        description="Video yardımcı hakem kuralları"
                        left={(props) => (
                            <List.Icon {...props} icon="video" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        )}
                    />
                </Surface>

                {/* Uygulama Ayarları */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>Uygulama</Text>
                    <List.Item
                        title="Karanlık Mod"
                        description="Koyu tema kullan"
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
                        description="Maç hatırlatıcıları"
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
                        description="Saha Komiseri v1.0.0"
                        left={(props) => (
                            <List.Icon {...props} icon="information-outline" color="#1a73e8" />
                        )}
                        right={(props) => (
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
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
});
