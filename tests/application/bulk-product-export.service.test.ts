import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import ExcelJS from 'exceljs';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteProductRepository } from '../../src/infrastructure/repositories/sqlite-product.repository';
import { SqliteProviderRepository } from '../../src/infrastructure/repositories/sqlite-provider.repository';
import { BulkProductExportService } from '../../src/application/services/bulk-product-export.service';
import { Product } from '../../src/domain/models/product.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { MinorPrice } from '../../src/domain/models/minor-price.entity';
import { Provider } from '../../src/domain/models/provider.entity';

describe('BulkProductExportService (BULK_PRODUCT_IMPORT_SPEC.md compliant)', () => {
  let db: DatabaseInstance;
  let productRepo: SqliteProductRepository;
  let providerRepo: SqliteProviderRepository;
  let service: BulkProductExportService;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    productRepo = new SqliteProductRepository(db);
    providerRepo = new SqliteProviderRepository(db);
    service = new BulkProductExportService(productRepo, providerRepo);
  });

  afterEach(() => {
    db.close();
  });

  it('exports products to JSON format specified in BULK_PRODUCT_IMPORT_SPEC.md', async () => {
    const prov = new Provider({ id: 'prov-1', name: 'Estrada Distribuidora', barcodePrefix: 'RD99' });
    await providerRepo.save(prov);

    const product = new Product({
      id: '018f3a2c-0000-7000-8000-000000000001',
      name: 'Cuaderno Rivadavia Tapa Dura 50 Hojas',
      barcode: '7791234500018',
      description: 'Tapas duras forradas rayado',
      providerId: 'prov-1',
      priceMinor: Money.fromCents(385000), // $3850 ARS
      priceMajor: Money.fromCents(290000), // $2900 ARS
      minorPrices: [
        new MinorPrice({ id: 'mp-1', productId: '018f3a2c-0000-7000-8000-000000000001', condition: 'quantity', conditionValue: 10, priceValue: Money.fromCents(320000) }),
        new MinorPrice({ id: 'mp-2', productId: '018f3a2c-0000-7000-8000-000000000001', condition: 'quantity', conditionValue: 5, priceValue: Money.fromCents(350000) }),
      ],
    });
    await productRepo.save(product);

    const result = await service.exportToJson();

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.id).toBe('018f3a2c-0000-7000-8000-000000000001');
    expect(item.name).toBe('CUADERNO RIVADAVIA TAPA DURA 50 HOJAS');
    expect(item.description).toBe('Tapas duras forradas rayado');
    expect(item.barcode).toBe('7791234500018');
    expect(item.retailPrice).toBe(3850);
    expect(item.wholesalePrice).toBe(2900);
    expect(item.supplier).toBe('ESTRADA DISTRIBUIDORA');
    expect(item.isActive).toBe(true);
    expect(item.categories).toEqual([]);
    expect(item.tags).toEqual([]);

    expect(item.retailPriceTiers).toBeDefined();
    expect(item.retailPriceTiers).toHaveLength(2);
    // Verified sorted by minQuantity ascending: 5 ($3500) -> 10 ($3200)
    expect(item.retailPriceTiers![0]).toEqual({ minQuantity: 5, unitPrice: 3500 });
    expect(item.retailPriceTiers![1]).toEqual({ minQuantity: 10, unitPrice: 3200 });
  });

  it('exports products to Excel format matching Section 5 of specification', async () => {
    const prov = new Provider({ id: 'prov-2', name: 'Bic Argentina', barcodePrefix: 'RD88' });
    await providerRepo.save(prov);

    const product = new Product({
      id: '018f3a2c-0000-7000-8000-000000000002',
      name: 'Boligrafo Bic Fino Azul',
      barcode: '70330129654',
      description: 'Punta de tungsteno 0.8mm',
      providerId: 'prov-2',
      priceMinor: Money.fromCents(45000), // $450
      priceMajor: Money.fromCents(31000), // $310
    });
    await productRepo.save(product);

    const buffer = await service.exportToExcel();
    expect(buffer).toBeInstanceOf(Buffer);

    const book = new ExcelJS.Workbook();
    await book.xlsx.load(buffer as any);
    const sheet = book.getWorksheet('Productos');
    expect(sheet).toBeDefined();

    const headers = sheet!.getRow(1).values as string[];
    expect(headers).toContain('ID (Opcional)');
    expect(headers).toContain('Nombre *');
    expect(headers).toContain('Código de Barras');
    expect(headers).toContain('Precio Minorista');
    expect(headers).toContain('Precio Mayorista');
    expect(headers).toContain('Proveedor');
    expect(headers).toContain('Activo (SI/NO)');
    expect(headers).toContain('Descripción');

    const row2 = sheet!.getRow(2);
    expect(row2.getCell(2).value).toBe('BOLIGRAFO BIC FINO AZUL');
    expect(row2.getCell(3).value).toBe('70330129654');
    expect(row2.getCell(4).value).toBe(450);
    expect(row2.getCell(5).value).toBe(310);
    expect(row2.getCell(6).value).toBe('BIC ARGENTINA');
    expect(row2.getCell(9).value).toBe('SI');
  });
});
