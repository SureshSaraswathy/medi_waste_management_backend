/**
 * Customer Entitlements - catalogue DEFINITION (single source of truth).
 *
 * Hierarchy: Module -> Submodule -> Feature. Codes are permanent and dotted:
 *   MODULE                      e.g. FINANCE
 *   MODULE.SUBMODULE            e.g. FINANCE.INVOICE_MGMT
 *   MODULE.SUBMODULE.FEATURE    e.g. FINANCE.INVOICE_MGMT.DOWNLOAD_PDF
 *
 * scripts/entitlements/build-seed.js turns this into the SQL seed, the endpoint mapping and the
 * frontend route map. Never rename or reuse a code once released.
 *
 * Feature fields: type RIGHT | ACTION | EXPORT | REPORT | WIDGET | SCREEN
 *                 enforcement API (backend can block) | UI (hidden/blocked in the browser only)
 */
const RELEASE = '2026.1';

const modules = [
  { code: 'DASHBOARD', name: 'Dashboard', core: true, sort: 10 },
  { code: 'PROFILE', name: 'Profile', core: true, sort: 20 },
  { code: 'ADMINISTRATION', name: 'Administration', core: true, sort: 30 },
  { code: 'TRANSACTION', name: 'Transaction', sort: 40 },
  { code: 'FINANCE', name: 'Finance', sort: 50 },
  { code: 'COMMERCIAL', name: 'Commercial / Agreements', sort: 60 },
  { code: 'COMPLIANCE', name: 'Compliance & Training', sort: 70 },
  { code: 'MASTER', name: 'Master', sort: 80 },
  { code: 'REPORTS', name: 'Reports', sort: 90 },
  { code: 'MOBILE_APP', name: 'Mobile App', sort: 100 },
  { code: 'HCF_PORTAL', name: 'HCF Portal', sort: 110 },
];

const RIGHT_NAMES = { VIEW: 'View', CREATE: 'Create', EDIT: 'Edit', DELETE: 'Delete' };

/** Standard rights helper: perm prefix -> PREFIX_VIEW / _CREATE / _EDIT / _DELETE (overridable per right). */
const std = (perm, rights = ['VIEW', 'CREATE', 'EDIT', 'DELETE'], overrides = {}) =>
  rights.map((r) => ({ code: r, name: RIGHT_NAMES[r], type: 'RIGHT', enforcement: 'API', perm: overrides[r] || (perm ? `${perm}_${r}` : null) }));

const act = (code, name, enforcement = 'API', perm = null, type = 'ACTION') => ({ code, name, type, enforcement, perm });
const ui = (code, name, type = 'ACTION') => act(code, name, 'UI', null, type);

/** submodule: [module, code, name, routes, features, options] */
const S = (module, code, name, routes, features, options = {}) => ({ module, code, name, routes, features, ...options });

const register = (code, name, perm, route) =>
  S('TRANSACTION', code, name, [route], std(perm));

