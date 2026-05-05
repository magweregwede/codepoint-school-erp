'use client';

import { useState } from 'react';
import { CheckCircle2, Send, Smartphone, Mail, MessageSquare } from 'lucide-react';

type Class = { id: string; name: string };

export function ComposeForm({
  classes, totals,
}: { classes: Class[]; totals: { students: number; employees: number; guardians: number } }) {
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'IN_APP'>('SMS');
  const [audience, setAudience] = useState<string>('ALL_PARENTS');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);

  const recipientCount = audience === 'ALL_PARENTS' ? totals.guardians
    : audience === 'ALL_STAFF' ? totals.employees
    : audience === 'ALL_STUDENTS' ? totals.students
    : audience.startsWith('CLASS:') ? 35
    : 0;

  const charLimit = channel === 'SMS' ? 160 : 5000;

  if (done) {
    return (
      <div className="flex items-start gap-3 bg-success-soft text-success border border-success/20 rounded-md p-4">
        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold">Message queued for delivery (demo)</div>
          <div className="text-sm mt-1 text-success/80">
            {recipientCount} recipients via {channel}. The full system would call the gateway,
            persist a row per recipient with delivery status, and update the message log.
          </div>
          <button onClick={() => setDone(false)} className="mt-3 text-sm font-medium underline">Compose another</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-2">Channel</label>
        <div className="flex gap-2">
          <ChannelButton selected={channel === 'SMS'}    onClick={() => setChannel('SMS')}    icon={<Smartphone className="w-4 h-4" />} label="SMS" />
          <ChannelButton selected={channel === 'EMAIL'}  onClick={() => setChannel('EMAIL')}  icon={<Mail className="w-4 h-4" />}        label="Email" />
          <ChannelButton selected={channel === 'IN_APP'} onClick={() => setChannel('IN_APP')} icon={<MessageSquare className="w-4 h-4" />} label="In-app" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Audience</label>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full h-10 px-2 rounded-md border border-border bg-surface">
          <option value="ALL_PARENTS">All parents / guardians</option>
          <option value="ALL_STAFF">All staff</option>
          <option value="ALL_STUDENTS">All students</option>
          <optgroup label="Class">
            {classes.map((c) => <option key={c.id} value={`CLASS:${c.id}`}>Parents of {c.name}</option>)}
          </optgroup>
        </select>
        <div className="text-xs text-text-muted mt-1">≈ {recipientCount} recipients</div>
      </div>

      {channel === 'EMAIL' && (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Subject</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-border bg-surface" placeholder="e.g. End-of-term reports published" />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Body</label>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)}
          rows={5} maxLength={charLimit}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface font-mono text-sm"
          placeholder="Type your message..."
        />
        <div className="text-xs text-text-muted text-right mt-1">{body.length} / {charLimit} chars</div>
      </div>

      <div className="pt-2 flex gap-2">
        <button type="submit" disabled={!body || recipientCount === 0} className="h-10 px-4 rounded-md bg-brand text-brand-fg font-medium hover:bg-brand/90 disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="w-4 h-4" /> Send to {recipientCount}
        </button>
        <a href="/communications/log" className="h-10 px-4 rounded-md border border-border font-medium hover:bg-surface-2 inline-flex items-center">Cancel</a>
      </div>
    </form>
  );
}

function ChannelButton({ selected, onClick, icon, label }: { selected: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-md border text-sm flex items-center gap-2 ${selected ? 'bg-brand text-brand-fg border-brand' : 'border-border hover:bg-surface-2'}`}>
      {icon} {label}
    </button>
  );
}
