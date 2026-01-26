const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createTransactionTables() {
  const client = new Client({
    host: process.env.TRANSACTION_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TRANSACTION_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.TRANSACTION_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.TRANSACTION_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.TRANSACTION_DB_DATABASE || 'medi_waste_management_transaction',
  });

  try {
    console.log('Connecting to transaction database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/create_transaction_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL script...');
    await client.query(sql);
    console.log('✅ Transaction tables created successfully!');

    // Verify table was created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'training_certificates'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: training_certificates table exists');
    } else {
      console.log('⚠️  Warning: training_certificates table not found');
    }

  } catch (error) {
    console.error('❌ Error creating transaction tables:', error.message);
    if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Please create it first:');
      console.error(`   CREATE DATABASE ${process.env.TRANSACTION_DB_DATABASE || 'medi_waste_management_transaction'};`);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

createTransactionTables();
