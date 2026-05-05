import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function StudentsPage(props: { searchParams: Promise<{ class?: string; q?: string }> }) {
  const sp = await props.searchParams;
  const classFilter = sp.class ?? '';
  const q = (sp.q ?? '').trim();

  const classes = await prisma.schoolClass.findMany({
    orderBy: [{ classLevel: { orderNo: 'asc' } }, { stream: 'asc' }],
    include: { classLevel: true },
  });

  const where: Record<string, unknown> = { isActive: true };
  if (classFilter) {
    where.enrolments = { some: { classId: classFilter, status: 'ACTIVE' } };
  }
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { admissionNo: { contains: q } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    take: 100,
    orderBy: { admissionNo: 'asc' },
    include: {
      enrolments: {
        where: { status: 'ACTIVE' },
        take: 1,
        orderBy: { startDate: 'desc' },
        include: { schoolClass: true },
      },
    },
  });

  const total = await prisma.student.count({ where });

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${total.toLocaleString()} students • showing first ${students.length}`}
      />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Name or admission #"
            className="h-9 px-3 rounded-md border border-border bg-surface text-sm w-64"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Class</label>
          <select name="class" defaultValue={classFilter} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">
          Apply
        </button>
        {(classFilter || q) && (
          <Link href="/academics/students" className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-surface-2 inline-flex items-center">
            Clear
          </Link>
        )}
      </form>

      <Card>
        {students.length === 0 ? (
          <EmptyState>No students match the current filter.</EmptyState>
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Adm. No.</Th>
                <Th>Name</Th>
                <Th>Class</Th>
                <Th>Gender</Th>
                <Th>Date of birth</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </THead>
            <TBody>
              {students.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.admissionNo}</Td>
                  <Td>{s.firstName} {s.lastName}</Td>
                  <Td>{s.enrolments[0]?.schoolClass.name ?? '—'}</Td>
                  <Td>{s.gender}</Td>
                  <Td>{dateFmt(s.dateOfBirth)}</Td>
                  <Td><StatusBadge status={s.status} /></Td>
                  <Td className="text-right">
                    <Link href={`/academics/students/${s.id}`} className="text-brand text-xs font-medium hover:underline">
                      View →
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
