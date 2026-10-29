import { Money } from '../value-objects/money.vo';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface MinorPriceProps {
  id: string;
  productId: string;
  condition: string;
  conditionValue: number;
  priceValue: Money;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MinorPrice {
  public readonly id: string;
  public readonly productId: string;
  public readonly condition: string;
  public readonly conditionValue: number;
  public readonly priceValue: Money;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: MinorPriceProps) {
    if (props.conditionValue <= 0) {
      throw new InvalidArgumentError('La condición de cantidad debe ser mayor a 0.');
    }
    if (props.priceValue.isLessThan(Money.zero())) {
      throw new InvalidArgumentError('El precio de descuento no puede ser negativo.');
    }
    this.id = props.id;
    this.productId = props.productId;
    this.condition = props.condition || 'discount';
    this.conditionValue = props.conditionValue;
    this.priceValue = props.priceValue;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public toJSON(): object {
    return {
      id: this.id,
      productId: this.productId,
      product_id: this.productId,
      condition: this.condition,
      conditionValue: this.conditionValue,
      condition_value: this.conditionValue,
      priceValue: this.priceValue.getCents(),
      price_value: this.priceValue.getCents(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

