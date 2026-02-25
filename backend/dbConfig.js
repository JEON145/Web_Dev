import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables from your .env file
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you are using a hosted DB (like Render or Supabase), 
  // you might need to add: ssl: { rejectUnauthorized: false }
});

// Verify the connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL Connected');
});

export default pool;