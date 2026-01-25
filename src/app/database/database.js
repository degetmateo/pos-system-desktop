const SQLite = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

class Database {
    db;
    ready;
    current_version;

    database_dir;
    migrations_dir;
    backups_dir;

    constructor () {
        this.ready = false;
        this.current_version = 0;
        
        this.database_dir = path.join(app.getPath('userData'), 'data.db');
        this.migrations_dir = path.join(__dirname, '/migrations/');
        this.backups_dir = path.join(app.getPath('userData'), '/backups/');

        this.db = new SQLite(this.database_dir);
    };

    init () {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT
            );
        `);
        
        this.run_migrations();
        this.ready = true;
        this.schedule_backups();
    };

    get_version () {
        const row = this.db
            .prepare("SELECT value FROM meta WHERE key='schema_version'")
            .get();

        return row ? Number(row.value) : 0;
    };

    set_version (version) {
        this.db.prepare(`
            INSERT OR REPLACE INTO meta (key, value, updated_at)
            VALUES ('schema_version', ?, ?)
        `).run(version, new Date().toISOString());
    };

    run_migrations () {
        const migrations = fs.readdirSync(this.migrations_dir)
            .map(file => require(path.join(this.migrations_dir, file)))
            .sort((a, b) => a.version - b.version);
    
        this.current_version = this.get_version();

        for (const migration of migrations) {
            if (migration.version > this.current_version) {
                console.log(`Migrating to v${migration.version}`);
                
                migration.up(this.db);

                this.set_version(migration.version);
                this.current_version = migration.version;
            };
        };
    };

    async backup () {
        if (!fs.existsSync(this.backups_dir)) {
            fs.mkdirSync(this.backups_dir, { recursive: true });
        };

        const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const filename = `backup-${date}.db`;
        const filepath = path.join(this.backups_dir, filename);

        try {
            console.log("INICIANDO BACKUP.");
            await this.db.backup(filepath);
            console.log("BACKUP FINALIZADO.");
        } catch (error) {
            console.log("ERROR EN BACKUP.");
            console.error(error);
        };
    };

    schedule_backups () {
        cron.schedule('0 * * * *', async () => {
            console.log('Iniciando backup por hora...');
            await this.backup();
            this.clear_old_backups();
        });
    };

    clear_old_backups () {
        const backup_files = fs.readdirSync(this.backups_dir)
            .map(file => ({ name: file, time: fs.statSync(path.join(this.backups_dir, file)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        const MAX_BACKUPS = 72;

        if (backup_files.length > MAX_BACKUPS) {
            backup_files.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(path.join(this.backups_dir, file.name));
                console.log(`[Backup] Eliminado archivo antiguo: ${file.name}`);
            });
        };
    };
};

const database = new Database();
module.exports = database;
module.exports.database = database.db;