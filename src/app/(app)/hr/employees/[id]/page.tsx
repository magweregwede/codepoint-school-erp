import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { dateFmt, money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const e = await prisma.employee.findUnique({
    where: { id },
    include: {
      qualifications: true,
      contracts: { orderBy: { startDate: 'desc' } },
      leaveBalances: { include: { leaveType: true }, where: { year: 2026 } },
      payslips: { take: 6, orderBy: { id: 'desc' }, include: { payrollRun: true } },
    },
  });
  if (!e) notFound();

  return (
    <div>
      <PageHeader
        title={`${e.firstName} ${e.lastName}`}
        description={`${e.jobTitle} • ${e.department ?? '—'}`}
        breadcrumbs={[{ href: '/hr/employees', label: 'Employees' }, { label: e.employeeNo }]}
        action={<StatusBadge status={e.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader title="Biodata" />
          <CardBody className="text-sm space-y-2">
            <Field l="Employee #" v={e.employeeNo} />
            <Field l="Gender" v={e.gender} />
            <Field l="Date of birth" v={dateFmt(e.dateOfBirth)} />
            <Field l="Phone" v={e.phone ?? '—'} />
            <Field l="Email" v={e.email ?? '—'} />
            <Field l="Hired" v={dateFmt(e.hireDate)} />
            <Field l="Basic salary" v={money(e.basicSalary)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Qualifications" />
          <CardBody className="text-sm space-y-2">
            {e.qualifications.length === 0 ? (
              <p className="text-text-muted">None on record.</p>
            ) : e.qualifications.map((q) => (
              <div key={q.id} className="border border-border-soft rounded-md p-2">
                <div className="font-medium">{q.type} in {q.field}</div>
                <div className="text-text-muted text-xs">{q.institution} • {q.yearObtained}</div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Leave balances (2026)" />
          <CardBody className="text-sm">
            <Table>
              <THead><tr><Th>Type</Th><Th className="text-right">Entitled</Th><Th className="text-right">Used</Th><Th className="text-right">Left</Th></tr></THead>
              <TBody>
                {e.leaveBalances.map((b) => (
                  <Tr key={b.id}>
                    <Td>{b.leaveType.name}</Td>
                    <Td className="text-right tabular-nums">{b.entitledDays}</Td>
                    <Td className="text-right tabular-nums">{b.usedDays}</Td>
                    <Td className="text-right tabular-nums font-medium">{b.entitledDays - b.usedDays}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Contracts" />
        <Table>
          <THead><tr><Th>Type</Th><Th>Start</Th><Th>End</Th><Th className="text-right">Salary</Th><Th>Status</Th></tr></THead>
          <TBody>
            {e.contracts.map((c) => (
              <Tr key={c.id}>
                <Td>{c.type}</Td>
                <Td>{dateFmt(c.startDate)}</Td>
                <Td>{dateFmt(c.endDate)}</Td>
                <Td className="text-right tabular-nums">{money(c.basicSalary)}</Td>
                <Td><StatusBadge status={c.status} /></Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Recent payslips" />
        <Table>
          <THead><tr><Th>Period</Th><Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th><Th className="text-right">Net</Th><Th>Status</Th></tr></THead>
          <TBody>
            {e.payslips.map((p) => (
              <Tr key={p.id}>
                <Td>{p.payrollRun.month}/{p.payrollRun.year}</Td>
                <Td className="text-right tabular-nums">{money(p.gross)}</Td>
                <Td className="text-right tabular-nums">{money(p.totalDeductions)}</Td>
                <Td className="text-right tabular-nums font-medium">{money(p.net)}</Td>
                <Td><StatusBadge status={p.payrollRun.status} /></Td>
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
