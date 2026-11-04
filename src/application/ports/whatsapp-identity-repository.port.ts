import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';

export interface IdentityMappingEntry {
  lidJid: string;
  pnJid: string;
  contactName?: string | null;
}

export interface ContactNameEntry {
  jid: string;
  contactName: string;
}

export interface IWhatsappIdentityRepository {
  saveMapping(lidJid: string, pnJid: string, contactName?: string | null): void;
  saveMappingsBatch(mappings: IdentityMappingEntry[]): void;
  getPnForLid(lidJid: string): string | null;
  saveContactName(jid: string, contactName: string): void;
  saveContactNamesBatch(entries: ContactNameEntry[]): void;
  getContactName(jid: string): string | null;
  findUnresolvedLidChatJids(): string[];
  findUniquePnChatByExactName(name: string): string | null;
  mergeLidChatIntoPn(lidJid: string, pnJid: string, preferredName?: string | null): WhatsappChat | null;
}

