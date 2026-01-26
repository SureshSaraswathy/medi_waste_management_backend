/**
 * Script to check the actual column name for user_id in the database
 */
const { Client } = require('pg');
require('dotenv').config();

async function checkTable() {
  const client = new Client({
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
    database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check the actual primary key column name
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name LIKE '%id%'
      ORDER BY ordinal_position;
    `);

    console.log('📊 ID-related columns in users table:');
    console.log('─'.repeat(80));
    result.rows.forEach((row) => {
      console.log(`${row.column_name.padEnd(30)} | ${row.data_type.padEnd(20)} | nullable: ${row.is_nullable} | default: ${row.column_default || 'none'}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
