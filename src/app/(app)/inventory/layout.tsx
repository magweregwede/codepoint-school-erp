import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/inventory/assets',      label: 'Assets' },
  { href: '/inventory/movements',   label: 'Movements' },
  { href: '/inventory/vehicles',    label: 'Vehicles' },
  { href: '/inventory/consumables', label: 'Consumables' },
];

export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['inventory.view_asset','inventory.manage_consumables','inventory.manage_vehicle']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
