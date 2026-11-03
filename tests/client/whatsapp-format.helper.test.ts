import { describe, it, expect } from 'vitest';
import { WhatsappFormatHelper } from '../../src/public/views/whatsapp/whatsapp-format.helper';
import { WhatsappChatDto, WhatsappMessageDto } from '../../src/public/types/whatsapp.types';

describe('WhatsappFormatHelper (Frontend Utilities)', () => {
  it('computes contact initials cleanly', () => {
    expect(WhatsappFormatHelper.getInitials('Librería Rubén Darío')).toBe('LR');
    expect(WhatsappFormatHelper.getInitials('+5491122334455')).toBe('54');
    expect(WhatsappFormatHelper.getInitials('')).toBe('WA');
  });

  it('formats chat timestamps relative to reference date', () => {
    const refNow = new Date(2026, 10, 3, 15, 30, 0);
    const sameDay = new Date(2026, 10, 3, 10, 5, 0).getTime();
    const yesterday = new Date(2026, 10, 2, 18, 0, 0).getTime();

    expect(WhatsappFormatHelper.formatChatTimestamp(sameDay, refNow)).toMatch(/10:05/);
    expect(WhatsappFormatHelper.formatChatTimestamp(yesterday, refNow)).toBe('Ayer');
  });

  it('upserts and sorts chats by recent, importance and top_buyers, and filters accurately', () => {
    const c1: WhatsappChatDto = {
      jid: '1@s.whatsapp.net', name: 'Uno', phone: '1', importance: 'ignore', totalSpentCents: 1000,
      isPriorityBuyer: false, isGroup: false, unreadCount: 0, lastMessageText: 'A',
      lastMessageTimestamp: 3000, lastMessageFromMe: false, pinned: false, updatedAt: '',
    };
    const c2: WhatsappChatDto = {
      ...c1, jid: '2@s.whatsapp.net', name: 'Dos', importance: 'normal',
      totalSpentCents: 9000000, isPriorityBuyer: true, lastMessageTimestamp: 2000,
    };
    const c3: WhatsappChatDto = {
      ...c1, jid: '3@s.whatsapp.net', name: 'Tres', importance: 'important',
      totalSpentCents: 500000, isPriorityBuyer: false, lastMessageTimestamp: 1000,
    };

    const byImp = WhatsappFormatHelper.sortChats([c1, c2, c3], 'importance');
    expect(byImp.map((c) => c.jid)).toEqual(['3@s.whatsapp.net', '2@s.whatsapp.net', '1@s.whatsapp.net']);

    const byBuyers = WhatsappFormatHelper.sortChats([c1, c2, c3], 'top_buyers');
    expect(byBuyers[0].jid).toBe('2@s.whatsapp.net');

    expect(WhatsappFormatHelper.matchesFilter(c1, 'active')).toBe(false);
    expect(WhatsappFormatHelper.matchesFilter(c2, 'priority')).toBe(true);
    expect(WhatsappFormatHelper.matchesFilter(c3, 'important')).toBe(true);
  });

  it('deduplicates, orders and updates status on messages', () => {
    const m1: WhatsappMessageDto = {
      id: '1', chatJid: 'a@s.whatsapp.net', senderJid: null, senderName: null,
      fromMe: true, body: 'Primero', messageType: 'text', mediaUrl: null, mimeType: null, fileName: null,
      status: 'sent', timestamp: 100,
    };
    const m2: WhatsappMessageDto = { ...m1, id: '2', body: 'Segundo', timestamp: 200 };

    const merged = WhatsappFormatHelper.upsertAndSortMessages([m2], m1);
    expect(merged.map((m) => m.id)).toEqual(['1', '2']);

    const updated = WhatsappFormatHelper.applyMessageStatus(merged, '1', 'read');
    expect(updated[0].status).toBe('read');
  });
});
