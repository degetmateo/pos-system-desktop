import { Database as DatabaseInstance } from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';
import { Order } from '../../domain/models/order.entity';
import { OrderItem } from '../../domain/models/order-item.entity';
import { IOrderRepository, OrderFilters } from '../../application/ports/order-repository.port';
import { SqliteMetadataRepository } from './sqlite-metadata.repository';
import { SqliteOrderMapper, OrderRow, ItemRow } from './mappers/sqlite-order.mapper';
import { OrderQueryBuilder } from './search/order-query.builder';

export class SqliteOrderRepository implements IOrderRepository {
  private readonly metadataRepo: SqliteMetadataRepository;

  constructor(private readonly db: DatabaseInstance) {
    this.metadataRepo = new SqliteMetadataRepository(db);
  }

  public async getNextOrderNumber(): Promise<number> {
    return this.metadataRepo.incrementInt('orders-count');
  }

  public async findById(id: string): Promise<Order | null> {
    const row = this.db.prepare('SELECT o.*, c.name as customer_name, c.cuil as customer_cuil FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?').get(id) as OrderRow | undefined;
    return row ? SqliteOrderMapper.toEntity(row, this.loadItems(row.id)) : null;
  }

  public async findAll(filters?: OrderFilters): Promise<Order[]> {
    const { selectSql, selectParams } = OrderQueryBuilder.build(filters);
    const rows = this.db.prepare(selectSql).all(...selectParams) as OrderRow[];
    return rows.map((r) => SqliteOrderMapper.toEntity(r, this.loadItems(r.id)));
  }

  public async count(filters?: OrderFilters): Promise<number> {
    const { countSql, countParams } = OrderQueryBuilder.build(filters);
    const row = this.db.prepare(countSql).get(...countParams) as { total: number } | undefined;
    return row?.total || 0;
  }

  public async getDailyReport(startDate?: string, endDate?: string): Promise<{ labels: string[]; values: number[] }> {
    let sql = 'SELECT date(created_at) as date, SUM(total_price) as total FROM orders WHERE 1=1';
    const params: unknown[] = [];
    if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }
    sql += ' GROUP BY date ORDER BY date ASC';
    const rows = this.db.prepare(sql).all(...params) as { date: string; total: number }[];
    return { labels: rows.map((r) => r.date), values: rows.map((r) => (Number(r.total) || 0) / 100) };
  }

  public async save(order: Order): Promise<void> {
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO orders (id, number, customer_id, total_price, type, status, payment_method, advancement, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customer_id = excluded.customer_id, total_price = excluded.total_price, type = excluded.type,
          status = excluded.status, payment_method = excluded.payment_method,
          advancement = excluded.advancement, updated_at = excluded.updated_at
      `).run(
        order.id, order.number, order.customerId, order.getTotalPrice().getCents(),
        order.type.getCode(), order.status, order.paymentMethod?.getCode() || null,
        order.advancement.getCents(), order.createdAt.toISOString(), order.updatedAt.toISOString()
      );

      this.db.prepare('DELETE FROM order_item WHERE order_id = ?').run(order.id);
      this.db.prepare('DELETE FROM discounts WHERE order_id = ?').run(order.id);

      const insItem = this.db.prepare('INSERT INTO order_item (id, order_id, product_id, product_name, quantity, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const insDisc = this.db.prepare('INSERT INTO discounts (id, order_id, product_id, original_price, discount_price) VALUES (?, ?, ?, ?, ?)');

      for (const item of order.getItems()) {
        insItem.run(item.id, order.id, item.productId, item.productName, item.quantity, item.price.getCents(), item.createdAt.toISOString(), item.updatedAt.toISOString());
        if (item.hasDiscount() && item.discountPrice) {
          insDisc.run(uuidv7(), order.id, item.productId, item.price.getCents(), item.discountPrice.getCents());
        }
      }
    })();
  }

  private loadItems(orderId: string): OrderItem[] {
    const rows = this.db.prepare(`
      SELECT oi.*, d.discount_price FROM order_item oi
      LEFT JOIN discounts d ON d.order_id = oi.order_id AND d.product_id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId) as ItemRow[];
    return rows.map(SqliteOrderMapper.toItemEntity);
  }
}
