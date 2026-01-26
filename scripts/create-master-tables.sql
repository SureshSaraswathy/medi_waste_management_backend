-- Master Data Tables Migration Script
-- Run this script on the master database

-- States Table
CREATE TABLE IF NOT EXISTS states (
    state_id UUID PRIMARY KEY,
    state_code VARCHAR(10) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_states_code_unique ON states(state_code) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_states_status ON states(status) WHERE is_deleted = FALSE;

-- Areas Table
CREATE TABLE IF NOT EXISTS areas (
    area_id UUID PRIMARY KEY,
    area_code VARCHAR(20) NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    area_pincode VARCHAR(6) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_code_unique ON areas(area_code) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_areas_status ON areas(status) WHERE is_deleted = FALSE;

-- Colors Table
CREATE TABLE IF NOT EXISTS colors (
    color_id UUID PRIMARY KEY,
    color_name VARCHAR(50) NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_colors_name_company_unique ON colors(color_name, company_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_colors_status ON colors(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_colors_company ON colors(company_id) WHERE is_deleted = FALSE;

-- PCB Zones Table
CREATE TABLE IF NOT EXISTS pcb_zones (
    pcb_zone_id UUID PRIMARY KEY,
    pcb_zone_name VARCHAR(100) NOT NULL,
    pcb_zone_address TEXT,
    contact_num VARCHAR(20),
    contact_email VARCHAR(100),
    alert_email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pcb_zones_name_unique ON pcb_zones(pcb_zone_name) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_pcb_zones_status ON pcb_zones(status) WHERE is_deleted = FALSE;

-- Comments
COMMENT ON TABLE states IS 'State Master - Stores state/region information';
COMMENT ON TABLE areas IS 'Area Master - Stores area/zone information with pincode';
COMMENT ON TABLE colors IS 'Color Master - Stores color codes per company';
COMMENT ON TABLE pcb_zones IS 'PCB Zone Master - Stores PCB zone information';
