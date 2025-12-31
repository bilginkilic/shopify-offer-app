import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferForm from '../../app/components/OfferForm';

describe('OfferForm', () => {
  const mockProduct = {
    id: 'prod-123',
    title: 'Test Ürün',
    price: 1000,
    image: 'https://example.com/image.jpg'
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('tüm form alanlarını göstermeli', () => {
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Adınız Soyadınız/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Adresiniz/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Telefon Numaranız/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teklif Fiyatınız/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Adet/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mesajınız/i)).toBeInTheDocument();
    });

    it('ürün bilgilerini göstermeli', () => {
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(/1000\.00 TL/)).toBeInTheDocument();
      expect(screen.getByAltText(mockProduct.title)).toHaveAttribute('src', mockProduct.image);
    });

    it('cancel butonu verilmişse göstermeli', () => {
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('İptal')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('boş isim için hata göstermeli', async () => {
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('İsim gereklidir')).toBeInTheDocument();
      });
    });

    it('geçersiz email için hata göstermeli', async () => {
      const user = userEvent.setup();
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email Adresiniz/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Geçerli bir email giriniz')).toBeInTheDocument();
      });
    });

    it('teklif fiyatı orijinal fiyattan düşük olmalı', async () => {
      const user = userEvent.setup();
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      const priceInput = screen.getByLabelText(/Teklif Fiyatınız/i);
      await user.type(priceInput, '1500');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Teklif fiyatı orijinal fiyattan düşük olmalıdır')).toBeInTheDocument();
      });
    });

    it('teklif fiyatı sıfırdan büyük olmalı', async () => {
      const user = userEvent.setup();
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      const priceInput = screen.getByLabelText(/Teklif Fiyatınız/i);
      await user.type(priceInput, '0');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Teklif fiyatı 0'dan büyük olmalıdır")).toBeInTheDocument();
      });
    });
  });

  describe('Discount Calculation', () => {
    it('indirim yüzdesini doğru hesaplamalı', async () => {
      const user = userEvent.setup();
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      const priceInput = screen.getByLabelText(/Teklif Fiyatınız/i);
      await user.type(priceInput, '800'); // %20 indirim

      await waitFor(() => {
        expect(screen.getByText(/%20 indirim/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('geçerli veriyle form submit edilmeli', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({});

      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      // Formu doldur
      await user.type(screen.getByLabelText(/Adınız Soyadınız/i), 'Ahmet Yılmaz');
      await user.type(screen.getByLabelText(/Email Adresiniz/i), 'ahmet@test.com');
      await user.type(screen.getByLabelText(/Telefon Numaranız/i), '0555 123 45 67');
      await user.type(screen.getByLabelText(/Teklif Fiyatınız/i), '800');
      await user.clear(screen.getByLabelText(/Adet/i));
      await user.type(screen.getByLabelText(/Adet/i), '2');
      await user.type(screen.getByLabelText(/Mesajınız/i), 'Test mesaj');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          customerName: 'Ahmet Yılmaz',
          customerEmail: 'ahmet@test.com',
          customerPhone: '0555 123 45 67',
          offerPrice: 800,
          quantity: 2,
          message: 'Test mesaj',
          productId: mockProduct.id,
          productTitle: mockProduct.title,
          productImage: mockProduct.image,
          originalPrice: mockProduct.price
        });
      });
    });

    it('submit sırasında buton disable olmalı', async () => {
      const user = userEvent.setup();
      let resolveSubmit;
      mockOnSubmit.mockImplementation(() => new Promise(resolve => {
        resolveSubmit = resolve;
      }));

      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      // Minimum gerekli alanları doldur
      await user.type(screen.getByLabelText(/Adınız Soyadınız/i), 'Ahmet Yılmaz');
      await user.type(screen.getByLabelText(/Email Adresiniz/i), 'ahmet@test.com');
      await user.type(screen.getByLabelText(/Teklif Fiyatınız/i), '800');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Gönderiliyor...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      resolveSubmit();
    });

    it('hata durumunda hata mesajı göstermeli', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      // Minimum gerekli alanları doldur
      await user.type(screen.getByLabelText(/Adınız Soyadınız/i), 'Ahmet Yılmaz');
      await user.type(screen.getByLabelText(/Email Adresiniz/i), 'ahmet@test.com');
      await user.type(screen.getByLabelText(/Teklif Fiyatınız/i), '800');

      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Teklif gönderilirken hata oluştu')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Handler', () => {
    it('cancel butonuna tıklandığında callback çağrılmalı', () => {
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('İptal');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error Clearing', () => {
    it('kullanıcı yazmaya başladığında hata temizlenmeli', async () => {
      const user = userEvent.setup();
      render(<OfferForm product={mockProduct} onSubmit={mockOnSubmit} />);

      // Önce hatayı tetikle
      const submitButton = screen.getByText('Teklif Gönder');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('İsim gereklidir')).toBeInTheDocument();
      });

      // Şimdi alana yaz
      const nameInput = screen.getByLabelText(/Adınız Soyadınız/i);
      await user.type(nameInput, 'A');

      // Hata kaybolmalı
      expect(screen.queryByText('İsim gereklidir')).not.toBeInTheDocument();
    });
  });
});
