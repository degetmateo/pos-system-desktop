import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from '../migration.interface';

/**
 * Migración v9: Purga mensajes residuales de estados (`status@broadcast`), canales (`@newsletter`),
 * listas de difusión (`@broadcast`) y tramas vacías de protocolo (`other`) en `whatsapp_messages`,
 * y sincroniza la vista previa de `whatsapp_chats` con el último mensaje real de cada conversación.
 */
export const migration009PurgeWhatsappStatusMessages: IMigration = {
  version: 9,
  name: '009_purge_whatsapp_status_and_non_chat_messages',
  up: (db: DatabaseInstance) => {
    db.exec(`
      DELETE FROM whatsapp_messages
      WHERE LOWER(chat_jid) = 'status@broadcast'
         OR LOWER(chat_jid) LIKE '%@broadcast'
         OR LOWER(chat_jid) LIKE '%@newsletter'
         OR LOWER(COALESCE(sender_jid, '')) LIKE '%@broadcast'
         OR LOWER(COALESCE(sender_jid, '')) LIKE '%@newsletter'
         OR (message_type = 'other' AND TRIM(COALESCE(body, '')) = '' AND media_path IS NULL)
         OR (chat_jid NOT LIKE '%@g.us' AND from_me = 1 AND sender_jid IS NOT NULL)
         OR (chat_jid NOT LIKE '%@g.us' AND sender_jid LIKE '%:%@%');

      DELETE FROM whatsapp_chats
      WHERE LOWER(jid) = 'status@broadcast'
         OR LOWER(jid) LIKE '%@broadcast'
         OR LOWER(jid) LIKE '%@newsletter';
    `);
  },
};

