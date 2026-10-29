import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { addColumnIfNotExists } from '../../src/infrastructure/database/migrations.registry';

describe('SchemaMigrationRunner (Database Migrations)', () => {
  it('applies all pending migrations sequentially and records them', () => {
    const db = new Database(':memory:');
    const runner = new SchemaMigrationRunner(db);

    runner.run();

    // Verify _migrations table has versions
    const migrations = db.prepare('SELECT version, name FROM _migrations ORDER BY version ASC').all() as any[];
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(migrations[0].version).toBe(1);
    expect(migrations[0].name).toBe('001_initial_schema');
    expect(migrations[1].version).toBe(2);
    expect(migrations[1].name).toBe('002_performance_indexes_and_resilience');

    // Running again is idempotent (does not fail or duplicate)
    runner.run();
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as { count: number };
    expect(countAfter.count).toBe(migrations.length);

    db.close();
  });

  it('safely adds columns to existing tables without failing', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE test_table (id TEXT PRIMARY KEY, title TEXT);');

    addColumnIfNotExists(db, 'test_table', 'extra_col', 'INTEGER DEFAULT 0');
    // Calling again does not throw
    addColumnIfNotExists(db, 'test_table', 'extra_col', 'INTEGER DEFAULT 0');

    const cols = db.prepare('PRAGMA table_info(test_table)').all() as any[];
    expect(cols.some((c) => c.name === 'extra_col')).toBe(true);

    db.close();
  });
});

