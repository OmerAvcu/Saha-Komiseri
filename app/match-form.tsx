import { useAppContext } from '@/context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Surface,
    Text,
    TextInput,
} from 'react-native-paper';

export default function MatchFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ matchId?: string }>();
    const { settings, addMatch, updateMatch, getMatchById, isLoading, scheduleMatchNotification } = useAppContext();

    const isEditMode = !!params.matchId;
    const existingMatch = isEditMode ? getMatchById(params.matchId!) : null;

    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

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
                });
                // Parse date safely
                if (existingMatch.date && existingMatch.date.includes('-')) {
                    const parts = existingMatch.date.split('-').map(Number);
                    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                        setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
                    }
                }
                // Parse time safely
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

    // Format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format time as HH:mm
    const formatTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Format display date
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
        // Validation
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

            // Find category name for display
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
                status: 'scheduled' as const,
            };

            if (isEditMode && params.matchId) {
                await updateMatch(params.matchId, matchData);
                // Reschedule notification
                await scheduleMatchNotification({ ...existingMatch, ...matchData, id: params.matchId } as any);

                Alert.alert('Başarılı', 'Maç başarıyla güncellendi', [
                    { text: 'Tamam', onPress: () => router.back() }
                ]);
            } else {
                const newMatch = await addMatch(matchData);
                // Schedule notification
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

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: isEditMode ? 'Maç Düzenle' : 'Yeni Maç',
                    headerStyle: { backgroundColor: '#1a73e8' },
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
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <TextInput
                        label="Deplasman Takımı *"
                        value={formData.awayTeam}
                        onChangeText={(text) => setFormData({ ...formData, awayTeam: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Fenerbahçe U19"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
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
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <Text style={styles.pickerLabel}>Lig / Turnuva *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.league}
                            onValueChange={(value) => setFormData({ ...formData, league: value })}
                            style={styles.picker}
                        >
                            <Picker.Item label="Seçiniz..." value="" />
                            {leagues.map((league, index) => (
                                <Picker.Item
                                    key={index}
                                    label={league}
                                    value={league}
                                />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.pickerLabel}>Kategori *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                            style={styles.picker}
                        >
                            {categories.map((category) => (
                                <Picker.Item
                                    key={category.id}
                                    label={`${category.name} (${category.halfDuration}dk / ${category.substitutionLimit} değişiklik)`}
                                    value={category.id}
                                />
                            ))}
                        </Picker>
                    </View>
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
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <TextInput
                        label="1. Yardımcı Hakem"
                        value={formData.assistantRef1}
                        onChangeText={(text) => setFormData({ ...formData, assistantRef1: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Bahattin Duran"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <TextInput
                        label="2. Yardımcı Hakem"
                        value={formData.assistantRef2}
                        onChangeText={(text) => setFormData({ ...formData, assistantRef2: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: Tarik Ongun"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <TextInput
                        label="4. Hakem"
                        value={formData.fourthOfficial}
                        onChangeText={(text) => setFormData({ ...formData, fourthOfficial: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Opsiyonel"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

                    <TextInput
                        label="Gözlemci"
                        value={formData.observer}
                        onChangeText={(text) => setFormData({ ...formData, observer: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Opsiyonel"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />
                </Surface>

                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.cancelButton}
                        textColor="#6b7280"
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
        </>
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
    formSection: {
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a73e8',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    pickerLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
        marginLeft: 4,
    },
    dateTimeButton: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 4,
        backgroundColor: '#f9f9f9',
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    dateTimeButtonText: {
        fontSize: 16,
        color: '#000000',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 4,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
        overflow: 'hidden',
    },
    picker: {
        height: Platform.OS === 'ios' ? 150 : 50,
        color: '#000000',
    },
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
        borderColor: '#d1d5db',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#1a73e8',
    },
});
