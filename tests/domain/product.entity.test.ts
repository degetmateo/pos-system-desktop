import { describe, it, expect } from 'vitest';
import { Product } from '../../src/domain/models/product.entity';
import { Money } from '../../src/domain/value-objects/money.vo';

describe('Product Entity', () => {
  it('initializes and manages stock correctly', () => {
    const product = new Product({
      id: 'p1',
      name: 'Resma A4',
      stock: 50,
      priceMajor: Money.fromDecimal(4000),
      priceMinor: Money.fromDecimal(5000),
    });

    expect(product.name).toBe('RESMA A4');
    expect(product.stock).toBe(50);

    product.updateStock(-10);
    expect(product.stock).toBe(40);
    expect(product.synchronized).toBe(false);

    product.markAsDeleted();
    expect(product.deleted).toBe(true);
  });
});

