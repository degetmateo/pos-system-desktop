import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { AppContainer } from '../../src/desktop/app.container';
import { ExpressApp } from '../../src/presentation/server/express.app';
import { WhatsappChat } from '../../src/domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../src/domain/models/whatsapp-message.entity';
import { SqliteWhatsappChatRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappMessageRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-message.repository';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

describe('Statistics Endpoint, Customer WSP Search & Chat Importance API (E2E)', () => {
  let db: DatabaseInstance;
  let tmpDir: string;
  let expressApp: ExpressApp;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-stats-e2e-'));
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

  it('supports unassigned customers, searching by whatsappName/email, and updating chat importance', async () => {
    const createRes = await request(expressApp.app).post('/api/customers').send({
      name: 'Juan Perez',
      whatsappName: 'Juancito Mayorista',
      phone: '+5491155443322',
      email: 'juan@kiosco.com',
      type: null,
      importance: 'normal',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.defaultOrderType).toBeNull();

    const unassignedRes = await request(expressApp.app).get('/api/customers?type=unassigned');
    expect(unassignedRes.status).toBe(200);
    expect(unassignedRes.body.data).toHaveLength(1);

    const wspSearchRes = await request(expressApp.app).get('/api/customers?search=Juancito');
    expect(wspSearchRes.body.data).toHaveLength(1);
    expect(wspSearchRes.body.data[0].email).toBe('juan@kiosco.com');

    const chatRepo = new SqliteWhatsappChatRepository(db);
    await chatRepo.upsert(new WhatsappChat({
      jid: '5491155443322@s.whatsapp.net',
      name: 'Juancito Mayorista',
      customerId: createRes.body.data.id,
      lastMessageTimestamp: Date.now(),
    }));

    const patchRes = await request(expressApp.app)
      .patch(`/api/whatsapp/chats/${encodeURIComponent('5491155443322@s.whatsapp.net')}/importance`)
      .send({ importance: 'important' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.importance).toBe('important');

    const impCustRes = await request(expressApp.app).get('/api/customers?importance=important');
    expect(impCustRes.body.data).toHaveLength(1);
    expect(impCustRes.body.data[0].id).toBe(createRes.body.data.id);
  });

  it('computes complete sales, product price variations, customer rankings and WhatsApp message statistics', async () => {
    const prodRes = await request(expressApp.app).post('/api/products').send({
      name: 'Marcador Indeleble Negro',
      minor_price: 1200,
      major_price: 900,
    });
    const prodId = prodRes.body.data.id;

    await request(expressApp.app).post(`/api/products/update/${prodId}`).send({
      name: 'Marcador Indeleble Negro',
      minor_price: 1500,
      major_price: 1080,
    });

    const custRes = await request(expressApp.app).post('/api/customers').send({
      name: 'Comercial Norte',
      whatsappName: 'Norte Compras',
      phone: '+5491188776655',
      type: 'major',
      importance: 'important',
    });
    const custId = custRes.body.data.id;

    await request(expressApp.app).post('/api/orders').send({
      customer_id: custId,
      type: 'major',
      payment_method: 'transfer',
      products: [{ product_id: prodId, quantity: 10 }],
    });

    const chatRepo = new SqliteWhatsappChatRepository(db);
    const msgRepo = new SqliteWhatsappMessageRepository(db);
    const now = Date.now();
    await chatRepo.upsert(new WhatsappChat({ jid: '5491188776655@s.whatsapp.net', name: 'Norte Compras', customerId: custId, lastMessageTimestamp: now }));
    await msgRepo.upsertBatch([
      new WhatsappMessage({ id: 'W1', chatJid: '5491188776655@s.whatsapp.net', fromMe: false, body: 'Hola', timestamp: now - 5000 }),
      new WhatsappMessage({ id: 'W2', chatJid: '5491188776655@s.whatsapp.net', fromMe: false, body: 'Pedido 10 marcadores', timestamp: now - 3000 }),
      new WhatsappMessage({ id: 'W3', chatJid: '5491188776655@s.whatsapp.net', fromMe: true, body: 'Confirmado!', timestamp: now - 1000 }),
    ]);

    const statsRes = await request(expressApp.app).get('/api/statistics?period=30d');
    expect(statsRes.status).toBe(200);
    const stats = statsRes.body.data;

    expect(stats.kpis.totalOrdersCount).toBe(1);
    expect(stats.kpis.totalRevenueCents).toBe(1080 * 10 * 100);
    expect(stats.kpis.priceChangesCount).toBe(2);
    expect(stats.kpis.totalMessagesCount).toBe(3);
    expect(stats.kpis.incomingMessagesCount).toBe(2);
    expect(stats.kpis.outgoingMessagesCount).toBe(1);

    expect(stats.topCustomers).toHaveLength(1);
    expect(stats.topCustomers[0].name).toBe('COMERCIAL NORTE');
    expect(stats.topProducts[0].unitsSold).toBe(10);
    expect(stats.recentPriceChanges).toHaveLength(2);
    expect(stats.whatsappDailySeries.length).toBeGreaterThanOrEqual(1);
    expect(stats.whatsappTopContacts[0].totalMessages).toBe(3);
  });

  it('paginates customer search for POS V2 selector without loading all records at once', async () => {
    for (let i = 1; i <= 25; i++) {
      await request(expressApp.app).post('/api/customers').send({
        name: `Cliente Masivo ${String(i).padStart(2, '0')}`,
        phone: `+54911000000${String(i).padStart(2, '0')}`,
        importance: i === 25 ? 'important' : 'normal',
      });
    }

    const page1 = await request(expressApp.app).get('/api/customers?page=1&limit=10&sorting=importance_desc');
    expect(page1.status).toBe(200);
    expect(page1.body.data.items).toHaveLength(10);
    expect(page1.body.data.total).toBe(25);
    expect(page1.body.data.totalPages).toBe(3);
    expect(page1.body.data.items[0].name).toBe('CLIENTE MASIVO 25');

    const page3 = await request(expressApp.app).get('/api/customers?page=3&limit=10&sorting=importance_desc');
    expect(page3.body.data.items).toHaveLength(5);

    const byId = await request(expressApp.app).get(`/api/customers/${page1.body.data.items[0].id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.data.name).toBe('CLIENTE MASIVO 25');
  });
});

