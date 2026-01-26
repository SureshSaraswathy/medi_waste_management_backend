/**
 * Script to get company IDs from the database
 * Use these UUIDs in the frontend companies array
 */
const { Client } = require('pg');
require('dotenv').config();

async function getCompanyIds() {
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

    const result = await client.query(`
      SELECT company_id, company_code, company_name, status
      FROM companies
      WHERE is_deleted = false
      ORDER BY created_on DESC;
    `);

    if (result.rows.length === 0) {
      console.log('❌ No companies found in the database.');
      console.log('   Please create companies first using the Company Master.');
      return;
    }

    console.log('📋 Companies in database:');
    console.log('─'.repeat(80));
    console.log('Use these IDs in your frontend companies array:\n');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.company_name}`);
      console.log(`   ID: ${row.company_id}`);
      console.log(`   Code: ${row.company_code}`);
      console.log(`   Status: ${row.status}`);
      console.log('');
    });

    console.log('📝 Frontend companies array format:');
    console.log('─'.repeat(80));
    console.log('const [companies] = useState<Company[]>([');
    result.rows.forEach((row) => {
      console.log(`  {`);
      console.log(`    id: '${row.company_id}',`);
      console.log(`    companyCode: '${row.company_code}',`);
      console.log(`    companyName: '${row.company_name}',`);
      console.log(`    status: '${row.status}',`);
      console.log(`  },`);
    });
    console.log(']);');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

getCompanyIds();
