import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  ProductPriceSummaryDto,
  RecentPriceChangeDto,
  StatisticsQueryRange,
  TopProductStatDto,
} from '../../../application/dtos/statistics.dto';

export class SqliteProductStatsQuery {
  constructor(private readonly db: DatabaseInstance) {}

  public getCatalogAndPriceKpis(range: StatisticsQueryRange): { totalProductsCount: number; priceChangesCount: number } {
    const prod = this.db.prepare('SELECT COUNT(*) AS total FROM products WHERE COALESCE(deleted, 0) = 0').get() as { total: number };
    const parts = ['1 = 1'];
    const params: unknown[] = [];
    if (range.startIso) { parts.push('created_at >= ?'); params.push(range.startIso); }
    if (range.endIso) { parts.push('created_at <= ?'); params.push(range.endIso); }
    const changes = this.db.prepare(`SELECT COUNT(*) AS total FROM price_history WHERE ${parts.join(' AND ')}`)
      .get(...params) as { total: number };
    return {
      totalProductsCount: Number(prod?.total || 0),
      priceChangesCount: Number(changes?.total || 0),
    };
  }

  public getPriceSummary(): ProductPriceSummaryDto {
    const row = this.db.prepare(`
      SELECT
        COALESCE(ROUND(AVG(CASE WHEN price_minor > 0 THEN price_minor END)), 0) AS avgMinorCents,
        COALESCE(MIN(CASE WHEN price_minor > 0 THEN price_minor END), 0) AS minMinorCents,
        COALESCE(MAX(price_minor), 0) AS maxMinorCents,
        COALESCE(ROUND(AVG(CASE WHEN price_major > 0 THEN price_major END)), 0) AS avgMajorCents,
        COALESCE(MIN(CASE WHEN price_major > 0 THEN price_major END), 0) AS minMajorCents,
        COALESCE(MAX(price_major), 0) AS maxMajorCents
      FROM products WHERE COALESCE(deleted, 0) = 0
    `).get() as Record<string, number>;

    return {
      avgMinorCents: Number(row?.avgMinorCents || 0),
      minMinorCents: Number(row?.minMinorCents || 0),
      maxMinorCents: Number(row?.maxMinorCents || 0),
      avgMajorCents: Number(row?.avgMajorCents || 0),
      minMajorCents: Number(row?.minMajorCents || 0),
      maxMajorCents: Number(row?.maxMajorCents || 0),
    };
  }

  public getTopProducts(range: StatisticsQueryRange, limit: number = 10): TopProductStatDto[] {
    const parts = ['1 = 1'];
    const params: unknown[] = [];
    if (range.startIso) { parts.push('o.created_at >= ?'); params.push(range.startIso); }
    if (range.endIso) { parts.push('o.created_at <= ?'); params.push(range.endIso); }

    return this.db.prepare(`
      SELECT
        COALESCE(oi.product_id, oi.product_name) AS productId,
        oi.product_name AS productName,
        COALESCE(SUM(oi.quantity), 0) AS unitsSold,
        COALESCE(SUM(oi.quantity * COALESCE(d.discount_price, oi.price)), 0) AS revenueCents,
        COUNT(DISTINCT oi.order_id) AS ordersCount
      FROM order_item oi
      INNER JOIN orders o ON o.id = oi.order_id
      LEFT JOIN discounts d ON d.order_id = oi.order_id AND d.product_id = oi.product_id
      WHERE ${parts.join(' AND ')}
      GROUP BY COALESCE(oi.product_id, oi.product_name), oi.product_name
      ORDER BY revenueCents DESC, unitsSold DESC
      LIMIT ?
    `).all(...params, limit) as TopProductStatDto[];
  }

  public getRecentPriceChanges(range: StatisticsQueryRange, limit: number = 15): RecentPriceChangeDto[] {
    const parts = ['1 = 1'];
    const params: unknown[] = [];
    if (range.startIso) { parts.push('ph.created_at >= ?'); params.push(range.startIso); }
    if (range.endIso) { parts.push('ph.created_at <= ?'); params.push(range.endIso); }

    return this.db.prepare(`
      SELECT
        ph.id, ph.product_id AS productId,
        COALESCE(p.name, 'Producto eliminado') AS productName,
        ph.price_type AS priceType,
        ph.old_price AS oldPriceCents,
        ph.new_price AS newPriceCents,
        ph.percentage_diff AS percentageDiff,
        ph.created_at AS createdAt
      FROM price_history ph
      LEFT JOIN products p ON p.id = ph.product_id
      WHERE ${parts.join(' AND ')}
      ORDER BY ph.created_at DESC
      LIMIT ?
    `).all(...params, limit) as RecentPriceChangeDto[];
  }
}

