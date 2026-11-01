import { describe, it, expect, vi } from 'vitest';
import { formatCaptureMoney, formatPaymentMethod, OrderCaptureData } from '../../src/public/services/order-capture.types';
import { OrderCaptureService } from '../../src/public/services/order-capture.service';
import { OrderCaptureCanvas } from '../../src/public/services/order-capture.canvas';
import { ApiClient } from '../../src/public/services/api.client';

describe('OrderCapture Helpers and Service', () => {
  describe('formatCaptureMoney', () => {
    it('formats round numbers with dot thousands separator and comma cents', () => {
      expect(formatCaptureMoney(32900)).toBe('$ 32.900,00');
      expect(formatCaptureMoney(11500)).toBe('$ 11.500,00');
      expect(formatCaptureMoney(250)).toBe('$ 250,00');
    });

    it('formats decimal amounts accurately', () => {
      expect(formatCaptureMoney(150.5)).toBe('$ 150,50');
      expect(formatCaptureMoney(0)).toBe('$ 0,00');
    });
  });

  describe('formatPaymentMethod', () => {
    it('translates cash to Efectivo', () => {
      expect(formatPaymentMethod('cash')).toBe('Efectivo');
      expect(formatPaymentMethod('CASH')).toBe('Efectivo');
      expect(formatPaymentMethod('efectivo')).toBe('Efectivo');
    });

    it('translates transfer to Transferencia', () => {
      expect(formatPaymentMethod('transfer')).toBe('Transferencia');
      expect(formatPaymentMethod('transferencia')).toBe('Transferencia');
    });

    it('translates card to Tarjeta and current_account to Cuenta Corriente', () => {
      expect(formatPaymentMethod('card')).toBe('Tarjeta');
      expect(formatPaymentMethod('current_account')).toBe('Cuenta Corriente');
    });

    it('falls back to Efectivo if method is null or undefined', () => {
      expect(formatPaymentMethod(null)).toBe('Efectivo');
      expect(formatPaymentMethod(undefined)).toBe('Efectivo');
    });
  });

  describe('OrderCaptureService', () => {
    it('calls ApiClient.copyOrderPdf when executing copyOrderPdf', async () => {
      const copyPdfSpy = vi.spyOn(ApiClient, 'copyOrderPdf').mockResolvedValue({
        success: true,
        orderNumber: 123,
        filePath: 'test.pdf',
      });

      const success = await OrderCaptureService.copyOrderPdf('order-123', 123);
      expect(success).toBe(true);
      expect(copyPdfSpy).toHaveBeenCalledWith('order-123');

      copyPdfSpy.mockRestore();
    });

    it('handles copyTableCapture gracefully when clipboard write is mocked', async () => {
      const data: OrderCaptureData = {
        orderNumber: 101,
        items: [
          { quantity: 1, name: 'foto', unitPrice: 11500, subtotal: 11500 },
          { quantity: 10, name: 'cartulina blanca', unitPrice: 250, subtotal: 2500 },
        ],
        total: 14000,
        paymentMethod: 'Transferencia',
      };

      const mockBlob = new Blob(['fake-png'], { type: 'image/png' });
      vi.spyOn(OrderCaptureCanvas, 'generate').mockResolvedValue(mockBlob);

      const writeSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: { write: writeSpy },
        configurable: true,
        writable: true,
      });

      (globalThis as any).ClipboardItem = class {
        constructor(public obj: Record<string, Blob>) {}
      };

      const res = await OrderCaptureService.copyTableCapture(data);
      expect(res).toBe(true);
      expect(writeSpy).toHaveBeenCalled();
    });
  });
});
