import { Money } from '../value-objects/money.vo';
import { MinorPrice } from '../models/minor-price.entity';
import { IPricingStrategy, PriceCalculationResult } from './pricing-strategy.interface';

export class MinorPricingStrategy implements IPricingStrategy {
  calculate(
    _basePriceMajor: Money,
    basePriceMinor: Money,
    quantity: number,
    rules: MinorPrice[]
  ): PriceCalculationResult {
    // Ordenar reglas por condición de cantidad de mayor a menor para aplicar el mejor escalón
    const sorted = [...rules].sort((a, b) => b.conditionValue - a.conditionValue);
    const applicableRule = sorted.find((r) => quantity >= r.conditionValue);

    if (applicableRule) {
      const subtotal = applicableRule.priceValue.multiply(quantity);
      return {
        unitPrice: basePriceMinor,
        discountPrice: applicableRule.priceValue,
        subtotal,
        hasDiscount: true,
      };
    }

    return {
      unitPrice: basePriceMinor,
      discountPrice: null,
      subtotal: basePriceMinor.multiply(quantity),
      hasDiscount: false,
    };
  }
}

