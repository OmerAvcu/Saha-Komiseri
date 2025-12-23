# SahaKomiseri - Futbol Hakem Yönetim Uygulaması

React Native + Expo ile geliştirilmiş mobil futbol hakem yönetim uygulaması.

## Teknolojiler

| Teknoloji | Açıklama |
|-----------|----------|
| Expo Router | Dosya bazlı navigasyon |
| TypeScript | Tip güvenliği |
| React Native Paper | Material Design UI |
| AsyncStorage | Kalıcı veri depolama |
| Context API | Global state yönetimi |

## Özellikler

- **Maçlar**: Planlanan maçları listele ve yönet
- **Canlı Takip**: Aktif maçları canlı takip et
- **Sonuçlar**: Tamamlanan maçların arşivi
- **Ayarlar**: Kategori kuralları ve uygulama ayarları

## Kurulum

```bash
# Projeyi klonla
git clone <repo-url>
cd SahaKomiseri

# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npx expo start
```

## Bağımlılıklar

- react-native-paper
- @react-native-async-storage/async-storage
- uuid
- @expo/vector-icons