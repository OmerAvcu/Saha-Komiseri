import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Menu,
    Surface,
    Text,
    TextInput,
    TouchableRipple,
} from 'react-native-paper';

export default function MatchFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ matchId?: string }>();
    const { settings, addMatch, updateMatch, getMatchById, isLoading, scheduleMatchNotification, theme, isDarkMode } = useAppContext();

    const isEditMode = !!params.matchId;
    const existingMatch = isEditMode ? getMatchById(params.matchId!) : null;

    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Menu visibility states
    const [showLeagueMenu, setShowLeagueMenu] = useState(false);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [esamePhotos, setEsamePhotos] = useState<string[]>([]);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);
    // Stabilization: Memoize the input theme to prevent constant re-creation/animation node issues
    const inputTheme = useMemo(() => ({
        colors: {
            background: theme.inputBackground,
            text: theme.text,
            placeholder: theme.textSecondary,
            onSurfaceVariant: theme.textSecondary,
        }
    }), [theme]);

    const [formData, setFormData] = useState({
        homeTeam: '',
        awayTeam: '',
        venue: '',
        league: '',
        category: settings?.categories?.[0]?.id || '',
        referee: '',
        assistantRef1: '',
        assistantRef2: '',
        fourthOfficial: '',
        observer: '',
        representative: '',
    });

    const categories = settings?.categories || [];
    const leagues = settings?.leagues || [];

    // Load existing match data in edit mode
    useEffect(() => {
        if (existingMatch && settings?.categories) {
            try {
                setFormData({
                    homeTeam: existingMatch.homeTeam || '',
                    awayTeam: existingMatch.awayTeam || '',
                    venue: existingMatch.venue || '',
                    league: existingMatch.league || '',
                    category: settings.categories.find(c => c.name === existingMatch.category)?.id || existingMatch.category || '',
                    referee: existingMatch.referee || '',
                    assistantRef1: existingMatch.assistantRef1 || '',
                    assistantRef2: existingMatch.assistantRef2 || '',
                    fourthOfficial: existingMatch.fourthOfficial || '',
                    observer: existingMatch.observer || '',
                    representative: existingMatch.representative || '',
                });
                if (existingMatch.esamePhotos) {
                    setEsamePhotos(existingMatch.esamePhotos);
                }
                if (existingMatch.date && existingMatch.date.includes('-')) {
                    const parts = existingMatch.date.split('-').map(Number);
                    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                        setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
                    }
                }
                if (existingMatch.time && existingMatch.time.includes(':')) {
                    const timeParts = existingMatch.time.split(':').map(Number);
                    if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
                        const timeDate = new Date();
                        timeDate.setHours(timeParts[0], timeParts[1]);
                        setSelectedTime(timeDate);
                    }
                }
            } catch (error) {
                console.error('Error loading match data:', error);
            }
        }
    }, [existingMatch, settings?.categories]);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatDisplayDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const onTimeChange = (event: any, time?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (time) {
            setSelectedTime(time);
        }
    };

    const handleSave = async () => {
        if (!formData.homeTeam.trim()) {
            Alert.alert('Hata', 'Ev sahibi takım adı gerekli');
            return;
        }
        if (!formData.awayTeam.trim()) {
            Alert.alert('Hata', 'Deplasman takımı adı gerekli');
            return;
        }
        if (!formData.category) {
            Alert.alert('Hata', 'Kategori seçimi gerekli');
            return;
        }

        try {
            setSaving(true);
            const selectedCategory = categories.find(c => c.id === formData.category);

            const matchData = {
                homeTeam: formData.homeTeam.trim(),
                awayTeam: formData.awayTeam.trim(),
                date: formatDate(selectedDate),
                time: formatTime(selectedTime),
                venue: formData.venue.trim() || 'Belirtilmedi',
                league: formData.league.trim() || selectedCategory?.name || 'Belirtilmedi',
                category: selectedCategory?.name || formData.category,
                referee: formData.referee.trim() || undefined,
                assistantRef1: formData.assistantRef1.trim() || undefined,
                assistantRef2: formData.assistantRef2.trim() || undefined,
                fourthOfficial: formData.fourthOfficial.trim() || undefined,
                observer: formData.observer.trim() || undefined,
                representative: formData.representative.trim() || undefined,
                esamePhotos: esamePhotos.length > 0 ? esamePhotos : undefined,
                status: 'scheduled' as const,
            };

            if (isEditMode && params.matchId) {
                await updateMatch(params.matchId, matchData);
                await scheduleMatchNotification({ ...existingMatch, ...matchData, id: params.matchId } as any);
                Alert.alert('Başarılı', 'Maç başarıyla güncellendi', [
                    { text: 'Tamam', onPress: () => router.back() }
                ]);
            } else {
                const newMatch = await addMatch(matchData);
                await scheduleMatchNotification(newMatch);
                Alert.alert('Başarılı', 'Maç başarıyla eklendi', [
                    { text: 'Tamam', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            console.error('Error saving match:', error);
            Alert.alert('Hata', `Maç kaydedilemedi: ${error?.message || 'Bilinmeyen hata'}`);
        } finally {
            setSaving(false);
        }
    };

    const getSelectedCategoryLabel = () => {
        const cat = categories.find(c => c.id === formData.category);
        if (!cat) return '';
        return `${cat.name} (${cat.halfDuration}dk / ${cat.substitutionLimit} değişiklik)`;
    };

    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin vermeniz gerekiyor.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.4,
                allowsEditing: false,
                base64: false,
            });

            console.log('Camera result:', result);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                console.log('Photo URI:', uri);
                setEsamePhotos(prev => [...prev, uri]);
                Alert.alert('Başarılı', 'Fotoğraf eklendi!');
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Hata', 'Fotoğraf çekilemedi: ' + (error as Error).message);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setEsamePhotos(prev => prev.filter((_, i) => i !== index));
    };

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
                    title: isEditMode ? 'Maç Düzenle' : 'Yeni Maç',
                    headerStyle: { backgroundColor: theme.primary },
                    headerTintColor: '#ffffff',
                }}
            />

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Surface style={styles.formSection} elevation={1}>
                    <Text style={styles.sectionTitle}>Takım Bilgileri</Text>

                    <TextInput
                        label="Ev Sahibi Takım *"
                        value={formData.homeTeam}
                        onChangeText={(text) => setFormData({ ...formData, homeTeam: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Galatasaray U19"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="Deplasman Takımı *"
                        value={formData.awayTeam}
                        onChangeText={(text) => setFormData({ ...formData, awayTeam: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Fenerbahçe U19"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />
                </Surface>

                <Surface style={styles.formSection} elevation={1}>
                    <Text style={styles.sectionTitle}>Tarih ve Saat</Text>

                    <Text style={styles.pickerLabel}>Tarih *</Text>
                    <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateTimeButtonText}>
                            📅  {formatDisplayDate(selectedDate)}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            themeVariant={isDarkMode ? 'dark' : 'light'}
                        />
                    )}

                    <Text style={styles.pickerLabel}>Saat *</Text>
                    <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.dateTimeButtonText}>
                            🕐  {formatTime(selectedTime)}
                        </Text>
                    </TouchableOpacity>

                    {showTimePicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onTimeChange}
                            is24Hour={true}
                            themeVariant={isDarkMode ? 'dark' : 'light'}
                        />
                    )}
                </Surface>

                <Surface style={styles.formSection} elevation={1}>
                    <Text style={styles.sectionTitle}>Maç Detayları</Text>

                    <TextInput
                        label="Stadyum / Saha"
                        value={formData.venue}
                        onChangeText={(text) => setFormData({ ...formData, venue: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Florya Tesisleri"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <Text style={styles.pickerLabel}>Lig / Turnuva *</Text>
                    <Menu
                        visible={showLeagueMenu}
                        onDismiss={() => setShowLeagueMenu(false)}
                        anchor={
                            <TouchableRipple onPress={() => setShowLeagueMenu(true)}>
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        value={formData.league}
                                        placeholder="Seçiniz..."
                                        style={[styles.input, { paddingHorizontal: 12 }]}
                                        right={<TextInput.Icon icon="menu-down" />}
                                        textColor={theme.text}
                                        theme={inputTheme}
                                        outlineColor={theme.border}
                                        activeOutlineColor={theme.primary}
                                    />
                                </View>
                            </TouchableRipple>
                        }
                        contentStyle={{ backgroundColor: theme.card }}
                    >
                        <Menu.Item title="Seçiniz..." onPress={() => { setFormData({ ...formData, league: '' }); setShowLeagueMenu(false); }} titleStyle={{ color: theme.text }} />
                        {leagues.map((league, index) => (
                            <Menu.Item
                                key={index}
                                title={league}
                                onPress={() => { setFormData({ ...formData, league }); setShowLeagueMenu(false); }}
                                titleStyle={{ color: theme.text }}
                            />
                        ))}
                    </Menu>

                    <Text style={styles.pickerLabel}>Kategori *</Text>
                    <Menu
                        visible={showCategoryMenu}
                        onDismiss={() => setShowCategoryMenu(false)}
                        anchor={
                            <TouchableRipple onPress={() => setShowCategoryMenu(true)}>
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        value={getSelectedCategoryLabel()}
                                        placeholder="Seçiniz..."
                                        style={styles.input}
                                        right={<TextInput.Icon icon="menu-down" />}
                                        textColor={theme.text}
                                        theme={inputTheme}
                                        outlineColor={theme.border}
                                        activeOutlineColor={theme.primary}
                                    />
                                </View>
                            </TouchableRipple>
                        }
                        contentStyle={{ backgroundColor: theme.card }}
                    >
                        {categories.map((category) => (
                            <Menu.Item
                                key={category.id}
                                title={`${category.name} (${category.halfDuration}dk / ${category.substitutionLimit} değiş.)`}
                                onPress={() => { setFormData({ ...formData, category: category.id }); setShowCategoryMenu(false); }}
                                titleStyle={{ color: theme.text }}
                            />
                        ))}
                    </Menu>
                </Surface>

                <Surface style={styles.formSection} elevation={1}>
                    <Text style={styles.sectionTitle}>Hakem Kadrosu</Text>

                    <TextInput
                        label="Orta Hakem"
                        value={formData.referee}
                        onChangeText={(text) => setFormData({ ...formData, referee: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Cüneyt Çakır"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="1. Yardımcı Hakem"
                        value={formData.assistantRef1}
                        onChangeText={(text) => setFormData({ ...formData, assistantRef1: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Bahattin Duran"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="2. Yardımcı Hakem"
                        value={formData.assistantRef2}
                        onChangeText={(text) => setFormData({ ...formData, assistantRef2: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Tarik Ongun"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="4. Hakem"
                        value={formData.fourthOfficial}
                        onChangeText={(text) => setFormData({ ...formData, fourthOfficial: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Opsiyonel"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="Gözlemci"
                        value={formData.observer}
                        onChangeText={(text) => setFormData({ ...formData, observer: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Opsiyonel"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="Temsilci"
                        value={formData.representative}
                        onChangeText={(text) => setFormData({ ...formData, representative: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Opsiyonel"
                        textColor={theme.text}
                        placeholderTextColor={theme.textSecondary}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        theme={inputTheme}
                    />
                </Surface>

                {/* Esame Photos Section */}
                <Surface style={styles.formSection} elevation={1}>
                    <Text style={styles.sectionTitle}>Esame Listeleri</Text>

                    <Button
                        mode="outlined"
                        icon="camera"
                        onPress={handleTakePhoto}
                        style={styles.photoButton}
                        textColor={theme.primary}
                    >
                        📷 Esame Listesi Ekle
                    </Button>

                    {esamePhotos.length > 0 && (
                        <View style={styles.photoGrid}>
                            {esamePhotos.map((uri, index) => (
                                <View key={index} style={styles.photoThumbnailContainer}>
                                    <TouchableOpacity onPress={() => { setSelectedImageUri(uri); setImageViewerVisible(true); }}>
                                        <Image source={{ uri }} style={styles.photoThumbnail} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.photoDeleteButton}
                                        onPress={() => handleRemovePhoto(index)}
                                    >
                                        <Text style={styles.photoDeleteText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </Surface>

                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.cancelButton}
                        textColor={theme.textSecondary}
                    >
                        İptal
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        style={styles.saveButton}
                        loading={saving}
                        disabled={saving}
                    >
                        {isEditMode ? 'Güncelle' : 'Kaydet'}
                    </Button>
                </View>
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
    formSection: {
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.card,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        marginBottom: 12,
        backgroundColor: theme.inputBackground,
        fontSize: 18,
        minHeight: 60,
    },
    pickerLabel: {
        fontSize: 16,
        color: theme.textSecondary,
        marginBottom: 4,
        marginLeft: 4,
    },
    dateTimeButton: {
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 4,
        backgroundColor: theme.inputBackground,
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    dateTimeButtonText: {
        fontSize: 16,
        color: theme.text,
    },
    // Removed old picker styles
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        margin: 16,
        marginTop: 8,
        marginBottom: 32,
    },
    cancelButton: {
        flex: 1,
        borderColor: theme.border,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.primary,
    },
    photoButton: {
        borderColor: theme.primary,
        marginBottom: 12,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    photoThumbnailContainer: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    photoThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: theme.inputBackground,
    },
    photoDeleteButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoDeleteText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
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
