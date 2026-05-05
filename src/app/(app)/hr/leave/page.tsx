import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const requests = await prisma.leaveRequest.findMany({
    take: 30, orderBy: { createdAt: 'desc' },
    include: { employee: true, leaveType: true },
  });
  const pending = requests.filter((r) => r.status === 'PENDING');

  return (
    <div>
      <PageHeader title="Leave requests" description="Submit, approve and track employee leave (SRS §4.2.3)." />

      {pending.length > 0 && (
        <Card className="mb-4">
          <CardHeader title="Pending approval" subtitle={`${pending.length} request${pending.length === 1 ? '' : 's'} awaiting decision`} />
          <Table>
            <THead><tr><Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th className="text-right">Days</Th><Th></Th></tr></THead>
            <TBody>
              {pending.map((r) => (
                <Tr key={r.id}>
                  <Td>{r.employee.firstName} {r.employee.lastName}</Td>
                  <Td>{r.leaveType.name}</Td>
                  <Td>{dateFmt(r.startDate)}</Td>
                  <Td>{dateFmt(r.endDate)}</Td>
                  <Td className="text-right tabular-nums">{r.days}</Td>
                  <Td className="text-right space-x-1">
                    <button className="px-2 py-1 rounded text-xs bg-success-soft text-success border border-success/20" title="Approve (demo)">Approve</button>
                    <button className="px-2 py-1 rounded text-xs bg-danger-soft text-danger border border-danger/20" title="Decline (demo)">Decline</button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader title="All recent requests" />
        <Table>
          <THead><tr><Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th className="text-right">Days</Th><Th>Reason</Th><Th>Status</Th></tr></THead>
          <TBody>
            {requests.map((r) => (
              <Tr key={r.id}>
                <Td>{r.employee.firstName} {r.employee.lastName}</Td>
                <Td>{r.leaveType.name}</Td>
                <Td>{dateFmt(r.startDate)}</Td>
                <Td>{dateFmt(r.endDate)}</Td>
                <Td className="text-right tabular-nums">{r.days}</Td>
                <Td className="text-text-muted">{r.reason}</Td>
                <Td><StatusBadge status={r.status} /></Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
