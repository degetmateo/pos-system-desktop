import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  PaymentBreakdownItemDto,
  SalesSeriesPointDto,
  StatisticsQueryRange,
  TopCustomerStatDto,
} from '../../../application/dtos/statistics.dto';

export class SqliteSalesStatsQuery {
  constructor(private readonly db: DatabaseInstance) {}

  private buildDateWhere(col: string, range: StatisticsQueryRange): { sql: string; params: unknown[] } {
    const parts: string[] = ['1 = 1'];
    const params: unknown[] = [];
    if (range.startIso) { parts.push(`${col} >= ?`); params.push(range.startIso); }
    if (range.endIso) { parts.push(`${col} <= ?`); params.push(range.endIso); }
    return { sql: parts.join(' AND '), params };
  }

  public getOrderTotals(range: StatisticsQueryRange) {
    const w = this.buildDateWhere('created_at', range);
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_price), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN type = 'minor' THEN 1 ELSE 0 END), 0) AS minor_orders,
        COALESCE(SUM(CASE WHEN type = 'major' THEN 1 ELSE 0 END), 0) AS major_orders,
        COALESCE(SUM(CASE WHEN type = 'minor' THEN total_price ELSE 0 END), 0) AS minor_revenue,
        COALESCE(SUM(CASE WHEN type = 'major' THEN total_price ELSE 0 END), 0) AS major_revenue
      FROM orders WHERE ${w.sql}
    `).get(...w.params) as Record<string, number>;

    const custTotals = this.db.prepare('SELECT COUNT(*) AS total FROM customers').get() as { total: number };
    const priorityCust = this.db.prepare(`
      SELECT COUNT(*) AS total FROM (
        SELECT customer_id FROM orders WHERE customer_id IS NOT NULL
        GROUP BY customer_id HAVING COUNT(*) >= 2 OR SUM(total_price) >= 5000000
      )
    `).get() as { total: number };

    const totalOrdersCount = Number(row?.total_orders || 0);
    const totalRevenueCents = Number(row?.total_revenue || 0);
    return {
      totalRevenueCents,
      totalOrdersCount,
      averageTicketCents: totalOrdersCount > 0 ? Math.round(totalRevenueCents / totalOrdersCount) : 0,
      minorOrdersCount: Number(row?.minor_orders || 0),
      majorOrdersCount: Number(row?.major_orders || 0),
      minorRevenueCents: Number(row?.minor_revenue || 0),
      majorRevenueCents: Number(row?.major_revenue || 0),
      totalCustomersCount: Number(custTotals?.total || 0),
      priorityCustomersCount: Number(priorityCust?.total || 0),
    };
  }

  public getSalesSeries(range: StatisticsQueryRange): SalesSeriesPointDto[] {
    const w = this.buildDateWhere('created_at', range);
    return this.db.prepare(`
      SELECT
        substr(created_at, 1, 10) AS date,
        COUNT(*) AS ordersCount,
        COALESCE(SUM(total_price), 0) AS revenueCents,
        COALESCE(SUM(CASE WHEN type = 'minor' THEN total_price ELSE 0 END), 0) AS minorRevenueCents,
        COALESCE(SUM(CASE WHEN type = 'major' THEN total_price ELSE 0 END), 0) AS majorRevenueCents
      FROM orders WHERE ${w.sql}
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date ASC
    `).all(...w.params) as SalesSeriesPointDto[];
  }

  public getPaymentBreakdown(range: StatisticsQueryRange): PaymentBreakdownItemDto[] {
    const w = this.buildDateWhere('created_at', range);
    return this.db.prepare(`
      SELECT
        COALESCE(NULLIF(TRIM(payment_method), ''), 'unspecified') AS method,
        COUNT(*) AS ordersCount,
        COALESCE(SUM(total_price), 0) AS revenueCents
      FROM orders WHERE ${w.sql}
      GROUP BY method ORDER BY revenueCents DESC
    `).all(...w.params) as PaymentBreakdownItemDto[];
  }

  public getTopCustomers(range: StatisticsQueryRange, limit: number = 10): TopCustomerStatDto[] {
    const w = this.buildDateWhere('o.created_at', range);
    return this.db.prepare(`
      SELECT
        c.id, c.name, c.whatsapp_name AS whatsappName, c.phone,
        COALESCE(c.importance, 'normal') AS importance,
        COUNT(o.id) AS ordersCount,
        COALESCE(SUM(o.total_price), 0) AS totalSpentCents,
        MAX(o.created_at) AS lastOrderAt
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id
      WHERE ${w.sql}
      GROUP BY c.id
      ORDER BY totalSpentCents DESC, ordersCount DESC
      LIMIT ?
    `).all(...w.params, limit) as TopCustomerStatDto[];
  }
}

