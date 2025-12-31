# Test Dokümantasyonu

Bu belge, Shopify Teklif Uygulaması için oluşturulan test altyapısı ve test stratejisini açıklar.

## Test Altyapısı

### Kullanılan Teknolojiler

- **Vitest**: Vite tabanlı hızlı test framework'ü
- **React Testing Library**: Component testleri için
- **Happy-DOM**: DOM simülasyonu için
- **@testing-library/user-event**: Kullanıcı etkileşimlerini simüle etmek için
- **@testing-library/jest-dom**: Ek matcher'lar için

### Kurulum

Test bağımlılıkları zaten yüklü. Eğer yeniden yüklemeniz gerekirse:

```bash
npm install --save-dev --legacy-peer-deps vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom @testing-library/dom @vitejs/plugin-react
```

## Test Komutları

### Tüm Testleri Çalıştırma

```bash
npm test
```

### Watch Modunda Test Çalıştırma

```bash
npm run test:watch
```

### UI ile Test Çalıştırma

```bash
npm run test:ui
```

Tarayıcınızda test sonuçlarını görsel olarak görüntüleyebilirsiniz.

### Coverage Raporu Oluşturma

```bash
npm run test:coverage
```

Coverage raporu `coverage/` dizininde oluşturulacaktır.

## Test Yapısı

```
tests/
├── setup.js                      # Test setup ve global konfigürasyon
├── components/                   # Component testleri
│   ├── OfferForm.test.jsx       # Form component testleri
│   ├── OfferTable.test.jsx      # Tablo component testleri
│   ├── OfferModal.test.jsx      # Modal component testleri
│   └── OfferStats.test.jsx      # İstatistik kartları testleri
└── api/                          # API endpoint testleri
    ├── offers.test.js            # /api/offers endpoint testleri
    └── offers.$id.test.js        # /api/offers/:id endpoint testleri
```

## Test Kategorileri

### 1. Component Testleri

#### OfferForm Component

**Test Edilen Özellikler:**
- Form alanlarının render edilmesi
- Ürün bilgilerinin gösterilmesi
- Form validasyonu:
  - Boş alanlar için hata mesajları
  - Email format validasyonu
  - Fiyat validasyonu (sıfırdan büyük ve orijinal fiyattan düşük olmalı)
- İndirim yüzdesi hesaplaması
- Form gönderimi
- Hata durumu yönetimi
- Cancel işlevi

**Örnek Test:**

```javascript
it('geçerli veriyle form submit edilmeli', async () => {
  const user = userEvent.setup();
  mockOnSubmit.mockResolvedValue({});

  render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

  await user.type(screen.getByLabelText(/Adınız Soyadınız/i), 'Ahmet Yılmaz');
  await user.type(screen.getByLabelText(/Email Adresiniz/i), 'ahmet@test.com');
  // ... diğer alanlar

  fireEvent.click(screen.getByText('Teklif Gönder'));

  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
```

#### OfferTable Component

**Test Edilen Özellikler:**
- Loading durumu
- Boş liste durumu
- Tekliflerin listelenmesi
- Durum etiketleri (pending, accepted, rejected, countered)
- Fiyat formatlaması (Türk Lirası)
- İndirim hesaplaması
- Satır seçimi (tek ve çoklu)
- İşlem butonları (görüntüle, kabul, red, sil)
- Tarih formatlaması

#### OfferModal Component

**Test Edilen Özellikler:**
- Null check (offer yoksa render olmamalı)
- Ürün ve müşteri bilgilerinin gösterilmesi
- Fiyat bilgileri ve hesaplamalar
- Müşteri mesajı gösterimi
- Status değiştirme
- Karşı teklif girişi
- Admin notları
- İşlem geçmişi
- Kaydetme işlevi
- Modal kapatma

#### OfferStats Component

**Test Edilen Özellikler:**
- İstatistik kartlarının render edilmesi
- Doğru değerlerin gösterilmesi
- Undefined/null stats durumu
- Icon'ların gösterilmesi
- Sayı formatlaması

### 2. API Testleri

#### GET /api/offers

**Test Edilen Özellikler:**
- Tüm teklifleri listeleme
- Status filtresi
- Arama (search) filtresi
- Sayfalama (pagination)
- Hata durumu (500)

**Örnek Test:**

```javascript
it('status filtresi çalışmalı', async () => {
  prisma.offer.findMany.mockResolvedValue([]);
  prisma.offer.count.mockResolvedValue(0);

  const request = new Request('http://localhost/api/offers?status=accepted');
  await loader({ request });

  expect(prisma.offer.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { status: 'accepted' }
    })
  );
});
```

#### POST /api/offers

**Test Edilen Özellikler:**
- Geçerli teklif oluşturma
- Eksik alan validasyonu
- Email validasyonu
- Fiyat validasyonu
- Log kaydı oluşturma
- Geçersiz method (405)
- Hata durumu (500)

