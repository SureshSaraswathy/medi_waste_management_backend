/**
 * Script to test user creation directly
 */
const { Client } = require('pg');
require('dotenv').config();

async function testCreateUser() {
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

    // Get company ID
    const companyResult = await client.query(
      `SELECT company_id FROM companies WHERE company_code = 'COMP001' LIMIT 1`
    );

    if (companyResult.rows.length === 0) {
      console.log('❌ No company found. Run: npm run test:get-company-id');
      return;
    }

    const companyId = companyResult.rows[0].company_id;
    console.log(`📋 Using Company ID: ${companyId}\n`);

    // Try to insert directly
    console.log('🧪 Testing direct database insert...');
    const insertResult = await client.query(
      `INSERT INTO users (
        user_id, company_id, user_name, mobile_number, employee_code, 
        status, password_enabled, otp_enabled, force_otp_on_next_login,
        web_login, mobile_app_access, created_by, modified_by, is_deleted
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING user_id, user_name, status`,
      [
        companyId,
        'test_user_' + Date.now(),
        '9876543210',
        'EMP001',
        'Draft', // Status as string
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        false,
      ]
    );

    console.log('✅ Direct insert successful!');
    console.log(`   User ID: ${insertResult.rows[0].user_id}`);
    console.log(`   User Name: ${insertResult.rows[0].user_name}`);
    console.log(`   Status: ${insertResult.rows[0].status}`);

    // Clean up test user
    await client.query(`DELETE FROM users WHERE user_id = $1`, [insertResult.rows[0].user_id]);
    console.log('\n🧹 Test user cleaned up');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

testCreateUser();
