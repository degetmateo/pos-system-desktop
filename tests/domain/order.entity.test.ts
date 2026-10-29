import { describe, it, expect } from 'vitest';
import { Order } from '../../src/domain/models/order.entity';
import { OrderItem } from '../../src/domain/models/order-item.entity';
import { Money } from '../../src/domain/value-objects/money.vo';

describe('Order Entity (Aggregate Root)', () => {
  it('calculates total price and final due amount considering advancement', () => {
    const order = new Order({
      id: 'o1',
      number: 100,
      advancement: Money.fromDecimal(500),
    });

    const item1 = new OrderItem({
      id: 'i1',
      orderId: 'o1',
      productId: 'p1',
      productName: 'Cuaderno A4',
      quantity: 2,
      price: Money.fromDecimal(600),
    });

    const item2 = new OrderItem({
      id: 'i2',
      orderId: 'o1',
      productId: 'p2',
      productName: 'Lapicera Azul',
      quantity: 10,
      price: Money.fromDecimal(100),
      discountPrice: Money.fromDecimal(80), // discounted
    });

    order.addItem(item1);
    order.addItem(item2);

    // item1: 2 * 600 = 1200
    // item2: 10 * 80 = 800
    // Total = 2000
    expect(order.getTotalPrice().toDecimal()).toBe(2000);
    expect(order.hasDiscounts()).toBe(true);
    // Final = 2000 - 500 = 1500
    expect(order.getFinalDueAmount().toDecimal()).toBe(1500);
  });
});

