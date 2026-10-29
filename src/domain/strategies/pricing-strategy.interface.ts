import { Money } from '../value-objects/money.vo';
import { MinorPrice } from '../models/minor-price.entity';

export interface PriceCalculationResult {
  unitPrice: Money;
  discountPrice: Money | null;
  subtotal: Money;
  hasDiscount: boolean;
}

export interface IPricingStrategy {
  calculate(
    basePriceMajor: Money,
    basePriceMinor: Money,
    quantity: number,
    rules: MinorPrice[]
  ): PriceCalculationResult;
}

