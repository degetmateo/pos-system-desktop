import fs from 'node:fs';
import path from 'node:path';
import { Database as DatabaseInstance } from 'better-sqlite3';

export interface BackupFileInfo {
  filename: string;
  size: number;
  createdAt: string;
}

export class BackupFacade {
  private static readonly MAX_BACKUPS = 72;

  constructor(
    private readonly db: DatabaseInstance,
    private readonly backupsDir: string
  ) {}

  public async performBackup(): Promise<string> {
    if (!fs.existsSync(this.backupsDir)) fs.mkdirSync(this.backupsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${timestamp}.db`;
    const filepath = path.join(this.backupsDir, filename);
    await this.db.backup(filepath);
    this.rotateBackups();
    return filepath;
  }

  public listBackups(): BackupFileInfo[] {
    if (!fs.existsSync(this.backupsDir)) return [];
    return fs.readdirSync(this.backupsDir)
      .filter((n) => n.endsWith('.db'))
      .map((name) => {
        const stat = fs.statSync(path.join(this.backupsDir, name));
        return { filename: name, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async restoreBackup(filename: string): Promise<void> {
    const safeName = path.basename(filename);
    const backupPath = path.join(this.backupsDir, safeName);
    if (!fs.existsSync(backupPath)) throw new Error(`El archivo de respaldo ${safeName} no existe.`);

    await this.performBackup();
    const cleanPath = backupPath.replace(/'/g, "''");
    this.db.exec(`
      ATTACH DATABASE '${cleanPath}' AS source_db;
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      DELETE FROM minor_prices; DELETE FROM order_items; DELETE FROM orders;
      DELETE FROM products; DELETE FROM customers; DELETE FROM providers; DELETE FROM metadata;
      INSERT INTO metadata SELECT * FROM source_db.metadata;
      INSERT INTO providers SELECT * FROM source_db.providers;
      INSERT INTO customers SELECT * FROM source_db.customers;
      INSERT INTO products SELECT * FROM source_db.products;
      INSERT INTO orders SELECT * FROM source_db.orders;
      INSERT INTO order_items SELECT * FROM source_db.order_items;
      INSERT INTO minor_prices SELECT * FROM source_db.minor_prices;
      COMMIT;
      PRAGMA foreign_keys = ON;
      DETACH DATABASE source_db;
    `);
  }

  public defragment(): void {
    this.db.exec('VACUUM');
  }

  private rotateBackups(): void {
    if (!fs.existsSync(this.backupsDir)) return;
    const files = fs.readdirSync(this.backupsDir)
      .map((n) => ({ n, t: fs.statSync(path.join(this.backupsDir, n)).mtime.getTime() }))
      .sort((a, b) => b.t - a.t);
    if (files.length > BackupFacade.MAX_BACKUPS) {
      files.slice(BackupFacade.MAX_BACKUPS).forEach((f) => fs.unlinkSync(path.join(this.backupsDir, f.n)));
    }
  }
}
