import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/StatCard';
import { money, dateFmt } from '@/lib/money';
import { Wallet, AlertTriangle, Banknote, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FeesPage(props: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await props.searchParams;
  const status = sp.status ?? '';
  const q = (sp.q ?? '').trim();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) where.OR = [
    { invoiceNo: { contains: q } },
    { student: { is: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { admissionNo: { contains: q } }] } } },
  ];

  const [invoices, totalInvoiced, totalCollected, outstanding, paidCount] = await Promise.all([
    prisma.feeInvoice.findMany({
      where, take: 50, orderBy: { date: 'desc' },
      include: { student: true, term: true },
    }),
    prisma.feeInvoice.aggregate({ _sum: { total: true } }),
    prisma.feeReceipt.aggregate({ _sum: { totalAmount: true } }),
    prisma.feeInvoice.aggregate({ _sum: { balance: true }, where: { status: { in: ['ISSUED','PARTIAL'] } } }),
    prisma.feeInvoice.count({ where: { status: 'PAID' } }),
  ]);

  // Aged debtors
  const today = new Date();
  const allOpen = await prisma.feeInvoice.findMany({
    where: { status: { in: ['ISSUED','PARTIAL'] } },
    select: { balance: true, dueDate: true },
  });
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  for (const inv of allOpen) {
    const days = Math.max(0, Math.floor((today.getTime() - inv.dueDate.getTime()) / 86400000));
    if (days <= 30) buckets['0-30'] += inv.balance;
    else if (days <= 60) buckets['31-60'] += inv.balance;
    else if (days <= 90) buckets['61-90'] += inv.balance;
    else buckets['90+'] += inv.balance;
  }

  return (
    <div>
      <PageHeader
        title="Fees & Receipts"
        description="Per-student invoicing, receipting, and aged-debtors view (SRS §4.1.1)."
        action={
          <Link href="/finance/fees/new-receipt" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90 inline-flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Record receipt
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total invoiced" value={money(Number(totalInvoiced._sum.total ?? 0))} icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Total collected" value={money(Number(totalCollected._sum.totalAmount ?? 0))} tone="success" icon={<Banknote className="w-5 h-5" />} />
        <StatCard label="Outstanding" value={money(Number(outstanding._sum.balance ?? 0))} tone="warn" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label="Invoices fully paid" value={paidCount} sublabel="To date" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Aged debtors" subtitle="Outstanding balances grouped by days since due" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['0-30','31-60','61-90','90+'] as const).map((b) => (
              <div key={b} className="bg-surface-2 rounded-md p-4">
                <div className="text-xs text-text-muted uppercase tracking-wide">{b} days</div>
                <div className={`text-xl font-semibold mt-1 ${
                  b === '0-30' ? 'text-text' : b === '31-60' ? 'text-warn' : 'text-danger'
                }`}>{money(buckets[b])}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Search</label>
          <input name="q" defaultValue={q} placeholder="Invoice # or student"
            className="h-9 px-3 rounded-md border border-border bg-surface text-sm w-64" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
          <select name="status" defaultValue={status} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Apply</button>
      </form>

      <Card>
        <CardHeader title="Recent invoices" subtitle={`Showing first 50`} />
        <Table>
          <THead>
            <tr>
              <Th>Invoice</Th>
              <Th>Student</Th>
              <Th>Term</Th>
              <Th>Date</Th>
              <Th>Due</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Balance</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <TBody>
            {invoices.map((inv) => (
              <Tr key={inv.id}>
                <Td className="font-medium">{inv.invoiceNo}</Td>
                <Td>{inv.student.firstName} {inv.student.lastName} <span className="text-text-muted">({inv.student.admissionNo})</span></Td>
                <Td>{inv.term.name}</Td>
                <Td>{dateFmt(inv.date)}</Td>
                <Td>{dateFmt(inv.dueDate)}</Td>
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
