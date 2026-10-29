import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderType } from '../value-objects/order-type.vo';
import { PaymentMethod } from '../value-objects/payment-method.vo';
import { Money } from '../value-objects/money.vo';

export interface OrderProps {
  id: string;
  number: number;
  customerId?: string | null;
  customer?: Customer | null;
  paymentMethod?: PaymentMethod | string | null;
  type?: OrderType | string;
  status?: string;
  advancement?: Money;
  items?: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  public readonly id: string;
  public readonly number: number;
  public customerId: string | null;
  public customer: Customer | null;
  public paymentMethod: PaymentMethod | null;
  public type: OrderType;
  public status: string;
  public advancement: Money;
  private readonly items: OrderItem[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.number = props.number;
    this.customerId = props.customerId || null;
    this.customer = props.customer || null;
    this.paymentMethod =
      props.paymentMethod instanceof PaymentMethod
        ? props.paymentMethod
        : PaymentMethod.create(props.paymentMethod);
    this.type = props.type instanceof OrderType ? props.type : OrderType.create(props.type);
    this.status = props.status || 'completed';
    this.advancement = props.advancement || Money.zero();
    this.items = props.items || [];
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public getItems(): readonly OrderItem[] {
    return [...this.items];
  }

  public addItem(item: OrderItem): void {
    this.items.push(item);
    this.updatedAt = new Date();
  }

  public getTotalPrice(): Money {
    return this.items.reduce((total, item) => total.add(item.getSubtotal()), Money.zero());
  }

  public getFinalDueAmount(): Money {
    const total = this.getTotalPrice();
    return total.isGreaterThan(this.advancement) ? total.subtract(this.advancement) : Money.zero();
  }

  public hasDiscounts(): boolean {
    return this.items.some((item) => item.hasDiscount());
  }

  public toJSON(): object {
    const totalCents = this.getTotalPrice().getCents();
    const pmCode = this.paymentMethod ? this.paymentMethod.getCode() : null;
    return {
      id: this.id,
      number: this.number,
      customerId: this.customerId,
      customer_id: this.customerId,
      customer: this.customer,
      paymentMethod: pmCode,
      payment_method: pmCode,
      type: this.type.getCode(),
      status: this.status,
      advancement: this.advancement.getCents(),
      totalPrice: totalCents,
      total_price: totalCents,
      items: this.items.map((i) => (typeof i.toJSON === 'function' ? i.toJSON() : i)),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

