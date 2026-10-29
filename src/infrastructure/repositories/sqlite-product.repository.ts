import { Database as DatabaseInstance } from 'better-sqlite3';
import { Product } from '../../domain/models/product.entity';
import { MinorPrice } from '../../domain/models/minor-price.entity';
import { IProductRepository, ProductFilters } from '../../application/ports/product-repository.port';
import { SqliteProductMapper, ProductRow, MinorPriceRow } from './mappers/sqlite-product.mapper';

export class SqliteProductRepository implements IProductRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async findById(id: string): Promise<Product | null> {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').get(id) as ProductRow | undefined;
    return row ? SqliteProductMapper.toEntity(row, this.loadMinorPrices(row.id)) : null;
  }

  public async findByBarcode(barcode: string): Promise<Product | null> {
    const row = this.db.prepare('SELECT * FROM products WHERE barcode = ? AND deleted = 0').get(barcode) as ProductRow | undefined;
    return row ? SqliteProductMapper.toEntity(row, this.loadMinorPrices(row.id)) : null;
  }

  private buildFilterClauses(filters?: ProductFilters): { whereClause: string; params: unknown[] } {
    let whereClause = 'WHERE deleted = 0';
    const params: unknown[] = [];

    if (filters?.id) {
      whereClause += ' AND id = ?';
      params.push(filters.id);
    }

    if (filters?.barcode) {
      whereClause += ' AND barcode = ?';
      params.push(filters.barcode);
    }

    const searchTerm = filters?.search?.trim() || filters?.name?.trim();
    if (searchTerm) {
      const words = searchTerm.split(/\s+/).filter(Boolean);
      for (const w of words) {
        whereClause += ' AND (name LIKE ? COLLATE NOCASE OR barcode LIKE ? OR description LIKE ? COLLATE NOCASE)';
        params.push(`%${w}%`, `%${w}%`, `%${w}%`);
      }
    }

    if (filters?.providerId) {
      if (filters.providerId === 'none') {
        whereClause += ' AND (provider_id IS NULL OR provider_id = "")';
      } else {
        whereClause += ' AND provider_id = ?';
        params.push(filters.providerId);
      }
    }

    if (filters?.stockStatus) {
      if (filters.stockStatus === 'in_stock') {
        whereClause += ' AND stock > 0';
      } else if (filters.stockStatus === 'out_of_stock') {
        whereClause += ' AND stock <= 0';
      } else if (filters.stockStatus === 'low_stock') {
        whereClause += ' AND stock > 0 AND stock <= 5';
      }
    }

    if (filters?.minPrice !== undefined && filters?.minPrice !== null) {
      whereClause += ' AND price_minor >= ?';
      params.push(filters.minPrice);
    }

    if (filters?.maxPrice !== undefined && filters?.maxPrice !== null) {
      whereClause += ' AND price_minor <= ?';
      params.push(filters.maxPrice);
    }

    return { whereClause, params };
  }

  private resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'abc':
      case 'name_asc':
        return 'ORDER BY name COLLATE NOCASE ASC';
      case 'name_desc':
        return 'ORDER BY name COLLATE NOCASE DESC';
      case 'price_asc':
        return 'ORDER BY price_minor ASC';
      case 'price_desc':
        return 'ORDER BY price_minor DESC';
      case 'price_major_asc':
        return 'ORDER BY price_major ASC';
      case 'price_major_desc':
        return 'ORDER BY price_major DESC';
      case 'stock_asc':
        return 'ORDER BY stock ASC';
      case 'stock_desc':
        return 'ORDER BY stock DESC';
      case 'created_at_desc':
        return 'ORDER BY created_at DESC';
      case 'created_at_asc':
      case 'created_at':
        return 'ORDER BY created_at ASC';
      case 'updated_at':
      case 'updated_at_desc':
        return 'ORDER BY updated_at DESC';
      case 'price_updated_at_desc':
        return 'ORDER BY COALESCE(price_updated_at, updated_at, created_at) DESC';
      case 'price_updated_at_asc':
        return 'ORDER BY COALESCE(price_updated_at, updated_at, created_at) ASC';
      case 'barcode_asc':
        return 'ORDER BY barcode ASC';
      case 'barcode_desc':
        return 'ORDER BY barcode DESC';
      default:
        return 'ORDER BY created_at ASC';
    }
  }

  public async findAll(filters?: ProductFilters): Promise<Product[]> {
    const { whereClause, params } = this.buildFilterClauses(filters);
    let sql = `SELECT * FROM products ${whereClause} ${this.resolveOrderBy(filters?.sorting)}`;
    if (filters?.limit) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const rows = this.db.prepare(sql).all(...params) as ProductRow[];
    return rows.map((r) => SqliteProductMapper.toEntity(r, this.loadMinorPrices(r.id)));
  }

  public async count(filters?: ProductFilters): Promise<number> {
    const { whereClause, params } = this.buildFilterClauses(filters);
    const sql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const row = this.db.prepare(sql).get(...params) as { total: number } | undefined;
    return row?.total || 0;
  }

  public async save(product: Product): Promise<void> {
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO products (id, barcode, name, description, stock, provider_id, image_name, price_major, price_minor, synchronized, deleted, created_at, updated_at, price_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          barcode=excluded.barcode, name=excluded.name, description=excluded.description,
          stock=excluded.stock, provider_id=excluded.provider_id, image_name=excluded.image_name,
          price_major=excluded.price_major, price_minor=excluded.price_minor,
          synchronized=excluded.synchronized, deleted=excluded.deleted, updated_at=excluded.updated_at,
          price_updated_at=excluded.price_updated_at
      `).run(
        product.id, product.barcode?.getValue() || null, product.name, product.description,
        product.stock, product.providerId, product.imageName, product.priceMajor.getCents(),
        product.priceMinor.getCents(), product.synchronized ? 1 : 0, product.deleted ? 1 : 0,
        product.createdAt.toISOString(), product.updatedAt.toISOString(),
        product.priceUpdatedAt.toISOString()
      );

      this.db.prepare('DELETE FROM minor_prices WHERE product_id = ?').run(product.id);
      const insert = this.db.prepare('INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const r of product.minorPrices) {
        insert.run(r.id, r.productId, r.condition, r.conditionValue, r.priceValue.getCents(), r.createdAt.toISOString(), r.updatedAt.toISOString());
      }
    })();
  }

  public async saveMany(products: Product[]): Promise<void> {
    this.db.transaction(() => { for (const p of products) this.save(p); })();
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('UPDATE products SET deleted = 1, synchronized = 0 WHERE id = ?').run(id);
  }

  public async getUnsynchronized(limit: number = 100): Promise<Product[]> {
    const rows = this.db.prepare('SELECT * FROM products WHERE synchronized = 0 LIMIT ?').all(limit) as ProductRow[];
    return rows.map((r) => SqliteProductMapper.toEntity(r, this.loadMinorPrices(r.id)));
  }

  public async markSynchronized(ids: string[]): Promise<void> {
    if (!ids.length) return;
    this.db.prepare(`UPDATE products SET synchronized = 1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  }

  public async resetSynchronization(): Promise<void> {
    this.db.prepare('UPDATE products SET synchronized = 0').run();
  }

  private loadMinorPrices(productId: string): MinorPrice[] {
    const rows = this.db.prepare('SELECT * FROM minor_prices WHERE product_id = ? ORDER BY condition_value ASC').all(productId) as MinorPriceRow[];
    return rows.map(SqliteProductMapper.toMinorPriceEntity);
  }
}
