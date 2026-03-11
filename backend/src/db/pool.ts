import { Pool } from 'pg';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'label_web',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export default pool;
