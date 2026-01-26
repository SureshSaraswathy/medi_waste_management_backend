/**
 * Node.js script to run SQL migration file
 * Usage: node scripts/run-migration.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const dbConfig = {
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  };
  const databaseName = process.env.MASTER_DB_DATABASE || 'medi_waste_management_master';

  // First, connect to default 'postgres' database to check/create our database
  const adminClient = new Client({
    ...dbConfig,
    database: 'postgres', // Connect to default database first
  });

  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server!');

    // Check if database exists
    const dbCheck = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName],
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Database '${databaseName}' does not exist. Creating...`);
      await adminClient.query(`CREATE DATABASE ${databaseName}`);
      console.log(`✅ Database '${databaseName}' created successfully!`);
    } else {
      console.log(`✅ Database '${databaseName}' already exists.`);
    }

    await adminClient.end();

    // Now connect to our target database
    const client = new Client({
      ...dbConfig,
      database: databaseName,
    });

    console.log(`🔌 Connecting to database '${databaseName}'...`);
    await client.connect();
    console.log('✅ Connected successfully!');

    const migrationPath = path.join(
      __dirname,
      '../src/database/migrations/master/001_create_user_management_tables.sql',
    );

    console.log('📄 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'companies', 'users', 'user_employee_profiles', 
        'user_identity_compliance', 'user_addresses', 
        'roles', 'permissions', 'role_permissions'
      )
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check permissions
    const permResult = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n🔐 Permissions inserted: ${permResult.rows[0].count}`);

    await client.end();
    console.log('\n🎉 All done! Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();
