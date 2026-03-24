-- Add error logging table for health monitoring
CREATE TABLE IF NOT EXISTS error_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT,
  message TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_error_log_created ON error_log(created_at);
