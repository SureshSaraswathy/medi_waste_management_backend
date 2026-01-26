/**
 * Script to run password fields migration
 * Usage: node scripts/run-password-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
  user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    const migrationPath = path.join(__dirname, '../src/database/migrations/master/002_add_password_fields_to_users.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    console.log('\n🔍 Verifying migration...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('password_hash', 'force_password_change', 'temporary_password', 'temporary_password_expiry')
      ORDER BY column_name;
    `);
    
    if (result.rows.length === 4) {
      console.log('✅ All 4 password columns were added successfully:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    } else {
      console.warn('⚠️  Warning: Expected 4 columns but found', result.rows.length);
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') {
      console.log('ℹ️  Note: Some columns may already exist. This is safe to ignore.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

runMigration();
