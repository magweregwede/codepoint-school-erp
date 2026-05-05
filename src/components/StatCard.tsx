import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function StatCard({
  label, value, sublabel, tone, icon,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  tone?: 'default' | 'success' | 'warn' | 'danger' | 'info';
  icon?: ReactNode;
}) {
  const toneClass = {
    default: 'text-text',
    success: 'text-success',
    warn:    'text-warn',
    danger:  'text-danger',
    info:    'text-info',
  }[tone ?? 'default'];

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</div>
          <div className={cn('mt-1 text-2xl font-semibold tabular-nums truncate', toneClass)}>{value}</div>
          {sublabel && <div className="mt-1 text-xs text-text-muted">{sublabel}</div>}
        </div>
        {icon && <div className="text-text-soft shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
