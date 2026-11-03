import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from '../migration.interface';

function ensureColumn(db: DatabaseInstance, table: string, col: string, def: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name.toLowerCase() === col.toLowerCase())) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }
}

export const migration008WhatsappCrmAndStats: IMigration = {
  version: 8,
  name: '008_whatsapp_crm_lid_and_stats',
  up: (db: DatabaseInstance) => {
    ensureColumn(db, 'customers', 'whatsapp_name', 'TEXT DEFAULT NULL');
    ensureColumn(db, 'customers', 'importance', "TEXT NOT NULL DEFAULT 'normal'");

    ensureColumn(db, 'whatsapp_chats', 'customer_id', 'TEXT DEFAULT NULL');
    ensureColumn(db, 'whatsapp_chats', 'lid_jid', 'TEXT DEFAULT NULL');
    ensureColumn(db, 'whatsapp_chats', 'importance', 'TEXT DEFAULT NULL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_lid_mappings (
        lid_jid TEXT PRIMARY KEY,
        pn_jid TEXT NOT NULL,
        contact_name TEXT DEFAULT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_name
        ON customers(whatsapp_name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_customers_importance
        ON customers(importance);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_customer_id
        ON whatsapp_chats(customer_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_lid_pn
        ON whatsapp_lid_mappings(pn_jid);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_ts
        ON whatsapp_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_me_ts
        ON whatsapp_messages(from_me, timestamp);
    `);

    db.prepare(`
      UPDATE whatsapp_chats
      SET name = 'Contacto de WhatsApp'
      WHERE jid LIKE '%@lid'
        AND name GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'
    `).run();
  },
};

