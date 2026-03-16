const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT DEFAULT (datetime('now','localtime')),
      start_cash REAL NOT NULL,
      start_bills REAL DEFAULT 0,
      start_coins REAL DEFAULT 0,
      end_cash REAL,
      end_bills REAL DEFAULT 0,
      end_coins REAL DEFAULT 0,
      profit REAL,
      status TEXT DEFAULT 'active',
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (!err) {
            db.all("PRAGMA table_info(shifts)", (err, rows) => {
                if (rows) {
                    const columns = rows.map(r => r.name);
                    if (!columns.includes('user_id')) {
                        db.run("ALTER TABLE shifts ADD COLUMN user_id INTEGER");
                    }
                    if (!columns.includes('start_bills')) {
                        db.run("ALTER TABLE shifts ADD COLUMN start_bills REAL DEFAULT 0");
                    }
                    if (!columns.includes('start_coins')) {
                        db.run("ALTER TABLE shifts ADD COLUMN start_coins REAL DEFAULT 0");
                    }
                    if (!columns.includes('end_bills')) {
                        db.run("ALTER TABLE shifts ADD COLUMN end_bills REAL DEFAULT 0");
                    }
                    if (!columns.includes('end_coins')) {
                        db.run("ALTER TABLE shifts ADD COLUMN end_coins REAL DEFAULT 0");
                    }
                }
            });
        }
    });
});

module.exports = db;
