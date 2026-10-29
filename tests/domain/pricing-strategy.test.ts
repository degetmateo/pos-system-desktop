import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/value-objects/money.vo';
import { MinorPrice } from '../../src/domain/models/minor-price.entity';
import { MajorPricingStrategy } from '../../src/domain/strategies/major-pricing-strategy';
import { MinorPricingStrategy } from '../../src/domain/strategies/minor-pricing-strategy';

describe('Pricing Strategies (GoF Strategy)', () => {
  const priceMajor = Money.fromDecimal(80);
  const priceMinor = Money.fromDecimal(100);

  const rules: MinorPrice[] = [
    new MinorPrice({
      id: '1',
      productId: 'p1',
      condition: 'discount',
      conditionValue: 3,
      priceValue: Money.fromDecimal(90),
    }),
    new MinorPrice({
      id: '2',
      productId: 'p1',
      condition: 'discount',
      conditionValue: 5,
      priceValue: Money.fromDecimal(85),
    }),
  ];

  it('calculates wholesale (major) price correctly', () => {
    const strategy = new MajorPricingStrategy();
    const result = strategy.calculate(priceMajor, priceMinor, 4, rules);

    expect(result.unitPrice.toDecimal()).toBe(80);
    expect(result.discountPrice).toBeNull();
    expect(result.subtotal.toDecimal()).toBe(320);
    expect(result.hasDiscount).toBe(false);
  });

  it('calculates retail (minor) price without discount when below threshold', () => {
    const strategy = new MinorPricingStrategy();
    const result = strategy.calculate(priceMajor, priceMinor, 2, rules);

    expect(result.unitPrice.toDecimal()).toBe(100);
    expect(result.discountPrice).toBeNull();
    expect(result.subtotal.toDecimal()).toBe(200);
    expect(result.hasDiscount).toBe(false);
  });

  it('applies first tier discount when threshold reached', () => {
    const strategy = new MinorPricingStrategy();
    const result = strategy.calculate(priceMajor, priceMinor, 4, rules);

    expect(result.unitPrice.toDecimal()).toBe(100);
    expect(result.discountPrice?.toDecimal()).toBe(90);
    expect(result.subtotal.toDecimal()).toBe(360);
    expect(result.hasDiscount).toBe(true);
  });

  it('applies highest tier discount when threshold reached', () => {
    const strategy = new MinorPricingStrategy();
    const result = strategy.calculate(priceMajor, priceMinor, 10, rules);

    expect(result.unitPrice.toDecimal()).toBe(100);
    expect(result.discountPrice?.toDecimal()).toBe(85);
    expect(result.subtotal.toDecimal()).toBe(850);
    expect(result.hasDiscount).toBe(true);
  });
});

