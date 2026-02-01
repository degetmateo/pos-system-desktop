module.exports = {
    version: 4,
    up: (db) => {
        db.transaction(() => {
            db.prepare(`
                ALTER TABLE order_item
                ADD COLUMN product_name TEXT DEFAULT NULL;
            `).run();
        })()
    }
};