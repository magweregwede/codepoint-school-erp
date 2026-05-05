import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/hr/employees',  label: 'Employees' },
  { href: '/hr/attendance', label: 'Attendance' },
  { href: '/hr/leave',      label: 'Leave' },
  { href: '/hr/payroll',    label: 'Payroll' },
];

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['hr.view_employee']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
