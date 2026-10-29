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

describe('Advanced Filters, Sorting and LAN IP Detection', () => {
  let db: DatabaseInstance;
  let expressApp: ExpressApp;
  let infoController: InfoController;

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

    infoController = new InfoController(4000);

    const publicPath = path.resolve(process.cwd(), 'dist/public');
    expressApp = new ExpressApp({
      productController: new ProductController(productService),
      orderController: new OrderController(orderService, pdfAdapter),
      customerController: new CustomerController(customerService),
      providerController: new ProviderController(providerService),
      barcodeController: new BarcodeController(barcodeService),
      optionsController: new OptionsController(backupFacade, 'data.db'),
      infoController,
      listController: new ListController(productService, excelAdapter),
    }, publicPath);
  });

  afterEach(() => {
    db.close();
  });

  describe('LAN IP and Network Info Detection', () => {
    it('returns candidate interfaces prioritizing real LAN over virtual ones', async () => {
      const res = await request(expressApp.app).get('/api/info');
      expect(res.status).toBe(200);
      expect(res.body.ip).toBeDefined();
      expect(res.body.interfaces).toBeInstanceOf(Array);
      expect(res.body.interfaces.length).toBeGreaterThanOrEqual(1);

      // The selected default interface should not be Radmin or VirtualBox 192.168.56.x
      const defaultIface = res.body.interfaces.find((i: any) => i.isDefault);
      expect(defaultIface).toBeDefined();
      expect(defaultIface.ip).not.toMatch(/^26\./);
      expect(defaultIface.ip).not.toMatch(/^192\.168\.56\./);
    });

    it('handles firewall configuration endpoint', async () => {
      const res = await request(expressApp.app).post('/api/info/firewall');
      expect([200, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
      expect(typeof res.body.success).toBe('boolean');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Product Advanced Filters & Sorting', () => {
    beforeEach(async () => {
      // Seed products
      await request(expressApp.app).post('/api/products').send({
        name: 'Cuaderno A4',
        minor_price: 1500,
        major_price: 1200,
        stock: 20,
      });
      await request(expressApp.app).post('/api/products').send({
        name: 'Lapicera Azul',
        minor_price: 300,
        major_price: 200,
        stock: 3, // low stock
      });
      await request(expressApp.app).post('/api/products').send({
        name: 'Regla 30cm',
        minor_price: 500,
        major_price: 400,
        stock: 0, // out of stock
      });
    });

    it('filters products by stockStatus: low_stock and out_of_stock', async () => {
      const lowStockRes = await request(expressApp.app).get('/api/products?stock_status=low_stock');
      expect(lowStockRes.status).toBe(200);
      expect(lowStockRes.body.data.length).toBe(1);
      expect(lowStockRes.body.data[0].name).toBe('LAPICERA AZUL');

      const outOfStockRes = await request(expressApp.app).get('/api/products?stock_status=out_of_stock');
      expect(outOfStockRes.status).toBe(200);
      expect(outOfStockRes.body.data.length).toBe(1);
      expect(outOfStockRes.body.data[0].name).toBe('REGLA 30CM');
    });

    it('sorts products by price ascending and descending', async () => {
      const ascRes = await request(expressApp.app).get('/api/products?sorting=price_asc');
      expect(ascRes.status).toBe(200);
      expect(ascRes.body.data[0].name).toBe('LAPICERA AZUL'); // 300
      expect(ascRes.body.data[2].name).toBe('CUADERNO A4'); // 1500

      const descRes = await request(expressApp.app).get('/api/products?sorting=price_desc');
      expect(descRes.status).toBe(200);
      expect(descRes.body.data[0].name).toBe('CUADERNO A4'); // 1500
      expect(descRes.body.data[2].name).toBe('LAPICERA AZUL'); // 300
    });

    it('tracks price history changes and sorts by price_updated_at', async () => {
      // Get Lapicera ID
      const listRes = await request(expressApp.app).get('/api/products?search=Lapicera');
      const lapicera = listRes.body.data[0];
      expect(lapicera).toBeDefined();

      // Update Lapicera price from 300 to 450 (minor) and 200 to 250 (major)
      const updateRes = await request(expressApp.app)
        .post(`/api/products/update/${lapicera.id}`)
        .send({
          ...lapicera,
          minor_price: 450,
          major_price: 250,
        });
      expect(updateRes.status).toBe(200);

      // Verify price history endpoint returns history
      const historyRes = await request(expressApp.app).get(`/api/products/${lapicera.id}/price-history`);
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBe(2);

      const minorHist = historyRes.body.data.find((h: any) => h.priceType === 'minor');
      expect(minorHist).toBeDefined();
      expect(minorHist.oldPrice).toBe(30000);
      expect(minorHist.newPrice).toBe(45000);
      expect(minorHist.difference).toBe(15000);
      expect(minorHist.percentageDiff).toBe(50); // +50%

      // Verify sorting by price_updated_at_desc places recently updated Lapicera first
      const sortRes = await request(expressApp.app).get('/api/products?sorting=price_updated_at_desc');
      expect(sortRes.status).toBe(200);
      expect(sortRes.body.data[0].id).toBe(lapicera.id);
    });
  });

  describe('Customer Advanced Filters & Sorting', () => {
    beforeEach(async () => {
      await request(expressApp.app).post('/api/customers').send({
        name: 'Carlos Gomez',
        cuil: '20-11111111-2',
        phone: '11223344',
        type: 'minor',
      });
      await request(expressApp.app).post('/api/customers').send({
        name: 'Ana Martinez',
        cuil: '27-99999999-4',
        phone: '',
        type: 'major',
      });
    });

    it('searches customer across name, cuil or phone', async () => {
      const searchRes = await request(expressApp.app).get('/api/customers?search=11223344');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBe(1);
      expect(searchRes.body.data[0].name).toBe('CARLOS GOMEZ');

      const cuilRes = await request(expressApp.app).get('/api/customers?search=99999999');
      expect(cuilRes.status).toBe(200);
      expect(cuilRes.body.data.length).toBe(1);
      expect(cuilRes.body.data[0].name).toBe('ANA MARTINEZ');
    });

    it('filters customer by type and sorts by name_desc', async () => {
      const typeRes = await request(expressApp.app).get('/api/customers?type=major');
      expect(typeRes.status).toBe(200);
      expect(typeRes.body.data.length).toBe(1);
      expect(typeRes.body.data[0].name).toBe('ANA MARTINEZ');

      const sortRes = await request(expressApp.app).get('/api/customers?sorting=name_desc');
      expect(sortRes.status).toBe(200);
      expect(sortRes.body.data[0].name).toBe('CARLOS GOMEZ');
      expect(sortRes.body.data[1].name).toBe('ANA MARTINEZ');
    });
  });

  describe('Order Advanced Filters & Sorting', () => {
    beforeEach(async () => {
      // 1. Create a product
      const pRes = await request(expressApp.app).post('/api/products').send({
        name: 'Articulo Test',
        minor_price: 1000,
        major_price: 800,
        stock: 100,
      });
      const prodId = pRes.body.data.id;

      // 2. Create orders
      await request(expressApp.app).post('/api/orders').send({
        type: 'minor',
        payment_method: 'cash',
        products: [{ product_id: prodId, quantity: 1 }],
      });
      await request(expressApp.app).post('/api/orders').send({
        type: 'major',
        payment_method: 'transfer',
        products: [{ product_id: prodId, quantity: 5 }],
      });
    });

    it('filters orders by paymentMethod and order number search', async () => {
      const payRes = await request(expressApp.app).get('/api/orders?payment_method=transfer');
      expect(payRes.status).toBe(200);
      expect(payRes.body.data.length).toBe(1);
      expect(payRes.body.data[0].paymentMethod).toBe('transfer');

      const numRes = await request(expressApp.app).get('/api/orders?search=1');
      expect(numRes.status).toBe(200);
      expect(numRes.body.data.some((o: any) => o.number === 1)).toBe(true);
    });

    it('sorts orders by total_desc and total_asc', async () => {
      const descRes = await request(expressApp.app).get('/api/orders?sorting=total_desc');
      expect(descRes.status).toBe(200);
      expect(descRes.body.data[0].totalPrice).toBeGreaterThan(descRes.body.data[1].totalPrice);

      const ascRes = await request(expressApp.app).get('/api/orders?sorting=total_asc');
      expect(ascRes.status).toBe(200);
      expect(ascRes.body.data[0].totalPrice).toBeLessThan(ascRes.body.data[1].totalPrice);
    });
  });
});
