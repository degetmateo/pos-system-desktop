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
    await BackgroundTaskQueue.processInChunks(lidPnMappings || [], 120, (chunk) => {
      for (const m of chunk) identityRepo?.saveMapping(m.lid, m.pn);
    });

    const names = new Map<string, string>();
    await BackgroundTaskQueue.processInChunks(contacts, 80, (chunk) => {
      for (const c of chunk) {
        const label = this.pickContactLabel(c);
        const { lid, pn } = this.extractLidAndPn(c);
        if (lid && pn) identityRepo?.saveMapping(lid, pn, label);
        for (const candidate of [c.id, c.phoneNumber, c.lid]) {
          const j = WhatsappJid.tryCreate(candidate)?.getValue();
          if (j && label) {
            names.set(j, label);
            identityRepo?.saveContactName(j, label);
          }
        }
      }
    });

    await BackgroundTaskQueue.processInChunks(chats, 80, (chunk) => {
      for (const rc of chunk) {
        const label = this.pickChatLabel(rc);
        if (rc.id && rc.pnJid) identityRepo?.saveMapping(rc.id, rc.pnJid, label);
        if (rc.lidJid && rc.pnJid) identityRepo?.saveMapping(rc.lidJid, rc.pnJid, label);
        if (rc.lidJid && rc.id?.endsWith('@s.whatsapp.net')) identityRepo?.saveMapping(rc.lidJid, rc.id, label);
      }
    });
    return names;
  }
}
