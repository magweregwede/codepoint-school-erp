import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/finance/fees',      label: 'Fees' },
  { href: '/finance/suppliers', label: 'Suppliers & AP' },
  { href: '/finance/bank',      label: 'Cash & Bank' },
  { href: '/finance/ledger',    label: 'General Ledger' },
];

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['finance.view_invoice','finance.view_supplier','finance.view_ledger']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
