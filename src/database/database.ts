import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (error) => {
  console.error('❌ PostgreSQL pool error:', error);
});

export default pool;