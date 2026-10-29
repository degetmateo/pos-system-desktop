import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import path from 'node:path';

export class SqliteConnection {
  private static instance: DatabaseInstance | null = null;

  public static initialize(dbPath?: string): DatabaseInstance {
    if (!this.instance) {
      const resolvedPath = dbPath || path.join(process.cwd(), 'data.db');
      this.instance = new Database(resolvedPath);
      // WAL mode permite lecturas y escrituras concurrentes eficientes para múltiples dispositivos LAN
      this.instance.pragma('journal_mode = WAL');
      this.instance.pragma('foreign_keys = ON');
    }
    return this.instance;
  }

  public static getInstance(): DatabaseInstance {
    if (!this.instance) {
      return this.initialize();
    }
    return this.instance;
  }

  public static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }
}

