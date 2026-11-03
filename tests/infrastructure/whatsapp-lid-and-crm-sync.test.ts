import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { SqliteCustomerRepository } from '../../src/infrastructure/repositories/sqlite-customer.repository';
import { SqliteOrderRepository } from '../../src/infrastructure/repositories/sqlite-order.repository';
import { SqliteWhatsappChatRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappIdentityRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-identity.repository';
import { SqliteWhatsappMessageRepository } from '../../src/infrastructure/repositories/sqlite-whatsapp-message.repository';
import { WhatsappCustomerSyncService } from '../../src/application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../../src/application/services/whatsapp-event.bus';
import { BaileysLidReconciler } from '../../src/infrastructure/adapters/whatsapp/baileys-lid.reconciler';
import { BaileysEventHandler } from '../../src/infrastructure/adapters/whatsapp/baileys-event.handler';
import { BaileysHistorySyncHandler } from '../../src/infrastructure/adapters/whatsapp/baileys-history-sync.handler';
import { WhatsappMediaStorage } from '../../src/infrastructure/adapters/whatsapp/whatsapp-media.storage';
import { Customer } from '../../src/domain/models/customer.entity';
import { Order } from '../../src/domain/models/order.entity';
import { OrderItem } from '../../src/domain/models/order-item.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { WhatsappChat } from '../../src/domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../src/domain/models/whatsapp-message.entity';

describe('WhatsApp LID Merging, Contact Names & CRM Auto-Sync (Integration)', () => {
  let db: DatabaseInstance;
  let tmpDir: string;
  let customerRepo: SqliteCustomerRepository;
  let orderRepo: SqliteOrderRepository;
  let chatRepo: SqliteWhatsappChatRepository;
  let msgRepo: SqliteWhatsappMessageRepository;
  let identityRepo: SqliteWhatsappIdentityRepository;
  let customerSync: WhatsappCustomerSyncService;
  let reconciler: BaileysLidReconciler;
  let eventBus: WhatsappEventBus;

  beforeEach(() => {
    db = new Database(':memory:');
    new SchemaMigrationRunner(db).run();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-wa-crm-'));
    customerRepo = new SqliteCustomerRepository(db);
    orderRepo = new SqliteOrderRepository(db);
    chatRepo = new SqliteWhatsappChatRepository(db);
    msgRepo = new SqliteWhatsappMessageRepository(db);
    identityRepo = new SqliteWhatsappIdentityRepository(db);
    eventBus = new WhatsappEventBus();
    customerSync = new WhatsappCustomerSyncService(customerRepo, chatRepo);
    reconciler = new BaileysLidReconciler(identityRepo, chatRepo, customerSync, eventBus);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges duplicate @lid and @s.whatsapp.net chats ("mateo") and resolves 14-digit LIDs via signalRepository', async () => {
    await chatRepo.upsert(new WhatsappChat({ jid: '99112233445566@lid', name: 'mateo', lastMessageText: 'test', lastMessageTimestamp: 1710000100000, lastMessageFromMe: true }));
    await msgRepo.upsert(new WhatsappMessage({ id: 'M-OLD', chatJid: '99112233445566@lid', fromMe: true, body: 'test', timestamp: 1710000100000 }));

    await chatRepo.upsert(new WhatsappChat({ jid: '5491144556677@s.whatsapp.net', name: 'mateo', lastMessageText: 'dou', lastMessageTimestamp: 1710000200000, unreadCount: 1 }));
    await msgRepo.upsert(new WhatsappMessage({ id: 'M-NEW', chatJid: '5491144556677@s.whatsapp.net', fromMe: false, body: 'dou', timestamp: 1710000200000 }));

    await chatRepo.upsert(new WhatsappChat({ jid: '23738351374505@lid', name: '23738351374505', lastMessageText: 'Ver catalogo', unreadCount: 5, lastMessageTimestamp: 1710000050000 }));
    await msgRepo.upsert(new WhatsappMessage({ id: 'M-CAT', chatJid: '23738351374505@lid', fromMe: false, body: 'Ver catalogo', timestamp: 1710000050000 }));

    const fakeSock = {
      signalRepository: {
        lidMapping: {
          getPNsForLIDs: async (lids: string[]) => lids
            .filter((l) => l.startsWith('23738351374505'))
            .map((lid) => ({ lid, pn: '5491199887766:0@s.whatsapp.net' })),
        },
      },
    } as any;

    await reconciler.reconcileAll(fakeSock);

    const allChats = await chatRepo.findAllEnriched();
    expect(allChats).toHaveLength(2);
    expect(allChats.some((c) => c.jid.endsWith('@lid'))).toBe(false);

    const mateoChat = allChats.find((c) => c.jid === '5491144556677@s.whatsapp.net')!;
    expect(mateoChat).toBeDefined();
    expect(mateoChat.name).toBe('mateo');
    expect(mateoChat.lastMessageText).toBe('dou');
    const mateoMsgs = await msgRepo.findByChatJid('5491144556677@s.whatsapp.net');
    expect(mateoMsgs.map((m) => m.body)).toEqual(['test', 'dou']);

    const resolvedLidChat = allChats.find((c) => c.jid === '5491199887766@s.whatsapp.net')!;
    expect(resolvedLidChat).toBeDefined();
    expect(resolvedLidChat.phone).toBe('5491199887766');
    expect(resolvedLidChat.unreadCount).toBe(5);
  });

  it('updates whatsappName on existing customer and auto-creates unassigned customer on new incoming message', async () => {
    await customerRepo.save(new Customer({
      id: 'cust-existing',
      name: 'LIBRERIA CENTRAL SRL',
      phone: '011 15-3344-5566',
      defaultOrderType: 'major',
    }));

    const order = new Order({ id: 'ord-1', number: 1, customerId: 'cust-existing', type: 'major', paymentMethod: 'transfer' });
    order.addItem(new OrderItem({ id: 'oi-1', orderId: 'ord-1', productId: 'p-1', productName: 'Resma A4', quantity: 10, price: Money.fromDecimal(6000) }));
    await orderRepo.save(order);

    const historyHandler = new BaileysHistorySyncHandler(chatRepo, msgRepo, eventBus, identityRepo, reconciler, customerSync);
    await historyHandler.handleHistorySync(
      [],
      [{ id: '5491133445566@s.whatsapp.net', lid: '77788899900011@lid', name: 'Martín Central' } as any],
      [],
      [{ lid: '77788899900011@lid', pn: '5491133445566@s.whatsapp.net' }]
    );

    const eventHandler = new BaileysEventHandler(
      chatRepo, msgRepo, new WhatsappMediaStorage(tmpDir), eventBus, identityRepo, reconciler, customerSync
    );

    await eventHandler.handleMessagesUpsert([
      {
        key: { id: 'MSG-1', remoteJid: '77788899900011@lid', fromMe: false },
        pushName: 'Tincho',
        messageTimestamp: 1710000500,
        message: { conversation: 'Hola! Necesito reponer resmas' },
      } as any,
      {
        key: { id: 'MSG-2', remoteJid: '5491166778899@s.whatsapp.net', fromMe: false },
        pushName: 'Sofía Papelería',
        messageTimestamp: 1710000600,
        message: { conversation: 'Buenas tardes, pasan lista?' },
      } as any,
    ], true);

    const updatedExisting = await customerRepo.findById('cust-existing');
    expect(updatedExisting?.name).toBe('LIBRERIA CENTRAL SRL');
    expect(updatedExisting?.whatsappName).toBe('Martín Central');
    expect(updatedExisting?.defaultOrderType?.getCode()).toBe('major');

    const byWspSearch = await customerRepo.findAll({ search: 'Martín Central' });
    expect(byWspSearch).toHaveLength(1);
    expect(byWspSearch[0].id).toBe('cust-existing');

    const newCustomer = await customerRepo.findByPhone('5491166778899');
    expect(newCustomer).not.toBeNull();
    expect(newCustomer?.name).toBe('SOFÍA PAPELERÍA');
    expect(newCustomer?.whatsappName).toBe('Sofía Papelería');
    expect(newCustomer?.defaultOrderType).toBeNull();

    const priorityChats = await chatRepo.findAllEnriched({ importance: 'priority' });
    expect(priorityChats).toHaveLength(1);
    expect(priorityChats[0].jid).toBe('5491133445566@s.whatsapp.net');
    expect(priorityChats[0].isPriorityBuyer).toBe(true);
    expect(priorityChats[0].totalSpentCents).toBe(6000000);
  });
});

