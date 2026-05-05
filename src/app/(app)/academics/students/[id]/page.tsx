import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { dateFmt, money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrolments: { include: { schoolClass: { include: { classLevel: true } } }, orderBy: { startDate: 'desc' } },
      guardians: { include: { guardian: true } },
      feeInvoices: { orderBy: { date: 'desc' }, include: { term: true } },
      attendance: { take: 30, orderBy: { date: 'desc' } },
    },
  });
  if (!student) notFound();

  const attendanceCounts = student.attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Admission no. ${student.admissionNo}`}
        breadcrumbs={[{ href: '/academics/students', label: 'Students' }, { label: student.admissionNo }]}
        action={<StatusBadge status={student.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader title="Biodata" />
          <CardBody className="text-sm space-y-2">
            <Field label="Gender" value={student.gender} />
            <Field label="Date of birth" value={dateFmt(student.dateOfBirth)} />
            <Field label="Blood group" value={student.bloodGroup ?? '—'} />
            <Field label="Address" value={student.address ?? '—'} />
            <Field label="Previous school" value={student.previousSchool ?? '—'} />
            <Field label="Admitted on" value={dateFmt(student.admissionDate)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Guardians" />
          <CardBody className="text-sm space-y-3">
            {student.guardians.length === 0 ? (
              <p className="text-text-muted">No guardians on record.</p>
            ) : student.guardians.map((sg) => (
              <div key={sg.id} className="border border-border-soft rounded-md p-3">
                <div className="font-medium">
                  {sg.guardian.firstName} {sg.guardian.lastName}
                  {sg.isPrimary && <span className="ml-2 text-xs text-brand">Primary</span>}
                </div>
                <div className="text-text-muted text-xs">{sg.relationship}</div>
                <div className="text-xs mt-1">{sg.guardian.phone} • {sg.guardian.email}</div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent attendance (last 30 days)" />
          <CardBody className="text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Present"  v={attendanceCounts.P ?? 0} tone="text-success" />
              <Stat label="Absent"   v={attendanceCounts.A ?? 0} tone="text-danger" />
              <Stat label="Late"     v={attendanceCounts.L ?? 0} tone="text-warn" />
            </div>
            <p className="text-xs text-text-muted mt-3">Open the Attendance tab for the full record.</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Enrolment history" />
        <Table>
          <THead><tr><Th>Year</Th><Th>Class</Th><Th>Started</Th><Th>Ended</Th><Th>Status</Th></tr></THead>
          <TBody>
            {student.enrolments.map((e) => (
              <Tr key={e.id}>
                <Td>{e.academicYearId.slice(0, 4)}</Td>
                <Td>{e.schoolClass.name}</Td>
                <Td>{dateFmt(e.startDate)}</Td>
                <Td>{dateFmt(e.endDate)}</Td>
                <Td><StatusBadge status={e.status} /></Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Fee invoices" />
        <Table>
          <THead><tr><Th>Invoice</Th><Th>Term</Th><Th>Date</Th><Th className="text-right">Total</Th><Th className="text-right">Balance</Th><Th>Status</Th></tr></THead>
          <TBody>
            {student.feeInvoices.length === 0 ? (
              <tr><Td colSpan={6}><p className="text-text-muted text-sm py-2">No invoices yet.</p></Td></tr>
            ) : student.feeInvoices.map((inv) => (
              <Tr key={inv.id}>
                <Td className="font-medium">{inv.invoiceNo}</Td>
                <Td>{inv.term.name}</Td>
                <Td>{dateFmt(inv.date)}</Td>
                <Td className="text-right tabular-nums">{money(inv.total)}</Td>
                <Td className="text-right tabular-nums">{money(inv.balance)}</Td>
                <Td><StatusBadge status={inv.status} /></Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-text-muted text-xs uppercase tracking-wide">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}

function Stat({ label, v, tone }: { label: string; v: number; tone: string }) {
  return (
    <div className="bg-surface-2 rounded-md p-3">
      <div className={`text-2xl font-semibold ${tone}`}>{v}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
