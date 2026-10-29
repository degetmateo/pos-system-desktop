import { Money } from '../value-objects/money.vo';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: Money;
  discountPrice?: Money | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrderItem {
  public readonly id: string;
  public readonly orderId: string;
  public readonly productId: string;
  public readonly productName: string;
  public readonly quantity: number;
  public readonly price: Money;
  public readonly discountPrice: Money | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: OrderItemProps) {
    if (props.quantity <= 0) {
      throw new InvalidArgumentError('La cantidad del producto debe ser mayor a 0.');
    }
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.price = props.price;
    this.discountPrice = props.discountPrice || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public getEffectiveUnitPrice(): Money {
    return this.discountPrice ?? this.price;
  }

  public getSubtotal(): Money {
    return this.getEffectiveUnitPrice().multiply(this.quantity);
  }

  public hasDiscount(): boolean {
    return this.discountPrice !== null;
  }

  public toJSON(): object {
    const discCents = this.discountPrice ? this.discountPrice.getCents() : null;
    return {
      id: this.id,
      orderId: this.orderId,
      order_id: this.orderId,
      productId: this.productId,
      product_id: this.productId,
      productName: this.productName,
      product_name: this.productName,
      quantity: this.quantity,
      price: this.price.getCents(),
      unitPrice: this.price.getCents(),
      unit_price: this.price.getCents(),
      discountPrice: discCents,
      discount_price: discCents,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

