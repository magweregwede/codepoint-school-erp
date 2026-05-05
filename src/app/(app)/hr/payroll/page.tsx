import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const runs = await prisma.payrollRun.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { _count: { select: { payslips: true } } },
  });

  return (
    <div>
      <PageHeader title="Payroll" description="Monthly payroll runs (SRS §4.2.4)." />

      <Card>
        <CardHeader title="Payroll runs" />
        <Table>
          <THead><tr><Th>Period</Th><Th className="text-right">Gross</Th><Th className="text-right">Net</Th><Th className="text-right">Payslips</Th><Th>Status</Th><Th></Th></tr></THead>
          <TBody>
            {runs.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium">{String(r.month).padStart(2, '0')}/{r.year}</Td>
                <Td className="text-right tabular-nums">{money(r.totalGross)}</Td>
                <Td className="text-right tabular-nums">{money(r.totalNet)}</Td>
                <Td className="text-right tabular-nums">{r._count.payslips}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td className="text-right">
                  <Link href={`/hr/payroll/${r.id}`} className="text-brand text-xs font-medium hover:underline">Open →</Link>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
