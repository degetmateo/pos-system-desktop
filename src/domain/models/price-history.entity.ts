import { v7 as uuidv7 } from 'uuid';

export interface PriceHistoryProps {
  id?: string;
  productId: string;
  priceType: 'minor' | 'major';
  oldPrice: number; // in cents
  newPrice: number; // in cents
  difference?: number; // in cents
  percentageDiff?: number;
  createdAt?: Date;
}

export class PriceHistory {
  public readonly id: string;
  public readonly productId: string;
  public readonly priceType: 'minor' | 'major';
  public readonly oldPrice: number;
  public readonly newPrice: number;
  public readonly difference: number;
  public readonly percentageDiff: number;
  public readonly createdAt: Date;

  constructor(props: PriceHistoryProps) {
    this.id = props.id || uuidv7();
    this.productId = props.productId;
    this.priceType = props.priceType;
    this.oldPrice = props.oldPrice;
    this.newPrice = props.newPrice;
    this.difference = props.difference ?? (props.newPrice - props.oldPrice);
    this.percentageDiff =
      props.percentageDiff ?? PriceHistory.calculatePercentage(props.oldPrice, props.newPrice);
    this.createdAt = props.createdAt || new Date();
  }

  public static calculatePercentage(oldPrice: number, newPrice: number): number {
    if (oldPrice === 0) {
      return newPrice > 0 ? 100 : 0;
    }
    const ratio = ((newPrice - oldPrice) / oldPrice) * 100;
    return Math.round(ratio * 100) / 100;
  }

  public toJSON(): object {
    return {
      id: this.id,
      productId: this.productId,
      product_id: this.productId,
      priceType: this.priceType,
      price_type: this.priceType,
      oldPrice: this.oldPrice,
      old_price: this.oldPrice,
      newPrice: this.newPrice,
      new_price: this.newPrice,
      difference: this.difference,
      percentageDiff: this.percentageDiff,
      percentage_diff: this.percentageDiff,
      createdAt: this.createdAt.toISOString(),
      created_at: this.createdAt.toISOString(),
    };
  }
}

