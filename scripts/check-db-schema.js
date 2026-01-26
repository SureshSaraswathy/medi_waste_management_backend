/**
 * Script to check database schema and identify missing columns
 */
const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
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

    // Check users table columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Current Users Table Schema:');
    console.log('─'.repeat(80));
    result.rows.forEach((row) => {
      console.log(`${row.column_name.padEnd(30)} | ${row.data_type.padEnd(20)} | nullable: ${row.is_nullable}`);
    });

    // Expected columns
    const expectedColumns = [
      'user_id',
      'company_id',
      'user_name',
      'mobile_number',
      'employee_code',
      'user_role_id',
      'status',
      'password_enabled',
      'otp_enabled',
      'force_otp_on_next_login',
      'web_login',
      'mobile_app_access',
      'created_by',
      'created_on',
      'modified_by',
      'modified_on',
      'is_deleted',
    ];

    const existingColumns = result.rows.map((r) => r.column_name);
    const missingColumns = expectedColumns.filter((col) => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing Columns:');
      missingColumns.forEach((col) => console.log(`   - ${col}`));
      console.log('\n⚠️  You need to run the migration or update the table schema!');
    } else {
      console.log('\n✅ All expected columns exist!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
