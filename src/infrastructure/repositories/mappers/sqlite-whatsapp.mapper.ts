import { WhatsappChat } from '../../../domain/models/whatsapp-chat.entity';
import {
  WhatsappMessage,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from '../../../domain/models/whatsapp-message.entity';
import { CustomerImportanceCode } from '../../../domain/value-objects/customer-importance.vo';

export interface WhatsappChatRow {
  jid: string;
  name: string;
  phone: string | null;
  customer_id?: string | null;
  lid_jid?: string | null;
  importance?: string | null;
  is_group: number;
  unread_count: number;
  last_message_text: string | null;
  last_message_timestamp: number;
  last_message_from_me: number;
  pinned: number;
  updated_at: string;
}

export interface WhatsappMessageRow {
  id: string;
  chat_jid: string;
  sender_jid: string | null;
  sender_name: string | null;
  from_me: number;
  body: string;
  message_type: string;
  media_path: string | null;
  mime_type: string | null;
  file_name: string | null;
  status: string;
  timestamp: number;
}

export class SqliteWhatsappMapper {
  public static toChatDomain(row: WhatsappChatRow): WhatsappChat {
    return new WhatsappChat({
      jid: row.jid,
      name: row.name,
      phone: row.phone,
      customerId: row.customer_id ?? null,
      lidJid: row.lid_jid ?? null,
      importance: (row.importance as CustomerImportanceCode) || null,
      isGroup: row.is_group === 1,
      unreadCount: row.unread_count,
      lastMessageText: row.last_message_text,
      lastMessageTimestamp: row.last_message_timestamp,
      lastMessageFromMe: row.last_message_from_me === 1,
      pinned: row.pinned === 1,
      updatedAt: new Date(row.updated_at),
    });
  }

  public static toMessageDomain(row: WhatsappMessageRow): WhatsappMessage {
    return new WhatsappMessage({
      id: row.id,
      chatJid: row.chat_jid,
      senderJid: row.sender_jid,
      senderName: row.sender_name,
      fromMe: row.from_me === 1,
      body: row.body,
      messageType: (row.message_type as WhatsappMessageType) || 'text',
      mediaPath: row.media_path,
      mimeType: row.mime_type,
      fileName: row.file_name,
      status: (row.status as WhatsappMessageStatus) || 'sent',
      timestamp: row.timestamp,
    });
  }
}
