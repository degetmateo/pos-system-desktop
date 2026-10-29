import { Order } from '../../../domain/models/order.entity';
import { OrderItem } from '../../../domain/models/order-item.entity';
import { Customer } from '../../../domain/models/customer.entity';
import { Money } from '../../../domain/value-objects/money.vo';

export interface OrderRow {
  id: string;
  number: number;
  customer_id: string | null;
  total_price: number;
  type: string;
  status: string;
  payment_method: string | null;
  advancement: number;
  created_at: string;
  updated_at: string;
  customer_name?: string | null;
  customer_cuil?: string | null;
}

export interface ItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  discount_price?: number | null;
  created_at: string;
  updated_at: string;
}

export class SqliteOrderMapper {
  public static toEntity(row: OrderRow, items: OrderItem[]): Order {
    let customer: Customer | null = null;
    if (row.customer_id) {
      customer = new Customer({
        id: row.customer_id,
        name: row.customer_name || 'Desconocido',
        cuil: row.customer_cuil,
      });
    }

    return new Order({
      id: row.id,
      number: row.number,
      customerId: row.customer_id,
      customer,
      paymentMethod: row.payment_method,
      type: row.type,
      status: row.status,
      advancement: Money.fromCents(row.advancement || 0),
      items,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public static toItemEntity(row: ItemRow): OrderItem {
    return new OrderItem({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      price: Money.fromCents(row.price),
      discountPrice: row.discount_price ? Money.fromCents(row.discount_price) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}

