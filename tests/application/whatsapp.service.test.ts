import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteWhatsappChatRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappMessageRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-message.repository';
import { WhatsappEventBus } from '../../src/application/services/whatsapp-event.bus';
import { WhatsappService } from '../../src/application/services/whatsapp.service';
import { IWhatsappClientPort } from '../../src/application/ports/whatsapp-client.port';
import { SendWhatsappMediaInput, WhatsappRealtimeEvent, WhatsappStatusDto } from '../../src/application/dtos/whatsapp.dto';
import { WhatsappMessage } from '../../src/domain/models/whatsapp-message.entity';

class FakeWhatsappClient implements IWhatsappClientPort {
  public statusDto: WhatsappStatusDto = {
    status: 'qr_ready', qr: '2@FAKE_QR_TOKEN', connectedPhone: null, connectedName: null, lastError: null,
  };
  public readCalls: string[] = [];

  public getStatus(): WhatsappStatusDto { return this.statusDto; }
  public async connect(): Promise<void> {
    this.statusDto = { status: 'connected', qr: null, connectedPhone: '5491100001111', connectedName: 'Librería RD', lastError: null };
  }
  public async connectIfSessionExists(): Promise<void> {}
  public async disconnect(): Promise<void> { this.statusDto = { ...this.statusDto, status: 'disconnected' }; }
  public async logout(): Promise<void> { this.statusDto = { status: 'disconnected', qr: null, connectedPhone: null, connectedName: null, lastError: null }; }
  public async sendTextMessage(jid: string, text: string): Promise<WhatsappMessage> {
    return new WhatsappMessage({ id: `TXT-${Date.now()}`, chatJid: jid, fromMe: true, body: text, messageType: 'text', status: 'sent', timestamp: Date.now() });
  }
  public async sendMediaMessage(input: SendWhatsappMediaInput): Promise<WhatsappMessage> {
    return new WhatsappMessage({ id: `MED-${Date.now()}`, chatJid: input.jid, fromMe: true, body: input.caption || '', messageType: 'image', mediaPath: 'test.png', mimeType: input.mimeType, fileName: input.fileName, status: 'sent', timestamp: Date.now() });
  }
  public async markChatRead(jid: string): Promise<void> { this.readCalls.push(jid); }
  public resolveMediaFilePath(rel: string): string | null { return rel === 'test.png' ? '/tmp/test.png' : null; }
}

describe('WhatsappService & WhatsappEventBus (Application Layer)', () => {
  let db: DatabaseInstance;
  let client: FakeWhatsappClient;
  let eventBus: WhatsappEventBus;
  let service: WhatsappService;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    client = new FakeWhatsappClient();
    eventBus = new WhatsappEventBus();
    service = new WhatsappService(
      client,
      new SqliteWhatsappChatRepository(db),
      new SqliteWhatsappMessageRepository(db),
      eventBus
    );
  });

  afterEach(() => db.close());

  it('exposes QR status, connects, starts chat by phone and sends messages emitting realtime events', async () => {
    const events: WhatsappRealtimeEvent[] = [];
    const unsub = eventBus.subscribe((e) => events.push(e));

    expect(service.getStatus().status).toBe('qr_ready');
    expect(service.getStatus().qr).toBe('2@FAKE_QR_TOKEN');

    const connected = await service.connect();
    expect(connected.status).toBe('connected');

    const chat = await service.startChatByPhone('+54 9 11 5555-6666', 'Cliente Mostrador');
    expect(chat.jid).toBe('5491155556666@s.whatsapp.net');
    expect(chat.name).toBe('Cliente Mostrador');

    const sentMsg = await service.sendText(chat.jid, 'Hola! Tu pedido está listo.');
    expect(sentMsg.body).toBe('Hola! Tu pedido está listo.');

    const messages = await service.getMessages(chat.jid);
    expect(messages).toHaveLength(1);

    const chats = await service.listChats('Mostrador');
    expect(chats).toHaveLength(1);
    expect(chats[0].lastMessageText).toBe('Hola! Tu pedido está listo.');

    expect(events.some((e) => e.type === 'message_upsert')).toBe(true);
    expect(events.some((e) => e.type === 'chat_updated')).toBe(true);
    unsub();
  });

  it('sends media, marks chat as read, and clears history on logout when requested', async () => {
    await service.connect();
    const chat = await service.startChatByPhone('5491177778888');
    const mediaMsg = await service.sendMedia({
      jid: chat.jid,
      buffer: Buffer.from('fake-png-bytes'),
      mimeType: 'image/png',
      fileName: 'presupuesto.png',
      caption: 'Presupuesto Orden #10',
    });
    expect(mediaMsg.messageType).toBe('image');
    expect(mediaMsg.mediaUrl).toContain('test.png');

    await service.markChatAsRead(chat.jid);
    expect(client.readCalls).toContain(chat.jid);

    await service.logout(true);
    expect(await service.listChats()).toHaveLength(0);
    expect(await service.getMessages(chat.jid)).toHaveLength(0);
  });
});

