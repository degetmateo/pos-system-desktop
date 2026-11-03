import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from '../migration.interface';

const REQUIRED_CHAT_COLS = [
  'jid', 'name', 'phone', 'is_group', 'unread_count',
  'last_message_text', 'last_message_timestamp', 'last_message_from_me', 'pinned', 'updated_at',
];

const REQUIRED_MSG_COLS = [
  'id', 'chat_jid', 'sender_jid', 'sender_name', 'from_me',
  'body', 'message_type', 'media_path', 'mime_type', 'file_name', 'status', 'timestamp',
];

interface TableColInfo {
  name: string;
  pk: number;
}

export function reconcileWhatsappTables(db: DatabaseInstance): void {
  const chatInfo = db.prepare('PRAGMA table_info(whatsapp_chats)').all() as TableColInfo[];
  if (chatInfo.length > 0) {
    const names = chatInfo.map((c) => c.name.toLowerCase());
    const jidPk = chatInfo.find((c) => c.name.toLowerCase() === 'jid')?.pk === 1;
    if (!jidPk || !REQUIRED_CHAT_COLS.every((col) => names.includes(col))) {
      db.exec('DROP TABLE IF EXISTS whatsapp_chats;');
    }
  }

  const msgInfo = db.prepare('PRAGMA table_info(whatsapp_messages)').all() as TableColInfo[];
  if (msgInfo.length > 0) {
    const names = msgInfo.map((c) => c.name.toLowerCase());
    const idPk = msgInfo.find((c) => c.name.toLowerCase() === 'id')?.pk === 1;
    const chatJidPk = msgInfo.find((c) => c.name.toLowerCase() === 'chat_jid')?.pk === 2;
    if (!idPk || !chatJidPk || !REQUIRED_MSG_COLS.every((col) => names.includes(col))) {
      db.exec('DROP TABLE IF EXISTS whatsapp_messages;');
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_chats (
      jid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      is_group INTEGER NOT NULL DEFAULT 0,
      unread_count INTEGER NOT NULL DEFAULT 0,
      last_message_text TEXT DEFAULT NULL,
      last_message_timestamp INTEGER NOT NULL DEFAULT 0,
      last_message_from_me INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT NOT NULL,
      chat_jid TEXT NOT NULL,
      sender_jid TEXT DEFAULT NULL,
      sender_name TEXT DEFAULT NULL,
      from_me INTEGER NOT NULL DEFAULT 0,
      body TEXT NOT NULL DEFAULT '',
      message_type TEXT NOT NULL DEFAULT 'text',
      media_path TEXT DEFAULT NULL,
      mime_type TEXT DEFAULT NULL,
      file_name TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (id, chat_jid)
    );

    CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_ts
      ON whatsapp_chats(pinned DESC, last_message_timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_name
      ON whatsapp_chats(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_ts
      ON whatsapp_messages(chat_jid, timestamp DESC);
  `);
}

export const migration006WhatsappTables: IMigration = {
  version: 6,
  name: '006_whatsapp_tables',
  up: (db: DatabaseInstance) => reconcileWhatsappTables(db),
};
