import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/communications/log',     label: 'Message log' },
  { href: '/communications/compose', label: 'Compose' },
];

export default async function CommsLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['comms.view_log','comms.send_message']);
  return <div><TabNav tabs={TABS} />{children}</div>;
}
