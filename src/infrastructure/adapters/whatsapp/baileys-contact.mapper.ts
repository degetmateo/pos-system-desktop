import type { Chat, Contact } from '@whiskeysockets/baileys';
import { IWhatsappIdentityRepository } from '../../../application/ports/whatsapp-identity-repository.port';
import { PhoneNormalizer } from '../../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';

export class BaileysContactMapper {
  public static pickChatLabel(c: Chat): string | null {
    const rawDisplay = (c as { displayName?: string | null }).displayName;
    return [c.name, rawDisplay].find((n) => PhoneNormalizer.isMeaningfulContactName(n))?.trim() || null;
  }

  public static pickContactLabel(c: Partial<Contact>): string | null {
    return [c.name, c.verifiedName, c.notify].find((n) => PhoneNormalizer.isMeaningfulContactName(n))?.trim() || null;
  }

  public static extractLidAndPn(c: Partial<Contact>): { lid: string | null; pn: string | null } {
    const lid = c.lid || (c.id?.endsWith('@lid') ? c.id : null);
    const pn = c.phoneNumber || (c.id?.endsWith('@s.whatsapp.net') ? c.id : null);
    return { lid, pn };
  }

  public static async ingestHistoryMappings(
    identityRepo: IWhatsappIdentityRepository | null,
    chats: Chat[],
    contacts: Contact[],
    lidPnMappings?: Array<{ lid: string; pn: string }>
  ): Promise<Map<string, string>> {
    if (identityRepo && lidPnMappings?.length) {
      await BackgroundTaskQueue.processInChunks(lidPnMappings, 100, (chunk) => {
        identityRepo.saveMappingsBatch(chunk.map((m) => ({ lidJid: m.lid, pnJid: m.pn })));
      }, 2);
    }

    const names = new Map<string, string>();
    await BackgroundTaskQueue.processInChunks(contacts, 75, (chunk) => {
      const mapBatch: Array<{ lidJid: string; pnJid: string; contactName?: string | null }> = [];
      const nameBatch: Array<{ jid: string; contactName: string }> = [];
      for (const c of chunk) {
        const label = this.pickContactLabel(c);
        const { lid, pn } = this.extractLidAndPn(c);
        if (lid && pn) mapBatch.push({ lidJid: lid, pnJid: pn, contactName: label });
        for (const candidate of [c.id, c.phoneNumber, c.lid]) {
          const j = WhatsappJid.tryCreate(candidate)?.getValue();
          if (j && label) {
            names.set(j, label);
            nameBatch.push({ jid: j, contactName: label });
          }
        }
      }
      if (identityRepo) {
        if (mapBatch.length > 0) identityRepo.saveMappingsBatch(mapBatch);
        if (nameBatch.length > 0) identityRepo.saveContactNamesBatch(nameBatch);
      }
    }, 2);

    await BackgroundTaskQueue.processInChunks(chats, 75, (chunk) => {
      const mapBatch: Array<{ lidJid: string; pnJid: string; contactName?: string | null }> = [];
      for (const rc of chunk) {
        const label = this.pickChatLabel(rc);
        if (rc.id && rc.pnJid) mapBatch.push({ lidJid: rc.id, pnJid: rc.pnJid, contactName: label });
        if (rc.lidJid && rc.pnJid) mapBatch.push({ lidJid: rc.lidJid, pnJid: rc.pnJid, contactName: label });
        if (rc.lidJid && rc.id?.endsWith('@s.whatsapp.net')) mapBatch.push({ lidJid: rc.lidJid, pnJid: rc.id, contactName: label });
      }
      if (identityRepo && mapBatch.length > 0) identityRepo.saveMappingsBatch(mapBatch);
    }, 2);
    return names;
  }
}
