-- ═══════════════════════════════════════════════════════
-- SMARTPM — D1 DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════

-- AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT,
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

-- DOCUMENT CONTENT (base64-encoded file data in D1, upgrade path to R2 later)
CREATE TABLE IF NOT EXISTS document_content (
  document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
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

-- INFRASTRUCTURE LOCATIONS (MDF / IDF / TR)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'idf',
  floor TEXT,
  room_number TEXT,
  building TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- EQUIPMENT / MATERIAL INSIDE EACH LOCATION
CREATE TABLE IF NOT EXISTS location_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  model TEXT,
  unit TEXT DEFAULT 'ea',
  budgeted_qty REAL DEFAULT 0,
  installed_qty REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  budgeted_cost REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- CABLE RUNS FROM EACH LOCATION
CREATE TABLE IF NOT EXISTS cable_runs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_label TEXT,
  cable_type TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_floor TEXT,
  pathway TEXT,
  budgeted_qty REAL DEFAULT 0,
  installed_qty REAL DEFAULT 0,
  budgeted_labor_hrs REAL DEFAULT 0,
  actual_labor_hrs REAL DEFAULT 0,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- LABOR TRACKING PER LOCATION
CREATE TABLE IF NOT EXISTS location_labor (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  description TEXT,
  budgeted_hours REAL DEFAULT 0,
  actual_hours REAL DEFAULT 0,
  worker_count INTEGER DEFAULT 1,
  date_worked TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- WORK BREAKDOWN STRUCTURE (WBS) — Auto-generated from SmartPlans bid
CREATE TABLE IF NOT EXISTS wbs_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES wbs_tasks(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  wbs_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT,
  task_type TEXT DEFAULT 'task',
  sort_order INTEGER DEFAULT 0,
  -- Budget (locked from SmartPlans import)
  budgeted_material REAL DEFAULT 0,
  budgeted_labor_hrs REAL DEFAULT 0,
  budgeted_labor_cost REAL DEFAULT 0,
  budgeted_equipment REAL DEFAULT 0,
  budgeted_total REAL DEFAULT 0,
  budgeted_qty REAL DEFAULT 0,
  unit TEXT DEFAULT 'ea',
  -- Actuals (PM can update)
  actual_material REAL DEFAULT 0,
  actual_labor_hrs REAL DEFAULT 0,
  actual_labor_cost REAL DEFAULT 0,
  actual_equipment REAL DEFAULT 0,
  actual_total REAL DEFAULT 0,
  actual_qty_installed REAL DEFAULT 0,
  -- Progress
  progress_pct REAL DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  -- Dates
  planned_start TEXT,
  planned_end TEXT,
  actual_start TEXT,
  actual_end TEXT,
  -- Meta
  assigned_to TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- LOGIN RATE LIMITING — Brute-force protection
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    locked_until TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
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
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(project_id, category);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_location_items_loc ON location_items(location_id);
CREATE INDEX IF NOT EXISTS idx_cable_runs_loc ON cable_runs(source_location_id);
CREATE INDEX IF NOT EXISTS idx_location_labor_loc ON location_labor(location_id);
CREATE INDEX IF NOT EXISTS idx_wbs_project ON wbs_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_wbs_parent ON wbs_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_wbs_location ON wbs_tasks(location_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated ON rate_limits(updated_at);

-- ═══════════════════════════════════════════════════════
-- INITIAL SETUP: Default users are NOT seeded in schema for security.
-- Password hashes must not be committed to source control.
--
-- After first deployment, create users via the admin panel or API:
--   POST /api/auth/setup (first-run only, when no users exist)
--
-- Roles: admin, ops_mgr, pm, viewer
-- All passwords use PBKDF2 with per-user salt (100K iterations)
-- ═══════════════════════════════════════════════════════
