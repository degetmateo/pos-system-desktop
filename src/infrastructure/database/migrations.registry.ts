import { Database as DatabaseInstance } from 'better-sqlite3';
import { IMigration } from './migration.interface';

export function addColumnIfNotExists(db: DatabaseInstance, table: string, col: string, def: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name.toLowerCase() === col.toLowerCase())) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }
}

export const MIGRATIONS_REGISTRY: IMigration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: DatabaseInstance) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS metadata (id TEXT PRIMARY KEY, key TEXT, value_txt TEXT, value_int INTEGER, created_at TEXT, updated_at TEXT);
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY, barcode TEXT, name TEXT, description TEXT, stock INTEGER DEFAULT 0,
          provider_id TEXT, image_name TEXT, price_major INTEGER DEFAULT 0, price_minor INTEGER DEFAULT 0,
          synchronized INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS providers (id TEXT PRIMARY KEY, name TEXT, barcode_prefix TEXT, created_at TEXT, updated_at TEXT);
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY, name TEXT, description TEXT, cuil TEXT, email TEXT, phone TEXT, address TEXT,
          default_order_type TEXT DEFAULT NULL, created_at TEXT, updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS minor_prices (
          id TEXT PRIMARY KEY, product_id TEXT, condition TEXT, condition_value INTEGER, price_value INTEGER, created_at TEXT, updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY, number INTEGER, customer_id TEXT, total_price INTEGER, type TEXT, status TEXT,
          payment_method TEXT DEFAULT NULL, advancement INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS order_item (
          id TEXT PRIMARY KEY, order_id TEXT, product_id TEXT, product_name TEXT, quantity INTEGER, price INTEGER, created_at TEXT, updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS discounts (
          id TEXT PRIMARY KEY, minor_price_id TEXT, order_id TEXT, product_id TEXT, original_price INTEGER DEFAULT 0, discount_price INTEGER DEFAULT 0
        );
      `);
    },
  },
  {
    version: 2,
    name: '002_performance_indexes_and_resilience',
    up: (db: DatabaseInstance) => {
      // Garantizar que columnas de versiones recientes existan en bases de datos heredadas
      addColumnIfNotExists(db, 'customers', 'default_order_type', 'TEXT DEFAULT NULL');
      addColumnIfNotExists(db, 'orders', 'advancement', 'INTEGER DEFAULT 0');
      addColumnIfNotExists(db, 'orders', 'payment_method', 'TEXT DEFAULT NULL');
      addColumnIfNotExists(db, 'products', 'deleted', 'INTEGER DEFAULT 0');

      // Índices de alta performance para acelerar búsquedas
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id);
        CREATE INDEX IF NOT EXISTS idx_minor_prices_product_id ON minor_prices(product_id);
      `);
    },
  },
  {
    version: 3,
    name: '003_advanced_filters_and_sorting_indexes',
    up: (db: DatabaseInstance) => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
        CREATE INDEX IF NOT EXISTS idx_products_price_minor ON products(price_minor);
        CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
        CREATE INDEX IF NOT EXISTS idx_customers_cuil ON customers(cuil);
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_default_order_type ON customers(default_order_type);
        CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(number);
        CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
        CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
        CREATE INDEX IF NOT EXISTS idx_orders_total_price ON orders(total_price);
      `);
    },
  },
  {
    version: 4,
    name: '004_price_history_and_price_updated_at',
    up: (db: DatabaseInstance) => {
      addColumnIfNotExists(db, 'products', 'price_updated_at', 'TEXT DEFAULT NULL');
      db.exec(`
        CREATE TABLE IF NOT EXISTS price_history (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          price_type TEXT NOT NULL,
          old_price INTEGER NOT NULL,
          new_price INTEGER NOT NULL,
          difference INTEGER NOT NULL,
          percentage_diff REAL NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at);
        CREATE INDEX IF NOT EXISTS idx_products_price_updated_at ON products(price_updated_at);
      `);
    },
  },
];

