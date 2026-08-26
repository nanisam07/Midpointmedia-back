import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('✅ Neon PostgreSQL connected');
});

pool.on('error', (error) => {
  console.error('❌ PostgreSQL pool error:', error);
});

export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export default pool;