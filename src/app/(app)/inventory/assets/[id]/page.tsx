import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function AssetDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const a = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true, currentLocation: true,
      movements: { orderBy: { date: 'desc' }, include: { fromLocation: true, toLocation: true } },
    },
  });
  if (!a) notFound();

  return (
    <div>
      <PageHeader
        title={a.description}
        description={`${a.category.name} • Tag ${a.assetTag}`}
        breadcrumbs={[{ href: '/inventory/assets', label: 'Assets' }, { label: a.assetTag }]}
        action={<StatusBadge status={a.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader title="Asset details" />
          <CardBody className="text-sm space-y-2">
            <Field l="Brand / Model" v={`${a.brand ?? '—'} ${a.model ?? ''}`} />
            <Field l="Serial #" v={a.serialNo ?? '—'} />
            <Field l="Acquired" v={dateFmt(a.acquisitionDate)} />
            <Field l="Cost" v={money(a.acquisitionCost)} />
            <Field l="Useful life" v={`${a.usefulLifeMonths} months`} />
            <Field l="Condition" v={a.condition} />
            <Field l="Location" v={a.currentLocation?.name ?? '—'} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="QR / Barcode label" subtitle="Scan to open this asset" />
          <CardBody>
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
              <div className="font-mono font-bold text-3xl tracking-wider mb-2">{a.assetTag}</div>
              <div className="text-text-muted text-sm">{a.description}</div>
              <div className="text-text-muted text-xs mt-1">{a.category.name} • {a.currentLocation?.name}</div>
              <div className="mt-3 inline-block bg-surface-2 border border-border rounded-md px-3 py-2 font-mono text-xs">
                |||||  ||| ||||  || |||||  |||| ||  ||||| |
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Movement history" />
        <Table>
          <THead><tr><Th>Date</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Reason</Th></tr></THead>
          <TBody>
            {a.movements.length === 0 ? (
              <tr><Td colSpan={5}><p className="text-text-muted text-sm py-2">No movements recorded.</p></Td></tr>
            ) : a.movements.map((m) => (
              <Tr key={m.id}>
                <Td>{dateFmt(m.date)}</Td>
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

function Field({ l, v }: { l: string; v: string }) {
  return <div className="grid grid-cols-3 gap-2"><div className="text-text-muted text-xs uppercase">{l}</div><div className="col-span-2">{v}</div></div>;
}
