import { Database as DatabaseInstance } from 'better-sqlite3';

export interface IMigration {
  version: number;
  name: string;
  up(db: DatabaseInstance): void;
}

