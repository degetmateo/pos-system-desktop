import { Database as DatabaseInstance } from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';
import { IMetadataRepository } from '../../application/ports/metadata-repository.port';

export class SqliteMetadataRepository implements IMetadataRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async getInt(key: string, defaultValue: number = 0): Promise<number> {
    const row = this.db.prepare('SELECT value_int FROM metadata WHERE key = ?').get(key) as
      | { value_int: number }
      | undefined;
    return row && row.value_int !== null ? Number(row.value_int) : defaultValue;
  }

  public async incrementInt(key: string): Promise<number> {
    return this.db.transaction(() => {
      const current = this.db.prepare('SELECT value_int FROM metadata WHERE key = ?').get(key) as
        | { value_int: number }
        | undefined;
      const nextValue = current && current.value_int !== null ? Number(current.value_int) + 1 : 1;
      const now = new Date().toISOString();

      if (current) {
        this.db
          .prepare('UPDATE metadata SET value_int = ?, updated_at = ? WHERE key = ?')
          .run(nextValue, now, key);
      } else {
        this.db
          .prepare('INSERT INTO metadata (id, key, value_int, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
          .run(uuidv7(), key, nextValue, now, now);
      }
      return nextValue;
    })();
  }

  public async setInt(key: string, value: number): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO metadata (id, key, value_int, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value_int = excluded.value_int, updated_at = excluded.updated_at
      `)
      .run(uuidv7(), key, value, now, now);
  }

  public async getText(key: string, defaultValue: string = ''): Promise<string | null> {
    const row = this.db.prepare('SELECT value_txt FROM metadata WHERE key = ?').get(key) as
      | { value_txt: string }
      | undefined;
    return row && row.value_txt !== null ? row.value_txt : defaultValue;
  }

  public async setText(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO metadata (id, key, value_txt, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value_txt = excluded.value_txt, updated_at = excluded.updated_at
      `)
      .run(uuidv7(), key, value, now, now);
  }
}

