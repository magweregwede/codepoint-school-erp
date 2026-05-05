import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function BankPage() {
  const [banks, withdrawals] = await Promise.all([
    prisma.bankAccount.findMany({ where: { isActive: true } }),
    prisma.withdrawal.findMany({ take: 20, orderBy: { date: 'desc' }, include: { bankAccount: true } }),
  ]);

  // Per-bank: opening balance + receipts received - withdrawals
  const enriched = await Promise.all(banks.map(async (b) => {
    const inflows = await prisma.feeReceipt.aggregate({ _sum: { totalAmount: true }, where: { bankAccountId: b.id } });
    const outflows = await prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { bankAccountId: b.id } });
    const balance = b.openingBalance + Number(inflows._sum.totalAmount ?? 0) - Number(outflows._sum.amount ?? 0);
    return { ...b, inflows: Number(inflows._sum.totalAmount ?? 0), outflows: Number(outflows._sum.amount ?? 0), balance };
  }));

  return (
    <div>
      <PageHeader title="Cash & Bank" description="Bank accounts, petty cash floats, withdrawals (SRS §4.1.3)." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {enriched.map((b) => (
          <Card key={b.id}>
            <CardHeader title={b.name} subtitle={b.bankName} />
            <div className="px-5 pb-4">
              <div className="text-2xl font-semibold tabular-nums">{money(b.balance)}</div>
              <div className="text-xs text-text-muted mt-1">A/C {b.accountNo}</div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-success-soft text-success rounded p-2">
                  <div className="opacity-70">In</div>
                  <div className="font-semibold">{money(b.inflows)}</div>
                </div>
                <div className="bg-danger-soft text-danger rounded p-2">
                  <div className="opacity-70">Out</div>
                  <div className="font-semibold">{money(b.outflows)}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Recent withdrawals" subtitle="Bank/petty-cash withdrawal vouchers" />
        <Table>
          <THead><tr><Th>Voucher</Th><Th>Date</Th><Th>Account</Th><Th>Recipient</Th><Th>Purpose</Th><Th className="text-right">Amount</Th></tr></THead>
          <TBody>
            {withdrawals.map((w) => (
              <Tr key={w.id}>
                <Td className="font-medium">{w.voucherNo}</Td>
                <Td>{dateFmt(w.date)}</Td>
                <Td>{w.bankAccount.name}</Td>
                <Td>{w.recipient}</Td>
                <Td className="text-text-muted">{w.purpose}</Td>
                <Td className="text-right tabular-nums">{money(w.amount)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
