-- ═══════════════════════════════════════════════════════
-- SMARTPM — D1 DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════

-- AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'pm',
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_number TEXT UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT,
  client_name TEXT,
  client_contact TEXT,
  client_email TEXT,
  client_phone TEXT,
  gc_name TEXT,
  gc_contact TEXT,
  gc_email TEXT,
  gc_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  jurisdiction TEXT,
  bid_date TEXT,
  award_date TEXT,
  start_date TEXT,
  substantial_completion TEXT,
  final_completion TEXT,
  original_contract_value REAL DEFAULT 0,
  current_contract_value REAL DEFAULT 0,
  total_billed REAL DEFAULT 0,
  total_paid REAL DEFAULT 0,
  retainage_pct REAL DEFAULT 10,
  retainage_held REAL DEFAULT 0,
  disciplines TEXT,
  pricing_tier TEXT DEFAULT 'mid',
  regional_multiplier TEXT DEFAULT 'national_average',
  prevailing_wage TEXT DEFAULT '',
  work_shift TEXT DEFAULT '',
  markup_material REAL DEFAULT 25,
  markup_labor REAL DEFAULT 30,
  markup_equipment REAL DEFAULT 15,
  markup_subcontractor REAL DEFAULT 10,
  labor_rates TEXT,
  burden_rate REAL DEFAULT 35,
  include_burden INTEGER DEFAULT 1,
  notes TEXT,
  smartplans_import_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- SCHEDULE OF VALUES
CREATE TABLE IF NOT EXISTS sov_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  division TEXT,
  category TEXT,
  scheduled_value REAL DEFAULT 0,
  material_cost REAL DEFAULT 0,
  labor_cost REAL DEFAULT 0,
  equipment_cost REAL DEFAULT 0,
  sub_cost REAL DEFAULT 0,
  total_completed_pct REAL DEFAULT 0,
  total_completed_value REAL DEFAULT 0,
  stored_material REAL DEFAULT 0,
  retainage REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- BILLING PERIODS
CREATE TABLE IF NOT EXISTS billing_periods (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  original_contract REAL DEFAULT 0,
  net_change_orders REAL DEFAULT 0,
  contract_sum_to_date REAL DEFAULT 0,
  total_completed_stored REAL DEFAULT 0,
  retainage REAL DEFAULT 0,
  total_earned_less_retainage REAL DEFAULT 0,
  less_previous_payments REAL DEFAULT 0,
  current_payment_due REAL DEFAULT 0,
  submitted_date TEXT,
  approved_date TEXT,
  paid_date TEXT,
  paid_amount REAL,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS billing_line_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  billing_period_id TEXT NOT NULL REFERENCES billing_periods(id) ON DELETE CASCADE,
  sov_item_id TEXT NOT NULL REFERENCES sov_items(id) ON DELETE CASCADE,
  work_completed_this_period REAL DEFAULT 0,
  stored_material_this_period REAL DEFAULT 0,
  total_completed_pct REAL DEFAULT 0,
  total_completed_value REAL DEFAULT 0,
  total_stored REAL DEFAULT 0,
  retainage REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- CHANGE ORDERS
CREATE TABLE IF NOT EXISTS change_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT DEFAULT 'addition',
  material_cost REAL DEFAULT 0,
  labor_hours REAL DEFAULT 0,
  labor_cost REAL DEFAULT 0,
  equipment_cost REAL DEFAULT 0,
  sub_cost REAL DEFAULT 0,
  markup_pct REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  schedule_impact_days INTEGER DEFAULT 0,
  requested_by TEXT,
  requested_date TEXT,
  submitted_date TEXT,
  approved_date TEXT,
  approved_by TEXT,
  rfi_reference TEXT,
  revision INTEGER DEFAULT 0,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- RFIs
CREATE TABLE IF NOT EXISTS rfis (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  detail TEXT,
  discipline TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  submitted_to TEXT,
  submitted_date TEXT,
  response TEXT,
  responded_by TEXT,
  response_date TEXT,
  due_date TEXT,
  cost_impact INTEGER DEFAULT 0,
  schedule_impact INTEGER DEFAULT 0,
  change_order_id TEXT REFERENCES change_orders(id),
  source TEXT DEFAULT 'manual',
  smartplans_rfi_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- SUBMITTALS
CREATE TABLE IF NOT EXISTS submittals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submittal_number TEXT NOT NULL,
  title TEXT NOT NULL,
  spec_section TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_preparation',
  submitted_date TEXT,
  returned_date TEXT,
  due_date TEXT,
  revision INTEGER DEFAULT 0,
  discipline TEXT,
  category TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- DAILY LOGS
CREATE TABLE IF NOT EXISTS daily_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  weather TEXT,
  temperature_high REAL,
  temperature_low REAL,
  site_conditions TEXT,
  crew_size INTEGER DEFAULT 0,
  hours_worked REAL DEFAULT 0,
  work_performed TEXT,
  areas_worked TEXT,
  delays TEXT,
  safety_incidents TEXT,
  visitor_log TEXT,
  materials_received TEXT,
  materials_installed TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  r2_key TEXT,
  description TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- PUNCH LIST
CREATE TABLE IF NOT EXISTS punch_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  discipline TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to TEXT,
  due_date TEXT,
  completed_date TEXT,
  verified_by TEXT,
  verified_date TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_sov_project ON sov_items(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_project ON billing_periods(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_lines ON billing_line_items(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_co_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_rfi_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id, log_date);
CREATE INDEX IF NOT EXISTS idx_punch_project ON punch_items(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);

-- SEED: Default users with role-based access
-- Admin (password: SmartAdmin2026!) — Full access: all modules, create/edit/delete everything
INSERT OR IGNORE INTO users (id, username, password_hash, display_name, email, role) VALUES (
  '00000000000000000000000000000001',
  'admin',
  '2acae1a4f8bb9f49d6ba5c284d761739a778762b3a4b0512ecc6c8360ac923ef',
  'Administrator',
  'agoodson@3dtsi.com',
  'admin'
);

-- Ops Manager (password: SmartOps2026!) — Operational access: edit projects, logs, schedules; no user/financial mgmt
INSERT OR IGNORE INTO users (id, username, password_hash, display_name, email, role) VALUES (
  '00000000000000000000000000000002',
  'opsmgr',
  'fa2dc6f4ebbd72bde9d5adbeeeb3e1fcb37d6a0bc501047e80bbca74294213ad',
  'Operations Manager',
  'ops@3dtsi.com',
  'ops_mgr'
);

-- Project Manager (password: SmartPM2026!) — PM access: view-heavy, edit own projects/logs only
INSERT OR IGNORE INTO users (id, username, password_hash, display_name, email, role) VALUES (
  '00000000000000000000000000000003',
  'pm',
  'af88c4ddc866702bd349fa83d8efa95e9586a5d81dc2f63fdbfd21c4eebbe5ac',
  'Project Manager',
  'pm@3dtsi.com',
  'pm'
);
