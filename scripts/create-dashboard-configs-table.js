/**
 * Script to create dashboard_configs table in medi_waste_management_report database
 * 
 * Usage:
 * node scripts/create-dashboard-configs-table.js
 * 
 * Make sure your .env file has the REPORT_DB_* variables configured
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const reportDbConfig = {
  host: process.env.REPORT_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.REPORT_DB_PORT || process.env.DB_PORT || '5432', 10),
  user: process.env.REPORT_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.REPORT_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.REPORT_DB_DATABASE || 'medi_waste_management_report',
};

const createTableSQL = `
-- Create dashboard_configs table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(100) NOT NULL UNIQUE,
  widgets JSONB,
  "menuItems" JSONB,
  permissions JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_role ON dashboard_configs(role);

-- Add comment to table
COMMENT ON TABLE dashboard_configs IS 'Stores dashboard widget and menu configurations for each role/department. Configuration-only table that does not affect business logic.';
`;

async function createTable() {
  const client = new Client(reportDbConfig);
  
  try {
    console.log('Connecting to report database...');
    console.log(`Database: ${reportDbConfig.database}`);
    console.log(`Host: ${reportDbConfig.host}:${reportDbConfig.port}`);
    
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('\nCreating dashboard_configs table...');
    await client.query(createTableSQL);
    console.log('✓ Table created successfully!');
    
    // Verify table creation
    console.log('\nVerifying table creation...');
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dashboard_configs' 
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length > 0) {
      console.log('\nTable structure:');
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.column_name} (${row.data_type})`);
      });
      console.log('\n✓ Table verification successful!');
    } else {
      console.log('⚠ Warning: Table was created but verification returned no rows.');
    }
    
  } catch (error) {
    console.error('\n✗ Error creating table:');
    console.error(error.message);
    
    if (error.code === '3D000') {
      console.error('\nDatabase does not exist. Please create it first:');
      console.error(`CREATE DATABASE ${reportDbConfig.database};`);
    } else if (error.code === '28P01') {
      console.error('\nAuthentication failed. Please check your database credentials in .env file.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please ensure PostgreSQL is running.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

// Run the script
createTable();
