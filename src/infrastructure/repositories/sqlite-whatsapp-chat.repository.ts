import { Database as DatabaseInstance, Statement } from 'better-sqlite3';
import { WhatsappChatDto, WhatsappChatListOptions } from '../../application/dtos/whatsapp.dto';
import { IWhatsappChatRepository } from '../../application/ports/whatsapp-chat-repository.port';
import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { CustomerImportanceCode } from '../../domain/value-objects/customer-importance.vo';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { BackgroundTaskQueue } from '../concurrency/background-task.queue';
import { SqliteWhatsappMapper, WhatsappChatRow } from './mappers/sqlite-whatsapp.mapper';
import { SqliteSearchRelevanceBuilder } from './search/sqlite-search-relevance.builder';
import { SqliteWhatsappChatEnricher } from './sqlite-whatsapp-chat.enricher';

export class SqliteWhatsappChatRepository implements IWhatsappChatRepository {
  private readonly enricher: SqliteWhatsappChatEnricher;
  private upsertStmt: Statement | null = null;

  constructor(private readonly db: DatabaseInstance) {
    this.enricher = new SqliteWhatsappChatEnricher(db);
  }

  private getUpsertStmt(): Statement {
    if (!this.upsertStmt) {
      this.upsertStmt = this.db.prepare(`
        INSERT INTO whatsapp_chats (
          jid, name, phone, customer_id, lid_jid, importance, is_group, unread_count,
          last_message_text, last_message_timestamp, last_message_from_me, pinned, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(jid) DO UPDATE SET
          name = CASE WHEN ? = 1 THEN excluded.name ELSE whatsapp_chats.name END,
          phone = COALESCE(excluded.phone, whatsapp_chats.phone),
          customer_id = COALESCE(excluded.customer_id, whatsapp_chats.customer_id),
          lid_jid = COALESCE(excluded.lid_jid, whatsapp_chats.lid_jid),
          importance = COALESCE(excluded.importance, whatsapp_chats.importance),
          is_group = excluded.is_group,
          unread_count = excluded.unread_count,
          last_message_text = CASE
            WHEN excluded.last_message_timestamp >= whatsapp_chats.last_message_timestamp AND excluded.last_message_text IS NOT NULL
            THEN excluded.last_message_text
            ELSE COALESCE(whatsapp_chats.last_message_text, excluded.last_message_text)
          END,
          last_message_timestamp = MAX(excluded.last_message_timestamp, whatsapp_chats.last_message_timestamp),
          last_message_from_me = CASE
            WHEN excluded.last_message_timestamp >= whatsapp_chats.last_message_timestamp
            THEN excluded.last_message_from_me
            ELSE whatsapp_chats.last_message_from_me
          END,
          pinned = excluded.pinned,
          updated_at = excluded.updated_at
      `);
    }
    return this.upsertStmt;
  }

  private upsertOne(chat: WhatsappChat): void {
    const meaningfulIncoming = PhoneNormalizer.isMeaningfulContactName(chat.name) ? 1 : 0;
    this.getUpsertStmt().run(
      chat.jid.getValue(), chat.name, chat.phone, chat.customerId, chat.lidJid, chat.importance,
      chat.isGroup ? 1 : 0, chat.unreadCount, chat.lastMessageText, chat.lastMessageTimestamp,
      chat.lastMessageFromMe ? 1 : 0, chat.pinned ? 1 : 0, chat.updatedAt.toISOString(),
      meaningfulIncoming
    );
  }

  public async upsert(chat: WhatsappChat): Promise<void> { this.upsertOne(chat); }

  public async upsertBatch(chats: WhatsappChat[]): Promise<void> {
    if (chats.length === 0) return;
    const tx = this.db.transaction((items: WhatsappChat[]) => { for (const c of items) this.upsertOne(c); });
    await BackgroundTaskQueue.processInChunks(chats, 100, (chunk) => { tx(chunk); });
  }

  public async findByJid(jid: string): Promise<WhatsappChat | null> {
    const row = this.db.prepare('SELECT * FROM whatsapp_chats WHERE jid = ?').get(jid) as WhatsappChatRow | undefined;
    return row ? SqliteWhatsappMapper.toChatDomain(row) : null;
  }

  public async findAll(search?: string, limit: number = 100): Promise<WhatsappChat[]> {
    const rel = SqliteSearchRelevanceBuilder.build(search, ['name', 'phone', 'last_message_text']);
    const selectCols = rel.hasSearch ? `*, ${rel.scoreSelect}` : '*';
    const whereSql = rel.hasSearch ? `WHERE ${rel.whereClause}` : '';
    const orderSql = rel.orderClause('ORDER BY pinned DESC, last_message_timestamp DESC');
    const rows = this.db
      .prepare(`SELECT ${selectCols} FROM whatsapp_chats ${whereSql} ${orderSql} LIMIT ?`)
      .all(...rel.scoreParams, ...rel.whereParams, limit) as WhatsappChatRow[];
    return rows.map(SqliteWhatsappMapper.toChatDomain);
  }

  public async findEnrichedByJid(jid: string): Promise<WhatsappChatDto | null> { return this.enricher.findByJid(jid); }
  public async findEnrichedByJids(jids: string[]): Promise<WhatsappChatDto[]> { return this.enricher.findByJids(jids); }
  public async findAllEnriched(options?: WhatsappChatListOptions): Promise<WhatsappChatDto[]> { return this.enricher.findAll(options); }

  public async linkCustomer(jid: string, customerId: string, preferredChatName?: string | null): Promise<void> {
    const row = this.db.prepare('SELECT name FROM whatsapp_chats WHERE jid = ?').get(jid) as { name: string } | undefined;
    if (!row) return;
    const nextName = !PhoneNormalizer.isMeaningfulContactName(row.name) && PhoneNormalizer.isMeaningfulContactName(preferredChatName)
      ? preferredChatName!.trim() : row.name;
    this.db.prepare('UPDATE whatsapp_chats SET customer_id = ?, name = ?, updated_at = ? WHERE jid = ?')
      .run(customerId, nextName, new Date().toISOString(), jid);
  }

  public async updateImportance(jid: string, importance: CustomerImportanceCode): Promise<void> {
    this.db.prepare('UPDATE whatsapp_chats SET importance = ?, updated_at = ? WHERE jid = ?').run(importance, new Date().toISOString(), jid);
  }

  public async markAsRead(jid: string): Promise<void> {
    this.db.prepare('UPDATE whatsapp_chats SET unread_count = 0, updated_at = ? WHERE jid = ?').run(new Date().toISOString(), jid);
  }

  public async clearAll(): Promise<void> { this.db.prepare('DELETE FROM whatsapp_chats').run(); }
}
