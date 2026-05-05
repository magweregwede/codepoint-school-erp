import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  const [accounts, journals] = await Promise.all([
    prisma.chartOfAccount.findMany({ orderBy: { code: 'asc' } }),
    prisma.journal.findMany({
      take: 30, orderBy: { date: 'desc' },
      include: { lines: { include: { account: true } } },
    }),
  ]);

  // Trial balance
  const trial = await prisma.journalLine.groupBy({
    by: ['accountId'],
    _sum: { debit: true, credit: true },
  });
  const tbRows = trial.map((t) => {
    const acc = accounts.find((a) => a.id === t.accountId)!;
    const debit = Number(t._sum.debit ?? 0);
    const credit = Number(t._sum.credit ?? 0);
    const balance = debit - credit;
    return { ...acc, debit, credit, balance };
  }).sort((a, b) => a.code.localeCompare(b.code));

  const totalDebit = tbRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = tbRows.reduce((s, r) => s + r.credit, 0);

  return (
    <div>
      <PageHeader
        title="General Ledger"
        description="Chart of accounts, journals and trial balance (SRS §4.1.4)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader title="Chart of accounts" subtitle={`${accounts.length} accounts`} />
          <Table>
            <THead><tr><Th>Code</Th><Th>Name</Th><Th>Type</Th></tr></THead>
            <TBody>
              {accounts.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-mono">{a.code}</Td>
                  <Td>{a.name}</Td>
                  <Td><span className="text-xs text-text-muted">{a.type}</span></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Trial balance" subtitle="All-time, by account" />
          <Table>
            <THead><tr><Th>Code</Th><Th>Account</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr></THead>
            <TBody>
              {tbRows.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-mono">{r.code}</Td>
                  <Td>{r.name}</Td>
                  <Td className="text-right tabular-nums">{r.debit ? money(r.debit) : '—'}</Td>
                  <Td className="text-right tabular-nums">{r.credit ? money(r.credit) : '—'}</Td>
                </Tr>
              ))}
              <tr className="bg-surface-2 font-semibold">
                <Td colSpan={2}>Totals</Td>
                <Td className="text-right tabular-nums">{money(totalDebit)}</Td>
                <Td className="text-right tabular-nums">{money(totalCredit)}</Td>
              </tr>
            </TBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent journal entries" />
        <Table>
          <THead>
            <tr>
              <Th>Reference</Th><Th>Date</Th><Th>Narration</Th><Th>Source</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th>
            </tr>
          </THead>
          <TBody>
            {journals.map((j) => {
              const dr = j.lines.reduce((s, l) => s + l.debit, 0);
              const cr = j.lines.reduce((s, l) => s + l.credit, 0);
              return (
                <Tr key={j.id}>
                  <Td className="font-medium">{j.reference}</Td>
                  <Td>{dateFmt(j.date)}</Td>
                  <Td>{j.narration}</Td>
                  <Td><span className="text-xs text-text-muted">{j.sourceModule}</span></Td>
                  <Td className="text-right tabular-nums">{money(dr)}</Td>
                  <Td className="text-right tabular-nums">{money(cr)}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
