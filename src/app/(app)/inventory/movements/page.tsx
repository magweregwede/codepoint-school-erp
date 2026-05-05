import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function MovementsPage() {
  const movements = await prisma.assetMovement.findMany({
    take: 50, orderBy: { date: 'desc' },
    include: { asset: true, fromLocation: true, toLocation: true },
  });
  return (
    <div>
      <PageHeader title="Asset movements" description="Issue / Transfer / Return / Disposal / Loss (SRS §FR-INV-003)." />
      <Card>
        <CardHeader title="Recent movements" />
        <Table>
          <THead><tr><Th>Date</Th><Th>Asset</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Reason</Th></tr></THead>
          <TBody>
            {movements.map((m) => (
              <Tr key={m.id}>
                <Td>{dateFmt(m.date)}</Td>
                <Td className="font-medium">{m.asset.assetTag} <span className="text-text-muted">{m.asset.description}</span></Td>
                <Td><span className="text-xs">{m.movementType}</span></Td>
                <Td>{m.fromLocation?.name ?? '—'}</Td>
                <Td>{m.toLocation?.name ?? '—'}</Td>
                <Td className="text-text-muted">{m.reason ?? '—'}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
