import { describe, it, expect, beforeEach } from 'vitest';
import { OrderRemakeService } from '../../src/public/services/order-remake.service';
import { OrderDraftStorage } from '../../src/public/services/order-draft.storage';
import { OrderDto } from '../../src/public/types/api.types';

describe('OrderRemakeService', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (global as any).window = {
      localStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
    };
    OrderDraftStorage.clearDraftV1();
    OrderDraftStorage.clearDraftV2();
  });

  it('clones an order into PosDraftV2 and PosDraftV1 with all fields populated', () => {
    const sampleOrder: OrderDto = {
      id: 'ord-orig-1',
      number: 45,
      customerId: 'cust-123',
      type: 'major',
      paymentMethod: 'transfer',
      totalPrice: 500000,
      advancement: 100000,
      status: 'completed',
      createdAt: new Date().toISOString(),
      items: [
        {
          productId: 'p-1',
          productName: 'Resma A4 Ledesma',
          quantity: 5,
          unitPrice: 100000, // $1000.00
          discountPrice: 90000, // $900.00
        },
      ],
    };

    const draftV2 = OrderRemakeService.remakeOrder(sampleOrder);

    expect(draftV2.orderType).toBe('major');
    expect(draftV2.customerId).toBe('cust-123');
    expect(draftV2.paymentMethod).toBe('transfer');
    expect(draftV2.advancement).toBe(100000);
    expect(draftV2.rows).toHaveLength(1);
    expect(draftV2.rows[0].productName).toBe('Resma A4 Ledesma');
    expect(draftV2.rows[0].quantity).toBe(5);
    expect(draftV2.rows[0].unitPrice).toBe(900); // 90000 cents = $900.00

    const storedV2 = OrderDraftStorage.getDraftV2();
    expect(storedV2).not.toBeNull();
    expect(storedV2?.rows[0].productName).toBe('Resma A4 Ledesma');

    const storedV1 = OrderDraftStorage.getDraftV1();
    expect(storedV1).not.toBeNull();
    expect(storedV1?.items[0].product.name).toBe('Resma A4 Ledesma');
    expect(storedV1?.items[0].quantity).toBe(5);
  });
});
