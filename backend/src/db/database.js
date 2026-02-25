const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'tickets.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log(`Database initialized at ${dbPath}`);
        // Enable WAL mode
        db.run('PRAGMA journal_mode = WAL');
        initDatabase();
    }
});

// Initialize schema if it doesn't exist
function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            urgency INTEGER DEFAULT 0,
            confidence REAL,
            keywords TEXT,
            signals TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `;
    db.run(createTableQuery);
    db.run('CREATE INDEX IF NOT EXISTS idx_createdAt ON tickets(created_at DESC);');
}

// Helper wrapper to add `.prepare().run()` and `.prepare().all()` syntax
// to match better-sqlite3 for minimal changes in ticketService.js
const dbWrapper = {
    prepare: (stmtStr) => {
        return {
            run: (...args) => {
                return new Promise((resolve, reject) => {
                    db.run(stmtStr, args, function (err) {
                        if (err) reject(err);
                        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
                    });
                });
            },
            all: (...args) => {
                return new Promise((resolve, reject) => {
                    db.all(stmtStr, args, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
            }
        };
    }
};

module.exports = dbWrapper;
