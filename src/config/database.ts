import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'midpoint_media',
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (error: any) => {
  console.error('❌ PostgreSQL pool error:', error);
});

export const testDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');

    console.log(
      `✅ Database connected at ${result.rows[0].now}`
    );
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export default pool;