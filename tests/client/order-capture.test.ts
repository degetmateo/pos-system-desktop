import { describe, it, expect, vi } from 'vitest';
import { formatCaptureMoney, formatPaymentMethod, OrderCaptureData } from '../../src/public/services/order-capture.types';
import { OrderCaptureService } from '../../src/public/services/order-capture.service';
import { OrderCaptureCanvas } from '../../src/public/services/order-capture.canvas';
import { OrderCaptureMapper } from '../../src/public/services/order-capture.mapper';
import { ApiClient } from '../../src/public/services/api.client';

describe('OrderCapture Helpers, Mapper and Service', () => {
  it('formats round and decimal amounts accurately', () => {
    expect(formatCaptureMoney(32900)).toBe('$ 32.900,00');
    expect(formatCaptureMoney(150.5)).toBe('$ 150,50');
    expect(formatCaptureMoney(0)).toBe('$ 0,00');
  });

  it('translates payment methods correctly', () => {
    expect(formatPaymentMethod('cash')).toBe('Efectivo');
    expect(formatPaymentMethod('transfer')).toBe('Transferencia');
    expect(formatPaymentMethod('card')).toBe('Tarjeta');
    expect(formatPaymentMethod('current_account')).toBe('Cuenta Corriente');
    expect(formatPaymentMethod(null)).toBe('Efectivo');
  });

  it('maps an OrderDto to OrderCaptureData preserving orderNumber and cents conversion', () => {
    const orderDto: any = {
      id: 'ord-1',
      number: 45,
      type: 'minor',
      paymentMethod: 'transfer',
      totalPrice: { cents: 150000 },
      advancement: { cents: 50000 },
      customer: { name: 'Escuela N° 12' },
      items: [
        { quantity: 2, productName: 'Resma A4', price: 50000, subtotal: 100000 },
        { quantity: 1, productName: 'Marcador', price: 50000, subtotal: 50000 },
      ],
    };

    const data = OrderCaptureMapper.fromOrder(orderDto);
    expect(data.orderNumber).toBe(45);
    expect(data.customerName).toBe('Escuela N° 12');
    expect(data.total).toBe(1500);
    expect(data.advancement).toBe(500);
    expect(data.items).toHaveLength(2);
    expect(data.items[0].unitPrice).toBe(500);
  });

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

  it('handles copyOrderCapture by mapping order and invoking copyTableCapture', async () => {
    const copyTableSpy = vi.spyOn(OrderCaptureService, 'copyTableCapture').mockResolvedValue(true);
    const orderDto: any = {
      id: 'ord-99',
      number: 99,
      items: [],
      totalPrice: 10000,
    };

    const res = await OrderCaptureService.copyOrderCapture(orderDto);
    expect(res).toBe(true);
    expect(copyTableSpy).toHaveBeenCalledWith(
      expect.objectContaining({ orderNumber: 99 })
    );
    copyTableSpy.mockRestore();
  });
});
