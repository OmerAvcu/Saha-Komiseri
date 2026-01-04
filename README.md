# ⚽ Saha Komiseri

**Futbol müsabakalarını profesyonelce takip edin ve raporlayın.**

Saha Komiseri, futbol hakemlerinin ve maç komiserlerin sahada kullanması için tasarlanmış kapsamlı bir mobil uygulamadır. Canlı maç takibi, olay kaydı, hakem kadrosu yönetimi ve WhatsApp üzerinden hızlı rapor paylaşımı özelliklerini bir arada sunar.

---

## 📱 Özellikler

### 🎯 Canlı Maç Takibi
- **Gerçek zamanlı kronometre** - Timestamp tabanlı, telefon kilitlense bile doğru çalışır
- **Dinamik devre süreleri** - Kategoriye göre otomatik süre ayarlama (U16: 40dk, U19: 45dk, vb.)
- **Olay kaydı** - Gol ⚽, Sarı Kart 🟨, Kırmızı Kart 🟥, Oyuncu Değişikliği 🔄
- **Uzatma devresi desteği** - 1. ve 2. uzatma devreleri dahil

### 📋 Maç Yönetimi
- **Maç planlama** - Tarih, saat, stadyum, lig ve kategori bilgileri
- **Hakem kadrosu** - Orta hakem, yardımcı hakemler, 4. hakem, gözlemci ve temsilci
- **Esame fotoğrafları** - Takım listelerinin fotoğraflarını ekleyin ve kaydedin

### 📊 Raporlama
- **WhatsApp paylaşımı** - Tek tıkla profesyonel maç raporu oluşturun
- **Detaylı maç geçmişi** - Tamamlanan maçları görüntüleyin ve analiz edin
- **Oyun ihracı listesi** - Kırmızı kart raporları

### ⚙️ Ayarlar
- **Kategori yönetimi** - Özel kategoriler ekleyin (devre süresi, değişiklik limiti)
- **Lig yönetimi** - Ligleri düzenleyin
- **Veri yedekleme** - JSON formatında dışa/içe aktarma
- **Karanlık mod** - Göz yorgunluğunu azaltın

---

## 🛠️ Teknolojiler

| Teknoloji | Açıklama |
|-----------|----------|
| **React Native** | Cross-platform mobil geliştirme |
| **Expo** | Geliştirme ve build araçları |
| **Expo Router** | Dosya tabanlı navigasyon |
| **React Native Paper** | Material Design UI bileşenleri |
| **AsyncStorage** | Yerel veri depolama |
| **TypeScript** | Tip güvenli kod |

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)

### Adımlar

```bash
# Repoyu klonlayın
git clone https://github.com/OmerAvcu/Saha-Komiseri.git
cd Saha-Komiseri

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npx expo start
```

### Build Alma

```bash
# Android Preview Build
eas build --platform android --profile preview

# Android Production Build
eas build --platform android --profile production
```

---

## 📁 Proje Yapısı

```
SahaKomiseri/
├── app/                    # Ekranlar (Expo Router)
│   ├── (tabs)/             # Tab navigasyonu
│   │   ├── index.tsx       # Ana sayfa (Maçlar)
│   │   ├── canli.tsx       # Canlı takip
│   │   ├── sonuclar.tsx    # Sonuçlar
│   │   └── ayarlar.tsx     # Ayarlar
│   ├── match-form.tsx      # Maç oluşturma/düzenleme
│   ├── match-detail.tsx    # Maç detayları
│   ├── categories.tsx      # Kategori yönetimi
│   └── leagues.tsx         # Lig yönetimi
├── components/             # Yeniden kullanılabilir bileşenler
├── context/                # React Context (AppContext)
├── services/               # Veri servisleri (storage)
├── types/                  # TypeScript tip tanımları
├── constants/              # Sabitler ve tema
└── assets/                 # Görseller ve ikonlar
```

---