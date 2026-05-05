'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function IssueLoanForm({
  titles, students,
}: {
  titles: { id: string; title: string; copies: { id: string; accessionNo: string }[] }[];
  students: { id: string; firstName: string; lastName: string; admissionNo: string }[];
}) {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="flex items-start gap-3 bg-success-soft text-success border border-success/20 rounded-md p-4">
        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold">Loan issued (demo)</div>
          <div className="text-sm mt-1 text-success/80">In the full system this would set <code>copy.status = ON_LOAN</code> and create a loan row.</div>
          <button onClick={() => setDone(false)} className="mt-3 text-sm font-medium underline">Issue another</button>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Title (only available copies shown)</label>
        <select className="w-full h-10 px-2 rounded-md border border-border bg-surface">
          {titles.map((t) => <option key={t.id} value={t.id}>{t.title} (copy {t.copies[0]?.accessionNo})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Borrower (student)</label>
        <select className="w-full h-10 px-2 rounded-md border border-border bg-surface">
          {students.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.admissionNo})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Loan type</label>
          <select className="w-full h-10 px-2 rounded-md border border-border bg-surface">
            <option value="SHORT_TERM">Short term (14 days)</option>
            <option value="LONG_TERM">Long term (whole term)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Due date</label>
          <input type="date" className="w-full h-10 px-3 rounded-md border border-border bg-surface" />
        </div>
      </div>
      <div className="pt-2 flex gap-2">
        <button type="submit" className="h-10 px-4 rounded-md bg-brand text-brand-fg font-medium hover:bg-brand/90">Issue loan</button>
        <a href="/library/loans" className="h-10 px-4 rounded-md border border-border font-medium hover:bg-surface-2 inline-flex items-center">Cancel</a>
      </div>
    </form>
  );
}
