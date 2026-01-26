/**
 * Script to create a test company for testing purposes
 */
const { Client } = require('pg');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function createTestCompany() {
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

    // Check if companies table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Companies table does not exist. Please create it first.');
      return;
    }

    // Check if test company already exists
    const existing = await client.query(`
      SELECT company_id, company_code, company_name 
      FROM companies 
      WHERE company_code = 'TEST001' AND is_deleted = false;
    `);

    if (existing.rows.length > 0) {
      console.log('ℹ️  Test company already exists:');
      console.log(`   ID: ${existing.rows[0].company_id}`);
      console.log(`   Code: ${existing.rows[0].company_code}`);
      console.log(`   Name: ${existing.rows[0].company_name}`);
      console.log('\n✅ Use this company ID in your API requests.');
      return;
    }

    // Create test company
    const companyId = randomUUID();
    const now = new Date().toISOString();

    await client.query(`
      INSERT INTO companies (
        company_id, 
        company_code, 
        company_name, 
        status, 
        created_by, 
        created_on, 
        modified_by, 
        modified_on, 
        is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      companyId,
      'TEST001',
      'Test Company',
      'Active',
      '00000000-0000-0000-0000-000000000001', // Test user ID
      now,
      null,
      now,
      false
    ]);

    console.log('✅ Test company created successfully!\n');
    console.log('📋 Company Details:');
    console.log(`   ID: ${companyId}`);
    console.log(`   Code: TEST001`);
    console.log(`   Name: Test Company`);
    console.log(`   Status: Active\n`);
    console.log('💡 Use this company ID in your API requests:');
    console.log(`   ${companyId}\n`);
    console.log('Example API request body:');
    console.log(JSON.stringify({
      colorName: "Yellow",
      companyId: companyId
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.error('\n💡 Company with code TEST001 already exists.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestCompany();
