const mysql = require('mysql2/promise');

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '@14vishnuVVA'
    });

    console.log('Connected to MySQL server.');

    await connection.query(`CREATE DATABASE IF NOT EXISTS farmin`);
    console.log('Database "farmin" created or already exists.');

    await connection.changeUser({ database: 'farmin' });

    // Table for Income
    await connection.query(`
      CREATE TABLE IF NOT EXISTS income (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        source VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
    console.log('Table "income" created or already exists.');

    // Table for Expense
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
    console.log('Table "expense" created or already exists.');

    await connection.end();
    console.log('Setup complete.');
  } catch (error) {
    console.error('Error:', error);
  }
}

setup();
