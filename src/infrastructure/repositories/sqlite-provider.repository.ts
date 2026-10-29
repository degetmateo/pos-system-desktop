import { Database as DatabaseInstance } from 'better-sqlite3';
import { Provider } from '../../domain/models/provider.entity';
import { IProviderRepository } from '../../application/ports/provider-repository.port';

interface ProviderRow {
  id: string;
  name: string;
  barcode_prefix: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteProviderRepository implements IProviderRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async findById(id: string): Promise<Provider | null> {
    const row = this.db.prepare('SELECT * FROM providers WHERE id = ?').get(id) as ProviderRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  public async findByName(name: string): Promise<Provider | null> {
    const row = this.db.prepare('SELECT * FROM providers WHERE name = ? COLLATE NOCASE').get(name) as
      | ProviderRow
      | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  public async findAll(): Promise<Provider[]> {
    const rows = this.db.prepare('SELECT * FROM providers ORDER BY name ASC').all() as ProviderRow[];
    return rows.map((r) => this.mapToEntity(r));
  }

  public async save(provider: Provider): Promise<void> {
    this.db
      .prepare(`
        INSERT INTO providers (id, name, barcode_prefix, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          barcode_prefix = excluded.barcode_prefix,
          updated_at = excluded.updated_at
      `)
      .run(
        provider.id,
        provider.name,
        provider.barcodePrefix,
        provider.createdAt.toISOString(),
        provider.updatedAt.toISOString()
      );
  }

  public async delete(id: string): Promise<void> {
    this.db.transaction(() => {
      this.db.prepare('UPDATE products SET provider_id = NULL WHERE provider_id = ?').run(id);
      this.db.prepare('DELETE FROM providers WHERE id = ?').run(id);
    })();
  }

  private mapToEntity(row: ProviderRow): Provider {
    return new Provider({
      id: row.id,
      name: row.name,
      barcodePrefix: row.barcode_prefix,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}

