import { useAppContext } from '@/context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    const { settings, addMatch, isLoading } = useAppContext();

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
    });

    const categories = settings?.categories || [];

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

            await addMatch({
                homeTeam: formData.homeTeam.trim(),
                awayTeam: formData.awayTeam.trim(),
                date: formatDate(selectedDate),
                time: formatTime(selectedTime),
                venue: formData.venue.trim() || 'Belirtilmedi',
                league: formData.league.trim() || selectedCategory?.name || 'Belirtilmedi',
                category: selectedCategory?.name || formData.category,
                referee: formData.referee.trim() || undefined,
                status: 'scheduled',
            });

            Alert.alert('Başarılı', 'Maç başarıyla eklendi', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);
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
                    title: 'Yeni Maç',
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
                            minimumDate={new Date()}
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

                    <TextInput
                        label="Lig / Turnuva"
                        value={formData.league}
                        onChangeText={(text) => setFormData({ ...formData, league: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Örn: U19 Ligi"
                        textColor="#000000"
                        placeholderTextColor="#666666"
                        outlineColor="#cccccc"
                        activeOutlineColor="#1a73e8"
                    />

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

                    <TextInput
                        label="Hakem"
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
                        Kaydet
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
