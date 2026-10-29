import { describe, it, expect } from 'vitest';
import { PosCartCalculator } from '../../src/public/views/pos/PosCartCalculator';
import { ProductDto } from '../../src/public/types/api.types';
import { CartItem } from '../../src/public/views/pos/pos.types';

describe('PosCartCalculator (Frontend Business Logic)', () => {
  const sampleProduct: ProductDto = {
    id: 'prod-1',
    name: 'Cuaderno Universitario',
    description: '',
    barcode: '7791234567890',
    stock: 50,
    providerId: null,
    priceMinor: 100000, // $1,000.00
    priceMajor: 80000,  // $800.00
    minorPrices: [
      { conditionValue: 3, priceValue: 90000 }, // 3+ -> $900.00
      { conditionValue: 5, priceValue: 85000 }, // 5+ -> $850.00
    ],
  };

  it('calculates retail regular price when quantity is below first threshold', () => {
    const { basePrice, effectivePrice } = PosCartCalculator.calculateItemPrice(sampleProduct, 2, 'minor');
    expect(basePrice).toBe(100000);
    expect(effectivePrice).toBe(100000);
  });

  it('applies first volume discount tier when quantity matches threshold', () => {
    const { basePrice, effectivePrice } = PosCartCalculator.calculateItemPrice(sampleProduct, 3, 'minor');
    expect(basePrice).toBe(100000);
    expect(effectivePrice).toBe(90000);
  });

  it('applies highest qualifying discount tier when quantity reaches 5', () => {
    const { basePrice, effectivePrice } = PosCartCalculator.calculateItemPrice(sampleProduct, 6, 'minor');
    expect(basePrice).toBe(100000);
    expect(effectivePrice).toBe(85000);
  });

  it('uses wholesale price directly when order type is major', () => {
    const { basePrice, effectivePrice } = PosCartCalculator.calculateItemPrice(sampleProduct, 1, 'major');
    expect(basePrice).toBe(80000);
    expect(effectivePrice).toBe(80000);
  });

  it('calculates total, total discounts, and item count correctly', () => {
    const cart: CartItem[] = [
      { product: sampleProduct, quantity: 5, basePrice: 100000, effectivePrice: 85000 },
    ];
    const { total, totalDiscount, itemCount } = PosCartCalculator.getTotals(cart);
    // 5 * 85000 = 425000 cents ($4,250.00)
    expect(total).toBe(425000);
    // 5 * (100000 - 85000) = 75000 cents ($750.00)
    expect(totalDiscount).toBe(75000);
    expect(itemCount).toBe(5);
  });
});

