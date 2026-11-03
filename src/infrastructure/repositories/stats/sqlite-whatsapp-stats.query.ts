import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  StatisticsQueryRange,
  WhatsappContactStatDto,
  WhatsappDailyPointDto,
} from '../../../application/dtos/statistics.dto';

export class SqliteWhatsappStatsQuery {
  constructor(private readonly db: DatabaseInstance) {}

  private buildTsWhere(col: string, range: StatisticsQueryRange): { sql: string; params: unknown[] } {
    const parts = ['1 = 1'];
    const params: unknown[] = [];
    if (range.startMs !== null) { parts.push(`${col} >= ?`); params.push(range.startMs); }
    if (range.endMs !== null) { parts.push(`${col} <= ?`); params.push(range.endMs); }
    return { sql: parts.join(' AND '), params };
  }

  public getMessageKpis(range: StatisticsQueryRange) {
    const w = this.buildTsWhere('timestamp', range);
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN from_me = 0 THEN 1 ELSE 0 END), 0) AS incoming,
        COALESCE(SUM(CASE WHEN from_me = 1 THEN 1 ELSE 0 END), 0) AS outgoing,
        COUNT(DISTINCT chat_jid) AS activeChats
      FROM whatsapp_messages
      WHERE ${w.sql}
    `).get(...w.params) as Record<string, number>;

    return {
      totalMessagesCount: Number(row?.total || 0),
      incomingMessagesCount: Number(row?.incoming || 0),
      outgoingMessagesCount: Number(row?.outgoing || 0),
      activeWhatsappChatsCount: Number(row?.activeChats || 0),
    };
  }

  public getDailySeries(range: StatisticsQueryRange): WhatsappDailyPointDto[] {
    const w = this.buildTsWhere('timestamp', range);
    return this.db.prepare(`
      SELECT
        strftime('%Y-%m-%d', CAST(timestamp / 1000 AS INTEGER), 'unixepoch', 'localtime') AS date,
        COUNT(*) AS totalCount,
        COALESCE(SUM(CASE WHEN from_me = 0 THEN 1 ELSE 0 END), 0) AS incomingCount,
        COALESCE(SUM(CASE WHEN from_me = 1 THEN 1 ELSE 0 END), 0) AS outgoingCount
      FROM whatsapp_messages
      WHERE ${w.sql}
      GROUP BY date
      ORDER BY date ASC
    `).all(...w.params) as WhatsappDailyPointDto[];
  }

  public getTopContacts(range: StatisticsQueryRange, limit: number = 12): WhatsappContactStatDto[] {
    const w = this.buildTsWhere('wm.timestamp', range);
    return this.db.prepare(`
      SELECT
        wm.chat_jid AS jid,
        COALESCE(NULLIF(TRIM(c.whatsapp_name), ''), NULLIF(TRIM(wc.name), ''), c.name, wm.chat_jid) AS name,
        COALESCE(wc.phone, c.phone) AS phone,
        wc.customer_id AS customerId,
        COALESCE(c.importance, wc.importance, 'normal') AS importance,
        COUNT(*) AS totalMessages,
        COALESCE(SUM(CASE WHEN wm.from_me = 0 THEN 1 ELSE 0 END), 0) AS incomingCount,
        COALESCE(SUM(CASE WHEN wm.from_me = 1 THEN 1 ELSE 0 END), 0) AS outgoingCount,
        MIN(wm.timestamp) AS firstMessageTimestamp,
        MAX(wm.timestamp) AS lastMessageTimestamp
      FROM whatsapp_messages wm
      LEFT JOIN whatsapp_chats wc ON wc.jid = wm.chat_jid
      LEFT JOIN customers c ON c.id = wc.customer_id
      WHERE ${w.sql}
      GROUP BY wm.chat_jid
      ORDER BY totalMessages DESC, lastMessageTimestamp DESC
      LIMIT ?
    `).all(...w.params, limit) as WhatsappContactStatDto[];
  }
}

