const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'farmin';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database "${dbName}" created or already exists.`);

    await connection.changeUser({ database: dbName });

    // Table for Income with Indices for Query Optimization
    await connection.query(`
      CREATE TABLE IF NOT EXISTS income (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(12, 2) NOT NULL,
        source VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        INDEX idx_income_date (date),
        INDEX idx_income_source (source)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table "income" with performance indices created or already exists.');

    // Table for Expense with Indices for Query Optimization
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        INDEX idx_expense_date (date),
        INDEX idx_expense_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table "expense" with performance indices created or already exists.');

    await connection.end();
    console.log('Database setup complete successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

setup();
