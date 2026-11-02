import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SqliteProductRepository } from '../../src/infrastructure/repositories/sqlite-product.repository';
import { SqliteCustomerRepository } from '../../src/infrastructure/repositories/sqlite-customer.repository';
import { SqliteOrderRepository } from '../../src/infrastructure/repositories/sqlite-order.repository';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { Product } from '../../src/domain/models/product.entity';
import { Customer } from '../../src/domain/models/customer.entity';
import { Order } from '../../src/domain/models/order.entity';
import { OrderItem } from '../../src/domain/models/order-item.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { OrderType } from '../../src/domain/value-objects/order-type.vo';
import { PaymentMethod } from '../../src/domain/value-objects/payment-method.vo';

describe('Multi-Term Independent Search and Relevance Ranking', () => {
  let db: Database.Database;
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

  it('ranks products with more matching independent words higher', async () => {
    // 1. Setup products with different matching terms
    // Target query: "cuaderno gloria rayado"
    const p1 = new Product({
      id: 'prod-1',
      name: 'Cuaderno Gloria Rayado Tapa Dura', // matches 3 words
      priceMajor: Money.fromCents(1000),
      priceMinor: Money.fromCents(1200),
    });
    const p2 = new Product({
      id: 'prod-2',
      name: 'Cuaderno Rivadavia Rayado', // matches 2 words ("cuaderno", "rayado")
      priceMajor: Money.fromCents(1000),
      priceMinor: Money.fromCents(1200),
    });
    const p3 = new Product({
      id: 'prod-3',
      name: 'Lapicera Gloria Azul', // matches 1 word ("gloria")
      priceMajor: Money.fromCents(300),
      priceMinor: Money.fromCents(350),
    });
    const p4 = new Product({
      id: 'prod-4',
      name: 'Goma de Borrar Blanca', // matches 0 words
      priceMajor: Money.fromCents(100),
      priceMinor: Money.fromCents(150),
    });

    await productRepo.save(p1);
    await productRepo.save(p2);
    await productRepo.save(p3);
    await productRepo.save(p4);

    const results = await productRepo.findAll({ search: 'cuaderno gloria rayado' });

    expect(results).toHaveLength(3);
    // Highest match (3 words) must be first
    expect(results[0].id).toBe('prod-1');
    // Second match (2 words) must be second
    expect(results[1].id).toBe('prod-2');
    // Third match (1 word) must be third
    expect(results[2].id).toBe('prod-3');
    // p4 must not appear
    expect(results.some((r) => r.id === 'prod-4')).toBe(false);
  });

  it('ranks customers by relevance when searching across name or address words', async () => {
    const c1 = new Customer({
      id: 'c-1',
      name: 'Juan Perez Libreria Central', // matches "juan", "libreria"
    });
    const c2 = new Customer({
      id: 'c-2',
      name: 'Juan Carlos Gomez', // matches "juan"
    });
    const c3 = new Customer({
      id: 'c-3',
      name: 'Maria Sanchez', // matches none
    });

    await customerRepo.save(c1);
    await customerRepo.save(c2);
    await customerRepo.save(c3);

    const results = await customerRepo.findAll({ search: 'juan libreria' });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('c-1');
    expect(results[1].id).toBe('c-2');
  });

  it('ranks orders matching customer name words and order number', async () => {
    const cust = new Customer({ id: 'c-order-1', name: 'Estela Maria Belgrano' });
    await customerRepo.save(cust);

    const order1 = new Order({
      id: 'ord-1',
      number: 101,
      customerId: cust.id,
      type: OrderType.create('minor'),
      paymentMethod: PaymentMethod.create('cash'),
      items: [new OrderItem({ id: 'it-1', productId: 'p-1', productName: 'Articulo', quantity: 1, price: Money.fromCents(500) })],
    });
    await orderRepo.save(order1);

    const results = await orderRepo.findAll({ search: 'estela belgrano' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('ord-1');
  });
});
