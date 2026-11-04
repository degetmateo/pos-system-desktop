import { Database as DatabaseInstance } from 'better-sqlite3';
import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../domain/value-objects/whatsapp-jid.vo';
import { SqliteWhatsappMapper, WhatsappChatRow, WhatsappMessageRow } from './mappers/sqlite-whatsapp.mapper';

/**
 * Fusionador de identidades LID/PN para SQLite (PEAA Transaction Script + GoF Command).
 * Reasigna mensajes y consolida chats duplicados dentro de una transacción atómica.
 */
export class SqliteWhatsappIdentityMerger {
  public static merge(
    db: DatabaseInstance,
    lid: WhatsappJid,
    pn: WhatsappJid,
    preferredName: string | null | undefined,
    contactNameGetter: (jid: string) => string | null,
    saveMappingFn: (lidStr: string, pnStr: string, name?: string | null) => void
  ): WhatsappChat | null {
    return db.transaction((): WhatsappChat | null => {
      saveMappingFn(lid.getValue(), pn.getValue(), preferredName);
      const lidRow = db.prepare('SELECT * FROM whatsapp_chats WHERE jid = ?').get(lid.getValue()) as WhatsappChatRow | undefined;
      const pnRow = db.prepare('SELECT * FROM whatsapp_chats WHERE jid = ?').get(pn.getValue()) as WhatsappChatRow | undefined;

      db.prepare(`
        INSERT OR IGNORE INTO whatsapp_messages (id, chat_jid, sender_jid, sender_name, from_me, body, message_type, media_path, mime_type, file_name, status, timestamp)
        SELECT id, ?, sender_jid, sender_name, from_me, body, message_type, media_path, mime_type, file_name, status, timestamp
        FROM whatsapp_messages WHERE chat_jid = ?
      `).run(pn.getValue(), lid.getValue());
      db.prepare('DELETE FROM whatsapp_messages WHERE chat_jid = ?').run(lid.getValue());
      if (!lidRow && !pnRow) return null;

      const bestName = [preferredName, contactNameGetter(pn.getValue()), pnRow?.name, lidRow?.name]
        .find((n) => PhoneNormalizer.isMeaningfulContactName(n)) || null;
      const latestRaw = db.prepare('SELECT * FROM whatsapp_messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1')
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

      db.prepare('DELETE FROM whatsapp_chats WHERE jid = ?').run(lid.getValue());
      db.prepare(`
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

