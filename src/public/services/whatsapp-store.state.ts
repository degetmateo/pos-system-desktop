import { CustomerImportanceCode } from '../types/api.types';
import {
  WhatsappChatDto,
  WhatsappChatSortMode,
  WhatsappImportanceFilter,
  WhatsappMessageDto,
  WhatsappRealtimeEvent,
  WhatsappStatusDto,
} from '../types/whatsapp.types';
import { WhatsappFormatHelper } from '../views/whatsapp/whatsapp-format.helper';

export interface WhatsappStoreSnapshot {
  statusInfo: WhatsappStatusDto;
  chats: WhatsappChatDto[];
  selectedJid: string | null;
  messages: WhatsappMessageDto[];
  search: string;
  sortBy: WhatsappChatSortMode;
  importanceFilter: WhatsappImportanceFilter;
  loadingChats: boolean;
  loadingMessages: boolean;
  syncingBackground: boolean;
  sending: boolean;
  totalUnread: number;
}

export class WhatsappStoreState {
  public static createInitial(): WhatsappStoreSnapshot {
    return {
      statusInfo: { status: 'disconnected', qr: null, connectedPhone: null, connectedName: null, lastError: null },
      chats: [],
      selectedJid: null,
      messages: [],
      search: '',
      sortBy: 'recent',
      importanceFilter: 'all',
      loadingChats: false,
      loadingMessages: false,
      syncingBackground: false,
      sending: false,
      totalUnread: 0,
    };
  }

  public static computeTotalUnread(chats: WhatsappChatDto[]): number {
    let sum = 0;
    for (const c of chats) {
      if (c.importance !== 'ignore' && c.unreadCount > 0) sum += c.unreadCount;
    }
    return sum;
  }

  public static upsertCachedMessage(
    cache: Map<string, WhatsappMessageDto[]>,
    msg: WhatsappMessageDto,
    maxCachedChats: number = 30
  ): WhatsappMessageDto[] | undefined {
    const existing = cache.get(msg.chatJid);
    if (!existing) return undefined;
    const next = WhatsappFormatHelper.upsertAndSortMessages(existing, msg);
    cache.set(msg.chatJid, next);
    if (cache.size > maxCachedChats) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey && oldestKey !== msg.chatJid) cache.delete(oldestKey);
    }
    return next;
  }

  public static reduceRealtimeEvent(
    prev: WhatsappStoreSnapshot,
    ev: WhatsappRealtimeEvent,
    cache: Map<string, WhatsappMessageDto[]>
  ): { next: WhatsappStoreSnapshot; shouldRefreshChats: boolean; shouldMarkReadJid: string | null } {
    if (ev.type === 'status') {
      return {
        next: { ...prev, statusInfo: ev.payload },
        shouldRefreshChats: ev.payload.status === 'connected',
        shouldMarkReadJid: null,
      };
    }
    if (ev.type === 'chat_updated') {
      const incoming = prev.selectedJid === ev.payload.jid && ev.payload.unreadCount > 0
        ? { ...ev.payload, unreadCount: 0 }
        : ev.payload;
      const chats = WhatsappFormatHelper.matchesFilter(incoming, prev.importanceFilter)
        ? WhatsappFormatHelper.upsertAndSortChats(prev.chats, incoming, prev.sortBy)
        : prev.chats.filter((c) => c.jid !== incoming.jid);
      return { next: { ...prev, chats, totalUnread: this.computeTotalUnread(chats) }, shouldRefreshChats: false, shouldMarkReadJid: null };
    }
    if (ev.type === 'chat_deleted') {
      cache.delete(ev.payload.jid);
      const chats = prev.chats.filter((c) => c.jid !== ev.payload.jid);
      const selectedJid = prev.selectedJid === ev.payload.jid ? null : prev.selectedJid;
      const messages = selectedJid ? prev.messages : [];
      return { next: { ...prev, chats, selectedJid, messages, totalUnread: this.computeTotalUnread(chats) }, shouldRefreshChats: false, shouldMarkReadJid: null };
    }
    if (ev.type === 'message_upsert') {
      const cachedNext = this.upsertCachedMessage(cache, ev.payload);
      if (ev.payload.chatJid === prev.selectedJid) {
        const messages = cachedNext || WhatsappFormatHelper.upsertAndSortMessages(prev.messages, ev.payload);
        cache.set(ev.payload.chatJid, messages);
        return { next: { ...prev, messages }, shouldRefreshChats: false, shouldMarkReadJid: !ev.payload.fromMe ? ev.payload.chatJid : null };
      }
      return { next: prev, shouldRefreshChats: false, shouldMarkReadJid: null };
    }
    if (ev.type === 'message_status') {
      const cached = cache.get(ev.payload.chatJid);
      if (cached) cache.set(ev.payload.chatJid, WhatsappFormatHelper.applyMessageStatus(cached, ev.payload.id, ev.payload.status));
      if (ev.payload.chatJid === prev.selectedJid) {
        return { next: { ...prev, messages: WhatsappFormatHelper.applyMessageStatus(prev.messages, ev.payload.id, ev.payload.status) }, shouldRefreshChats: false, shouldMarkReadJid: null };
      }
      return { next: prev, shouldRefreshChats: false, shouldMarkReadJid: null };
    }
    if (ev.type === 'history_sync') return { next: prev, shouldRefreshChats: true, shouldMarkReadJid: null };
    if (ev.type === 'session_cleared') {
      cache.clear();
      return { next: { ...prev, chats: [], messages: [], selectedJid: null, totalUnread: 0 }, shouldRefreshChats: false, shouldMarkReadJid: null };
    }
    return { next: prev, shouldRefreshChats: false, shouldMarkReadJid: null };
  }

  public static applyChatImportanceUpdate(prev: WhatsappStoreSnapshot, updated: WhatsappChatDto, _imp: CustomerImportanceCode): WhatsappStoreSnapshot {
    const chats = WhatsappFormatHelper.matchesFilter(updated, prev.importanceFilter)
      ? WhatsappFormatHelper.upsertAndSortChats(prev.chats, updated, prev.sortBy)
      : prev.chats.filter((c) => c.jid !== updated.jid);
    return { ...prev, chats, totalUnread: this.computeTotalUnread(chats) };
  }
}

