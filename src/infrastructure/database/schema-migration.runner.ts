import { Database as DatabaseInstance } from 'better-sqlite3';
import { MIGRATIONS_REGISTRY } from './migrations.registry';

export class SchemaMigrationRunner {
  constructor(private readonly db: DatabaseInstance) {}

  public run(): void {
    this.ensureMigrationsTable();
    const appliedVersions = this.getAppliedVersions();

    const pending = MIGRATIONS_REGISTRY.filter((m) => !appliedVersions.has(m.version)).sort(
      (a, b) => a.version - b.version
    );

    for (const migration of pending) {
      this.executeMigration(migration.version, migration.name, migration.up);
    }
  }

  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TEXT NOT NULL
      );
    `);
  }

  private getAppliedVersions(): Set<number> {
    const rows = this.db.prepare('SELECT version FROM _migrations').all() as Array<{ version: number }>;
    return new Set(rows.map((r) => r.version));
  }

  private executeMigration(version: number, name: string, up: (db: DatabaseInstance) => void): void {
    const runInTransaction = this.db.transaction(() => {
      up(this.db);
      this.db
        .prepare('INSERT INTO _migrations (version, name, executed_at) VALUES (?, ?, ?)')
        .run(version, name, new Date().toISOString());
    });

    try {
      runInTransaction();
      console.log(`[Database Migration] Aplicada migración v${version}: ${name}`);
    } catch (err) {
      console.error(`[Database Migration] Error fatal al aplicar migración v${version}: ${name}`, err);
      throw err;
    }
  }
}
