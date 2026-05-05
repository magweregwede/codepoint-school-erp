import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/session';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/StatCard';
import { money } from '@/lib/money';
import { FileText, BarChart3, ChevronRight, Wallet, Users, BookOpen, Briefcase, Package } from 'lucide-react';
import { ReportsCharts } from './charts';

export const dynamic = 'force-dynamic';

const CANNED_REPORTS = [
  { module: 'Finance',   name: 'Trial Balance',           href: '/finance/ledger' },
  { module: 'Finance',   name: 'Aged Debtors',            href: '/finance/fees' },
  { module: 'Finance',   name: 'Income Statement',        href: '/finance/ledger' },
  { module: 'Finance',   name: 'Balance Sheet',           href: '/finance/ledger' },
  { module: 'Finance',   name: 'Bank withdrawals',        href: '/finance/bank' },
  { module: 'Academics', name: 'Class mark sheet',        href: '/academics/marks' },
  { module: 'Academics', name: 'End-of-term report card', href: '/academics/reports' },
  { module: 'Academics', name: 'Attendance summary',      href: '/academics/attendance' },
  { module: 'HR',        name: 'Staff list',              href: '/hr/employees' },
  { module: 'HR',        name: 'Leave balance report',    href: '/hr/leave' },
  { module: 'HR',        name: 'Payroll bank schedule',   href: '/hr/payroll' },
  { module: 'Library',   name: 'Overdue books',           href: '/library/loans?filter=overdue' },
  { module: 'Library',   name: 'Outstanding fines',       href: '/library/fines' },
  { module: 'Inventory', name: 'Asset register',          href: '/inventory/assets' },
  { module: 'Inventory', name: 'Vehicle expiries',        href: '/inventory/vehicles' },
  { module: 'Inventory', name: 'Low-stock consumables',   href: '/inventory/consumables' },
  { module: 'Comms',     name: 'Message log',             href: '/communications/log' },
];

const ICONS: Record<string, React.ReactNode> = {
  Finance:   <Wallet className="w-4 h-4" />,
  Academics: <Users className="w-4 h-4" />,
  HR:        <Briefcase className="w-4 h-4" />,
  Library:   <BookOpen className="w-4 h-4" />,
  Inventory: <Package className="w-4 h-4" />,
  Comms:     <BarChart3 className="w-4 h-4" />,
};

export default async function ReportsPage() {
  await requireAnyPermission(['reports.view_dashboard','reports.view_canned']);

  const [studentCount, employeeCount, totalCollected, outstanding, overdueBooks, lowStock] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.feeReceipt.aggregate({ _sum: { totalAmount: true } }),
    prisma.feeInvoice.aggregate({ _sum: { balance: true }, where: { status: { in: ['ISSUED', 'PARTIAL'] } } }),
    prisma.libraryLoan.count({ where: { returnedAt: null, dueAt: { lt: new Date() } } }),
    prisma.consumableItem.count(), // we'll filter low-stock client-side stat below
  ]);

  // Attendance series — last 14 days
  const today = new Date();
  const attendanceSeries: { day: string; Present: number; Absent: number }[] = [];
  for (let d = 13; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 86400000);
    if ([0, 6].includes(date.getDay())) continue;
    const start = new Date(date.toDateString());
    const end = new Date(start.getTime() + 86400000);
    const [present, absent] = await Promise.all([
      prisma.studentAttendance.count({ where: { status: 'P', date: { gte: start, lt: end } } }),
      prisma.studentAttendance.count({ where: { status: 'A', date: { gte: start, lt: end } } }),
    ]);
    if (present > 0 || absent > 0) {
      attendanceSeries.push({ day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), Present: present, Absent: absent });
    }
  }

  // Asset breakdown by category
  const assetByCategory = await prisma.asset.groupBy({
    by: ['categoryId'], _count: { _all: true }, where: { isActive: true },
  });
  const cats = await prisma.assetCategory.findMany();
  const assetPie = assetByCategory.map((g) => ({
    name: cats.find((c) => c.id === g.categoryId)?.name ?? '—',
    value: g._count._all,
  }));

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Canned reports and cross-module dashboards (SRS §4.13)." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Students" value={studentCount} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Staff" value={employeeCount} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard label="Total collected" value={money(Number(totalCollected._sum.totalAmount ?? 0))} tone="success" icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Library overdue" value={overdueBooks} tone={overdueBooks ? 'danger' : 'default'} icon={<BookOpen className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Student attendance — last 14 days" subtitle="Present vs absent across the school" />
          <CardBody>
            <ReportsCharts type="attendance" data={attendanceSeries} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Assets by category" />
          <CardBody>
            <ReportsCharts type="assets" data={assetPie} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Canned reports" subtitle="Each opens the underlying view; print or export from there" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CANNED_REPORTS.map((r) => (
              <Link key={r.name + r.href} href={r.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border hover:bg-surface-2 hover:border-brand/30 transition-colors">
                <span className="text-text-muted">{ICONS[r.module]}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-text-muted">{r.module}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-soft" />
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
