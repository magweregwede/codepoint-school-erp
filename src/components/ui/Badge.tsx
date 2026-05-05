import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type BadgeTone = 'default' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  default: 'bg-surface-2 text-text border-border',
  success: 'bg-success-soft text-success border-success/20',
  warn:    'bg-warn-soft text-warn border-warn/20',
  danger:  'bg-danger-soft text-danger border-danger/20',
  info:    'bg-info-soft text-info border-info/20',
  neutral: 'bg-surface-2 text-text-muted border-border',
};

export function Badge({ tone = 'default', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      TONES[tone],
    )}>
      {children}
    </span>
  );
}

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  ACTIVE: 'success', PAID: 'success', APPROVED: 'success', SENT: 'success', DELIVERED: 'success', RECEIVED: 'success',
  PENDING: 'warn', DRAFT: 'warn', PARTIAL: 'warn', SUBMITTED: 'warn', QUEUED: 'warn',
  ISSUED: 'info', IN_USE: 'info', AVAILABLE: 'info', ON_LOAN: 'info',
  DECLINED: 'danger', CANCELLED: 'danger', VOID: 'danger', FAILED: 'danger', LOST: 'danger', OVERDUE: 'danger',
  WITHDRAWN: 'neutral', GRADUATED: 'neutral', SUSPENDED: 'warn', CLOSED: 'neutral',
  P: 'success', A: 'danger', L: 'warn', AA: 'info', S: 'warn',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE_MAP[status] ?? 'default';
  return <Badge tone={tone}>{status}</Badge>;
}
