import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Initialize dotenv to read your .env file
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you are using a cloud DB like Render/Supabase, uncomment the line below:
  // ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;