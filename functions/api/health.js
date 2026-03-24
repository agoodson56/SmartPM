// ═══════════════════════════════════════════════════════════════
// SMARTPM — Health Check Endpoint
// GET /api/health → returns app health status (public, no auth)
// ═══════════════════════════════════════════════════════════════

export async function onRequestGet(context) {
  const { env } = context;
  const result = {
    status: 'ok',
    app: 'smartpm',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok',
      tables: 0,
      users: 0,
      projects: 0,
    },
  };

  try {
    // Check D1 connectivity with a simple query
    await env.DB.prepare('SELECT 1').first();

    // Count tables
    const tablesResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
    ).first();
    result.checks.tables = tablesResult?.count ?? 0;

    // Count users
    const usersResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    result.checks.users = usersResult?.count ?? 0;

    // Count projects
    const projectsResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM projects'
    ).first();
    result.checks.projects = projectsResult?.count ?? 0;

  } catch (err) {
    console.error('Health check DB error:', err);
    result.status = 'error';
    result.checks.database = 'error';
  }

  const statusCode = result.status === 'ok' ? 200 : 503;
  return Response.json(result, { status: statusCode });
}
