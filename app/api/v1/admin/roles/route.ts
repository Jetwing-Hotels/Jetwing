import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, parseBody } from '@/lib/api/http';

const grantSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(['ADMIN', 'REVENUE_MANAGER']),
});

/**
 * POST /api/v1/admin/roles  — grant a role to a user. Admin only.
 */
export const POST = route(async (req) => {
  await requireAdmin();
  const { user_id, role } = await parseBody(req, grantSchema);

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_roles')
    .upsert({ user_id, role }, { onConflict: 'user_id,role' });

  if (error) throw new Error(error.message);
  return ok({ message: `Granted ${role} to ${user_id}.` }, 201);
});

/**
 * DELETE /api/v1/admin/roles?user_id=…&role=…  — revoke a role. Admin only.
 */
export const DELETE = route(async (req) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const parsed = grantSchema.parse({
    user_id: searchParams.get('user_id'),
    role: searchParams.get('role'),
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_roles')
    .delete()
    .eq('user_id', parsed.user_id)
    .eq('role', parsed.role);

  if (error) throw new Error(error.message);
  return ok({ message: `Revoked ${parsed.role} from ${parsed.user_id}.` });
});
