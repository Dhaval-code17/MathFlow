const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10000,

  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();

    console.log('Connected to MySQL database');

    connection.release();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

module.exports = { pool, initDB };