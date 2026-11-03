import { Database as DatabaseInstance, Statement } from 'better-sqlite3';
import { IWhatsappMessageRepository } from '../../application/ports/whatsapp-message-repository.port';
import { WhatsappMessage, WhatsappMessageStatus } from '../../domain/models/whatsapp-message.entity';
import { BackgroundTaskQueue } from '../concurrency/background-task.queue';
import { SqliteWhatsappMapper, WhatsappMessageRow } from './mappers/sqlite-whatsapp.mapper';

export class SqliteWhatsappMessageRepository implements IWhatsappMessageRepository {
  private upsertStmt: Statement | null = null;

  constructor(private readonly db: DatabaseInstance) {}

  private getUpsertStmt(): Statement {
    if (!this.upsertStmt) {
      this.upsertStmt = this.db.prepare(`
        INSERT INTO whatsapp_messages (
          id, chat_jid, sender_jid, sender_name, from_me,
          body, message_type, media_path, mime_type, file_name, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id, chat_jid) DO UPDATE SET
          body = CASE WHEN excluded.body != '' THEN excluded.body ELSE whatsapp_messages.body END,
          media_path = COALESCE(excluded.media_path, whatsapp_messages.media_path),
          mime_type = COALESCE(excluded.mime_type, whatsapp_messages.mime_type),
          file_name = COALESCE(excluded.file_name, whatsapp_messages.file_name),
          status = excluded.status,
          timestamp = excluded.timestamp
      `);
    }
    return this.upsertStmt;
  }

  private upsertOne(msg: WhatsappMessage): void {
    this.getUpsertStmt().run(
      msg.id, msg.chatJid.getValue(), msg.senderJid, msg.senderName,
      msg.fromMe ? 1 : 0, msg.body, msg.messageType, msg.mediaPath,
      msg.mimeType, msg.fileName, msg.status, msg.timestamp
    );
  }

  public async upsert(message: WhatsappMessage): Promise<void> {
    this.upsertOne(message);
  }

  public async upsertBatch(messages: WhatsappMessage[]): Promise<void> {
    if (messages.length === 0) return;
    const tx = this.db.transaction((items: WhatsappMessage[]) => {
      for (const m of items) this.upsertOne(m);
    });
    await BackgroundTaskQueue.processInChunks(messages, 150, (chunk) => {
      tx(chunk);
    });
  }

  public async findByChatJid(chatJid: string, limit: number = 80, beforeTimestamp?: number): Promise<WhatsappMessage[]> {
    const rows = beforeTimestamp
      ? (this.db
          .prepare('SELECT * FROM whatsapp_messages WHERE chat_jid = ? AND timestamp < ? ORDER BY timestamp DESC LIMIT ?')
          .all(chatJid, beforeTimestamp, limit) as WhatsappMessageRow[])
      : (this.db
          .prepare('SELECT * FROM whatsapp_messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT ?')
          .all(chatJid, limit) as WhatsappMessageRow[]);

    return rows.reverse().map(SqliteWhatsappMapper.toMessageDomain);
  }

  public async findById(id: string, chatJid: string): Promise<WhatsappMessage | null> {
    const row = this.db
      .prepare('SELECT * FROM whatsapp_messages WHERE id = ? AND chat_jid = ?')
      .get(id, chatJid) as WhatsappMessageRow | undefined;
    return row ? SqliteWhatsappMapper.toMessageDomain(row) : null;
  }

  public async updateStatus(id: string, chatJid: string, status: WhatsappMessageStatus): Promise<void> {
    this.db
      .prepare('UPDATE whatsapp_messages SET status = ? WHERE id = ? AND chat_jid = ?')
      .run(status, id, chatJid);
  }

  public async clearAll(): Promise<void> {
    this.db.prepare('DELETE FROM whatsapp_messages').run();
  }
}
