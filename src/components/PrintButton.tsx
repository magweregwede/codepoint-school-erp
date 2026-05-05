'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-9 px-3 rounded-md border border-border text-sm hover:bg-surface-2 inline-flex items-center gap-2 no-print"
    >
      <Printer className="w-4 h-4" /> {label}
    </button>
  );
}
