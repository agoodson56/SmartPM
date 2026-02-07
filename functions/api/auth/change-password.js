// ═══════════════════════════════════════════════════════════════
// PUT /api/auth/change-password
// Role-based password management:
//   admin   → can change any user's password
//   ops_mgr → can change PM password only
//   pm/viewer → cannot change passwords
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const callerRole = data.user.role;

    try {
        const { target_username, new_password } = await request.json();

        if (!target_username || !new_password) {
            return Response.json({ error: 'Target username and new password are required' }, { status: 400 });
        }

        if (new_password.length < 8) {
            return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Look up target user
        const targetUser = await env.DB.prepare(
            `SELECT id, username, role FROM users WHERE username = ?`
        ).bind(target_username).first();

        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Enforce role-based permissions
        if (callerRole === 'admin') {
            // Admin can change anyone's password
        } else if (callerRole === 'ops_mgr') {
            // Ops Manager can only change PM passwords
            if (targetUser.role !== 'pm') {
                return Response.json({ error: 'Ops Manager can only change PM passwords' }, { status: 403 });
            }
        } else {
            return Response.json({ error: 'You do not have permission to change passwords' }, { status: 403 });
        }

        // Hash new password with SHA-256
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(new_password));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Update password
        await env.DB.prepare(
            `UPDATE users SET password_hash = ? WHERE id = ?`
        ).bind(passwordHash, targetUser.id).run();

        return Response.json({ success: true, message: `Password updated for ${target_username}` });
    } catch (err) {
        console.error('Change password error:', err);
        return Response.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
