import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { AppContainer } from '../../src/desktop/app.container';
import { ExpressApp } from '../../src/presentation/server/express.app';

describe('OptionsController Bulk Product Export API (Integration)', () => {
  let db: DatabaseInstance;
  let tmpDir: string;
  let expressApp: ExpressApp;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-options-test-'));
    const container = new AppContainer(db, {
      userDataDir: tmpDir,
      dbPath: ':memory:',
      backupsDir: tmpDir,
    });
    expressApp = new ExpressApp(container.controllers, path.resolve(process.cwd(), 'dist/public'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exports products in JSON format compliant with BULK_PRODUCT_IMPORT_SPEC.md', async () => {
    await request(expressApp.app).post('/api/products').send({
      name: 'Resaltador Pastel Filgo',
      barcode: '7791234560012',
      description: 'Punta biselada',
      minor_price: 1250,
      major_price: 890,
    });

    const res = await request(expressApp.app).get('/api/options/export-products-bulk?format=json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toContain('attachment; filename="productos-bulk-import.json"');

    const products = JSON.parse(res.text);
    expect(Array.isArray(products)).toBe(true);
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('RESALTADOR PASTEL FILGO');
    expect(products[0].retailPrice).toBe(1250);
    expect(products[0].wholesalePrice).toBe(890);
    expect(products[0].isActive).toBe(true);
  });

  it('exports products in Excel format compliant with BULK_PRODUCT_IMPORT_SPEC.md', async () => {
    await request(expressApp.app).post('/api/products').send({
      name: 'Carpeta Escolar N3',
      barcode: '7798123400031',
      minor_price: 5200,
      major_price: 3950,
    });

    const res = await request(expressApp.app).get('/api/options/export-products-bulk?format=xlsx');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('attachment; filename="productos-bulk-import.xlsx"');
    expect(res.body).toBeDefined();
  });
});

