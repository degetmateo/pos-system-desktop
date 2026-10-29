import { Database as DatabaseInstance } from 'better-sqlite3';
import { PriceHistory } from '../../domain/models/price-history.entity';
import { IPriceHistoryRepository } from '../../application/ports/price-history-repository.port';

interface PriceHistoryRow {
  id: string;
  product_id: string;
  price_type: 'minor' | 'major';
  old_price: number;
  new_price: number;
  difference: number;
  percentage_diff: number;
  created_at: string;
}

export class SqlitePriceHistoryRepository implements IPriceHistoryRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async save(entry: PriceHistory): Promise<void> {
    this.db
      .prepare(`
        INSERT INTO price_history (id, product_id, price_type, old_price, new_price, difference, percentage_diff, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        entry.id,
        entry.productId,
        entry.priceType,
        entry.oldPrice,
        entry.newPrice,
        entry.difference,
        entry.percentageDiff,
        entry.createdAt.toISOString()
      );
  }

  public async saveMany(entries: PriceHistory[]): Promise<void> {
    if (entries.length === 0) return;
    const insert = this.db.prepare(`
      INSERT INTO price_history (id, product_id, price_type, old_price, new_price, difference, percentage_diff, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const e of entries) {
        insert.run(
          e.id,
          e.productId,
          e.priceType,
          e.oldPrice,
          e.newPrice,
          e.difference,
          e.percentageDiff,
          e.createdAt.toISOString()
        );
      }
    })();
  }

  public async findByProductId(productId: string): Promise<PriceHistory[]> {
    const rows = this.db
      .prepare('SELECT * FROM price_history WHERE product_id = ? ORDER BY created_at DESC')
      .all(productId) as PriceHistoryRow[];

    return rows.map(
      (r) =>
        new PriceHistory({
          id: r.id,
          productId: r.product_id,
          priceType: r.price_type,
          oldPrice: r.old_price,
          newPrice: r.new_price,
          difference: r.difference,
          percentageDiff: r.percentage_diff,
          createdAt: new Date(r.created_at),
        })
    );
  }
}

