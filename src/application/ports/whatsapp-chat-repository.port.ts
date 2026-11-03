import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { CustomerImportanceCode } from '../../domain/value-objects/customer-importance.vo';
import { WhatsappChatDto, WhatsappChatListOptions } from '../dtos/whatsapp.dto';

export interface IWhatsappChatRepository {
  upsert(chat: WhatsappChat): Promise<void>;
  upsertBatch(chats: WhatsappChat[]): Promise<void>;
  findByJid(jid: string): Promise<WhatsappChat | null>;
  findAll(search?: string, limit?: number): Promise<WhatsappChat[]>;
  findEnrichedByJid(jid: string): Promise<WhatsappChatDto | null>;
  findAllEnriched(options?: WhatsappChatListOptions): Promise<WhatsappChatDto[]>;
  linkCustomer(jid: string, customerId: string, preferredChatName?: string | null): Promise<void>;
  updateImportance(jid: string, importance: CustomerImportanceCode): Promise<void>;
  markAsRead(jid: string): Promise<void>;
  clearAll(): Promise<void>;
}
