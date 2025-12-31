# Shopify Teklif Uygulaması

Müşterilerin ürünlere fiyat teklifi yapabildiği ve admin panelinde teklifleri yönetebileceği Shopify uygulaması.

## Özellikler

### Müşteri Tarafı
- ✅ Ürünlere fiyat teklifi yapabilme
- ✅ Müşteri bilgileri (ad, email, telefon)
- ✅ Teklif fiyatı ve adet seçimi
- ✅ İsteğe bağlı mesaj ekleme
- ✅ Otomatik indirim oranı hesaplama

### Admin Tarafı
- ✅ Tüm teklifleri görüntüleme ve yönetme
- ✅ Teklif durumu güncelleme (Kabul/Red/Karşı Teklif)
- ✅ Karşı teklif yapabilme
- ✅ Admin notları ekleme
- ✅ Detaylı istatistikler
- ✅ Filtreleme ve arama
- ✅ İşlem geçmişi
- ✅ Sayfalama desteği

## Teknolojiler

- **Framework:** Remix (React Router)
- **Database:** Prisma + SQLite
- **Styling:** CSS Modules
- **Platform:** Shopify App
- **Language:** JavaScript (Türkçe arayüz)

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Veritabanını Hazırla

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Environment Değişkenlerini Ayarla

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun:

```bash
cp .env.example .env
```

### 4. Uygulamayı Başlat

```bash
npm run dev
```

## Dosya Yapısı

```
shopify-offer-app/
├── prisma/
│   └── schema.prisma          # Database modelleri (Offer, OfferLog)
├── app/
│   ├── components/
│   │   ├── OfferForm.jsx      # Müşteri teklif formu
│   │   ├── OfferForm.module.css
│   │   ├── OfferTable.jsx     # Teklifler tablosu
│   │   ├── OfferTable.module.css
│   │   ├── OfferStats.jsx     # İstatistik kartları
│   │   ├── OfferStats.module.css
│   │   ├── OfferModal.jsx     # Teklif detay modal
│   │   └── OfferModal.module.css
│   ├── routes/
│   │   ├── api/
│   │   │   ├── offers.jsx     # GET/POST endpoints
│   │   │   └── offers.$id.jsx # PUT/DELETE endpoints
│   │   ├── app.offers.jsx     # Admin dashboard
│   │   └── app.jsx            # Layout
│   ├── styles/
│   │   └── offers.module.css  # Dashboard stilleri
│   ├── db.server.js           # Prisma client
│   └── root.jsx               # App root
├── package.json
├── remix.config.js
└── vite.config.js
```

## API Endpoints

### GET /api/offers
Tüm teklifleri listeler (filtreleme ve sayfalama destekli)

**Query Parameters:**
- `status`: "all" | "pending" | "accepted" | "rejected" | "countered"
- `search`: Müşteri adı, email veya ürün araması
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 10)

### POST /api/offers
Yeni teklif oluşturur

**Body:**
```json
{
  "customerName": "Ahmet Yılmaz",
  "customerEmail": "ahmet@example.com",
  "customerPhone": "0555 123 45 67",
  "productId": "123456",
  "productTitle": "Örnek Ürün",
  "originalPrice": 1000,
  "offerPrice": 850,
  "quantity": 1,
  "message": "İsteğe bağlı mesaj"
}
```

### GET /api/offers/:id
Tek bir teklifi getirir

### PUT /api/offers/:id
Teklifi günceller

**Body:**
```json
{
  "status": "accepted",
  "counterPrice": 900,
  "adminNotes": "Admin notları"
}
```

### DELETE /api/offers/:id
Teklifi siler

## Veritabanı Modelleri

### Offer
- `id`: String (CUID)
- `customerName`: String
- `customerEmail`: String
- `customerPhone`: String?
- `productId`: String
- `productTitle`: String
- `productImage`: String?
- `variantId`: String?
- `variantTitle`: String?
- `originalPrice`: Float
- `offerPrice`: Float
- `quantity`: Int
- `message`: String?
- `status`: String (pending/accepted/rejected/countered)
- `counterPrice`: Float?
- `adminNotes`: String?
- `createdAt`: DateTime
- `updatedAt`: DateTime

### OfferLog
- `id`: String (CUID)
- `offerId`: String (Foreign Key)
- `action`: String (created/status_changed/price_updated/note_added)
- `oldValue`: String?
- `newValue`: String?
- `performedBy`: String? (admin/customer/system)
- `createdAt`: DateTime

## Geliştirme

### Test

```bash
npm test
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

## Lisans

MIT

## Destek

Sorularınız için GitHub Issues kullanabilirsiniz.
