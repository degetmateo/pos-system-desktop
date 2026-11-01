import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../../src/application/services/order.service';
import { IOrderRepository } from '../../src/application/ports/order-repository.port';
import { IProductRepository } from '../../src/application/ports/product-repository.port';
import { ICustomerRepository } from '../../src/application/ports/customer-repository.port';
import { Product } from '../../src/domain/models/product.entity';
import { MinorPrice } from '../../src/domain/models/minor-price.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { Order } from '../../src/domain/models/order.entity';

describe('OrderService', () => {
  let orderService: OrderService;
  let fakeOrders: Order[];
  let fakeProducts: Map<string, Product>;
  let orderNumberCounter: number;

  beforeEach(() => {
    fakeOrders = [];
    fakeProducts = new Map();
    orderNumberCounter = 100;

    const mockOrderRepo: IOrderRepository = {
      findById: async (id) => fakeOrders.find((o) => o.id === id) || null,
      findAll: async () => fakeOrders,
      save: async (order) => {
        const idx = fakeOrders.findIndex((o) => o.id === order.id);
        if (idx >= 0) fakeOrders[idx] = order;
        else fakeOrders.push(order);
      },
      getNextOrderNumber: async () => ++orderNumberCounter,
    };

    const mockProductRepo: IProductRepository = {
      findById: async (id) => fakeProducts.get(id) || null,
      findByBarcode: async () => null,
      findAll: async () => Array.from(fakeProducts.values()),
      save: async (p) => {
        fakeProducts.set(p.id, p);
      },
      saveMany: async () => {},
      delete: async () => {},
      getUnsynchronized: async () => [],
      markSynchronized: async () => {},
      resetSynchronization: async () => {},
    };

    const mockCustomerRepo: ICustomerRepository = {
      findById: async () => null,
      findAll: async () => [],
      save: async () => {},
      delete: async () => {},
    };

    orderService = new OrderService(mockOrderRepo, mockProductRepo, mockCustomerRepo);

    // Setup a test product
    const product = new Product({
      id: 'prod-1',
      name: 'Lapicera Roller',
      priceMajor: Money.fromDecimal(40),
      priceMinor: Money.fromDecimal(50),
      minorPrices: [
        new MinorPrice({
          id: 'mp-1',
          productId: 'prod-1',
          condition: 'discount',
          conditionValue: 5,
          priceValue: Money.fromDecimal(45),
        }),
      ],
    });
    fakeProducts.set('prod-1', product);
  });

  it('creates an order with discount on existing product', async () => {
    const order = await orderService.createOrder({
      type: 'minor',
      payment_method: 'cash',
      products: [{ product_id: 'prod-1', quantity: 6 }],
    });

    expect(order.number).toBe(101);
    expect(order.getItems().length).toBe(1);
    const item = order.getItems()[0];
    expect(item.quantity).toBe(6);
    expect(item.discountPrice?.toDecimal()).toBe(45);
    // 6 * 45 = 270
    expect(order.getTotalPrice().toDecimal()).toBe(270);
  });

  it('creates an order with custom price and updates price in DB when requested', async () => {
    const order = await orderService.createOrder({
      type: 'minor',
      payment_method: 'cash',
      products: [{ product_id: 'prod-1', quantity: 2, unit_price: 65, update_price_in_db: true }],
    });

    expect(order.getTotalPrice().toDecimal()).toBe(130);
    const updatedProd = fakeProducts.get('prod-1');
    expect(updatedProd?.priceMinor.toDecimal()).toBe(65);
  });

  it('creates an order with ad-hoc product and saves it to DB when save_to_db is true', async () => {
    const order = await orderService.createOrder({
      type: 'minor',
      payment_method: 'transfer',
      products: [{ name: 'Marcador Flúo', quantity: 4, unit_price: 300, save_to_db: true }],
    });

    expect(order.getItems().length).toBe(1);
    expect(order.getItems()[0].productName).toBe('MARCADOR FLÚO');
    expect(order.getTotalPrice().toDecimal()).toBe(1200);

    const savedProd = Array.from(fakeProducts.values()).find((p) => p.name === 'MARCADOR FLÚO');
    expect(savedProd).toBeDefined();
    expect(savedProd?.priceMinor.toDecimal()).toBe(300);
  });
});
