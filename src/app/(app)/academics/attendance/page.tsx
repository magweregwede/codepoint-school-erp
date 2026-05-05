import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AttendancePage(props: { searchParams: Promise<{ class?: string; date?: string }> }) {
  const sp = await props.searchParams;
  const today = new Date();
  const dateStr = sp.date ?? today.toISOString().slice(0, 10);
  const date = new Date(dateStr);

  const classes = await prisma.schoolClass.findMany({
    orderBy: [{ classLevel: { orderNo: 'asc' } }, { stream: 'asc' }],
  });
  const classId = sp.class ?? classes[0]?.id;

  const students = classId ? await prisma.student.findMany({
    where: { enrolments: { some: { classId, status: 'ACTIVE' } }, isActive: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      attendance: {
        where: { date: { gte: new Date(dateStr), lt: new Date(new Date(dateStr).getTime() + 86400000) } },
        take: 1,
      },
    },
  }) : [];

  return (
    <div>
      <PageHeader
        title="Attendance roll"
        description="Mark daily attendance per registration class. Status legend: P=Present, A=Absent, L=Late, AA=Authorised Absence, S=Sick."
      />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Class</label>
          <select name="class" defaultValue={classId} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
          <input type="date" name="date" defaultValue={dateStr} className="h-9 px-2 rounded-md border border-border bg-surface text-sm" />
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Load roll</button>
      </form>

      <Card>
        <CardHeader title={`Roll for ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} subtitle={`${students.length} students`} />
        <Table>
          <THead>
            <tr>
              <Th>Adm. No.</Th>
              <Th>Student</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {students.map((s) => {
              const status = s.attendance[0]?.status ?? '—';
              return (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.admissionNo}</Td>
                  <Td>{s.lastName}, {s.firstName}</Td>
                  <Td>{status === '—' ? <span className="text-text-muted text-xs">Not marked</span> : <StatusBadge status={status} />}</Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      {(['P','A','L','AA','S'] as const).map((opt) => (
                        <button key={opt} type="button"
                          className={`px-2 py-1 rounded text-xs border ${status === opt ? 'bg-brand text-brand-fg border-brand' : 'border-border hover:bg-surface-2'}`}
                          title={`Mark ${opt}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <p className="text-xs text-text-muted mt-3">
        Demo note: status buttons are non-functional in this read-only demo. The status shown above is the seeded attendance value for that day.
      </p>
    </div>
  );
}
