import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';

export interface IWhatsappIdentityRepository {
  saveMapping(lidJid: string, pnJid: string, contactName?: string | null): void;
  getPnForLid(lidJid: string): string | null;
  saveContactName(jid: string, contactName: string): void;
  getContactName(jid: string): string | null;
  findUnresolvedLidChatJids(): string[];
  findUniquePnChatByExactName(name: string): string | null;
  mergeLidChatIntoPn(lidJid: string, pnJid: string, preferredName?: string | null): WhatsappChat | null;
}

