import { CartItem } from './pos.types';
import { ProductDto } from '../../types/api.types';

export class PosCartCalculator {
  public static calculateItemPrice(product: ProductDto, quantity: number, orderType: 'minor' | 'major'): { basePrice: number; effectivePrice: number } {
    const pMaj = product.priceMajor ?? (product as any).price_major ?? 0;
    const pMin = product.priceMinor ?? (product as any).price_minor ?? 0;
    if (orderType === 'major') {
      return { basePrice: pMaj, effectivePrice: pMaj };
    }

    const basePrice = pMin;
    let effectivePrice = basePrice;
    const discounts = product.minorPrices || (product as any).minor_prices || [];

    // Check discount tiers for minor sales
    if (discounts.length > 0) {
      const sorted = [...discounts].sort((a: any, b: any) => {
        const cA = a.conditionValue ?? a.condition_value ?? 0;
        const cB = b.conditionValue ?? b.condition_value ?? 0;
        return cB - cA;
      });
      for (const tier of sorted as any[]) {
        const cond = tier.conditionValue ?? tier.condition_value ?? 0;
        const pVal = tier.priceValue ?? tier.price_value ?? 0;
        if (quantity >= cond && pVal > 0) {
          effectivePrice = pVal;
          break;
        }
      }
    }

    return { basePrice, effectivePrice };
  }

  public static recalculateCart(items: CartItem[], orderType: 'minor' | 'major'): CartItem[] {
    return items.map((it) => {
      const { basePrice, effectivePrice } = this.calculateItemPrice(it.product, it.quantity, orderType);
      return { ...it, basePrice, effectivePrice };
    });
  }

  public static getTotals(items: CartItem[]): { total: number; totalDiscount: number; itemCount: number } {
    let total = 0;
    let totalDiscount = 0;
    let itemCount = 0;

    for (const it of items) {
      const lineTotal = it.effectivePrice * it.quantity;
      const baseLineTotal = it.basePrice * it.quantity;
      total += lineTotal;
      totalDiscount += Math.max(0, baseLineTotal - lineTotal);
      itemCount += it.quantity;
    }

    return { total, totalDiscount, itemCount };
  }
}

