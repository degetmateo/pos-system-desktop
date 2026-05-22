module.exports = {
    version: 7,
    up: (database) => {
        database.transaction(() => {
            database.prepare(`
                ALTER TABLE products
                ADD COLUMN synchronized INT DEFAULT 0;
            `).run();

            database.prepare(`
                ALTER TABLE products
                ADD COLUMN deleted INT DEFAULT 0;
            `).run();
        })();
    }
};