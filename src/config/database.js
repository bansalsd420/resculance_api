const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'resculance_db',
  // connection timeouts (ms)
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 10000,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT_MS, 10) || 10000,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  // Allow executing multiple SQL statements per query (needed for migrations)
  multipleStatements: true
});

// Test connection
pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = pool;
