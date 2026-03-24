-- Add document content storage table
CREATE TABLE IF NOT EXISTS document_content (
  document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(project_id, category);
