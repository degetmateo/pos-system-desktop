import { Database as DatabaseInstance } from 'better-sqlite3';
import { IWhatsappIdentityRepository } from '../../application/ports/whatsapp-identity-repository.port';
import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../domain/value-objects/whatsapp-jid.vo';
import { SqliteWhatsappMapper, WhatsappChatRow, WhatsappMessageRow } from './mappers/sqlite-whatsapp.mapper';

export class SqliteWhatsappIdentityRepository implements IWhatsappIdentityRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public saveMapping(lidJid: string, pnJid: string, contactName?: string | null): void {
    const lid = WhatsappJid.tryCreate(lidJid);
    const pn = WhatsappJid.tryCreate(pnJid);
    if (!lid?.isLid() || !pn?.isPhoneJid()) return;
    const cleanName = PhoneNormalizer.isMeaningfulContactName(contactName) ? contactName!.trim() : null;
    this.db.prepare(`
      INSERT INTO whatsapp_lid_mappings (lid_jid, pn_jid, contact_name, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(lid_jid) DO UPDATE SET
        pn_jid = excluded.pn_jid,
        contact_name = COALESCE(excluded.contact_name, whatsapp_lid_mappings.contact_name),
        updated_at = excluded.updated_at
    `).run(lid.getValue(), pn.getValue(), cleanName, new Date().toISOString());
  }

  public getPnForLid(lidJid: string): string | null {
    const lid = WhatsappJid.tryCreate(lidJid);
    if (!lid?.isLid()) return null;
    const row = this.db.prepare('SELECT pn_jid FROM whatsapp_lid_mappings WHERE lid_jid = ?')
      .get(lid.getValue()) as { pn_jid: string } | undefined;
    return row?.pn_jid || null;
  }

  public saveContactName(jid: string, contactName: string): void {
    const parsed = WhatsappJid.tryCreate(jid);
    if (!parsed || !PhoneNormalizer.isMeaningfulContactName(contactName)) return;
    const col = parsed.isLid() ? 'lid_jid' : 'pn_jid';
    this.db.prepare(`UPDATE whatsapp_lid_mappings SET contact_name = ?, updated_at = ? WHERE ${col} = ?`)
      .run(contactName.trim(), new Date().toISOString(), parsed.getValue());
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

    return this.db.transaction((): WhatsappChat | null => {
      this.saveMapping(lid.getValue(), pn.getValue(), preferredName);
      const lidRow = this.db.prepare('SELECT * FROM whatsapp_chats WHERE jid = ?').get(lid.getValue()) as WhatsappChatRow | undefined;
      const pnRow = this.db.prepare('SELECT * FROM whatsapp_chats WHERE jid = ?').get(pn.getValue()) as WhatsappChatRow | undefined;

      this.db.prepare(`
        INSERT OR IGNORE INTO whatsapp_messages (id, chat_jid, sender_jid, sender_name, from_me, body, message_type, media_path, mime_type, file_name, status, timestamp)
        SELECT id, ?, sender_jid, sender_name, from_me, body, message_type, media_path, mime_type, file_name, status, timestamp
        FROM whatsapp_messages WHERE chat_jid = ?
      `).run(pn.getValue(), lid.getValue());
      this.db.prepare('DELETE FROM whatsapp_messages WHERE chat_jid = ?').run(lid.getValue());
      if (!lidRow && !pnRow) return null;

      const bestName = [preferredName, this.getContactName(pn.getValue()), pnRow?.name, lidRow?.name]
        .find((n) => PhoneNormalizer.isMeaningfulContactName(n)) || null;
      const latestRaw = this.db.prepare('SELECT * FROM whatsapp_messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1')
        .get(pn.getValue()) as WhatsappMessageRow | undefined;
      const latest = latestRaw ? SqliteWhatsappMapper.toMessageDomain(latestRaw) : null;

      const merged = new WhatsappChat({
        jid: pn, name: bestName, phone: pn.getPhone(),
        customerId: pnRow?.customer_id || lidRow?.customer_id || null,
        lidJid: lid.getValue(), importance: ((pnRow?.importance || lidRow?.importance) as any) || null,
        unreadCount: (pnRow?.unread_count || 0) + (lidRow?.unread_count || 0),
        lastMessageText: latest?.previewText() || pnRow?.last_message_text || lidRow?.last_message_text || null,
        lastMessageTimestamp: Math.max(latest?.timestamp || 0, pnRow?.last_message_timestamp || 0, lidRow?.last_message_timestamp || 0),
        lastMessageFromMe: latest ? latest.fromMe : Boolean(pnRow?.last_message_from_me ?? lidRow?.last_message_from_me),
        pinned: Boolean(pnRow?.pinned || lidRow?.pinned),
      });

      this.db.prepare('DELETE FROM whatsapp_chats WHERE jid = ?').run(lid.getValue());
      this.db.prepare(`
        INSERT INTO whatsapp_chats (jid, name, phone, customer_id, lid_jid, importance, is_group, unread_count, last_message_text, last_message_timestamp, last_message_from_me, pinned, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(jid) DO UPDATE SET
          name = excluded.name, phone = excluded.phone, customer_id = excluded.customer_id, lid_jid = excluded.lid_jid,
          importance = excluded.importance, unread_count = excluded.unread_count, last_message_text = excluded.last_message_text,
          last_message_timestamp = excluded.last_message_timestamp, last_message_from_me = excluded.last_message_from_me,
          pinned = excluded.pinned, updated_at = excluded.updated_at
      `).run(
        merged.jid.getValue(), merged.name, merged.phone, merged.customerId, merged.lidJid, merged.importance,
        merged.unreadCount, merged.lastMessageText, merged.lastMessageTimestamp,
        merged.lastMessageFromMe ? 1 : 0, merged.pinned ? 1 : 0, merged.updatedAt.toISOString()
      );
      return merged;
    })();
  }
}
