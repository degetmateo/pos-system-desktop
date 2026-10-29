import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SchemaMigrationRunner } from '../../src/infrastructure/database/schema-migration.runner';
import { BackupFacade } from '../../src/infrastructure/maintenance/backup.facade';

describe('BackupFacade (Integration)', () => {
  let db: DatabaseInstance;
  let tempDir: string;
  let facade: BackupFacade;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rd-backup-test-'));
    db = new Database(path.join(tempDir, 'active.db'));
    new SchemaMigrationRunner(db).run();
    facade = new BackupFacade(db, path.join(tempDir, 'backups'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('performs a backup and lists it with metadata', async () => {
    const backupPath = await facade.performBackup();
    expect(fs.existsSync(backupPath)).toBe(true);

    const list = facade.listBackups();
    expect(list.length).toBe(1);
    expect(list[0].filename).toBe(path.basename(backupPath));
    expect(list[0].size).toBeGreaterThan(0);
  });

  it('defragments the database without error', () => {
    expect(() => facade.defragment()).not.toThrow();
  });
});

