import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteWhatsappChatRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappMessageRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-message.repository';
import { WhatsappMediaStorage } from '../../src/infrastructure/adapters/whatsapp/whatsapp-media.storage';
import { BaileysMessageParser } from '../../src/infrastructure/adapters/whatsapp/baileys-message.parser';
import { BaileysEventHandler } from '../../src/infrastructure/adapters/whatsapp/baileys-event.handler';
import { BaileysHistorySyncHandler } from '../../src/infrastructure/adapters/whatsapp/baileys-history-sync.handler';
import { BaileysModuleLoader } from '../../src/infrastructure/adapters/whatsapp/baileys-module.loader';
import { WhatsappEventBus } from '../../src/application/services/whatsapp-event.bus';

describe('WhatsApp Baileys Infrastructure (Parser, Sync, Storage & Repositories)', () => {
  let db: DatabaseInstance;
  let tmpMediaDir: string;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    tmpMediaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-wa-media-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpMediaDir, { recursive: true, force: true });
  });

  it('loads @whiskeysockets/baileys ESM module cleanly inside Electron Node', async () => {
    const mod = await BaileysModuleLoader.load();
    expect(typeof mod.makeWASocket).toBe('function');
    expect(typeof mod.useMultiFileAuthState).toBe('function');
  });

  it('stores media files safely and blocks path traversal attempts', () => {
    const storage = new WhatsappMediaStorage(tmpMediaDir);
    const saved = storage.saveBuffer(Buffer.from('hello'), 'image/png', 'captura.png');
    expect(saved.endsWith('.png')).toBe(true);
    expect(storage.resolveSafePath(saved)).toContain(saved);
    expect(storage.resolveSafePath('../data.db')).toBeNull();
    expect(storage.resolveSafePath('/etc/passwd')).toBeNull();
  });

  it('parses Baileys WAMessage unwrapping ephemeral/viewOnce and resolving LID alt JIDs', () => {
    const parsed = BaileysMessageParser.parse({
      key: {
        id: 'BAE51234',
        remoteJid: '99887766@lid',
        remoteJidAlt: '5491133445566@s.whatsapp.net',
        fromMe: false,
      },
      pushName: 'Carlos Librería',
      messageTimestamp: 1710000000,
      message: {
        ephemeralMessage: {
          message: { extendedTextMessage: { text: 'Necesito 10 resmas A4' } },
        },
      },
    } as any);

    expect(parsed).not.toBeNull();
    expect(parsed!.chatJid.getValue()).toBe('5491133445566@s.whatsapp.net');
    expect(parsed!.body).toBe('Necesito 10 resmas A4');
    expect(parsed!.timestamp).toBe(1710000000000);

    const statusIgnored = BaileysMessageParser.parse({
      key: { id: 'ST1', remoteJid: 'status@broadcast' },
      message: { conversation: 'Estado' },
    } as any);
    expect(statusIgnored).toBeNull();

    // Baileys v7 status update where remoteJid is status@broadcast AND remoteJidAlt carries the contact's phone JID
    const statusWithAltIgnored = BaileysMessageParser.parse({
      key: {
        id: 'ST-ALT-1',
        remoteJid: 'status@broadcast',
        remoteJidAlt: '5491133445566@s.whatsapp.net',
        participant: '99887766:0@lid',
        fromMe: false,
      },
      broadcast: true,
      pushName: 'Carlos Librería',
      message: { imageMessage: { caption: 'Oferta del día en mi estado!' } },
    } as any);
    expect(statusWithAltIgnored).toBeNull();
  });

  it('blocks WhatsApp Statuses (status@broadcast + remoteJidAlt, groupStatusMessage, statusMentionMessage) from entering contact chats', async () => {
    const chatRepo = new SqliteWhatsappChatRepository(db);
    const msgRepo = new SqliteWhatsappMessageRepository(db);
    const bus = new WhatsappEventBus();
    const storage = new WhatsappMediaStorage(tmpMediaDir);
    const eventHandler = new BaileysEventHandler(chatRepo, msgRepo, storage, bus);

    await eventHandler.handleMessagesUpsert([
      {
        key: { id: 'CHAT-REAL', remoteJid: '5491155556666@s.whatsapp.net', fromMe: false },
        pushName: 'Cliente Real',
        messageTimestamp: 1710000100,
        message: { conversation: 'Hola! Tienen carpetas N3?' },
      } as any,
      {
        key: {
          id: 'STATUS-1',
          remoteJid: 'status@broadcast',
          remoteJidAlt: '5491155556666@s.whatsapp.net',
          participant: '88776655:0@lid',
          fromMe: false,
        },
        broadcast: true,
        pushName: 'Cliente Real',
        messageTimestamp: 1710000200,
        message: { extendedTextMessage: { text: 'De vacaciones en la costa 🏖️' } },
      } as any,
      {
        key: { id: 'STATUS-MENTION', remoteJid: '5491155556666@s.whatsapp.net', fromMe: false },
        messageTimestamp: 1710000300,
        message: { statusMentionMessage: { message: { conversation: 'Mención en estado' } } },
      } as any,
    ], true);

    const msgs = await msgRepo.findByChatJid('5491155556666@s.whatsapp.net');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('CHAT-REAL');
    expect(msgs[0].body).toBe('Hola! Tienen carpetas N3?');

    const chat = await chatRepo.findByJid('5491155556666@s.whatsapp.net');
    expect(chat?.unreadCount).toBe(1);
    expect(chat?.lastMessageText).toBe('Hola! Tienen carpetas N3?');
  });

  it('syncs history and realtime message upserts into SQLite with multi-term search', async () => {
    const chatRepo = new SqliteWhatsappChatRepository(db);
    const msgRepo = new SqliteWhatsappMessageRepository(db);
    const bus = new WhatsappEventBus();
    const storage = new WhatsappMediaStorage(tmpMediaDir);
    const historyHandler = new BaileysHistorySyncHandler(chatRepo, msgRepo, bus);
    const eventHandler = new BaileysEventHandler(chatRepo, msgRepo, storage, bus);

    await historyHandler.handleHistorySync(
      [{ id: '5491199887766@s.whatsapp.net', unreadCount: 2, conversationTimestamp: 1710000100 } as any],
      [{ id: '5491199887766@s.whatsapp.net', name: 'Escuela Técnica N2' }],
      [{
        key: { id: 'M1', remoteJid: '5491199887766@s.whatsapp.net', fromMe: false },
        messageTimestamp: 1710000100,
        message: { conversation: 'Pedido de cartulinas celestes' },
      } as any]
    );

    await eventHandler.handleMessagesUpsert([
      {
        key: { id: 'M2', remoteJid: '5491199887766@s.whatsapp.net', fromMe: false },
        messageTimestamp: 1710000200,
        message: { conversation: 'Y también marcadores permanentes' },
      } as any,
    ], true);

    const found = await chatRepo.findAll('Escuela marcadores');
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('Escuela Técnica N2');
    expect(found[0].unreadCount).toBe(3);

    const msgs = await msgRepo.findByChatJid('5491199887766@s.whatsapp.net');
    expect(msgs.map((m) => m.id)).toEqual(['M1', 'M2']);
  });
});

