module.exports = {
    version: 3,
    up: (db) => {
        db.transaction(() => {
            db.prepare(`
                ALTER TABLE discounts
                ADD COLUMN product_id TEXT DEFAULT NULL;
            `).run();

            db.prepare(`
                ALTER TABLE discounts
                ADD COLUMN original_price INTEGER DEFAULT 0;
            `).run();

            db.prepare(`
                ALTER TABLE discounts
                ADD COLUMN discount_price INTEGER DEFAULT 0;
            `).run();

            db.prepare(`
                ALTER TABLE order_item
                ADD COLUMN price INTEGER DEFAULT 0;
            `).run();
        })();
    }
};