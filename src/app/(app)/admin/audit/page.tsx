import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { dateTimeFmt } from '@/lib/money';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage(props: { searchParams: Promise<{ action?: string; user?: string }> }) {
  const sp = await props.searchParams;
  const where: Record<string, unknown> = {};
  if (sp.action) where.action = sp.action;
  if (sp.user) where.userEmail = { contains: sp.user };

  const [entries, totalCount] = await Promise.all([
    prisma.auditLog.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } }),
    prisma.auditLog.count(),
  ]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description={`Append-only, hash-chained log (SRS §FR-SYS-002 / §FR-SYS-003) — ${totalCount} entries total`}
      />

      <Card className="mb-4 border-info/20 bg-info-soft/30">
        <CardBody className="flex items-start gap-3 text-sm">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-info" />
          <div>
            Each row stores <code>prev_hash</code> + <code>row_hash</code> (SHA-256 chain). Tampering with any row breaks the chain forward, making the log tamper-evident.
            Entries are read-only to all users including auditors.
          </div>
        </CardBody>
      </Card>

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Action</label>
          <select name="action" defaultValue={sp.action ?? ''} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">User email contains</label>
          <input type="text" name="user" defaultValue={sp.user ?? ''} className="h-9 px-3 rounded-md border border-border bg-surface text-sm w-64" />
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Apply</button>
      </form>

      <Card>
        <Table>
          <THead><tr><Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Table</Th><Th>Record</Th><Th>IP</Th><Th>Hash (last 8)</Th></tr></THead>
          <TBody>
            {entries.map((e) => (
              <Tr key={e.id}>
                <Td className="text-text-muted text-xs">{dateTimeFmt(e.createdAt)}</Td>
                <Td>{e.userEmail ?? '—'}</Td>
                <Td><Badge tone={
                  e.action === 'DELETE' ? 'danger'
                  : e.action === 'CREATE' ? 'success'
                  : e.action === 'LOGIN_FAILED' ? 'warn'
                  : 'info'
                }>{e.action}</Badge></Td>
                <Td className="font-mono text-xs">{e.tableName ?? '—'}</Td>
                <Td className="font-mono text-xs text-text-muted">{e.recordId ?? '—'}</Td>
                <Td className="font-mono text-xs text-text-muted">{e.ip ?? '—'}</Td>
                <Td className="font-mono text-xs text-text-muted" title={e.rowHash}>…{e.rowHash.slice(-8)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
