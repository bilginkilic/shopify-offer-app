import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfferStats from '../../app/components/OfferStats';

describe('OfferStats', () => {
  describe('Rendering', () => {
    it('tüm istatistik kartlarını göstermeli', () => {
      const mockStats = {
        total: 100,
        pending: 25,
        accepted: 40,
        rejected: 20,
        countered: 15,
        totalSavings: 50000
      };

      render(<OfferStats stats={mockStats} />);

      expect(screen.getByText('Toplam Teklif')).toBeInTheDocument();
      expect(screen.getByText('Bekleyen')).toBeInTheDocument();
      expect(screen.getByText('Kabul Edilen')).toBeInTheDocument();
      expect(screen.getByText('Reddedilen')).toBeInTheDocument();
      expect(screen.getByText('Karşı Teklif')).toBeInTheDocument();
      expect(screen.getByText('Toplam Tasarruf')).toBeInTheDocument();
    });

    it('doğru değerleri göstermeli', () => {
      const mockStats = {
        total: 100,
        pending: 25,
        accepted: 40,
        rejected: 20,
        countered: 15,
        totalSavings: 50000
      };

      render(<OfferStats stats={mockStats} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('50000.00 TL')).toBeInTheDocument();
    });

    it('stats undefined ise sıfır değerleri göstermeli', () => {
      render(<OfferStats stats={undefined} />);

      // 6 tane 0 olmalı (total, pending, accepted, rejected, countered için)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(5);
    });

    it('eksik stats alanları için sıfır göstermeli', () => {
      const partialStats = {
        total: 50,
        accepted: 20
      };

      render(<OfferStats stats={partialStats} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      // Diğer alanlar 0 olmalı
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Icons', () => {
    it('her kart için icon göstermeli', () => {
      const mockStats = {
        total: 10,
        pending: 2,
        accepted: 3,
        rejected: 2,
        countered: 3,
        totalSavings: 1000
      };

      render(<OfferStats stats={mockStats} />);

      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
      expect(screen.getByText('💰')).toBeInTheDocument();
    });
  });

  describe('Formatting', () => {
    it('totalSavings için ondalık formatı göstermeli', () => {
      const mockStats = {
        totalSavings: 12345.67
      };

      render(<OfferStats stats={mockStats} />);

      expect(screen.getByText('12345.67 TL')).toBeInTheDocument();
    });

    it('totalSavings yoksa 0.00 göstermeli', () => {
      render(<OfferStats stats={{}} />);

      expect(screen.getByText('0 TL')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('boş stats objesi ile render olmalı', () => {
      render(<OfferStats stats={{}} />);

      // Component hata vermeden render olmalı
      expect(screen.getByText('Toplam Teklif')).toBeInTheDocument();
    });

    it('null stats ile render olmalı', () => {
      render(<OfferStats stats={null} />);

      // Component hata vermeden render olmalı
      expect(screen.getByText('Toplam Teklif')).toBeInTheDocument();
    });
  });
});
