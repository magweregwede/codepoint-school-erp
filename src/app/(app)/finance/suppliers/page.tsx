import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const [suppliers, pos] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { purchaseOrders: true } } } }),
    prisma.purchaseOrder.findMany({ take: 30, orderBy: { date: 'desc' }, include: { supplier: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Suppliers & Procurement"
        description="Three-way match: PO → GRN → Supplier Invoice → Payment Voucher (SRS §4.1.2 / §FR-FIN-013)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Supplier master" subtitle={`${suppliers.length} active suppliers`} />
          <Table>
            <THead><tr><Th>Code</Th><Th>Name</Th><Th>Contact</Th><Th className="text-right"># POs</Th></tr></THead>
            <TBody>
              {suppliers.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.code}</Td>
                  <Td>{s.name}</Td>
                  <Td className="text-text-muted">{s.contactName} <br /><span className="text-xs">{s.email}</span></Td>
                  <Td className="text-right tabular-nums">{s._count.purchaseOrders}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Recent purchase orders" />
          <Table>
            <THead><tr><Th>PO #</Th><Th>Supplier</Th><Th>Date</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></THead>
            <TBody>
              {pos.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.poNo}</Td>
                  <Td>{p.supplier.name}</Td>
                  <Td>{dateFmt(p.date)}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td className="text-right tabular-nums">{money(p.total)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <div className="mt-4 text-xs text-text-muted">
        Three-way match: each Supplier Invoice references a PO, and a GRN must exist for the PO before payment can be authorised.
      </div>
    </div>
  );
}
