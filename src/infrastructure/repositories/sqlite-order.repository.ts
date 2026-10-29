import { Database as DatabaseInstance } from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';
import { Order } from '../../domain/models/order.entity';
import { OrderItem } from '../../domain/models/order-item.entity';
import { IOrderRepository, OrderFilters } from '../../application/ports/order-repository.port';
import { SqliteMetadataRepository } from './sqlite-metadata.repository';
import { SqliteOrderMapper, OrderRow, ItemRow } from './mappers/sqlite-order.mapper';

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
    const { clause, params } = this.buildFilter(filters);
    let sql = `SELECT o.*, c.name as customer_name, c.cuil as customer_cuil FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE ${clause} ${this.resolveOrderBy(filters?.sorting)}`;
    if (filters?.limit) { sql += ' LIMIT ? OFFSET ?'; params.push(filters.limit, filters.offset || 0); }
    const rows = this.db.prepare(sql).all(...params) as OrderRow[];
    return rows.map((r) => SqliteOrderMapper.toEntity(r, this.loadItems(r.id)));
  }

  public async count(filters?: OrderFilters): Promise<number> {
    const { clause, params } = this.buildFilter(filters);
    const row = this.db.prepare(`SELECT COUNT(*) as total FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE ${clause}`).get(...params) as { total: number } | undefined;
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

  private buildFilter(f?: OrderFilters): { clause: string; params: unknown[] } {
    const p: unknown[] = [];
    const parts = ['1 = 1'];
    if (f?.id) { parts.push('o.id = ?'); p.push(f.id); }
    if (f?.customerId) { parts.push('o.customer_id = ?'); p.push(f.customerId); }

    const searchTerm = f?.search?.trim() || f?.customerName?.trim();
    if (searchTerm) {
      const numMatch = searchTerm.replace(/^#/, '');
      if (/^\d+$/.test(numMatch)) {
        parts.push('(o.number = ? OR c.name LIKE ? COLLATE NOCASE OR c.cuil LIKE ?)');
        p.push(Number(numMatch), `%${searchTerm}%`, `%${searchTerm}%`);
      } else {
        const words = searchTerm.split(/\s+/).filter(Boolean);
        for (const w of words) {
          parts.push('(c.name LIKE ? COLLATE NOCASE OR c.cuil LIKE ?)');
          p.push(`%${w}%`, `%${w}%`);
        }
      }
    }

    if (f?.orderNumber) { parts.push('o.number = ?'); p.push(f.orderNumber); }
    if (f?.type) { parts.push('o.type = ?'); p.push(f.type); }
    if (f?.status) { parts.push('o.status = ?'); p.push(f.status); }
    if (f?.paymentMethod) { parts.push('o.payment_method = ?'); p.push(f.paymentMethod); }

    if (f?.startDate) {
      parts.push('date(o.created_at) >= date(?)');
      p.push(f.startDate);
    }
    if (f?.endDate) {
      parts.push('date(o.created_at) <= date(?)');
      p.push(f.endDate);
    }

    if (f?.minTotal !== undefined && f?.minTotal !== null) {
      parts.push('o.total_price >= ?');
      p.push(f.minTotal);
    }
    if (f?.maxTotal !== undefined && f?.maxTotal !== null) {
      parts.push('o.total_price <= ?');
      p.push(f.maxTotal);
    }

    return { clause: parts.join(' AND '), params: p };
  }

  private resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'created_at_desc':
        return 'ORDER BY o.created_at DESC';
      case 'created_at_asc':
        return 'ORDER BY o.created_at ASC';
      case 'number_desc':
        return 'ORDER BY o.number DESC';
      case 'number_asc':
        return 'ORDER BY o.number ASC';
      case 'total_desc':
        return 'ORDER BY o.total_price DESC';
      case 'total_asc':
        return 'ORDER BY o.total_price ASC';
      case 'customer_asc':
        return 'ORDER BY COALESCE(c.name, "Consumidor Final") COLLATE NOCASE ASC';
      case 'customer_desc':
        return 'ORDER BY COALESCE(c.name, "Consumidor Final") COLLATE NOCASE DESC';
      default:
        return 'ORDER BY o.created_at DESC';
    }
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
