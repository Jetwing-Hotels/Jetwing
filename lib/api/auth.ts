import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { forbidden, unauthorized } from './http';

export type AppRole = 'ADMIN' | 'REVENUE_MANAGER';

export interface AuthContext {
  user: User;
  roles: AppRole[];
  /** RLS-scoped Supabase client bound to the signed-in user. */
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Resolve the current user and their application roles from the session cookie.
 * Throws 401 if not signed in.
 */
export async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw unauthorized();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  return { user, roles, supabase };
}

/** Any user with at least one application role (ADMIN or REVENUE_MANAGER). */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.roles.length === 0) throw forbidden('No application role assigned');
  return ctx;
}

/** ADMIN only. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (!ctx.roles.includes('ADMIN')) throw forbidden('Admin role required');
  return ctx;
}

/** REVENUE_MANAGER (ADMIN also satisfies this). */
export async function requireRevenueManager(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (!ctx.roles.includes('REVENUE_MANAGER') && !ctx.roles.includes('ADMIN')) {
    throw forbidden('Revenue Manager role required');
  }
  return ctx;
}

export const actorLabel = (user: User) => user.email ?? user.id;
