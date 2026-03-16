const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'uber-secret-key-123';

app.use(cors());
app.use(bodyParser.json());

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- AUTH ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';

    db.run(query, [username, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY);
        res.json({ token, user: { id: this.lastID, username } });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// --- SHIFT ENDPOINTS (SECURED) ---

// Get all shifts
app.get('/api/shifts', authenticateToken, (req, res) => {
    db.all('SELECT * FROM shifts WHERE user_id = ? ORDER BY date DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get current active shift
app.get('/api/shifts/active', authenticateToken, (req, res) => {
    db.get('SELECT * FROM shifts WHERE status = "active" AND user_id = ? LIMIT 1', [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// Start a new shift
app.post('/api/shifts/start', authenticateToken, (req, res) => {
    const { start_bills, start_coins } = req.body;
    const start_cash = (parseFloat(start_bills) || 0) + (parseFloat(start_coins) || 0);

    db.get('SELECT id FROM shifts WHERE status = "active" AND user_id = ? LIMIT 1', [req.user.id], (err, row) => {
        if (row) return res.status(400).json({ error: 'A shift is already active' });

        const query = 'INSERT INTO shifts (start_cash, start_bills, start_coins, status, user_id) VALUES (?, ?, ?, "active", ?)';
        db.run(query, [start_cash, start_bills, start_coins, req.user.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, start_cash, start_bills, start_coins, status: 'active' });
        });
    });
});

app.patch('/api/shifts/end', authenticateToken, (req, res) => {
    const { end_bills, end_coins } = req.body;
    const end_cash = (parseFloat(end_bills) || 0) + (parseFloat(end_coins) || 0);

    db.get('SELECT * FROM shifts WHERE status = "active" AND user_id = ? LIMIT 1', [req.user.id], (err, row) => {
        if (!row) return res.status(400).json({ error: 'No active shift found' });

        const profit = end_cash - row.start_cash;
        const query = 'UPDATE shifts SET end_cash = ?, end_bills = ?, end_coins = ?, profit = ?, status = "completed" WHERE id = ?';
        db.run(query, [end_cash, end_bills, end_coins, profit, row.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...row, end_cash, end_bills, end_coins, profit, status: 'completed' });
        });
    });
});

app.delete('/api/shifts/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM shifts WHERE id = ? AND user_id = ?', [id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Shift not found or unauthorized' });
        res.json({ message: 'Shift deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
