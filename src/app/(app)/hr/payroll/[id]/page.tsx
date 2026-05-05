import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money } from '@/lib/money';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function PayrollRunPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      payslips: { include: { employee: true }, orderBy: { employee: { lastName: 'asc' } } },
    },
  });
  if (!run) notFound();

  return (
    <div>
      <PageHeader
        title={`Payroll ${String(run.month).padStart(2, '0')}/${run.year}`}
        description={`${run.payslips.length} payslips`}
        breadcrumbs={[{ href: '/hr/payroll', label: 'Payroll' }, { label: `${run.month}/${run.year}` }]}
        action={<div className="flex items-center gap-2"><StatusBadge status={run.status} /><PrintButton label="Print bank schedule" /></div>}
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Gross</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums">{money(run.totalGross)}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Deductions</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums text-warn">{money(run.totalGross - run.totalNet)}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="text-xs text-text-muted uppercase">Net to pay</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums text-success">{money(run.totalNet)}</div>
        </div>
      </div>

      <Card>
        <CardHeader title="Payslips" subtitle="Individual employee payslips" />
        <Table>
          <THead><tr><Th>Emp #</Th><Th>Name</Th><Th>Dept</Th><Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th><Th className="text-right">Net</Th></tr></THead>
          <TBody>
            {run.payslips.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium">{p.employee.employeeNo}</Td>
                <Td>{p.employee.lastName}, {p.employee.firstName}</Td>
                <Td>{p.employee.department ?? '—'}</Td>
                <Td className="text-right tabular-nums">{money(p.gross)}</Td>
                <Td className="text-right tabular-nums">{money(p.totalDeductions)}</Td>
                <Td className="text-right tabular-nums font-semibold">{money(p.net)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
