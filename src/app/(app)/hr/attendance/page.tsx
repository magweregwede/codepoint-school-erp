import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function HRAttendancePage(props: { searchParams: Promise<{ date?: string }> }) {
  const sp = await props.searchParams;
  const today = new Date();
  const dateStr = sp.date ?? today.toISOString().slice(0, 10);

  const start = new Date(dateStr);
  const end = new Date(start.getTime() + 86400000);

  const attendance = await prisma.employeeAttendance.findMany({
    where: { date: { gte: start, lt: end } },
    include: { employee: true },
    orderBy: { employee: { lastName: 'asc' } },
  });

  const counts = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Staff attendance" description="Daily check-in / check-out grid (SRS §4.2.2)." />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
          <input type="date" name="date" defaultValue={dateStr} className="h-9 px-2 rounded-md border border-border bg-surface text-sm" />
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Show</button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {['P','A','L','LEAVE'].map((s) => (
          <div key={s} className="bg-surface border border-border rounded-md p-3">
            <div className="text-xs text-text-muted">Status {s}</div>
            <div className="text-2xl font-semibold mt-1">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Attendance roll" subtitle={`${attendance.length} entries on ${dateStr}`} />
        <Table>
          <THead><tr><Th>Emp #</Th><Th>Name</Th><Th>Department</Th><Th>Check-in</Th><Th>Check-out</Th><Th>Status</Th><Th>Source</Th></tr></THead>
          <TBody>
            {attendance.map((a) => (
              <Tr key={a.id}>
                <Td className="font-medium">{a.employee.employeeNo}</Td>
                <Td>{a.employee.lastName}, {a.employee.firstName}</Td>
                <Td>{a.employee.department ?? '—'}</Td>
                <Td className="text-text-muted">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</Td>
                <Td className="text-text-muted">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td className="text-text-muted text-xs">{a.source}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
