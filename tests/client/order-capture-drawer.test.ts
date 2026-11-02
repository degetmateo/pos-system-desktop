import { describe, it, expect, vi } from 'vitest';
import { OrderCaptureHeaderDrawer } from '../../src/public/services/order-capture.header-drawer';
import { OrderCaptureTableDrawer } from '../../src/public/services/order-capture.table-drawer';
import { OrderCaptureData } from '../../src/public/services/order-capture.types';

function createMockCtx() {
  const textCalls: { text: string; x: number; y: number }[] = [];
  return {
    textCalls,
    fillText: vi.fn((text, x, y) => textCalls.push({ text, x, y })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D & { textCalls: { text: string; x: number; y: number }[] };
}

describe('OrderCapture Drawers (Header & Table)', () => {
  it('draws ORDEN N° when orderNumber is provided', async () => {
    const ctx = createMockCtx();
    const data: OrderCaptureData = {
      orderNumber: 104,
      items: [],
      total: 1000,
      customerName: 'Gómez María',
    };

    await OrderCaptureHeaderDrawer.drawHeader(ctx, data);

    const hasOrderNumber = ctx.textCalls.some((c) => c.text === 'ORDEN N° 104');
    const hasCustomer = ctx.textCalls.some((c) => c.text === 'Cliente: Gómez María');
    expect(hasOrderNumber).toBe(true);
    expect(hasCustomer).toBe(true);
  });

  it('draws PRESUPUESTO when orderNumber is not provided', async () => {
    const ctx = createMockCtx();
    const data: OrderCaptureData = {
      items: [],
      total: 500,
    };

    await OrderCaptureHeaderDrawer.drawHeader(ctx, data);

    const hasPresupuesto = ctx.textCalls.some((c) => c.text === 'PRESUPUESTO');
    const hasOrderNumber = ctx.textCalls.some((c) => c.text.startsWith('ORDEN N°'));
    expect(hasPresupuesto).toBe(true);
    expect(hasOrderNumber).toBe(false);
  });

  it('draws table rows, totals, advancement and pending balance', () => {
    const ctx = createMockCtx();
    const items = [
      { quantity: 2, name: 'Lapicera Azul', unitPrice: 150, subtotal: 300 },
    ];

    const nextY = OrderCaptureTableDrawer.draw(ctx, 125, items, 300, 100);

    const hasItemName = ctx.textCalls.some((c) => c.text === 'Lapicera Azul');
    const hasTotal = ctx.textCalls.some((c) => c.text === '$ 300,00');
    const hasAdvancement = ctx.textCalls.some((c) => c.text === 'SEÑA / ADELANTO:');
    const hasBalance = ctx.textCalls.some((c) => c.text === 'SALDO PENDIENTE:');

    expect(hasItemName).toBe(true);
    expect(hasTotal).toBe(true);
    expect(hasAdvancement).toBe(true);
    expect(hasBalance).toBe(true);
    expect(nextY).toBeGreaterThan(125);
  });
});

