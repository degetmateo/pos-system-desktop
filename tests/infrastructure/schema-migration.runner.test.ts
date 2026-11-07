import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { addColumnIfNotExists } from '../../src/infrastructure/database/migrations.registry';

describe('SchemaMigrationRunner (Database Migrations)', () => {
  it('applies all pending migrations sequentially and records them', () => {
    const db = new Database(':memory:');
    const runner = new SchemaMigrationRunner(db);

    runner.run();

    const migrations = db.prepare('SELECT version, name FROM _migrations ORDER BY version ASC').all() as any[];
    expect(migrations.length).toBeGreaterThanOrEqual(10);
    expect(migrations[0].version).toBe(1);
    expect(migrations[0].name).toBe('001_initial_schema');
    expect(migrations[1].version).toBe(2);
    expect(migrations[1].name).toBe('002_performance_indexes_and_resilience');
    expect(migrations.some((m) => m.version === 5 && m.name === '005_remove_stock_column')).toBe(true);
    expect(migrations.some((m) => m.version === 10 && m.name === '010_drop_whatsapp_tables')).toBe(true);

    const prodCols = db.prepare('PRAGMA table_info(products)').all() as any[];
    expect(prodCols.some((c) => c.name === 'stock')).toBe(false);

    const waChatsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_chats'").get();
    const waMsgsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_messages'").get();
    expect(waChatsTable).toBeUndefined();
    expect(waMsgsTable).toBeUndefined();

    runner.run();
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as { count: number };
    expect(countAfter.count).toBe(migrations.length);

    db.close();
  });

  it('safely drops legacy whatsapp tables when upgrading older databases', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE _migrations (version INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, executed_at TEXT NOT NULL);
      INSERT INTO _migrations (version, name, executed_at) VALUES (6, '006_whatsapp_tables', '2026-01-01T00:00:00.000Z');
      CREATE TABLE whatsapp_chats (jid TEXT PRIMARY KEY, name TEXT);
      CREATE TABLE whatsapp_messages (id TEXT PRIMARY KEY, body TEXT);
    `);

    new SchemaMigrationRunner(db).run();

    const waChatsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_chats'").get();
    expect(waChatsTable).toBeUndefined();

    db.close();
  });

  it('safely adds columns to existing tables without failing', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE test_table (id TEXT PRIMARY KEY, title TEXT);');

    addColumnIfNotExists(db, 'test_table', 'extra_col', 'INTEGER DEFAULT 0');
    addColumnIfNotExists(db, 'test_table', 'extra_col', 'INTEGER DEFAULT 0');

    const cols = db.prepare('PRAGMA table_info(test_table)').all() as any[];
    expect(cols.some((c) => c.name === 'extra_col')).toBe(true);

    db.close();
  });
});
