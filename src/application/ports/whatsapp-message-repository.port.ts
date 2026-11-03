import { WhatsappMessage, WhatsappMessageStatus } from '../../domain/models/whatsapp-message.entity';

export interface IWhatsappMessageRepository {
  upsert(message: WhatsappMessage): Promise<void>;
  upsertBatch(messages: WhatsappMessage[]): Promise<void>;
  findByChatJid(chatJid: string, limit?: number, beforeTimestamp?: number): Promise<WhatsappMessage[]>;
  findById(id: string, chatJid: string): Promise<WhatsappMessage | null>;
  updateStatus(id: string, chatJid: string, status: WhatsappMessageStatus): Promise<void>;
  clearAll(): Promise<void>;
}

