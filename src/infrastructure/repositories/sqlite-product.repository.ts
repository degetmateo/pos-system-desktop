import { Database as DatabaseInstance } from 'better-sqlite3';
import { Product } from '../../domain/models/product.entity';
import { MinorPrice } from '../../domain/models/minor-price.entity';
import { IProductRepository, ProductFilters } from '../../application/ports/product-repository.port';
import { SqliteProductMapper, ProductRow, MinorPriceRow } from './mappers/sqlite-product.mapper';
import { ProductQueryBuilder } from './search/product-query.builder';

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

  public async findAll(filters?: ProductFilters): Promise<Product[]> {
    const { selectSql, selectParams } = ProductQueryBuilder.build(filters);
    const rows = this.db.prepare(selectSql).all(...selectParams) as ProductRow[];
    return rows.map((r) => SqliteProductMapper.toEntity(r, this.loadMinorPrices(r.id)));
  }

  public async count(filters?: ProductFilters): Promise<number> {
    const { countSql, countParams } = ProductQueryBuilder.build(filters);
    const row = this.db.prepare(countSql).get(...countParams) as { total: number } | undefined;
    return row?.total || 0;
  }

  public async save(product: Product): Promise<void> {
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO products (id, barcode, name, description, provider_id, image_name, price_major, price_minor, synchronized, deleted, created_at, updated_at, price_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          barcode=excluded.barcode, name=excluded.name, description=excluded.description,
          provider_id=excluded.provider_id, image_name=excluded.image_name,
          price_major=excluded.price_major, price_minor=excluded.price_minor,
          synchronized=excluded.synchronized, deleted=excluded.deleted, updated_at=excluded.updated_at,
          price_updated_at=excluded.price_updated_at
      `).run(
        product.id, product.barcode?.getValue() || null, product.name, product.description,
        product.providerId, product.imageName, product.priceMajor.getCents(),
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
