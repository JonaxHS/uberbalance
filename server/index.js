const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Get all shifts
app.get('/api/shifts', (req, res) => {
    db.all('SELECT * FROM shifts ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get current active shift
app.get('/api/shifts/active', (req, res) => {
    db.get('SELECT * FROM shifts WHERE status = "active" LIMIT 1', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || null);
    });
});

// Start a new shift
app.post('/api/shifts/start', (req, res) => {
    const { start_cash } = req.body;
    if (start_cash === undefined) {
        return res.status(400).json({ error: 'start_cash is required' });
    }

    // Check if there is already an active shift
    db.get('SELECT id FROM shifts WHERE status = "active" LIMIT 1', [], (err, row) => {
        if (row) {
            return res.status(400).json({ error: 'A shift is already active' });
        }

        const query = 'INSERT INTO shifts (start_cash, status) VALUES (?, "active")';
        db.run(query, [start_cash], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, start_cash, status: 'active' });
        });
    });
});

// End current shift
app.patch('/api/shifts/end', (req, res) => {
    const { end_cash } = req.body;
    if (end_cash === undefined) {
        return res.status(400).json({ error: 'end_cash is required' });
    }

    db.get('SELECT * FROM shifts WHERE status = "active" LIMIT 1', [], (err, row) => {
        if (!row) {
            return res.status(400).json({ error: 'No active shift found' });
        }

        const profit = end_cash - row.start_cash;
        const query = 'UPDATE shifts SET end_cash = ?, profit = ?, status = "completed" WHERE id = ?';
        db.run(query, [end_cash, profit, row.id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ ...row, end_cash, profit, status: 'completed' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
