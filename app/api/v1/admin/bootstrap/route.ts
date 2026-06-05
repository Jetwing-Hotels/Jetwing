import { requireUser } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, forbidden } from '@/lib/api/http';

/**
 * POST /api/v1/admin/bootstrap
 * One-time setup: if NO admin exists yet, grant the caller the ADMIN role.
 * Once any admin exists, this is locked (use /api/v1/admin/roles instead).
 */
export const POST = route(async () => {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { count, error: countErr } = await admin
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'ADMIN');

  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) > 0) {
    throw forbidden('An admin already exists. Ask an existing admin to grant your role.');
  }

  const { error } = await admin
    .from('user_roles')
    .insert({ user_id: user.id, role: 'ADMIN' });

  if (error) throw new Error(error.message);

  return ok({ message: 'You are now an ADMIN. Reload the app.', user_id: user.id, role: 'ADMIN' }, 201);
});
