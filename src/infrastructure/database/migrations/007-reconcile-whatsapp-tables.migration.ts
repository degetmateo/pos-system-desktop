import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from '../migration.interface';
import { reconcileWhatsappTables } from './006-whatsapp-tables.migration';

export const migration007ReconcileWhatsappTables: IMigration = {
  version: 7,
  name: '007_reconcile_whatsapp_tables_schema',
  up: (db: DatabaseInstance) => reconcileWhatsappTables(db),
};

