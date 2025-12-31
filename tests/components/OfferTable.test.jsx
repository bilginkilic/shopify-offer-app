import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfferTable from '../../app/components/OfferTable';

describe('OfferTable', () => {
  const mockOffers = [
    {
      id: 'offer-1',
      customerName: 'Ahmet Yılmaz',
      customerEmail: 'ahmet@test.com',
      productTitle: 'Test Ürün 1',
      productImage: 'https://example.com/image1.jpg',
      originalPrice: 1000,
      offerPrice: 800,
      quantity: 2,
      status: 'pending',
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString()
    },
    {
      id: 'offer-2',
      customerName: 'Ayşe Demir',
      customerEmail: 'ayse@test.com',
      productTitle: 'Test Ürün 2',
      productImage: 'https://example.com/image2.jpg',
      variantTitle: 'Kırmızı / L',
      originalPrice: 500,
      offerPrice: 400,
      counterPrice: 450,
      quantity: 1,
      status: 'countered',
      createdAt: new Date('2024-01-02T10:00:00Z').toISOString()
    },
    {
      id: 'offer-3',
      customerName: 'Mehmet Kaya',
      customerEmail: 'mehmet@test.com',
      productTitle: 'Test Ürün 3',
      originalPrice: 2000,
      offerPrice: 1500,
      quantity: 1,
      status: 'accepted',
      createdAt: new Date('2024-01-03T10:00:00Z').toISOString()
    }
  ];

  const mockOnView = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('loading durumunda spinner göstermeli', () => {
      render(<OfferTable offers={[]} onView={mockOnView} isLoading={true} />);

      expect(screen.getByText('Teklifler yükleniyor...')).toBeInTheDocument();
    });

    it('boş liste için mesaj göstermeli', () => {
      render(<OfferTable offers={[]} onView={mockOnView} isLoading={false} />);

      expect(screen.getByText('Henüz teklif bulunmuyor.')).toBeInTheDocument();
    });

    it('tüm teklifleri listelemeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
      expect(screen.getByText('Ayşe Demir')).toBeInTheDocument();
      expect(screen.getByText('Mehmet Kaya')).toBeInTheDocument();
    });

    it('ürün bilgilerini göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Ürün 1')).toBeInTheDocument();
      expect(screen.getByText('Test Ürün 2')).toBeInTheDocument();
      expect(screen.getByText('Kırmızı / L')).toBeInTheDocument();
    });

    it('durum etiketlerini göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Beklemede')).toBeInTheDocument();
      expect(screen.getByText('Karşı Teklif')).toBeInTheDocument();
      expect(screen.getByText('Kabul Edildi')).toBeInTheDocument();
    });

    it('karşı teklif varsa göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/Karşı: ₺450,00/)).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('fiyatları TL formatında göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Türk Lirası formatında olmalı
      expect(screen.getByText(/₺1\.000,00/)).toBeInTheDocument();
      expect(screen.getByText(/₺800,00/)).toBeInTheDocument();
    });
  });

  describe('Discount Calculation', () => {
    it('indirim yüzdesini doğru hesaplamalı', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // İndirim yüzdelerini kontrol et
      const discountBadges = screen.getAllByText(/-%\d+/);
      expect(discountBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Selection', () => {
    it('tek bir teklifi seçebilmeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // İlk checkbox "Hepsini Seç", diğerleri satırlar
      const firstRowCheckbox = checkboxes[1];

      fireEvent.click(firstRowCheckbox);
      expect(firstRowCheckbox).toBeChecked();
    });

    it('tüm teklifleri seçebilmeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      fireEvent.click(selectAllCheckbox);

      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('tüm seçimi kaldırabilmeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      // Önce seç
      fireEvent.click(selectAllCheckbox);
      // Sonra kaldır
      fireEvent.click(selectAllCheckbox);

      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Actions', () => {
    it('görüntüle butonuna tıklandığında callback çağrılmalı', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const viewButtons = screen.getAllByTitle('Görüntüle');
      fireEvent.click(viewButtons[0]);

      expect(mockOnView).toHaveBeenCalledWith(mockOffers[0]);
    });

    it('pending durumdaysa kabul/red butonlarını göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // İlk teklif pending durumda
      const acceptButtons = screen.getAllByTitle('Kabul Et');
      const rejectButtons = screen.getAllByTitle('Reddet');

      expect(acceptButtons.length).toBeGreaterThan(0);
      expect(rejectButtons.length).toBeGreaterThan(0);
    });

    it('kabul butonuna tıklandığında callback çağrılmalı', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const acceptButtons = screen.getAllByTitle('Kabul Et');
      fireEvent.click(acceptButtons[0]);

      expect(mockOnUpdate).toHaveBeenCalledWith('offer-1', { status: 'accepted' });
    });

    it('red butonuna tıklandığında callback çağrılmalı', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const rejectButtons = screen.getAllByTitle('Reddet');
      fireEvent.click(rejectButtons[0]);

      expect(mockOnUpdate).toHaveBeenCalledWith('offer-1', { status: 'rejected' });
    });

    it('sil butonuna tıklandığında callback çağrılmalı', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTitle('Sil');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith('offer-1');
    });
  });

  describe('Date Formatting', () => {
    it('tarihleri Türkçe formatında göstermeli', () => {
      render(
        <OfferTable
          offers={mockOffers}
          onView={mockOnView}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Türkçe tarih formatı bekleniyor
      expect(screen.getByText(/1 Oca 2024/)).toBeInTheDocument();
    });
  });
});
