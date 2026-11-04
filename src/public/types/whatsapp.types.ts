import { CustomerImportanceCode } from './api.types';

export type WhatsappConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
export type WhatsappMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'other';
export type WhatsappMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';
export type WhatsappChatSortMode = 'recent' | 'importance' | 'top_buyers';
export type WhatsappImportanceFilter = 'all' | 'active' | 'priority' | 'important' | 'normal' | 'low' | 'ignore';

export interface WhatsappStatusDto {
  status: WhatsappConnectionStatus;
  qr: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastError: string | null;
}

export interface WhatsappChatDto {
  jid: string;
  name: string;
  phone: string | null;
  customerId?: string | null;
  customerName?: string | null;
  whatsappName?: string | null;
  defaultOrderType?: 'minor' | 'major' | null;
  importance: CustomerImportanceCode;
  totalOrdersCount?: number;
  totalSpentCents?: number;
  isPriorityBuyer?: boolean;
  messageCount?: number;
  isGroup: boolean;
  unreadCount: number;
  lastMessageText: string | null;
  lastMessageTimestamp: number;
  lastMessageFromMe: boolean;
  pinned: boolean;
  updatedAt: string;
}

export interface WhatsappMessageDto {
  id: string;
  chatJid: string;
  senderJid: string | null;
  senderName: string | null;
  fromMe: boolean;
  body: string;
  messageType: WhatsappMessageType;
  mediaUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
  status: WhatsappMessageStatus;
  timestamp: number;
}

export type WhatsappRealtimeEvent =
  | { type: 'status'; payload: WhatsappStatusDto }
  | { type: 'chat_updated'; payload: WhatsappChatDto }
  | { type: 'chats_batch_updated'; payload: WhatsappChatDto[] }
  | { type: 'chat_deleted'; payload: { jid: string } }
  | { type: 'message_upsert'; payload: WhatsappMessageDto }
  | { type: 'message_status'; payload: { id: string; chatJid: string; status: WhatsappMessageStatus } }
  | { type: 'history_sync'; payload: { chatsCount: number; messagesCount: number; done?: boolean } }
  | { type: 'session_cleared'; payload: Record<string, never> };
