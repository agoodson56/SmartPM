// ═══════════════════════════════════════════════════════════════
// SMARTPM — Database Migration System
// GET  /api/migrations → current schema version + applied list
// POST /api/migrations → run pending migrations (admin only)
// ═══════════════════════════════════════════════════════════════

// All migration SQL is embedded here because Cloudflare Pages Functions
// cannot read files from disk at runtime. The .sql files in migrations/
// serve as the source-of-truth for review and version control.
const MIGRATIONS = [
  {
    version: 1,
    name: '001_initial_schema',
    sql: `-- Initial schema from schema.sql — applied manually on first deploy`,
  },
  {
    version: 2,
    name: '002_add_password_salt',
    sql: `ALTER TABLE users ADD COLUMN password_salt TEXT;`,
  },
  {
    version: 3,
    name: '003_add_document_content',
    sql: [
      `CREATE TABLE IF NOT EXISTS document_content (
        document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(project_id, category);`,
    ].join('\n'),
  },
  {
    version: 4,
    name: '004_add_error_log',
    sql: [
      `CREATE TABLE IF NOT EXISTS error_log (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        type TEXT,
        message TEXT,
        stack TEXT,
        url TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE INDEX IF NOT EXISTS idx_error_log_created ON error_log(created_at);`,
    ].join('\n'),
  },
  {
    version: 5,
    name: '005_add_estimate_revisions',
    sql: `-- Reference only: estimate revisions live in SmartPlans DB`,
  },
];

const ENSURE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now'))
  );
`;

// ── GET: Return current schema version and applied migrations ──────
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Ensure tracking table exists so the query doesn't fail on fresh DBs
    await env.DB.prepare(ENSURE_TRACKING_TABLE).run();

    const applied = await env.DB.prepare(
      `SELECT version, name, applied_at FROM schema_migrations ORDER BY version`
    ).all();

    const rows = applied.results || [];
    const currentVersion = rows.length > 0
      ? rows[rows.length - 1].version
      : 0;

    const pending = MIGRATIONS.filter(
      (m) => !rows.some((r) => r.version === m.version)
    );

    return Response.json({
      current_version: currentVersion,
      total_available: MIGRATIONS.length,
      pending_count: pending.length,
      applied: rows,
      pending: pending.map((m) => ({ version: m.version, name: m.name })),
    });
  } catch (err) {
    console.error('Migration status error:', err);
    return Response.json(
      { error: 'Failed to read migration status', detail: err.message },
      { status: 500 }
    );
  }
}

// ── POST: Run all pending migrations (admin only) ──────────────────
export async function onRequestPost(context) {
  const { env, data } = context;

  // Admin-only guard
  if (!data.user || data.user.role !== 'admin') {
    return Response.json(
      { error: 'Admin access required to run migrations' },
      { status: 403 }
    );
  }

  try {
    // Step 1: Ensure tracking table exists
    await env.DB.prepare(ENSURE_TRACKING_TABLE).run();

    // Step 2: Get already-applied versions
    const applied = await env.DB.prepare(
      `SELECT version FROM schema_migrations ORDER BY version`
    ).all();
    const appliedVersions = new Set(
      (applied.results || []).map((r) => r.version)
    );

    // Step 3: Find pending migrations
    const pending = MIGRATIONS.filter((m) => !appliedVersions.has(m.version));

    if (pending.length === 0) {
      return Response.json({
        message: 'Database is up to date',
        current_version: MIGRATIONS[MIGRATIONS.length - 1].version,
        applied_count: 0,
      });
    }

    // Step 4: Apply each pending migration in order
    const results = [];
    for (const migration of pending) {
      try {
        // Split SQL on semicolons to handle multi-statement migrations.
        // Skip comment-only / empty statements.
        const statements = migration.sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.match(/^--[\s\S]*$/));

        for (const stmt of statements) {
          await env.DB.prepare(stmt).run();
        }

        // Record the migration
        await env.DB.prepare(
          `INSERT INTO schema_migrations (version, name) VALUES (?, ?)`
        ).bind(migration.version, migration.name).run();

        results.push({
          version: migration.version,
          name: migration.name,
          status: 'applied',
        });
      } catch (err) {
        // Stop on first failure — don't skip migrations
        results.push({
          version: migration.version,
          name: migration.name,
          status: 'failed',
          error: err.message,
        });

        return Response.json(
          {
            message: 'Migration failed — stopped at first error',
            applied_count: results.filter((r) => r.status === 'applied').length,
            results,
          },
          { status: 500 }
        );
      }
    }

    const newVersion = results[results.length - 1].version;
    return Response.json({
      message: `Successfully applied ${results.length} migration(s)`,
      current_version: newVersion,
      applied_count: results.length,
      results,
    });
  } catch (err) {
    console.error('Migration runner error:', err);
    return Response.json(
      { error: 'Migration runner failed', detail: err.message },
      { status: 500 }
    );
  }
}
