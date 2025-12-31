import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader, action } from '../../app/routes/api/offers.$id';

// Mock Prisma
vi.mock('../../app/db.server', () => ({
  default: {
    offer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}));

import prisma from '../../app/db.server';

describe('API: /api/offers/$id', () => {
  const mockOffer = {
    id: 'offer-123',
    customerName: 'Ahmet Yılmaz',
    customerEmail: 'ahmet@test.com',
    productTitle: 'Test Ürün',
    originalPrice: 1000,
    offerPrice: 800,
    quantity: 1,
    status: 'pending',
    counterPrice: null,
    adminNotes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    logs: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/offers/:id (loader)', () => {
    it('teklifi döndürmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);

      const params = { id: 'offer-123' };
      const response = await loader({ params });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.id).toBe('offer-123');
      expect(prisma.offer.findUnique).toHaveBeenCalledWith({
        where: { id: 'offer-123' },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    });

    it('teklif bulunamazsa 404 dönmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      const params = { id: 'non-existent' };
      const response = await loader({ params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Teklif bulunamadı');
    });

    it('hata durumunda 500 dönmeli', async () => {
      prisma.offer.findUnique.mockRejectedValue(new Error('Database error'));

      const params = { id: 'offer-123' };
      const response = await loader({ params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/offers/:id (action)', () => {
    it('teklifi güncellemeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: 'accepted'
      });

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'accepted' })
      });

      const params = { id: 'offer-123' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.status).toBe('accepted');
    });

    it('status değişikliği için log oluşturmalı', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: 'accepted'
      });

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'accepted' })
      });

      const params = { id: 'offer-123' };
      await action({ request, params });

      expect(prisma.offer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            logs: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  action: 'status_changed',
                  oldValue: 'pending',
                  newValue: 'accepted',
                  performedBy: 'admin'
                })
              ])
            }
          })
        })
      );
    });

    it('karşı teklif güncellemeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        counterPrice: 850
      });

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PUT',
        body: JSON.stringify({ counterPrice: 850 })
      });

      const params = { id: 'offer-123' };
      await action({ request, params });

      expect(prisma.offer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            counterPrice: 850,
            logs: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  action: 'price_updated'
                })
              ])
            }
          })
        })
      );
    });

    it('admin notları güncellemeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        adminNotes: 'Yeni not'
      });

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PUT',
        body: JSON.stringify({ adminNotes: 'Yeni not' })
      });

      const params = { id: 'offer-123' };
      await action({ request, params });

      expect(prisma.offer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminNotes: 'Yeni not',
            logs: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  action: 'note_added',
                  newValue: 'Yeni not'
                })
              ])
            }
          })
        })
      );
    });

    it('teklif bulunamazsa 404 dönmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/offers/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ status: 'accepted' })
      });

      const params = { id: 'non-existent' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Teklif bulunamadı');
    });

    it('hata durumunda 500 dönmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'accepted' })
      });

      const params = { id: 'offer-123' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/offers/:id (action)', () => {
    it('teklifi silmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.delete.mockResolvedValue(mockOffer);

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'DELETE'
      });

      const params = { id: 'offer-123' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe('Teklif silindi');
      expect(prisma.offer.delete).toHaveBeenCalledWith({
        where: { id: 'offer-123' }
      });
    });

    it('teklif bulunamazsa 404 dönmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/offers/non-existent', {
        method: 'DELETE'
      });

      const params = { id: 'non-existent' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Teklif bulunamadı');
    });

    it('hata durumunda 500 dönmeli', async () => {
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.delete.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'DELETE'
      });

      const params = { id: 'offer-123' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Invalid Methods', () => {
    it('geçersiz method için 405 dönmeli', async () => {
      const request = new Request('http://localhost/api/offers/offer-123', {
        method: 'PATCH'
      });

      const params = { id: 'offer-123' };
      const response = await action({ request, params });
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });
  });
});
