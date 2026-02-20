module.exports = {
    version: 6,
    up: (database) => {
        database.transaction(() => {
            database.prepare(`
                ALTER TABLE customers
                ADD COLUMN default_order_type TEXT DEFAULT NULL;
            `).run();
        })();
    }
};