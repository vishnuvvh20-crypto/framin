const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '@14vishnuVVA',
  database: 'farmin'
};

let pool;

async function initDb() {
  pool = mysql.createPool(dbConfig);
  console.log("Connected to MySQL 'farmin' database pool.");
}

// Income endpoints
app.get('/api/income', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM income ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/income', async (req, res) => {
  try {
    const { amount, source, date, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO income (amount, source, date, description) VALUES (?, ?, ?, ?)',
      [amount, source, date, description]
    );
    res.json({ id: result.insertId, amount, source, date, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expense endpoints
app.get('/api/expense', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expense ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expense', async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO expense (amount, category, date, description) VALUES (?, ?, ?, ?)',
      [amount, category, date, description]
    );
    res.json({ id: result.insertId, amount, category, date, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on http://localhost:${PORT}`);
});
