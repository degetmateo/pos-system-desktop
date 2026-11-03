import { WhatsappMessage } from '../../domain/models/whatsapp-message.entity';
import { SendWhatsappMediaInput, WhatsappStatusDto } from '../dtos/whatsapp.dto';

export interface IWhatsappClientPort {
  getStatus(): WhatsappStatusDto;
  connect(): Promise<void>;
  connectIfSessionExists(): Promise<void>;
  disconnect(): Promise<void>;
  logout(): Promise<void>;
  sendTextMessage(jid: string, text: string): Promise<WhatsappMessage>;
  sendMediaMessage(input: SendWhatsappMediaInput): Promise<WhatsappMessage>;
  markChatRead(jid: string, messageKeys?: Array<{ id: string; fromMe: boolean }>): Promise<void>;
  resolveMediaFilePath(relativePath: string): string | null;
}

