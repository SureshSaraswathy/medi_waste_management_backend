/**
 * Script to create the master database if it doesn't exist
 * Usage: node scripts/create-database.js
 */
const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const dbConfig = {
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  };
  const databaseName = process.env.MASTER_DB_DATABASE || 'medi_waste_management_master';

  // Connect to default 'postgres' database
  const client = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✅ Connected!');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName],
    );

    if (result.rows.length > 0) {
      console.log(`ℹ️  Database '${databaseName}' already exists.`);
    } else {
      console.log(`📦 Creating database '${databaseName}'...`);
      await client.query(`CREATE DATABASE ${databaseName}`);
      console.log(`✅ Database '${databaseName}' created successfully!`);
    }
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
