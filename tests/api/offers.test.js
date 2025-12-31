import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader, action } from '../../app/routes/api/offers';

// Mock Prisma
vi.mock('../../app/db.server', () => ({
  default: {
    offer: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    }
  }
}));

import prisma from '../../app/db.server';

describe('API: /api/offers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/offers (loader)', () => {
    const mockOffers = [
      {
        id: 'offer-1',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet@test.com',
        productTitle: 'Test Ürün',
        originalPrice: 1000,
        offerPrice: 800,
        quantity: 1,
        status: 'pending',
        createdAt: new Date(),
        logs: []
      }
    ];

    it('tüm teklifleri döndürmeli', async () => {
      prisma.offer.findMany.mockResolvedValue(mockOffers);
      prisma.offer.count.mockResolvedValue(1);

      const request = new Request('http://localhost/api/offers');
      const response = await loader({ request });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
    });

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

    it('search filtresi çalışmalı', async () => {
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.offer.count.mockResolvedValue(0);

      const request = new Request('http://localhost/api/offers?search=Ahmet');
      await loader({ request });

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { customerName: { contains: 'Ahmet' } },
              { customerEmail: { contains: 'Ahmet' } },
              { productTitle: { contains: 'Ahmet' } }
            ]
          }
        })
      );
    });

    it('sayfalama çalışmalı', async () => {
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.offer.count.mockResolvedValue(25);

      const request = new Request('http://localhost/api/offers?page=2&limit=10');
      const response = await loader({ request });
      const data = await response.json();

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );

      expect(data.pagination.pages).toBe(3);
    });

    it('hata durumunda 500 dönmeli', async () => {
      prisma.offer.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/offers');
      const response = await loader({ request });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Teklifler yüklenirken hata oluştu');
    });
  });

  describe('POST /api/offers (action)', () => {
    const validOfferData = {
      customerName: 'Ahmet Yılmaz',
      customerEmail: 'ahmet@test.com',
      customerPhone: '0555 123 45 67',
      productId: 'prod-123',
      productTitle: 'Test Ürün',
      originalPrice: 1000,
      offerPrice: 800,
      quantity: 2,
      message: 'Test mesaj'
    };

    it('geçerli teklif oluşturulmalı', async () => {
      const createdOffer = {
        id: 'offer-new',
        ...validOfferData,
        status: 'pending',
        logs: []
      };

      prisma.offer.create.mockResolvedValue(createdOffer);

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(validOfferData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('offer-new');
    });

    it('eksik alan için 400 dönmeli', async () => {
      const incompleteData = { ...validOfferData };
      delete incompleteData.customerName;

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(incompleteData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('customerName');
    });

    it('geçersiz email için 400 dönmeli', async () => {
      const invalidEmailData = {
        ...validOfferData,
        customerEmail: 'invalid-email'
      };

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(invalidEmailData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Geçerli bir email adresi giriniz');
    });

    it('sıfır veya negatif fiyat için 400 dönmeli', async () => {
      const invalidPriceData = {
        ...validOfferData,
        offerPrice: -10
      };

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(invalidPriceData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Teklif fiyatı 0'dan büyük olmalıdır");
    });

    it('orijinal fiyattan yüksek teklif için 400 dönmeli', async () => {
      const invalidPriceData = {
        ...validOfferData,
        offerPrice: 1500
      };

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(invalidPriceData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Teklif fiyatı orijinal fiyattan düşük olmalıdır');
    });

    it('log kaydı oluşturmalı', async () => {
      const createdOffer = {
        id: 'offer-new',
        ...validOfferData,
        status: 'pending',
        logs: []
      };

      prisma.offer.create.mockResolvedValue(createdOffer);

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(validOfferData)
      });

      await action({ request });

      expect(prisma.offer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            logs: {
              create: {
                action: 'created',
                newValue: 'pending',
                performedBy: 'customer'
              }
            }
          })
        })
      );
    });

    it('geçersiz method için 405 dönmeli', async () => {
      const request = new Request('http://localhost/api/offers', {
        method: 'PUT'
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
    });

    it('hata durumunda 500 dönmeli', async () => {
      prisma.offer.create.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/offers', {
        method: 'POST',
        body: JSON.stringify(validOfferData)
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
