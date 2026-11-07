import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from '../migration.interface';

/**
 * Migración v10: Remoción definitiva de tablas e índices de WhatsApp.
 */
export const migration010DropWhatsappTables: IMigration = {
  version: 10,
  name: '010_drop_whatsapp_tables',
  up: (db: DatabaseInstance) => {
    db.exec(`
      DROP TABLE IF EXISTS whatsapp_messages;
      DROP TABLE IF EXISTS whatsapp_chats;
      DROP TABLE IF EXISTS whatsapp_lid_mappings;
      DROP INDEX IF EXISTS idx_whatsapp_messages_chat_jid;
      DROP INDEX IF EXISTS idx_whatsapp_messages_timestamp;
      DROP INDEX IF EXISTS idx_whatsapp_chats_last_timestamp;
      DROP INDEX IF EXISTS idx_whatsapp_chats_pinned;
      DROP INDEX IF EXISTS idx_whatsapp_chats_customer_id;
      DROP INDEX IF EXISTS idx_whatsapp_lid_mappings_pn;
    `);
  },
};

