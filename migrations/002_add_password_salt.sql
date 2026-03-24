-- Add password_salt column for PBKDF2 migration
ALTER TABLE users ADD COLUMN password_salt TEXT;
