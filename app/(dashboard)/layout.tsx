import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { createClient } from '@/lib/supabase/server';

/**
 * Authenticated app shell. Server-side gate: unauthenticated visitors are
 * redirected to /login (the middleware does this too — this is defense in depth).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  const roles = (roleRows ?? []).map((r) => r.role);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopNav email={user.email ?? ''} roles={roles} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
