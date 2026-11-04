import { Database as DatabaseInstance } from 'better-sqlite3';
import { WhatsappChatDto, WhatsappChatListOptions } from '../../application/dtos/whatsapp.dto';
import { CustomerImportanceCode } from '../../domain/value-objects/customer-importance.vo';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { SqliteSearchRelevanceBuilder } from './search/sqlite-search-relevance.builder';

interface EnrichedChatRow {
  jid: string;
  name: string;
  phone: string | null;
  customer_id: string | null;
  chat_importance: string | null;
  is_group: number;
  unread_count: number;
  last_message_text: string | null;
  last_message_timestamp: number;
  last_message_from_me: number;
  pinned: number;
  updated_at: string;
  customer_name: string | null;
  whatsapp_name: string | null;
  default_order_type: string | null;
  customer_importance: string | null;
  orders_count: number;
  total_spent_cents: number;
  message_count: number;
}

const PRIORITY_ORDERS = 2;
const PRIORITY_SPENT_CENTS = 5_000_000;

const SINGLE_SELECT = `
  SELECT
    wc.jid, wc.name, wc.phone, wc.customer_id, wc.importance AS chat_importance,
    wc.is_group, wc.unread_count, wc.last_message_text, wc.last_message_timestamp,
    wc.last_message_from_me, wc.pinned, wc.updated_at,
    c.name AS customer_name, c.whatsapp_name, c.default_order_type, c.importance AS customer_importance,
    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.customer_id = wc.customer_id), 0) AS orders_count,
    COALESCE((SELECT SUM(o.total_price) FROM orders o WHERE o.customer_id = wc.customer_id), 0) AS total_spent_cents,
    (SELECT COUNT(*) FROM whatsapp_messages wm WHERE wm.chat_jid = wc.jid) AS message_count
  FROM whatsapp_chats wc
  LEFT JOIN customers c ON c.id = wc.customer_id
  WHERE wc.jid = ?
`;

const LIST_SELECT = `
  SELECT
    wc.jid, wc.name, wc.phone, wc.customer_id, wc.importance AS chat_importance,
    wc.is_group, wc.unread_count, wc.last_message_text, wc.last_message_timestamp,
    wc.last_message_from_me, wc.pinned, wc.updated_at,
    c.name AS customer_name, c.whatsapp_name, c.default_order_type, c.importance AS customer_importance,
    COALESCE(os.orders_count, 0) AS orders_count,
    COALESCE(os.total_spent_cents, 0) AS total_spent_cents,
    COALESCE(ms.msg_count, 0) AS message_count
  FROM whatsapp_chats wc
  LEFT JOIN customers c ON c.id = wc.customer_id
  LEFT JOIN (
    SELECT customer_id, COUNT(*) AS orders_count, COALESCE(SUM(total_price), 0) AS total_spent_cents
    FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id
  ) os ON os.customer_id = wc.customer_id
  LEFT JOIN (
    SELECT chat_jid, COUNT(*) AS msg_count FROM whatsapp_messages GROUP BY chat_jid
  ) ms ON ms.chat_jid = wc.jid
`;

export class SqliteWhatsappChatEnricher {
  constructor(private readonly db: DatabaseInstance) {}

  public findByJid(jid: string): WhatsappChatDto | null {
    const row = this.db.prepare(SINGLE_SELECT).get(jid) as EnrichedChatRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  public findByJids(jids: string[]): WhatsappChatDto[] {
    if (jids.length === 0) return [];
    const placeholders = jids.map(() => '?').join(',');
    const sql = `${LIST_SELECT} WHERE wc.jid IN (${placeholders}) ORDER BY wc.pinned DESC, wc.last_message_timestamp DESC`;
    return (this.db.prepare(sql).all(...jids) as EnrichedChatRow[]).map((r) => this.mapRow(r));
  }

  public findAll(opts?: WhatsappChatListOptions): WhatsappChatDto[] {
    const rel = SqliteSearchRelevanceBuilder.build(opts?.search, [
      'wc.name', 'wc.phone', 'wc.last_message_text', 'c.name', 'c.whatsapp_name', 'c.cuil',
    ]);
    const where: string[] = ['1 = 1'];
    const filterParams: unknown[] = [];
    const impExpr = "COALESCE(c.importance, wc.importance, 'normal')";

    if (opts?.importance === 'active') where.push(`${impExpr} != 'ignore'`);
    else if (opts?.importance === 'priority') {
      where.push(`(COALESCE(os.orders_count, 0) >= ${PRIORITY_ORDERS} OR COALESCE(os.total_spent_cents, 0) >= ${PRIORITY_SPENT_CENTS})`);
    } else if (opts?.importance && opts.importance !== 'all') {
      where.push(`${impExpr} = ?`);
      filterParams.push(opts.importance);
    }
    if (rel.hasSearch) where.push(rel.whereClause);

    const scoreCol = rel.hasSearch ? `, ${rel.scoreSelect}` : '';
    const orderBy = rel.orderClause(this.buildOrderSql(opts?.sortBy, impExpr));
    const sql = `${LIST_SELECT.replace('FROM whatsapp_chats wc', `${scoreCol} FROM whatsapp_chats wc`)} WHERE ${where.join(' AND ')} ${orderBy} LIMIT ?`;
    const params = [...rel.scoreParams, ...filterParams, ...rel.whereParams, opts?.limit || 150];
    return (this.db.prepare(sql).all(...params) as EnrichedChatRow[]).map((r) => this.mapRow(r));
  }

  private buildOrderSql(sortBy?: string, impExpr: string = 'wc.importance'): string {
    if (sortBy === 'importance') {
      return `ORDER BY (CASE ${impExpr} WHEN 'important' THEN 4 WHEN 'normal' THEN 3 WHEN 'low' THEN 2 WHEN 'ignore' THEN 1 ELSE 3 END) DESC, (CASE WHEN COALESCE(os.orders_count, 0) >= ${PRIORITY_ORDERS} OR COALESCE(os.total_spent_cents, 0) >= ${PRIORITY_SPENT_CENTS} THEN 1 ELSE 0 END) DESC, wc.last_message_timestamp DESC`;
    }
    if (sortBy === 'top_buyers') return 'ORDER BY total_spent_cents DESC, orders_count DESC, wc.last_message_timestamp DESC';
    return 'ORDER BY wc.pinned DESC, wc.last_message_timestamp DESC';
  }

  private mapRow(r: EnrichedChatRow): WhatsappChatDto {
    const displayName = PhoneNormalizer.isMeaningfulContactName(r.name) ? r.name : (r.whatsapp_name || r.customer_name || r.name);
    return {
      jid: r.jid, name: displayName, phone: r.phone, customerId: r.customer_id,
      customerName: r.customer_name, whatsappName: r.whatsapp_name,
      defaultOrderType: (r.default_order_type as 'minor' | 'major' | null) || null,
      importance: (r.customer_importance || r.chat_importance || 'normal') as CustomerImportanceCode,
      totalOrdersCount: r.orders_count, totalSpentCents: r.total_spent_cents,
      isPriorityBuyer: r.orders_count >= PRIORITY_ORDERS || r.total_spent_cents >= PRIORITY_SPENT_CENTS,
      messageCount: r.message_count, isGroup: r.is_group === 1, unreadCount: r.unread_count,
      lastMessageText: r.last_message_text, lastMessageTimestamp: r.last_message_timestamp,
      lastMessageFromMe: r.last_message_from_me === 1, pinned: r.pinned === 1, updatedAt: r.updated_at,
    };
  }
}
