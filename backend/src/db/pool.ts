import sql from 'mssql';

const config: sql.config = {
  server:   process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME     || 'label_web',
  user:     process.env.DB_USER     || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt:                process.env.DB_ENCRYPT     === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT  !== 'false',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', (err) => {
  console.error('MSSQL pool error:', err);
});

export { sql, pool, poolConnect };
