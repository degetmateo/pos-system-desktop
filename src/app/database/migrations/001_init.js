const uuid = require('uuid');

module.exports = {
    version: 1,
    up: (db) => {
        db.transaction(() => {
            db.prepare(`
                CREATE TABLE IF NOT EXISTS metadata (
                    id TEXT PRIMARY KEY,
                    key TEXT,
                    value_txt TEXT,
                    value_int INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();

            db.prepare(`
                INSERT INTO metadata (id, key, value_int, created_at)
                VALUES (?, ?, ?, ?);
            `).run(uuid.v4(), 'orders-count', 0, new Date().toISOString());

            db.prepare(`
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    barcode TEXT,
                    name TEXT,
                    description TEXT,
                    stock INTEGER DEFAULT 0,
                    provider_id TEXT,
                    image_name TEXT,
                    price_major INTEGER DEFAULT 0, 
                    price_minor INTEGER DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();

            // db.prepare(`
            //     CREATE TABLE IF NOT EXISTS price_lists (
            //         id TEXT PRIMARY KEY,
            //         name TEXT,
            //         created_at TEXT,
            //         updated_at TEXT
            //     );
            // `).run();

            // db.prepare(`
            //     CREATE TABLE IF NOT EXISTS listed (
            //         id TEXT PRIMARY KEY,
            //         product_id TEXT,
            //         price_list_id TEXT,
            //         price INTEGER,
            //         created_at TEXT,
            //         updated_at TEXT
            //     );
            // `).run();

            db.prepare(`
                CREATE TABLE IF NOT EXISTS providers (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    barcode_prefix TEXT,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();

            db.prepare(`
                CREATE TABLE IF NOT EXISTS orders (
                    id TEXT PRIMARY KEY,
                    number INTEGER,
                    customer_id TEXT,
                    total_price INTEGER,
                    type TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    status TEXT
                );
            `).run();

            db.prepare(`
                CREATE TABLE IF NOT EXISTS order_item (
                    id TEXT PRIMARY KEY,
                    order_id TEXT,
                    product_id TEXT,
                    quantity INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();

            db.prepare(`
                CREATE TABLE IF NOT EXISTS customers (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    description TEXT,
                    cuil TEXT,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();
        })();
    }
};