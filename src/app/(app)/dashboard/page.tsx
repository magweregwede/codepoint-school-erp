import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';
import { Users, Wallet, BookOpen, Briefcase, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { DashboardChart } from './chart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const isPrincipal  = user.roles.includes('Principal');
  const isBursar     = user.roles.includes('Bursar') || user.roles.includes('Cashier');
  const isLibrarian  = user.roles.includes('Librarian');
  const isTeacher    = user.roles.includes('Class Teacher') || user.roles.includes('Subject Teacher');

  // Universal stats
  const [studentCount, employeeCount, openInvoices, totalCollected, overdueLoans] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.feeInvoice.aggregate({ _sum: { balance: true }, where: { status: { in: ['ISSUED', 'PARTIAL'] } } }),
    prisma.feeReceipt.aggregate({ _sum: { totalAmount: true } }),
    prisma.libraryLoan.count({ where: { returnedAt: null, dueAt: { lt: new Date() } } }),
  ]);

  // Recent activity for everyone
  const recentInvoices = await prisma.feeInvoice.findMany({
    take: 6,
    orderBy: { date: 'desc' },
    include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
  });

  // Chart data: invoiced vs collected per term
  const terms = await prisma.term.findMany({ orderBy: { startDate: 'asc' } });
  const chartData = await Promise.all(terms.map(async (t) => {
    const inv = await prisma.feeInvoice.aggregate({ _sum: { total: true }, where: { termId: t.id } });
    const rec = await prisma.feeReceipt.aggregate({
      _sum: { totalAmount: true },
      where: { allocations: { some: { invoice: { termId: t.id } } } },
    });
    return { term: t.name, Invoiced: Number(inv._sum.total ?? 0), Collected: Number(rec._sum.totalAmount ?? 0) };
  }));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}`}
        description={`Signed in as ${user.roles.join(', ')}.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Students enrolled" value={studentCount} sublabel="Active across all classes" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Staff" value={employeeCount} sublabel="Teaching + admin + support" icon={<Briefcase className="w-5 h-5" />} />
        <StatCard
          label="Outstanding fees"
          value={money(Number(openInvoices._sum.balance ?? 0))}
          sublabel="Across issued + partial invoices"
          tone="warn"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Library overdue"
          value={overdueLoans}
          sublabel="Loans past due date"
          tone={overdueLoans > 0 ? 'danger' : 'default'}
          icon={<BookOpen className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Fees: invoiced vs collected" subtitle="Per term, current academic year" />
          <CardBody>
            <DashboardChart data={chartData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Total collected to date" />
          <CardBody>
            <div className="text-3xl font-semibold text-success">{money(Number(totalCollected._sum.totalAmount ?? 0))}</div>
            <p className="text-sm text-text-muted mt-2">
              Includes all receipts across all open and closed terms.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface-2 rounded-md p-3">
                <div className="text-text-muted text-xs uppercase">Bank balance</div>
                <div className="font-semibold mt-1">{money(170000)}</div>
              </div>
              <div className="bg-surface-2 rounded-md p-3">
                <div className="text-text-muted text-xs uppercase">Petty cash</div>
                <div className="font-semibold mt-1">{money(1500)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Role-specific panels */}
      {(isPrincipal || isBursar) && (
        <Card className="mb-6">
          <CardHeader title="Recent fee invoices" subtitle="Last 6 issued" />
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Student</Th>
                <Th>Date</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Balance</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {recentInvoices.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="font-medium">{inv.invoiceNo}</Td>
                  <Td>{inv.student.firstName} {inv.student.lastName} <span className="text-text-muted">({inv.student.admissionNo})</span></Td>
                  <Td>{dateFmt(inv.date)}</Td>
                  <Td className="text-right tabular-nums">{money(inv.total)}</Td>
                  <Td className="text-right tabular-nums">{money(inv.balance)}</Td>
                  <Td><StatusBadge status={inv.status} /></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {isLibrarian && (
        <Card className="mb-6">
          <CardHeader title="Library quick view" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Active loans" value={50} icon={<ClipboardCheck className="w-5 h-5" />} />
              <StatCard label="Overdue" value={overdueLoans} tone="danger" icon={<AlertTriangle className="w-5 h-5" />} />
              <StatCard label="Available copies" value="—" sublabel="See catalogue" />
            </div>
          </CardBody>
        </Card>
      )}

      {isTeacher && (
        <Card className="mb-6">
          <CardHeader title="Today's classes" subtitle="Pull-out from your timetable (mock)" />
          <CardBody>
            <p className="text-sm text-text-muted">Open the Academics → Timetable view for the full grid.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
