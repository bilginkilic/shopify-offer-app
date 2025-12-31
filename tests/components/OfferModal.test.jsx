import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferModal from '../../app/components/OfferModal';

describe('OfferModal', () => {
  const mockOffer = {
    id: 'offer-123',
    customerName: 'Ahmet Yılmaz',
    customerEmail: 'ahmet@test.com',
    customerPhone: '0555 123 45 67',
    productId: 'prod-123',
    productTitle: 'Test Ürün',
    productImage: 'https://example.com/image.jpg',
    variantTitle: 'Kırmızı / L',
    originalPrice: 1000,
    offerPrice: 800,
    quantity: 2,
    message: 'Lütfen indirim yapın',
    status: 'pending',
    counterPrice: null,
    adminNotes: '',
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    logs: [
      {
        id: 'log-1',
        action: 'created',
        oldValue: null,
        newValue: 'Teklif oluşturuldu',
        performedBy: 'Müşteri',
        createdAt: new Date('2024-01-01T10:00:00Z').toISOString()
      }
    ]
  };

  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('null offer ile hiçbir şey render etmemeli', () => {
      const { container } = render(
        <OfferModal offer={null} onClose={mockOnClose} onUpdate={mockOnUpdate} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('modal başlığını göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Teklif Detayları')).toBeInTheDocument();
    });

    it('ürün bilgilerini göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Test Ürün')).toBeInTheDocument();
      expect(screen.getByText('Kırmızı / L')).toBeInTheDocument();
      expect(screen.getByAltText('Test Ürün')).toHaveAttribute('src', mockOffer.productImage);
    });

    it('müşteri bilgilerini göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
      expect(screen.getByText('ahmet@test.com')).toBeInTheDocument();
      expect(screen.getByText('0555 123 45 67')).toBeInTheDocument();
    });

    it('fiyat bilgilerini göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Orijinal Fiyat:')).toBeInTheDocument();
      expect(screen.getByText('Teklif Fiyatı:')).toBeInTheDocument();
      expect(screen.getByText('İndirim Oranı:')).toBeInTheDocument();
      expect(screen.getByText('Adet:')).toBeInTheDocument();
      expect(screen.getByText('Toplam Tasarruf:')).toBeInTheDocument();
    });

    it('müşteri mesajını göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Lütfen indirim yapın')).toBeInTheDocument();
    });

    it('mesaj yoksa müşteri mesajı bölümünü göstermemeli', () => {
      const offerWithoutMessage = { ...mockOffer, message: null };
      render(<OfferModal offer={offerWithoutMessage} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.queryByText('Müşteri Mesajı')).not.toBeInTheDocument();
    });

    it('işlem geçmişini göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('İşlem Geçmişi')).toBeInTheDocument();
      expect(screen.getByText('Oluşturuldu')).toBeInTheDocument();
    });

    it('işlem geçmişi yoksa bölümü göstermemeli', () => {
      const offerWithoutLogs = { ...mockOffer, logs: [] };
      render(<OfferModal offer={offerWithoutLogs} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.queryByText('İşlem Geçmişi')).not.toBeInTheDocument();
    });
  });

  describe('Calculations', () => {
    it('indirim yüzdesini doğru hesaplamalı', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // %20 indirim (1000 -> 800)
      expect(screen.getByText(/%20/)).toBeInTheDocument();
    });

    it('toplam tasarrufu doğru hesaplamalı', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // (1000 - 800) * 2 = 400 TL
      expect(screen.getByText(/₺400,00/)).toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    it('durum seçimi yapılabilmeli', async () => {
      const user = userEvent.setup();
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'accepted');

      expect(statusSelect).toHaveValue('accepted');
    });

    it('karşı teklif seçildiğinde fiyat alanı gösterilmeli', async () => {
      const user = userEvent.setup();
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'countered');

      await waitFor(() => {
        expect(screen.getByLabelText(/Karşı Teklif Fiyatı/i)).toBeInTheDocument();
      });
    });

    it('karşı teklif fiyatı girilmeli', async () => {
      const user = userEvent.setup();
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'countered');

      const counterPriceInput = await screen.findByLabelText(/Karşı Teklif Fiyatı/i);
      await user.type(counterPriceInput, '850');

      expect(counterPriceInput).toHaveValue(850);
    });
  });

  describe('Admin Notes', () => {
    it('admin notları girilmeli', async () => {
      const user = userEvent.setup();
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const notesTextarea = screen.getByLabelText(/Admin Notları/i);
      await user.type(notesTextarea, 'Test admin notu');

      expect(notesTextarea).toHaveValue('Test admin notu');
    });

    it('mevcut admin notlarını göstermeli', () => {
      const offerWithNotes = { ...mockOffer, adminNotes: 'Mevcut not' };
      render(<OfferModal offer={offerWithNotes} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const notesTextarea = screen.getByLabelText(/Admin Notları/i);
      expect(notesTextarea).toHaveValue('Mevcut not');
    });
  });

  describe('Save Functionality', () => {
    it('değişiklik varsa kaydet butonu aktif olmalı', async () => {
      const user = userEvent.setup();
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const saveButton = screen.getByText('Kaydet');
      expect(saveButton).toBeDisabled();

      // Durumu değiştir
      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'accepted');

      expect(saveButton).not.toBeDisabled();
    });

    it('kaydet butonuna tıklandığında onUpdate çağrılmalı', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockResolvedValue({});

      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // Durumu değiştir
      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'accepted');

      const saveButton = screen.getByText('Kaydet');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('offer-123', {
          status: 'accepted',
          counterPrice: null,
          adminNotes: ''
        });
      });
    });

    it('kayıt sırasında buton disable olmalı', async () => {
      const user = userEvent.setup();
      let resolveUpdate;
      mockOnUpdate.mockImplementation(() => new Promise(resolve => {
        resolveUpdate = resolve;
      }));

      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // Durumu değiştir
      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'accepted');

      const saveButton = screen.getByText('Kaydet');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Kaydediliyor...')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
      });

      resolveUpdate();
    });

    it('başarılı kayıt sonrası modal kapanmalı', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockResolvedValue({});

      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // Durumu değiştir
      const statusSelect = screen.getByDisplayValue('Beklemede');
      await user.selectOptions(statusSelect, 'accepted');

      const saveButton = screen.getByText('Kaydet');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Close Functionality', () => {
    it('kapat butonuna tıklandığında onClose çağrılmalı', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const closeButtons = screen.getAllByRole('button');
      const headerCloseButton = closeButtons[0]; // X butonu
      fireEvent.click(headerCloseButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('iptal butonuna tıklandığında onClose çağrılmalı', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const cancelButton = screen.getByText('İptal');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('overlay\'e tıklandığında onClose çağrılmalı', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      const overlay = screen.getByText('Teklif Detayları').closest('.modalOverlay');
      if (overlay?.parentElement) {
        fireEvent.click(overlay.parentElement);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Date Formatting', () => {
    it('tarihleri Türkçe formatında göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/1 Ocak 2024/)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('fiyatları TL formatında göstermeli', () => {
      render(<OfferModal offer={mockOffer} onClose={mockOnClose} onUpdate={mockOnUpdate} />);

      // Türk Lirası formatı bekleniyor
      expect(screen.getByText(/₺1\.000,00/)).toBeInTheDocument();
      expect(screen.getByText(/₺800,00/)).toBeInTheDocument();
    });
  });
});
