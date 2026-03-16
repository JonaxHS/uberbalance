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
      end_cash REAL,
      profit REAL,
      status TEXT DEFAULT 'active',
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (!err) {
            // Check if user_id column exists, if not add it (simple migration)
            db.all("PRAGMA table_info(shifts)", (err, rows) => {
                if (rows && !rows.find(row => row.name === 'user_id')) {
                    db.run("ALTER TABLE shifts ADD COLUMN user_id INTEGER");
                }
            });
        }
    });
});

module.exports = db;
