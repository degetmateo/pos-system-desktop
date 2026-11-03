import { describe, it, expect } from 'vitest';
import { WhatsappJid } from '../../src/domain/value-objects/whatsapp-jid.vo';
import { WhatsappChat } from '../../src/domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../src/domain/models/whatsapp-message.entity';

describe('WhatsApp Domain Layer (Value Objects & Entities)', () => {
  it('normalizes multi-device JIDs and legacy c.us suffixes', () => {
    const jid = WhatsappJid.create('5491122334455:18@c.us');
    expect(jid.getValue()).toBe('5491122334455@s.whatsapp.net');
    expect(jid.getPhone()).toBe('5491122334455');
    expect(jid.isGroup()).toBe(false);
    expect(jid.toJSON()).toBe('5491122334455@s.whatsapp.net');
  });

  it('creates JID from formatted and local Argentine phone numbers and validates length', () => {
    const jid = WhatsappJid.fromPhone('+54 (911) 4455-6677');
    expect(jid.getValue()).toBe('5491144556677@s.whatsapp.net');
    expect(WhatsappJid.fromPhone('11 4455-6677').getValue()).toBe('5491144556677@s.whatsapp.net');
    expect(WhatsappJid.fromPhone('011 4455-6677').getValue()).toBe('5491144556677@s.whatsapp.net');
    expect(WhatsappJid.fromPhone('15 4455-6677').getValue()).toBe('5491144556677@s.whatsapp.net');
    expect(() => WhatsappJid.fromPhone('123')).toThrow();
    expect(() => WhatsappJid.create('invalid-jid')).toThrow();
  });

  it('identifies groups and broadcast/newsletter JIDs', () => {
    const group = WhatsappJid.create('1203630445566@g.us');
    expect(group.isGroup()).toBe(true);
    expect(group.getPhone()).toBeNull();

    const status = WhatsappJid.create('status@broadcast');
    expect(status.isBroadcastOrNewsletter()).toBe(true);
  });

  it('updates WhatsappChat unread counts, contact name and read state', () => {
    const base = new WhatsappChat({ jid: '5491122334455@s.whatsapp.net' });
    expect(base.name).toBe('+5491122334455');

    const afterIncoming = base.recordMessage({
      previewText: 'Hola, tenés cuadernos?',
      timestamp: 1700000000000,
      fromMe: false,
      senderName: 'María Gómez',
      incrementUnread: true,
    });
    expect(afterIncoming.name).toBe('María Gómez');
    expect(afterIncoming.unreadCount).toBe(1);
    expect(afterIncoming.lastMessageText).toBe('Hola, tenés cuadernos?');

    const afterRead = afterIncoming.markAsRead();
    expect(afterRead.unreadCount).toBe(0);
  });

  it('formats WhatsappMessage previews and media URLs properly', () => {
    const imgMsg = new WhatsappMessage({
      id: 'MSG-1',
      chatJid: '5491122334455@s.whatsapp.net',
      fromMe: true,
      messageType: 'image',
      mediaPath: 'presupuesto 1.png',
      timestamp: 1700000005000,
    });
    expect(imgMsg.previewText()).toBe('📷 Imagen');
    expect(imgMsg.toJSON().mediaUrl).toBe('/api/whatsapp/media/presupuesto%201.png');

    const docMsg = new WhatsappMessage({
      id: 'MSG-2',
      chatJid: '5491122334455@s.whatsapp.net',
      fromMe: true,
      messageType: 'document',
      fileName: 'Orden_42.pdf',
      timestamp: 1700000006000,
    });
    expect(docMsg.previewText()).toBe('📄 Orden_42.pdf');
  });
});