#### GET /api/offers/:id

**Test Edilen Özellikler:**
- Tek teklif getirme
- Teklif bulunamadı (404)
- Hata durumu (500)

#### PUT /api/offers/:id

**Test Edilen Özellikler:**
- Teklif güncelleme
- Status değişikliği için log oluşturma
- Karşı teklif güncelleme
- Admin notları güncelleme
- Teklif bulunamadı (404)
- Hata durumu (500)

#### DELETE /api/offers/:id

**Test Edilen Özellikler:**
- Teklif silme
- Teklif bulunamadı (404)
- Hata durumu (500)

## Mock Stratejisi

### Prisma Mock

API testlerinde Prisma client mock'lanır:

```javascript
vi.mock('../../app/db.server', () => ({
  default: {
    offer: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}));
```

### Shopify App Bridge Mock

Setup dosyasında Shopify App Bridge mock'lanır:

```javascript
global.shopify = {
  config: {},
  idToken: () => Promise.resolve('mock-token')
};
```

## Test Yazma Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

```javascript
it('örnek test', async () => {
  // Arrange: Test ortamını hazırla
  const mockData = { ... };
  prisma.offer.create.mockResolvedValue(mockData);

  // Act: İşlemi gerçekleştir
  const result = await action({ request });

  // Assert: Sonuçları doğrula
  expect(result.success).toBe(true);
});
```

### 2. User-Centric Testing

Kullanıcı davranışlarını simüle edin:

```javascript
const user = userEvent.setup();
await user.type(input, 'değer');
await user.click(button);
```

### 3. Async İşlemleri Bekleyin

```javascript
await waitFor(() => {
  expect(screen.getByText('Mesaj')).toBeInTheDocument();
});
```

### 4. Mock'ları Her Test Öncesi Temizleyin

```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test Coverage Hedefleri

- **Statements**: > %80
- **Branches**: > %75
- **Functions**: > %80
- **Lines**: > %80

### Mevcut Coverage

Detaylı coverage raporu için:

```bash
npm run test:coverage
```

Raporu tarayıcıda görmek için:

```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Continuous Integration

### GitHub Actions Örneği

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Testleri

### 1. screen.debug() Kullanımı

```javascript
it('debug örneği', () => {
  render(<Component />);
  screen.debug(); // DOM'u konsola yazdırır
});
```

### 2. Belirli Bir Elementi Debug Etme

```javascript
const element = screen.getByText('Test');
screen.debug(element);
```

### 3. Test İzolasyonu

Sadece bir testi çalıştırmak için `it.only` kullanın:

```javascript
it.only('bu test çalışacak', () => {
  // ...
});
```

Bir testi atlamak için `it.skip` kullanın:

```javascript
it.skip('bu test atlanacak', () => {
  // ...
});
```

## Yaygın Sorunlar ve Çözümleri

### 1. "Unable to find element" Hatası

**Sorun**: Element bulunamıyor.

**Çözüm**:
- `screen.debug()` ile DOM'u kontrol edin
- `waitFor` kullanarak asenkron render'ı bekleyin
- Doğru query metodunu kullanın (getBy, findBy, queryBy)

### 2. "Multiple elements found" Hatası

**Sorun**: Birden fazla element eşleşiyor.

**Çözüm**:
- `getAllByText` yerine `getByText` kullanın veya
- Daha spesifik bir selector kullanın
- `getByRole` ile role-based seçim yapın

### 3. Mock Çalışmıyor

**Sorun**: Mock fonksiyonlar çağrılmıyor.

**Çözüm**:
- Mock'un doğru import edildiğinden emin olun
- `beforeEach` içinde `vi.clearAllMocks()` kullanın
- Mock'un test dosyasının en üstünde tanımlandığından emin olun

## Test Genişletme

### Yeni Component Testi Ekleme

1. `tests/components/` dizininde yeni test dosyası oluşturun
2. Component'i import edin
3. Test senaryolarını yazın

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import YeniComponent from '../../app/components/YeniComponent';

describe('YeniComponent', () => {
  it('render olmalı', () => {
    render(<YeniComponent />);
    expect(screen.getByText('Beklenen Metin')).toBeInTheDocument();
  });
});
```

### Yeni API Testi Ekleme

1. `tests/api/` dizininde yeni test dosyası oluşturun
2. Prisma mock'unu ekleyin
3. API endpoint'lerini test edin

## Kaynaklar

- [Vitest Dokümantasyonu](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI](https://vitest.dev/guide/ui.html)

## Katkıda Bulunma

Yeni testler eklerken:
1. Mevcut test yapısını takip edin
2. Açıklayıcı test isimleri kullanın
3. Her test izole olmalı
4. Mock'ları temizlemeyi unutmayın
5. Edge case'leri test edin

## Destek

Test ile ilgili sorularınız için:
- GitHub Issues kullanın
- Test dokümantasyonunu inceleyin
- Mevcut testleri örnek alın
