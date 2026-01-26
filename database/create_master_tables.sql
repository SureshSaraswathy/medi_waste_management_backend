-- SQL Script to create master data tables
-- Run this script in your PostgreSQL database: medi_waste_management_master

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id UUID PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code_company ON categories(category_code, company_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_company ON categories(category_name, company_id) WHERE is_deleted = false;

-- Frequencies table
CREATE TABLE IF NOT EXISTS frequencies (
    frequency_id UUID PRIMARY KEY,
    frequency_code VARCHAR(50) NOT NULL,
    frequency_name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_frequencies_status ON frequencies(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_frequencies_code_company ON frequencies(frequency_code, company_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_frequencies_name_company ON frequencies(frequency_name, company_id) WHERE is_deleted = false;

-- HCF Types table
CREATE TABLE IF NOT EXISTS hcf_types (
    hcf_type_id UUID PRIMARY KEY,
    hcf_type_code VARCHAR(50) NOT NULL,
    hcf_type_name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_hcf_types_status ON hcf_types(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hcf_types_code_company ON hcf_types(hcf_type_code, company_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hcf_types_name_company ON hcf_types(hcf_type_name, company_id) WHERE is_deleted = false;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    route_id UUID PRIMARY KEY,
    route_code VARCHAR(50) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL,
    frequency_id UUID,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_code_company ON routes(route_code, company_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_name_company ON routes(route_name, company_id) WHERE is_deleted = false;

-- Fleets table
CREATE TABLE IF NOT EXISTS fleets (
    fleet_id UUID PRIMARY KEY,
    vehicle_num VARCHAR(50) NOT NULL,
    company_id UUID NOT NULL,
    capacity VARCHAR(50),
    veh_make VARCHAR(100),
    veh_model VARCHAR(100),
    mfg_year VARCHAR(10),
    next_fc_date VARCHAR(50),
    puc_date_valid_upto VARCHAR(50),
    insurance_valid_upto VARCHAR(50),
    owner_name VARCHAR(100),
    owner_contact VARCHAR(20),
    owner_email VARCHAR(100),
    owner_pan VARCHAR(20),
    owner_aadhaar VARCHAR(20),
    pymt_to_name VARCHAR(100),
    pymt_bank_name VARCHAR(100),
    pymt_acc_num VARCHAR(50),
    pymt_ifsc_code VARCHAR(20),
    pymt_branch VARCHAR(100),
    contract_amount VARCHAR(50),
    tds_exemption BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_fleets_status ON fleets(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fleets_vehicle_company ON fleets(vehicle_num, company_id) WHERE is_deleted = false;

-- Route HCF Mappings table
CREATE TABLE IF NOT EXISTS route_hcf_mappings (
    route_hcf_id UUID PRIMARY KEY,
    route_id UUID NOT NULL,
    hcf_id UUID NOT NULL,
    company_id UUID NOT NULL,
    sequence_order INTEGER,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_route_hcf_status ON route_hcf_mappings(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_route_hcf_hcf ON route_hcf_mappings(hcf_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_hcf_unique ON route_hcf_mappings(route_id, hcf_id) WHERE is_deleted = false;

-- HCF Amendments table
CREATE TABLE IF NOT EXISTS hcf_amendments (
    hcf_amendment_id UUID PRIMARY KEY,
    hcf_id UUID NOT NULL,
    amendment_type VARCHAR(100) NOT NULL,
    amendment_date VARCHAR(50) NOT NULL,
    description TEXT,
    amendment_status VARCHAR(50),
    approved_by UUID,
    approved_date VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_hcf_amendments_status ON hcf_amendments(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_hcf_amendments_hcf ON hcf_amendments(hcf_id) WHERE is_deleted = false;

-- HCFs table (large table with many fields)
CREATE TABLE IF NOT EXISTS hcfs (
    hcf_id UUID PRIMARY KEY,
    hcf_code VARCHAR(50) NOT NULL,
    company_id UUID NOT NULL,
    password VARCHAR(255),
    hcf_type_code VARCHAR(50),
    hcf_name VARCHAR(200) NOT NULL,
    hcf_short_name VARCHAR(100),
    area_id UUID,
    pincode VARCHAR(10),
    district VARCHAR(100),
    state_code VARCHAR(50),
    group_code VARCHAR(50),
    pcb_zone UUID,
    billing_name VARCHAR(200),
    billing_address TEXT,
    service_address TEXT,
    gstin VARCHAR(20),
    regn_num VARCHAR(50),
    hosp_regn_date VARCHAR(50),
    billing_type VARCHAR(50),
    adv_amount VARCHAR(50),
    billing_option VARCHAR(50),
    bed_count VARCHAR(50),
    bed_rate VARCHAR(50),
    kg_rate VARCHAR(50),
    lumpsum VARCHAR(50),
    accounts_landline VARCHAR(20),
    accounts_mobile VARCHAR(20),
    accounts_email VARCHAR(100),
    contact_name VARCHAR(100),
    contact_designation VARCHAR(100),
    contact_mobile VARCHAR(20),
    contact_email VARCHAR(100),
    agr_sign_auth_name VARCHAR(100),
    agr_sign_auth_designation VARCHAR(100),
    dr_name VARCHAR(100),
    dr_ph_no VARCHAR(20),
    dr_email VARCHAR(100),
    service_start_date VARCHAR(50),
    service_end_date VARCHAR(50),
    category VARCHAR(50),
    route VARCHAR(50),
    executive_assigned VARCHAR(100),
    submit_by VARCHAR(100),
    agr_id VARCHAR(50),
    sort_order VARCHAR(10),
    is_govt BOOLEAN DEFAULT FALSE,
    is_gst_exempt BOOLEAN DEFAULT FALSE,
    auto_gen BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_hcfs_status ON hcfs(status) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hcfs_code_company ON hcfs(hcf_code, company_id) WHERE is_deleted = false;
