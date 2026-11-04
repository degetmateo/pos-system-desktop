import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  ContactNameEntry,
  IdentityMappingEntry,
  IWhatsappIdentityRepository,
} from '../../application/ports/whatsapp-identity-repository.port';
import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../domain/value-objects/whatsapp-jid.vo';
import { SqliteWhatsappIdentityMerger } from './sqlite-whatsapp-identity.merger';

export class SqliteWhatsappIdentityRepository implements IWhatsappIdentityRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public saveMapping(lidJid: string, pnJid: string, contactName?: string | null): void {
    this.saveMappingsBatch([{ lidJid, pnJid, contactName }]);
  }

  public saveMappingsBatch(mappings: IdentityMappingEntry[]): void {
    if (mappings.length === 0) return;
    const stmt = this.db.prepare(`
      INSERT INTO whatsapp_lid_mappings (lid_jid, pn_jid, contact_name, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(lid_jid) DO UPDATE SET
        pn_jid = excluded.pn_jid,
        contact_name = COALESCE(excluded.contact_name, whatsapp_lid_mappings.contact_name),
        updated_at = excluded.updated_at
    `);
    const now = new Date().toISOString();
    const tx = this.db.transaction((items: IdentityMappingEntry[]) => {
      for (const m of items) {
        const lid = WhatsappJid.tryCreate(m.lidJid);
        const pn = WhatsappJid.tryCreate(m.pnJid);
        if (!lid?.isLid() || !pn?.isPhoneJid()) continue;
        const cleanName = PhoneNormalizer.isMeaningfulContactName(m.contactName) ? m.contactName!.trim() : null;
        stmt.run(lid.getValue(), pn.getValue(), cleanName, now);
      }
    });
    tx(mappings);
  }

  public getPnForLid(lidJid: string): string | null {
    const lid = WhatsappJid.tryCreate(lidJid);
    if (!lid?.isLid()) return null;
    const row = this.db.prepare('SELECT pn_jid FROM whatsapp_lid_mappings WHERE lid_jid = ?')
      .get(lid.getValue()) as { pn_jid: string } | undefined;
    return row?.pn_jid || null;
  }

  public saveContactName(jid: string, contactName: string): void {
    this.saveContactNamesBatch([{ jid, contactName }]);
  }

  public saveContactNamesBatch(entries: ContactNameEntry[]): void {
    if (entries.length === 0) return;
    const updateLid = this.db.prepare('UPDATE whatsapp_lid_mappings SET contact_name = ?, updated_at = ? WHERE lid_jid = ?');
    const updatePn = this.db.prepare('UPDATE whatsapp_lid_mappings SET contact_name = ?, updated_at = ? WHERE pn_jid = ?');
    const now = new Date().toISOString();
    const tx = this.db.transaction((items: ContactNameEntry[]) => {
      for (const e of items) {
        const parsed = WhatsappJid.tryCreate(e.jid);
        if (!parsed || !PhoneNormalizer.isMeaningfulContactName(e.contactName)) continue;
        const stmt = parsed.isLid() ? updateLid : updatePn;
        stmt.run(e.contactName.trim(), now, parsed.getValue());
      }
    });
    tx(entries);
  }

  public getContactName(jid: string): string | null {
    const parsed = WhatsappJid.tryCreate(jid);
    if (!parsed) return null;
    const col = parsed.isLid() ? 'lid_jid' : 'pn_jid';
    const row = this.db.prepare(`SELECT contact_name FROM whatsapp_lid_mappings WHERE ${col} = ? AND contact_name IS NOT NULL LIMIT 1`)
      .get(parsed.getValue()) as { contact_name: string } | undefined;
    return row?.contact_name || null;
  }

  public findUnresolvedLidChatJids(): string[] {
    const rows = this.db.prepare("SELECT jid FROM whatsapp_chats WHERE jid LIKE '%@lid'").all() as Array<{ jid: string }>;
    return rows.map((r) => r.jid);
  }

  public findUniquePnChatByExactName(name: string): string | null {
    if (!PhoneNormalizer.isMeaningfulContactName(name)) return null;
    const rows = this.db.prepare(
      "SELECT jid FROM whatsapp_chats WHERE jid LIKE '%@s.whatsapp.net' AND LOWER(TRIM(name)) = LOWER(TRIM(?))"
    ).all(name.trim()) as Array<{ jid: string }>;
    return rows.length === 1 ? rows[0].jid : null;
  }

  public mergeLidChatIntoPn(lidJid: string, pnJid: string, preferredName?: string | null): WhatsappChat | null {
    const lid = WhatsappJid.tryCreate(lidJid);
    const pn = WhatsappJid.tryCreate(pnJid);
    if (!lid?.isLid() || !pn?.isPhoneJid()) return null;
    return SqliteWhatsappIdentityMerger.merge(
      this.db, lid, pn, preferredName,
      (j) => this.getContactName(j),
      (l, p, n) => this.saveMapping(l, p, n)
    );
  }
}
