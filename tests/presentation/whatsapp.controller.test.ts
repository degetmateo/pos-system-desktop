import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteWhatsappChatRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappMessageRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-message.repository';
import { WhatsappMediaStorage } from '../../src/infrastructure/adapters/whatsapp/whatsapp-media.storage';
import { WhatsappEventBus } from '../../src/application/services/whatsapp-event.bus';
import { WhatsappService } from '../../src/application/services/whatsapp.service';
import { WhatsappController } from '../../src/presentation/controllers/whatsapp.controller';
import { IWhatsappClientPort } from '../../src/application/ports/whatsapp-client.port';
import { SendWhatsappMediaInput, WhatsappStatusDto } from '../../src/application/dtos/whatsapp.dto';
import { WhatsappMessage } from '../../src/domain/models/whatsapp-message.entity';
import express, { Express } from 'express';

describe('WhatsappController REST & Media API (Integration)', () => {
  let db: DatabaseInstance;
  let tmpMediaDir: string;
  let app: Express;
  let mediaStorage: WhatsappMediaStorage;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    tmpMediaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-wa-ctrl-'));
    mediaStorage = new WhatsappMediaStorage(tmpMediaDir);

    let currentStatus: WhatsappStatusDto = {
      status: 'qr_ready', qr: '2@TEST_QR_CODE_DATA', connectedPhone: null, connectedName: null, lastError: null,
    };

    const fakeClient: IWhatsappClientPort = {
      getStatus: () => currentStatus,
      connect: async () => {
        currentStatus = { status: 'connected', qr: null, connectedPhone: '5491144445555', connectedName: 'Rubén Darío', lastError: null };
      },
      connectIfSessionExists: async () => {},
      disconnect: async () => {},
      logout: async () => {
        currentStatus = { status: 'disconnected', qr: null, connectedPhone: null, connectedName: null, lastError: null };
      },
      sendTextMessage: async (jid, text) =>
        new WhatsappMessage({ id: 'WAM-100', chatJid: jid, fromMe: true, body: text, messageType: 'text', status: 'sent', timestamp: Date.now() }),
      sendMediaMessage: async (input: SendWhatsappMediaInput) => {
        const saved = mediaStorage.saveBuffer(input.buffer, input.mimeType, input.fileName);
        return new WhatsappMessage({ id: 'WAM-101', chatJid: input.jid, fromMe: true, body: input.caption || '', messageType: 'image', mediaPath: saved, mimeType: input.mimeType, fileName: input.fileName, status: 'sent', timestamp: Date.now() });
      },
      markChatRead: async () => {},
      resolveMediaFilePath: (rel) => mediaStorage.resolveSafePath(rel),
    };

    const bus = new WhatsappEventBus();
    const service = new WhatsappService(
      fakeClient,
      new SqliteWhatsappChatRepository(db),
      new SqliteWhatsappMessageRepository(db),
      bus
    );
    const controller = new WhatsappController(service, bus);

    app = express();
    app.use(express.json());
    app.use('/api/whatsapp', controller.router);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpMediaDir, { recursive: true, force: true });
  });

  it('serves QR status, connects, creates chat, sends text & multipart media, and serves media file', async () => {
    const stRes = await request(app).get('/api/whatsapp/status');
    expect(stRes.status).toBe(200);
    expect(stRes.body.data.status).toBe('qr_ready');
    expect(stRes.body.data.qr).toBe('2@TEST_QR_CODE_DATA');

    const connRes = await request(app).post('/api/whatsapp/connect');
    expect(connRes.body.data.status).toBe('connected');

    const startRes = await request(app).post('/api/whatsapp/chats/start').send({ phone: '5491166778899', name: 'Ana' });
    expect(startRes.status).toBe(201);
    const jid = encodeURIComponent(startRes.body.data.jid);

    const txtRes = await request(app).post(`/api/whatsapp/chats/${jid}/messages`).send({ text: 'Buenas tardes Ana!' });
    expect(txtRes.status).toBe(201);
    expect(txtRes.body.data.body).toBe('Buenas tardes Ana!');

    const mediaRes = await request(app)
      .post(`/api/whatsapp/chats/${jid}/media`)
      .field('caption', 'Captura de presupuesto')
      .attach('file', Buffer.from([137, 80, 78, 71]), { filename: 'orden.png', contentType: 'image/png' });
    expect(mediaRes.status).toBe(201);
    expect(mediaRes.body.data.mediaUrl).toMatch(/^\/api\/whatsapp\/media\//);

    const fileRes = await request(app).get(mediaRes.body.data.mediaUrl);
    expect(fileRes.status).toBe(200);

    const listMsgs = await request(app).get(`/api/whatsapp/chats/${jid}/messages`);
    expect(listMsgs.body.data).toHaveLength(2);
  });
});