const submodules = [
  // ---------------- DASHBOARD (core) ----------------
  S('DASHBOARD', 'HOME', 'Dashboard', ['/dashboard'], [
    act('VIEW', 'View dashboard', 'API', 'DASHBOARD_VIEW', 'RIGHT'),
    act('KPI_WIDGETS', 'KPI widgets', 'API', null, 'WIDGET'),
    act('CHART_WIDGETS', 'Chart widgets', 'API', null, 'WIDGET'),
    act('TABLE_WIDGETS', 'Table widgets', 'API', null, 'WIDGET'),
    act('TASK_WIDGETS', 'Task widgets', 'API', null, 'WIDGET'),
    act('ALERT_WIDGETS', 'Alert widgets', 'API', null, 'WIDGET'),
  ]),
  // ---------------- PROFILE (core) ----------------
  S('PROFILE', 'MY_PROFILE', 'My Profile', ['/profile'], [ui('VIEW', 'View profile', 'SCREEN'), ui('CHANGE_PASSWORD', 'Change password')]),
  // ---------------- ADMINISTRATION (core) ----------------
  S('ADMINISTRATION', 'USER_MGMT', 'User Management', ['/master/user-management', '/users/new'], [
    ...std('USER'),
    act('ACTIVATE', 'Activate user', 'API', 'USER_ACTIVATE'),
    act('DEACTIVATE', 'Deactivate user', 'API', 'USER_DEACTIVATE'),
    act('RESET_PASSWORD', 'Reset password'),
  ]),
  S('ADMINISTRATION', 'ROLES_PERMISSIONS', 'Roles & Permissions', ['/master/roles-permissions'], [
    ...std('ROLE'),
    act('MANAGE_PERMISSIONS', 'Manage role permissions', 'API', 'ROLE_PERMISSIONS_MANAGE'),
  ]),

  // ---------------- TRANSACTION (15) ----------------
  S('TRANSACTION', 'ROUTE_ASSIGNMENT', 'Route Assignment', ['/transaction/route-assignment'], std('ROUTE_ASSIGNMENT')),
  S('TRANSACTION', 'BARCODE_GENERATION', 'Barcode Generation', ['/transaction/barcode-generation'], [
    act('VIEW', 'View', 'API', 'BARCODE_LABEL_VIEW', 'RIGHT'),
    act('GENERATE', 'Generate labels', 'API', 'BARCODE_LABEL_CREATE'),
    ui('PRINT_LABELS', 'Print labels'),
  ]),
  S('TRANSACTION', 'BARCODE_LIST', 'Barcode List', ['/transaction/barcode-list'], [
    act('VIEW', 'View', 'API', 'BARCODE_LABEL_VIEW', 'RIGHT'),
    act('EDIT', 'Edit', 'API', 'BARCODE_LABEL_UPDATE', 'RIGHT'),
    act('DELETE', 'Delete', 'API', 'BARCODE_LABEL_DELETE', 'RIGHT'),
    ui('PRINT', 'Print'),
  ]),
  S('TRANSACTION', 'WASTE_COLLECTION', 'Waste Collection', ['/transaction/waste-collection'], [...std('WASTE_COLLECTION'), ui('SCAN_BARCODE', 'Scan barcode')]),
  S('TRANSACTION', 'WASTE_TRANSACTION', 'Waste Transaction Data', ['/transaction/waste-transaction-data'], [...std('WASTE_TRANSACTION'), act('VERIFY', 'Verify', 'API', 'WASTE_TRANSACTION_VERIFY')]),
  S('TRANSACTION', 'VEHICLE_COLLECTION', 'Vehicle-wise Waste Collection', ['/transaction/vehicle-wise-waste-collection'], [...std('VEHICLE_WASTE_COLLECTION'), act('VERIFY', 'Verify', 'API', 'VEHICLE_WASTE_COLLECTION_VERIFY')]),
  S('TRANSACTION', 'WASTE_PROCESS', 'Waste Processing', ['/transaction/waste-processing'], [
    ...std('WASTE_PROCESS'),
    act('VERIFY', 'Verify', 'API', 'WASTE_PROCESS_VERIFY'),
    act('CLOSE', 'Close process', 'API', 'WASTE_PROCESS_CLOSE'),
  ]),
  register('INCIDENT_REGISTER', 'Incident Register', 'INCIDENT_REGISTER', '/transaction/incident-register'),
  register('INCINERATION_REGISTER', 'Incineration Register', 'INCINERATION_REGISTER', '/transaction/incineration-register'),
  register('AUTOCLAVE_REGISTER', 'Autoclave Register', 'AUTOCLAVE_REGISTER', '/transaction/autoclave-register'),
  register('SHREDDER_REGISTER', 'Shredder Register', 'SHREDDER_REGISTER', '/transaction/shredder-register'),
  register('DISPOSAL_REGISTER', 'Disposal Register', 'DISPOSAL_REGISTER', '/transaction/disposal-register'),
  register('EMISSION_REGISTER', 'Emission Register', 'EMISSION_REGISTER', '/transaction/emission-register'),
  register('ETP_REGISTER', 'ETP Register', 'ETP_REGISTER', '/transaction/etp-register'),
  register('DOWNTIME_REGISTER', 'Downtime Register', 'DOWNTIME_REGISTER', '/transaction/downtime-register'),

  // ---------------- FINANCE (5) ----------------
  S('FINANCE', 'INVOICE_MGMT', 'Invoice Management', ['/finance/invoice-management'], [
    ...std('INVOICE', ['VIEW', 'CREATE', 'EDIT', 'DELETE'], { EDIT: 'INVOICE_UPDATE' }),
    act('POST', 'Post invoice'),
    act('DOWNLOAD_PDF', 'Download PDF'),
    ui('PRINT', 'Print', 'EXPORT'),
    act('BULK_ZIP', 'Bulk PDF / ZIP download', 'API', null, 'EXPORT'),
    ui('EXPORT', 'Export', 'EXPORT'),
  ]),
  S('FINANCE', 'INVOICE_GENERATION', 'Invoice Generation', ['/finance/generate-invoices', '/finance/draft-invoices'], [
    act('VIEW', 'View batches', 'API', null, 'RIGHT'),
    act('AUTO_GENERATE', 'Auto generate'),
    act('GENERATE_BY_MONTH', 'Generate by month'),
    act('GENERATE_BY_WEIGHT', 'Generate by weight'),
    act('EDIT_DRAFT', 'Edit draft invoices'),
    act('POST_BATCH', 'Post batch'),
  ]),
  S('FINANCE', 'PAYMENT', 'Payment', ['/finance/payment', '/finance/payment-success'], [
    act('VIEW', 'View payments', 'API', null, 'RIGHT'),
    act('RECORD_PAYMENT', 'Record payment'),
    act('PROCESS_PAYMENT', 'Process payment'),
  ]),
  S('FINANCE', 'RECEIPT_MGMT', 'Receipt Management', ['/finance/receipt-management'], [
    act('VIEW', 'View receipts', 'API', null, 'RIGHT'),
    act('ADD_RECEIPT', 'Add receipt'),
    ui('DOWNLOAD_PDF', 'Download receipt PDF', 'EXPORT'),
    ui('PRINT', 'Print receipt', 'EXPORT'),
  ]),
  S('FINANCE', 'FIN_BALANCE', 'Financial Balance Summary', ['/finance/financial-balance-summary'], [
    act('VIEW', 'View', 'API', null, 'RIGHT'),
    act('CREATE', 'Create', 'API', null, 'RIGHT'),
    act('EDIT', 'Edit', 'API', null, 'RIGHT'),
    act('DELETE', 'Delete', 'API', null, 'RIGHT'),
    act('BULK_UPLOAD', 'Bulk upload'),
  ]),

  // ---------------- COMMERCIAL (4) ----------------
  S('COMMERCIAL', 'CONTRACT_MASTER', 'Contract Master', ['/commercial-agreements/contract-master'], std('CONTRACT')),
  S('COMMERCIAL', 'AGREEMENT', 'Agreement', ['/commercial-agreements/agreement'], [
    ...std('AGREEMENT'),
    act('DOWNLOAD_PDF', 'Download PDF', 'API', null, 'EXPORT'),
    ui('PRINT', 'Print', 'EXPORT'),
    ui('TERMINATE', 'Terminate agreement'),
    ui('STAMP_PAPER_PRINT', 'Stamp-paper print', 'EXPORT'),
  ]),
  S('COMMERCIAL', 'AGREEMENT_CLAUSE', 'Agreement Clause', ['/commercial-agreements/agreement-clause'], std('AGREEMENT_CLAUSE')),
  S('COMMERCIAL', 'AGREEMENT_TEMPLATE', 'Agreement Template', ['/commercial-agreements/agreement-template'], std('AGREEMENT_TEMPLATE')),

  // ---------------- COMPLIANCE (2) ----------------
  S('COMPLIANCE', 'TRAINING_CERTIFICATE', 'Training Certificate', ['/compliance-training/training-certificate-management'], [
    ...std('TRAINING_CERTIFICATE'),
    ui('EXPORT', 'Export', 'EXPORT'),
    ui('PRINT', 'Print', 'EXPORT'),
    ui('AUTO_NUMBER', 'Auto-number certificates'),
  ]),
  S('COMPLIANCE', 'COMPLIANCE_REGISTER', 'Compliance Register', ['/transaction/compliance-register'], std('COMPLIANCE_REGISTER')),

  // ---------------- MASTER (17) ----------------
  S('MASTER', 'COMPANY', 'Company', ['/master/company'], std('COMPANY')),
  S('MASTER', 'STATE', 'State', ['/master/state'], std('STATE')),
  S('MASTER', 'DISTRICT', 'District', ['/master/district'], std('DISTRICT')),
  S('MASTER', 'EQUIPMENT', 'Equipment', ['/master/equipment'], std('EQUIPMENT')),
  S('MASTER', 'PLACEHOLDER', 'Placeholder Master', ['/master/placeholder-master'], std('PLACEHOLDER_MASTER')),
  S('MASTER', 'FINANCE_YEAR', 'Finance Year', ['/master/finance-year'], std('FINANCE_YEAR')),
  S('MASTER', 'AREA', 'Area', ['/master/area'], std('AREA')),
  S('MASTER', 'CATEGORY', 'Category', ['/master/category'], std('CATEGORY')),
  S('MASTER', 'COLOR_CODE', 'Colour Code', ['/master/color-code'], std('COLOR')),
  S('MASTER', 'PCB_ZONE', 'PCB Zone', ['/master/pcb-zone'], std('PCB_ZONE')),
  S('MASTER', 'FREQUENCY', 'Frequency', ['/master/frequency'], std('FREQUENCY')),
  S('MASTER', 'HCF_TYPE', 'HCF Type', ['/master/hcf-type'], std('HCF_TYPE')),
  S('MASTER', 'HCF', 'HCF Master', ['/master/hcf-master'], [...std('HCF'), act('RESET_PORTAL_PASSWORD', 'Reset HCF portal password')]),
  S('MASTER', 'HCF_AMENDMENT', 'HCF Amendments', ['/master/hcf-amendments'], std('HCF_AMENDMENT')),
  S('MASTER', 'FLEET', 'Fleet Management', ['/master/fleet-management'], std('FLEET')),
  S('MASTER', 'ROUTE', 'Route', ['/master/route'], std('ROUTE')),
  S('MASTER', 'ROUTE_HCF', 'Route-HCF Mapping', ['/master/route-hcf-mapping'], std('ROUTE_HCF')),

  // ---------------- REPORTS (4 groups; each report a feature) ----------------
  // report feature: { code, name, routes, apis }  apis = backend /reports/<x> paths
  ...[
    ['FINANCE_BILLING', 'Finance & Billing', ['/report/billing-finance'], [
      ['INVOICE_REPORT', 'Invoice Report', ['/report/invoice', '/report/billing-finance/invoice-generation', '/report/billing-finance/unbilled-services'], ['invoices']],
      ['PAYMENT_REPORT', 'Payment Report', ['/report/payment', '/report/billing-finance/pending-payments'], []],
      ['REVENUE_REPORT', 'Revenue Analysis Report', ['/report/revenue', '/report/billing-finance/cost-revenue-analysis'], []],
      ['OUTSTANDING_REPORT', 'Outstanding Amount Report', ['/report/outstanding', '/report/billing-finance/outstanding-payments'], []],
      ['COST_ANALYSIS_REPORT', 'Cost Analysis Report', ['/report/cost-analysis'], ['cost-analysis']],
      ['HCF_LEDGER_STATEMENT', 'HCF Ledger Statement', ['/report/hcf-ledger-statement'], ['hcf-ledger-statement']],
      ['BULK_ZIP_REPORT', 'Bulk ZIP Download Report', ['/report/bulk-zip-downloads'], []],
    ]],
    ['OPERATIONS_LOGISTICS', 'Operations & Logistics', ['/report/operations-logistics'], [
      ['ROUTE_TRIP_REPORT', 'Route Trip Report', ['/report/operations-logistics/route-trip-sheet'], ['route-trip']],
      ['MISSED_ROUTE_REPORT', 'Missed Route Schedule', ['/report/operations-logistics/missed-route-schedule'], ['missed-route-schedule']],
      ['FLEET_REPORT', 'Fleet Management Report', ['/report/fleet'], []],
      ['ROUTE_REPORT', 'Route Report', ['/report/route'], []],
      ['BARCODE_USAGE_REPORT', 'Barcode Usage Report', ['/report/barcode', '/report/barcode-usage'], []],
      ['COLLECTION_REPORT', 'Waste Collection Report', ['/report/collection', '/report/operations-logistics/waste-collection-transactions'], []],
      ['HCF_COLLECTION_HISTORY', 'HCF Waste Collection History Report', ['/report/hcf-waste-collection-history'], ['hcf-waste-collection-history']],
      ['COLLECTION_SUMMARY', 'Waste Collection Summary Report', ['/report/waste-collection-summary'], ['waste-collection-summary']],
    ]],
    ['COMPLIANCE_REPORTS', 'Compliance', [], [
      ['TRAINING_CERTIFICATE_REPORT', 'Training Certificate Report', ['/report/training-certificate'], []],
      ['COMPLIANCE_STATUS_REPORT', 'Compliance Status Report', ['/report/compliance'], []],
      ['HCF_COMPLIANCE_REPORT', 'HCF Compliance Report', ['/report/hcf-compliance'], []],
      ['OPERATOR_PCB_REPORT', 'Operator PCB Report', ['/report/operator-pcb-collection'], ['operator-pcb-collection']],
      ['PCB_COMPLIANCE_REPORT', 'PCB Compliance Report', ['/report/pcb-compliance'], ['pcb-compliance']],
    ]],
    ['MASTER_DATA_REPORTS', 'Master Data', [], [
      ['COMPANY_REPORT', 'Company Master Report', ['/report/company'], []],
      ['HCF_REPORT', 'HCF Master Report', ['/report/hcf'], []],
      ['USER_REPORT', 'User Report', ['/report/user'], []],
      ['FLEET_MASTER_REPORT', 'Fleet Master Report', ['/report/fleet-master'], []],
      ['CONTRACT_REPORT', 'Contract Report', ['/report/contract'], []],
      ['AGREEMENT_REPORT', 'Agreement Report', ['/report/agreement'], []],
      ['CONTRACT_RENEWAL_REPORT', 'Contract Renewal Report', ['/report/contract-renewal'], []],
    ]],
  ].map(([code, name, groupRoutes, reports]) =>
    S('REPORTS', code, name, groupRoutes, [
      ...reports.map(([rc, rn, routes, apis]) => ({ code: rc, name: rn, type: 'REPORT', enforcement: 'API', perm: null, routes, apis })),
      act('EXPORT_PDF', 'Export PDF', 'UI', null, 'EXPORT'),
      act('EXPORT_EXCEL', 'Export Excel', 'UI', null, 'EXPORT'),
      act('EXPORT_CSV', 'Export CSV', 'UI', null, 'EXPORT'),
      act('PRINT', 'Print', 'UI', null, 'EXPORT'),
    ]),
  ),

  // ---------------- MOBILE APP (10 existing screens) ----------------
  ...[
    ['HOME', 'Home', '/mobile/home', 'HOME_VIEW'],
    ['SCAN', 'Scan', '/mobile/scan', null],
    ['WASTE_ENTRY', 'Waste Entry', '/mobile/waste-entry', null],
    ['WASTE_COLLECTIONS', 'Waste Collections', '/mobile/waste-collections', null],
    ['ASSIGN_HOSPITAL', 'Assign Hospital', '/mobile/assign-hospital', null],
    ['ASSIGNED_HCFS', 'Assigned HCFs', '/mobile/assigned-hcfs', null],
    ['ANALYTICS', 'Analytics', '/mobile/analytics', 'REPORT_VIEW'],
    ['HCF_MASTER', 'HCF Master', '/mobile/hcf-master', null],
    ['PROFILE', 'Profile', '/mobile/profile', null],
    ['SETTINGS', 'Settings', '/mobile/settings', null],
  ].map(([code, name, route, perm]) => S('MOBILE_APP', code, name, [route], [act('VIEW', 'Open screen', 'UI', perm, 'SCREEN')])),

  // ---------------- HCF PORTAL ----------------
  S('HCF_PORTAL', 'HCF_DASHBOARD', 'HCF Dashboard', ['/hcf/dashboard'], [ui('VIEW', 'Open dashboard', 'SCREEN')]),
  S('HCF_PORTAL', 'PASSWORD_MGMT', 'Password Management', ['/hcf/change-password'], [act('CHANGE_PASSWORD', 'Change password'), ui('VIEW', 'Open screen', 'SCREEN')]),
];

/** Hub / module level frontend routes (route prefix -> module code). */
const moduleRoutes = {
  '/dashboard': 'DASHBOARD',
  '/transaction': 'TRANSACTION',
  '/finance': 'FINANCE',
  '/commercial-agreements': 'COMMERCIAL',
  '/compliance-training': 'COMPLIANCE',
  '/master': 'MASTER',
  '/report': 'REPORTS',
  '/mobile': 'MOBILE_APP',
  '/hcf': 'HCF_PORTAL',
};

module.exports = { RELEASE, modules, submodules, moduleRoutes };
