'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function TabNav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 -mt-2 mb-6 border-b border-border overflow-x-auto">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        return (
          <Link key={t.href} href={t.href}
            className={cn(
              'px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors',
              active
                ? 'border-brand text-text font-medium'
                : 'border-transparent text-text-muted hover:text-text hover:border-border',
            )}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
