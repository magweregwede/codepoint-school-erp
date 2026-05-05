import { AppShell } from '@/components/AppShell';
import { requireUser } from '@/lib/session';
import { visibleModules } from '@/lib/rbac';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const modules = visibleModules(user);
  return (
    <AppShell visibleModules={modules} user={user}>
      {children}
    </AppShell>
  );
}
