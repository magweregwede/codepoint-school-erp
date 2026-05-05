import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/admin/users',  label: 'Users & Roles' },
  { href: '/admin/audit',  label: 'Audit log' },
  { href: '/admin/config', label: 'Configuration' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['admin.manage_users','admin.view_audit','admin.manage_config']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
