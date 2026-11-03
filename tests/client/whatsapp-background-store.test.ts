import { describe, it, expect } from 'vitest';
import { WhatsappStoreState } from '../../src/public/services/whatsapp-store.state';
import { WhatsappChatDto, WhatsappMessageDto } from '../../src/public/types/whatsapp.types';

const makeChat = (partial: Partial<WhatsappChatDto> & { jid: string; name: string }): WhatsappChatDto => ({
  phone: '5491100001111',
  isGroup: false,
  unreadCount: 0,
  lastMessageText: null,
  lastMessageTimestamp: 1000,
  lastMessageFromMe: false,
  pinned: false,
  updatedAt: new Date().toISOString(),
  importance: 'normal',
  ...partial,
});

const makeMsg = (partial: Partial<WhatsappMessageDto> & { id: string; chatJid: string }): WhatsappMessageDto => ({
  senderJid: null,
  senderName: 'Cliente',
  fromMe: false,
  body: 'Hola',
  messageType: 'text',
  mediaUrl: null,
  mimeType: null,
  fileName: null,
  status: 'delivered',
  timestamp: 2000,
  ...partial,
});

describe('WhatsappStoreState (Background Sync & Proxy Cache Reducer)', () => {
  it('computes totalUnread excluding ignored contacts and clears unread on active chat updates', () => {
    const cache = new Map<string, WhatsappMessageDto[]>();
    let state = WhatsappStoreState.createInitial();

    state = WhatsappStoreState.reduceRealtimeEvent(
      state,
      { type: 'chat_updated', payload: makeChat({ jid: '1@s.whatsapp.net', name: 'Ana', unreadCount: 3, importance: 'important' }) },
      cache
    ).next;
    state = WhatsappStoreState.reduceRealtimeEvent(
      state,
      { type: 'chat_updated', payload: makeChat({ jid: '2@s.whatsapp.net', name: 'Spam', unreadCount: 9, importance: 'ignore' }) },
      cache
    ).next;

    expect(state.totalUnread).toBe(3);

    state = { ...state, selectedJid: '1@s.whatsapp.net' };
    state = WhatsappStoreState.reduceRealtimeEvent(
      state,
      { type: 'chat_updated', payload: makeChat({ jid: '1@s.whatsapp.net', name: 'Ana', unreadCount: 4, importance: 'important' }) },
      cache
    ).next;

    expect(state.chats.find((c) => c.jid === '1@s.whatsapp.net')?.unreadCount).toBe(0);
    expect(state.totalUnread).toBe(0);
  });

  it('updates cached messages in background even when another chat or view is active', () => {
    const cache = new Map<string, WhatsappMessageDto[]>();
    cache.set('bg@s.whatsapp.net', [makeMsg({ id: 'M1', chatJid: 'bg@s.whatsapp.net', body: 'Primero', timestamp: 1000 })]);

    const state = { ...WhatsappStoreState.createInitial(), selectedJid: 'active@s.whatsapp.net' };
    const res = WhatsappStoreState.reduceRealtimeEvent(
      state,
      { type: 'message_upsert', payload: makeMsg({ id: 'M2', chatJid: 'bg@s.whatsapp.net', body: 'En segundo plano', timestamp: 2000 }) },
      cache
    );

    expect(res.next).toBe(state);
    expect(cache.get('bg@s.whatsapp.net')?.map((m) => m.id)).toEqual(['M1', 'M2']);
  });
});

