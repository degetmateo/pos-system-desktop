import {
  WhatsappChatDto,
  WhatsappChatSortMode,
  WhatsappImportanceFilter,
  WhatsappMessageDto,
  WhatsappMessageStatus,
} from '../../types/whatsapp.types';

const IMP_WEIGHT: Record<string, number> = { important: 4, normal: 3, low: 2, ignore: 1 };

export class WhatsappFormatHelper {
  public static formatChatTimestamp(ts: number, now: Date = new Date()): string {
    if (!ts || ts <= 0) return '';
    const date = new Date(ts);
    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (sameDay) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  public static formatMessageTime(ts: number): string {
    if (!ts || ts <= 0) return '';
    return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  public static getInitials(name: string): string {
    const cleaned = (name || '').replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    if (!cleaned) return 'WA';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return cleaned.slice(0, 2).toUpperCase();
  }

  public static matchesFilter(chat: WhatsappChatDto, filter: WhatsappImportanceFilter = 'all'): boolean {
    const imp = chat.importance || 'normal';
    if (filter === 'all') return true;
    if (filter === 'active') return imp !== 'ignore';
    if (filter === 'priority') return Boolean(chat.isPriorityBuyer);
    return imp === filter;
  }

  public static sortChats(list: WhatsappChatDto[], sortBy: WhatsappChatSortMode = 'recent'): WhatsappChatDto[] {
    return [...list].sort((a, b) => {
      if (sortBy === 'importance') {
        const wa = IMP_WEIGHT[a.importance || 'normal'] ?? 3;
        const wb = IMP_WEIGHT[b.importance || 'normal'] ?? 3;
        if (wa !== wb) return wb - wa;
        if (Boolean(a.isPriorityBuyer) !== Boolean(b.isPriorityBuyer)) return a.isPriorityBuyer ? -1 : 1;
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      }
      if (sortBy === 'top_buyers') {
        const sa = a.totalSpentCents || 0;
        const sb = b.totalSpentCents || 0;
        if (sa !== sb) return sb - sa;
        const oa = a.totalOrdersCount || 0;
        const ob = b.totalOrdersCount || 0;
        if (oa !== ob) return ob - oa;
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      }
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.lastMessageTimestamp - a.lastMessageTimestamp;
    });
  }

  public static upsertAndSortChats(
    list: WhatsappChatDto[],
    incoming: WhatsappChatDto,
    sortBy: WhatsappChatSortMode = 'recent'
  ): WhatsappChatDto[] {
    const filtered = list.filter((c) => c.jid !== incoming.jid);
    return this.sortChats([incoming, ...filtered], sortBy);
  }

  public static upsertAndSortMessages(list: WhatsappMessageDto[], incoming: WhatsappMessageDto): WhatsappMessageDto[] {
    const idx = list.findIndex((m) => m.id === incoming.id);
    const next = idx >= 0 ? list.map((m, i) => (i === idx ? incoming : m)) : [...list, incoming];
    return next.sort((a, b) => a.timestamp - b.timestamp);
  }

  public static applyMessageStatus(list: WhatsappMessageDto[], id: string, status: WhatsappMessageStatus): WhatsappMessageDto[] {
    return list.map((m) => (m.id === id ? { ...m, status } : m));
  }
}
