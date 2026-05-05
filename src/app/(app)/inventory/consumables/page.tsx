import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function ConsumablesPage() {
  const items = await prisma.consumableItem.findMany({
    orderBy: { name: 'asc' },
    include: { movements: { take: 3, orderBy: { date: 'desc' } } },
  });
  const lowStock = items.filter((i) => i.currentStock < i.reorderLevel);

  return (
    <div>
      <PageHeader title="Consumables" description="Stationery, sanitation, catering, IT consumables (SRS §FR-INV-008)." />

      {lowStock.length > 0 && (
        <Card className="mb-4 border-warn/30">
          <CardHeader title={`${lowStock.length} item${lowStock.length === 1 ? '' : 's'} below reorder level`} />
          <div className="px-5 pb-3 text-sm text-warn">
            {lowStock.map((i) => i.name).join(' • ')}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Stock-on-hand" />
        <Table>
          <THead><tr><Th>Item</Th><Th>Category</Th><Th>Unit</Th><Th className="text-right">Stock</Th><Th className="text-right">Reorder at</Th><Th>Last movement</Th><Th>Status</Th></tr></THead>
          <TBody>
            {items.map((i) => (
              <Tr key={i.id}>
                <Td className="font-medium">{i.name}</Td>
                <Td>{i.category}</Td>
                <Td className="text-text-muted">{i.unit}</Td>
                <Td className="text-right tabular-nums">{i.currentStock}</Td>
                <Td className="text-right tabular-nums text-text-muted">{i.reorderLevel}</Td>
                <Td className="text-xs text-text-muted">
                  {i.movements[0] ? `${i.movements[0].movementType} ${i.movements[0].quantity} on ${dateFmt(i.movements[0].date)}` : '—'}
                </Td>
                <Td>
                  {i.currentStock < i.reorderLevel
                    ? <Badge tone="warn">Low stock</Badge>
                    : <Badge tone="success">OK</Badge>}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
