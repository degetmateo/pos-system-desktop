import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteProductRepository } from '../../src/infrastructure/repositories/sqlite-product.repository';
import { SqliteCustomerRepository } from '../../src/infrastructure/repositories/sqlite-customer.repository';
import { SqliteOrderRepository } from '../../src/infrastructure/repositories/sqlite-order.repository';
import { SqliteProviderRepository } from '../../src/infrastructure/repositories/sqlite-provider.repository';
import { SqlitePriceHistoryRepository } from '../../src/infrastructure/repositories/sqlite-price-history.repository';
import { SqliteMetadataRepository } from '../../src/infrastructure/repositories/sqlite-metadata.repository';
import { BarcodeService } from '../../src/application/services/barcode.service';
import { ProductService } from '../../src/application/services/product.service';
import { OrderService } from '../../src/application/services/order.service';
import { CustomerService } from '../../src/application/services/customer.service';
import { ProviderService } from '../../src/application/services/provider.service';
import { ExceljsAdapter } from '../../src/infrastructure/adapters/exceljs.adapter';
import { PdfMakeAdapter } from '../../src/infrastructure/adapters/pdfmake.adapter';
import { BackupFacade } from '../../src/infrastructure/maintenance/backup.facade';
import { ProductController } from '../../src/presentation/controllers/product.controller';
import { OrderController } from '../../src/presentation/controllers/order.controller';
import { CustomerController } from '../../src/presentation/controllers/customer.controller';
import { ProviderController } from '../../src/presentation/controllers/provider.controller';
import { BarcodeController } from '../../src/presentation/controllers/barcode.controller';
import { OptionsController } from '../../src/presentation/controllers/options.controller';
import { InfoController } from '../../src/presentation/controllers/info.controller';
import { ListController } from '../../src/presentation/controllers/list.controller';
import { ExpressApp } from '../../src/presentation/server/express.app';

describe('Express API Endpoints (Integration)', () => {
  let db: DatabaseInstance;
  let expressApp: ExpressApp;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();

    const metadataRepo = new SqliteMetadataRepository(db);
    const productRepo = new SqliteProductRepository(db);
    const customerRepo = new SqliteCustomerRepository(db);
    const orderRepo = new SqliteOrderRepository(db);
    const providerRepo = new SqliteProviderRepository(db);

    const barcodeService = new BarcodeService(metadataRepo);
    const priceHistoryRepo = new SqlitePriceHistoryRepository(db);
    const productService = new ProductService(productRepo, barcodeService, priceHistoryRepo);
    const orderService = new OrderService(orderRepo, productRepo, customerRepo);
    const customerService = new CustomerService(customerRepo);
    const providerService = new ProviderService(providerRepo);

    const excelAdapter = new ExceljsAdapter();
    const pdfAdapter = new PdfMakeAdapter();
    const backupFacade = new BackupFacade(db, ':memory:');

    const publicPath = path.resolve(process.cwd(), 'dist/public');
    expressApp = new ExpressApp({
      productController: new ProductController(productService),
      orderController: new OrderController(orderService, pdfAdapter),
      customerController: new CustomerController(customerService),
      providerController: new ProviderController(providerService),
      barcodeController: new BarcodeController(barcodeService),
      optionsController: new OptionsController(backupFacade, 'data.db'),
      infoController: new InfoController(),
      listController: new ListController(productService, excelAdapter),
    }, publicPath);
  });

  afterEach(() => {
    db.close();
  });

  it('serves SPA index.html and static assets at root', async () => {
    const res = await request(expressApp.app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Rubén Darío POS');
    expect(res.text).toContain('/assets/index-');

    const match = res.text.match(/src="(\/assets\/index-[^"]+\.js)"/);
    expect(match).not.toBeNull();
    const jsRes = await request(expressApp.app).get(match![1]);
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers['content-type']).toContain('javascript');
  });

  it('generates internal barcode via /api/barcodes/new', async () => {
    const res = await request(expressApp.app).get('/api/barcodes/new');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatch(/^RD\d{11}$/);
  });

  it('creates and lists products via /api/products', async () => {
    const createRes = await request(expressApp.app)
      .post('/api/products')
      .send({
        name: 'Tijera Escolar',
        minor_price: 350.5,
        major_price: 280.0,
        stock: 15,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('TIJERA ESCOLAR');

    const listRes = await request(expressApp.app).get('/api/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].stock).toBe(15);
  });

  it('creates customer and processes order', async () => {
    // 1. Create product
    const prodRes = await request(expressApp.app).post('/api/products').send({
      name: 'Goma de Borrar',
      minor_price: 100,
      major_price: 80,
      stock: 50,
      minor_price_condition_1: 5,
      minor_price_value_1: 85,
    });
    const productId = prodRes.body.data.id;

    // 2. Create customer
    const custRes = await request(expressApp.app).post('/api/customers').send({
      name: 'Juan Perez',
      email: 'juan@test.com',
    });
    const customerId = custRes.body.data.id;

    // 3. Create order with quantity >= 5 to trigger discount
    const orderRes = await request(expressApp.app)
      .post('/api/orders')
      .send({
        customer_id: customerId,
        type: 'minor',
        payment_method: 'cash',
        products: [{ product_id: productId, quantity: 5 }],
      });

    expect(orderRes.status).toBe(201);
    // 5 * 85 = 42500 cents (425)
    const itemDiscount = orderRes.body.data.items[0].discountPrice;
    const discountCents = typeof itemDiscount === 'object' && itemDiscount !== null ? itemDiscount.cents : itemDiscount;
    expect(discountCents).toBe(8500);

    // 4. Test receipt HTML generation
    const receiptRes = await request(expressApp.app).get(
      `/api/orders/receipt/${orderRes.body.data.id}?action=print`
    );
    expect(receiptRes.status).toBe(200);
    expect(receiptRes.text).toContain('LIBRERÍA RUBÉN DARÍO');
    expect(receiptRes.text).toContain('JUAN PEREZ');
    expect(receiptRes.text).toContain('OGRO.CASO.RUINA');

    // 5. Test real PDF generation
    const pdfRes = await request(expressApp.app).get(
      `/api/orders/receipt/${orderRes.body.data.id}?action=save`
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain('.pdf');
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF');
  });
});

