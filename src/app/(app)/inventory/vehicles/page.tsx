import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { asset: true, trips: { take: 5, orderBy: { date: 'desc' } } },
  });
  const today = new Date();
  return (
    <div>
      <PageHeader title="Vehicles" description="Registration, insurance, licence & trip log (SRS §FR-INV-006)." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {vehicles.map((v) => {
          const insDays = Math.floor((v.insuranceExpiry.getTime() - today.getTime()) / 86400000);
          const licDays = Math.floor((v.licenceExpiry.getTime() - today.getTime()) / 86400000);
          return (
            <Card key={v.id}>
              <CardHeader
                title={`${v.make} ${v.model}`}
                subtitle={`${v.registrationNo} • ${v.year} • ${v.fuelType} • ${v.capacity} seats`}
              />
              <div className="px-5 pb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-text-muted">Insurance expires</div>
                    <div className="font-medium">{dateFmt(v.insuranceExpiry)}</div>
                    <Badge tone={insDays < 30 ? 'warn' : 'success'}>{insDays} days</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Licence expires</div>
                    <div className="font-medium">{dateFmt(v.licenceExpiry)}</div>
                    <Badge tone={licDays < 30 ? 'warn' : 'success'}>{licDays} days</Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-text-muted uppercase mb-2">Recent trips</div>
                  <Table>
                    <THead><tr><Th>Date</Th><Th>Driver</Th><Th>Purpose</Th><Th className="text-right">KM</Th></tr></THead>
                    <TBody>
                      {v.trips.map((t) => (
                        <Tr key={t.id}>
                          <Td>{dateFmt(t.date)}</Td>
                          <Td>{t.driverName}</Td>
                          <Td className="text-text-muted">{t.purpose}</Td>
                          <Td className="text-right tabular-nums">{t.endKm - t.startKm}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
