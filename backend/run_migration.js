import fs from 'fs';
import path from 'path';
import pool from './dbConfig.js';

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Read the migration SQL file
    const sqlPath = path.join(process.cwd(), 'migrations', 'update_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added columns: security_question, security_answer to users table');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();