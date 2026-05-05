import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function FinesPage() {
  const fines = await prisma.libraryFine.findMany({
    orderBy: { id: 'desc' }, take: 50,
    include: { loan: { include: { copy: { include: { title: true } } } }, student: true },
  });
  const outstanding = fines.filter((f) => f.status === 'OUTSTANDING');
  const total = outstanding.reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <PageHeader title="Library fines" description="Overdue / damaged book fines (SRS §FR-LIB-008)." />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Outstanding</div>
          <div className="text-xl font-semibold mt-1">{outstanding.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Total amount due</div>
          <div className="text-xl font-semibold mt-1 text-warn tabular-nums">{money(total)}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Settled this term</div>
          <div className="text-xl font-semibold mt-1 text-success">{fines.filter((f) => f.status === 'PAID').length}</div>
        </div>
      </div>

      <Card>
        <CardHeader title="All fines" />
        <Table>
          <THead><tr><Th>Borrower</Th><Th>Title</Th><Th>Reason</Th><Th>Issued</Th><Th>Due was</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th></Th></tr></THead>
          <TBody>
            {fines.map((f) => (
              <Tr key={f.id}>
                <Td>{f.student?.firstName} {f.student?.lastName}</Td>
                <Td>{f.loan.copy.title.title}</Td>
                <Td>{f.reason}</Td>
                <Td>{dateFmt(f.loan.issuedAt)}</Td>
                <Td>{dateFmt(f.loan.dueAt)}</Td>
                <Td className="text-right tabular-nums">{money(f.amount)}</Td>
                <Td><StatusBadge status={f.status} /></Td>
                <Td className="text-right">
                  {f.status === 'OUTSTANDING' && (
                    <div className="space-x-1">
                      <button className="px-2 py-1 rounded text-xs bg-success-soft text-success border border-success/20">Mark paid</button>
                      <button className="px-2 py-1 rounded text-xs border border-border hover:bg-surface-2">Waive</button>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
