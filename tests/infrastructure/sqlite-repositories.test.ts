import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteProductRepository } from '../../src/infrastructure/repositories/sqlite-product.repository';
import { SqliteCustomerRepository } from '../../src/infrastructure/repositories/sqlite-customer.repository';
import { SqliteOrderRepository } from '../../src/infrastructure/repositories/sqlite-order.repository';
import { Product } from '../../src/domain/models/product.entity';
import { Customer } from '../../src/domain/models/customer.entity';
import { Order } from '../../src/domain/models/order.entity';
import { OrderItem } from '../../src/domain/models/order-item.entity';
import { Money } from '../../src/domain/value-objects/money.vo';

describe('SQLite Repositories (Integration)', () => {
  let db: DatabaseInstance;
  let productRepo: SqliteProductRepository;
  let customerRepo: SqliteCustomerRepository;
  let orderRepo: SqliteOrderRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    productRepo = new SqliteProductRepository(db);
    customerRepo = new SqliteCustomerRepository(db);
    orderRepo = new SqliteOrderRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('saves and retrieves products with search filtering', async () => {
    const product = new Product({
      id: 'p-1',
      name: 'Cuaderno Universitario Rayado',
      priceMajor: Money.fromDecimal(1200),
      priceMinor: Money.fromDecimal(1500),
      stock: 25,
    });
    await productRepo.save(product);

    const found = await productRepo.findById('p-1');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('CUADERNO UNIVERSITARIO RAYADO');
    expect(found?.priceMinor.toDecimal()).toBe(1500);

    // Multi-token search
    const searchResults = await productRepo.findAll({ name: 'cuaderno rayado' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].id).toBe('p-1');
  });

  it('saves and retrieves orders with items and customer relation', async () => {
    const customer = new Customer({
      id: 'c-1',
      name: 'Empresa Demo SRL',
      cuil: '30-12345678-9',
    });
    await customerRepo.save(customer);

    const orderNumber = await orderRepo.getNextOrderNumber();
    expect(orderNumber).toBe(1);

    const order = new Order({
      id: 'o-1',
      number: orderNumber,
      customerId: 'c-1',
      type: 'major',
      paymentMethod: 'transfer',
      advancement: Money.fromDecimal(500),
    });

    order.addItem(
      new OrderItem({
        id: 'oi-1',
        orderId: 'o-1',
        productId: 'p-1',
        productName: 'Cuaderno Universitario',
        quantity: 5,
        price: Money.fromDecimal(1000),
      })
    );

    await orderRepo.save(order);

    const retrieved = await orderRepo.findById('o-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.customer?.name).toBe('EMPRESA DEMO SRL');
    expect(retrieved?.getTotalPrice().toDecimal()).toBe(5000);
    expect(retrieved?.getFinalDueAmount().toDecimal()).toBe(4500);
  });

  it('counts and paginates products and customers accurately', async () => {
    for (let i = 1; i <= 25; i++) {
      await productRepo.save(new Product({
        id: `p-${i}`,
        name: `Producto Test ${i}`,
        priceMajor: Money.fromCents(1000),
        priceMinor: Money.fromCents(1500),
      }));
    }
    const count = await productRepo.count();
    expect(count).toBe(25);

    const page1 = await productRepo.findAll({ limit: 10, offset: 0 });
    const page2 = await productRepo.findAll({ limit: 10, offset: 10 });
    const page3 = await productRepo.findAll({ limit: 10, offset: 20 });
    expect(page1.length).toBe(10);
    expect(page2.length).toBe(10);
    expect(page3.length).toBe(5);
  });
});

