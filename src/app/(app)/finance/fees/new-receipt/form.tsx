'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { money } from '@/lib/money';

export function ReceiptForm({
  banks, studentName, balance,
}: { banks: { id: string; name: string }[]; studentName: string; balance: number }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex items-start gap-3 bg-success-soft text-success border border-success/20 rounded-md p-4">
        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold">Receipt issued (demo)</div>
          <div className="text-sm mt-1 text-success/80">
            In the full system this would create a <code>fin_fee_receipt</code> row,
            allocate against open invoices, post a journal entry, and emit a printable PDF.
          </div>
          <button onClick={() => setSubmitted(false)} className="mt-3 text-sm font-medium underline">
            Issue another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Student</label>
        <input type="text" defaultValue={studentName} className="w-full h-10 px-3 rounded-md border border-border bg-surface" />
        <div className="text-xs text-text-muted mt-1">Outstanding balance: {money(balance)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Method</label>
          <select className="w-full h-10 px-2 rounded-md border border-border bg-surface">
            <option>CASH</option><option>EFT</option><option>MOBILE</option><option>CARD</option><option>CHEQUE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Bank account</label>
          <select className="w-full h-10 px-2 rounded-md border border-border bg-surface">
            {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Amount</label>
          <input type="number" defaultValue={balance.toFixed(2)} step="0.01" className="w-full h-10 px-3 rounded-md border border-border bg-surface" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Reference</label>
          <input type="text" placeholder="TXN reference" className="w-full h-10 px-3 rounded-md border border-border bg-surface" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Paid by</label>
        <input type="text" defaultValue="Parent / Guardian" className="w-full h-10 px-3 rounded-md border border-border bg-surface" />
      </div>

      <div className="pt-2 flex gap-2">
        <button type="submit" className="h-10 px-4 rounded-md bg-brand text-brand-fg font-medium hover:bg-brand/90">
          Issue receipt
        </button>
        <a href="/finance/fees" className="h-10 px-4 rounded-md border border-border font-medium hover:bg-surface-2 inline-flex items-center">Cancel</a>
      </div>
    </form>
  );
}
