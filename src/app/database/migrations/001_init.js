module.exports = {
    version: 1,
    up: (db) => {
        db.transaction(() => {
            db.prepare(`
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    barcode TEXT,
                    name TEXT,
                    price INTEGER,
                    stock INTEGER DEFAULT 0,
                    provider_id TEXT,
                    provider_type TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    synchronized INTEGER DEFAULT 0
                );
            `);

            db.prepare(`
                CREATE TABLE IF NOT EXISTS provider (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    barcode_prefix TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    synchronized INTEGER DEFAULT 0
                );
            `);
        });
    }
};