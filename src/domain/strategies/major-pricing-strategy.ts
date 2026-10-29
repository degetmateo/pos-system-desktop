import { Money } from '../value-objects/money.vo';
import { MinorPrice } from '../models/minor-price.entity';
import { IPricingStrategy, PriceCalculationResult } from './pricing-strategy.interface';

export class MajorPricingStrategy implements IPricingStrategy {
  calculate(
    basePriceMajor: Money,
    _basePriceMinor: Money,
    quantity: number,
    _rules: MinorPrice[]
  ): PriceCalculationResult {
    const subtotal = basePriceMajor.multiply(quantity);
    return {
      unitPrice: basePriceMajor,
      discountPrice: null,
      subtotal,
      hasDiscount: false,
    };
  }
}

