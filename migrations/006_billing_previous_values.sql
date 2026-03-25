-- Add previous period snapshot columns to billing_line_items
-- These store the cumulative values from the PRIOR billing period
-- so the UI can show "Previous %" and "Previous Amount" read-only columns
ALTER TABLE billing_line_items ADD COLUMN previous_completed_pct REAL DEFAULT 0;
ALTER TABLE billing_line_items ADD COLUMN previous_completed_value REAL DEFAULT 0;
