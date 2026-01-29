const uuid = require('uuid');

const PROVIDERS_NAMES = [
    "ADHESIVOS BADARACCO",
    "MAXXUM GROUP",
    "IBICO SRL",
    "BINDERPLUS",
    "MAIPU 47",
    "UTIL UNO",
    "TYN",
    "MANCHITAS",
    "GARABATOS",
    "HUSARES",
    "GCP",
    "OLAMI",
    "FILGO",
    "TRABI",
    "TECNOGRAFIC",
    "CBX",
    "EQ ARTE",
    "BAKCO",
    "MARISCAL",
    "COTILLON ALBERTO",
    "FILA GROUP",
    "HASENAUER",
    "PDQ (AKAPOL)",
    "PAPELERA MTT"
];

module.exports = {
    version: 2,
    up: (db) => {
        db.transaction(() => {
            for (const name of PROVIDERS_NAMES) {
                const provider = db.prepare(`
                    SELECT * FROM providers WHERE name = :name;
                `).get({ name });

                if (provider) continue;

                const id = uuid.v4();
                const date = new Date().toISOString();

                db.prepare(`
                    INSERT INTO providers (id, name, created_at, updated_at)
                    VALUES (?, ?, ?, ?);
                `).run(id, name, date, date);
            };

            db.prepare(`
                INSERT INTO metadata (id, key, value_int, created_at)
                VALUES (?, ?, ?, ?);
            `).run(uuid.v4(), 'barcode', 0, new Date().toISOString());

            db.prepare(`
                CREATE TABLE IF NOT EXISTS minor_prices (
                    id TEXT PRIMARY KEY,
                    product_id TEXT,
                    condition TEXT,
                    condition_value INTEGER,
                    price_value INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                );
            `).run();

            db.prepare(`
                ALTER TABLE orders
                ADD COLUMN payment_method TEXT DEFAULT NULL;
            `).run();

            db.prepare(`
                CREATE TABLE IF NOT EXISTS discounts (
                    id TEXT PRIMARY KEY,
                    minor_price_id TEXT,
                    order_id TEXT
                );
            `).run();
        })();
    }
};