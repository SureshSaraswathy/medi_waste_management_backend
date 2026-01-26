/**
 * Script to create master data tables
 * Run this script to create states, areas, colors, and pcb_zones tables
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createMasterTables() {
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

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-master-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    console.log('📋 Creating master data tables...\n');
    await client.query(sql);

    console.log('✅ Master data tables created successfully!\n');
    console.log('Created tables:');
    console.log('  - states');
    console.log('  - areas');
    console.log('  - colors');
    console.log('  - pcb_zones');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.error('\n💡 Tip: Make sure the "companies" table exists first.');
      console.error('   The colors table has a foreign key reference to companies.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createMasterTables();
