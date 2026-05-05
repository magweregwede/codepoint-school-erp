import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/library/catalogue', label: 'Catalogue' },
  { href: '/library/loans',     label: 'Loans' },
  { href: '/library/fines',     label: 'Fines' },
];

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['library.view_catalogue','library.issue_loan','library.manage_fine']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
