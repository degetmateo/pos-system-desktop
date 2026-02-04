module.exports = {
    version: 5,
    up: (db) => {
        db.transaction(() => {
            db.prepare(`
                ALTER TABLE orders
                ADD COLUMN advancement INTEGER DEFAULT 0;
            `).run();
        })();
    }
};