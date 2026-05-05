import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { dateFmt } from '@/lib/money';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LoansPage(props: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await props.searchParams;
  const filter = sp.filter ?? 'active';
  const today = new Date();

  const where = filter === 'overdue'
    ? { returnedAt: null, dueAt: { lt: today } }
    : filter === 'returned'
    ? { returnedAt: { not: null } }
    : { returnedAt: null };

  const loans = await prisma.libraryLoan.findMany({
    where, take: 100, orderBy: { issuedAt: 'desc' },
    include: { copy: { include: { title: true } }, student: true },
  });

  return (
    <div>
      <PageHeader
        title="Loans"
        description="Short-term and long-term book loans (SRS §4.4.2)."
        action={
          <Link href="/library/loans/issue" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Issue loan
          </Link>
        }
      />

      <div className="flex gap-2 mb-4">
        <FilterChip href="/library/loans?filter=active" label="Active" active={filter === 'active'} />
        <FilterChip href="/library/loans?filter=overdue" label="Overdue" active={filter === 'overdue'} />
        <FilterChip href="/library/loans?filter=returned" label="Returned" active={filter === 'returned'} />
      </div>

      <Card>
        <Table>
          <THead><tr><Th>Title</Th><Th>Copy</Th><Th>Borrower</Th><Th>Issued</Th><Th>Due</Th><Th>Returned</Th><Th>Status</Th></tr></THead>
          <TBody>
            {loans.map((l) => {
              const overdue = !l.returnedAt && l.dueAt < today;
              return (
                <Tr key={l.id}>
                  <Td className="font-medium">{l.copy.title.title}</Td>
                  <Td className="font-mono text-xs">{l.copy.accessionNo}</Td>
                  <Td>{l.student?.firstName} {l.student?.lastName}</Td>
                  <Td>{dateFmt(l.issuedAt)}</Td>
                  <Td>{dateFmt(l.dueAt)}</Td>
                  <Td>{l.returnedAt ? dateFmt(l.returnedAt) : <span className="text-text-muted">—</span>}</Td>
                  <Td>
                    {l.returnedAt
                      ? <StatusBadge status="RETURNED" />
                      : overdue
                        ? <StatusBadge status="OVERDUE" />
                        : <Badge tone="info">{l.loanType.replace('_', ' ')}</Badge>}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`px-3 py-1.5 rounded-md text-sm border ${active ? 'bg-brand text-brand-fg border-brand' : 'border-border hover:bg-surface-2'}`}>
      {label}
    </Link>
  );
}
