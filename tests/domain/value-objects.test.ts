import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/value-objects/money.vo';
import { Barcode } from '../../src/domain/value-objects/barcode.vo';
import { PaymentMethod } from '../../src/domain/value-objects/payment-method.vo';
import { OrderType } from '../../src/domain/value-objects/order-type.vo';

describe('Value Objects', () => {
  describe('Money', () => {
    it('creates money from cents and formats correctly', () => {
      const price = Money.fromCents(125050);
      expect(price.getCents()).toBe(125050);
      expect(price.toDecimal()).toBe(1250.5);
    });

    it('performs arithmetic without floating point issues', () => {
      const a = Money.fromDecimal(0.1);
      const b = Money.fromDecimal(0.2);
      const sum = a.add(b);
      expect(sum.toDecimal()).toBe(0.3);
      expect(sum.getCents()).toBe(30);
    });

    it('multiplies correctly', () => {
      const unit = Money.fromDecimal(150);
      const total = unit.multiply(3);
      expect(total.toDecimal()).toBe(450);
    });
  });

  describe('Barcode', () => {
    it('generates internal barcode format RD<YY><000000000>', () => {
      const barcode = Barcode.generateInternal(42, 2026);
      expect(barcode.getValue()).toBe('RD26000000042');
      expect(barcode.isInternal()).toBe(true);
    });

    it('handles null barcodes gracefully', () => {
      expect(Barcode.create(null)).toBeNull();
      expect(Barcode.create('')).toBeNull();
    });
  });

  describe('PaymentMethod', () => {
    it('normalizes valid payment codes', () => {
      const method = PaymentMethod.create('cash');
      expect(method?.getCode()).toBe('cash');
      expect(method?.getLabel()).toBe('EFECTIVO');
    });

    it('throws error for invalid payment methods', () => {
      expect(() => PaymentMethod.create('bitcoin')).toThrow();
    });
  });

  describe('OrderType', () => {
    it('defaults to minor when null', () => {
      const type = OrderType.create(null);
      expect(type.isMinor()).toBe(true);
      expect(type.isMajor()).toBe(false);
    });

    it('creates major order type', () => {
      const type = OrderType.create('major');
      expect(type.isMajor()).toBe(true);
    });
  });
});

