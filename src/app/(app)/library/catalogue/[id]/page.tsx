import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { dateFmt, money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function TitleDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const title = await prisma.libraryTitle.findUnique({
    where: { id },
    include: { copies: { include: { loans: { where: { returnedAt: null }, include: { student: true } } } } },
  });
  if (!title) notFound();
  const authors = JSON.parse(title.authors) as string[];

  return (
    <div>
      <PageHeader
        title={title.title}
        description={authors.join(', ')}
        breadcrumbs={[{ href: '/library/catalogue', label: 'Catalogue' }, { label: title.title }]}
      />

      <Card className="mb-4">
        <CardHeader title="Bibliographic record" />
        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Field l="ISBN" v={title.isbn ?? '—'} />
          <Field l="Publisher" v={title.publisher ?? '—'} />
          <Field l="Edition" v={title.edition ?? '—'} />
          <Field l="Year" v={String(title.year ?? '—')} />
          <Field l="Subject" v={title.subject ?? '—'} />
          <Field l="Dewey" v={title.deweyCode ?? '—'} />
          <Field l="Language" v={title.language} />
        </div>
      </Card>

      <Card>
        <CardHeader title={`Copies (${title.copies.length})`} subtitle="Each physical copy with status and current borrower" />
        <Table>
          <THead><tr><Th>Accession</Th><Th>Barcode</Th><Th>Shelf</Th><Th>Cost</Th><Th>Condition</Th><Th>Status</Th><Th>Borrower</Th></tr></THead>
          <TBody>
            {title.copies.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium">{c.accessionNo}</Td>
                <Td className="font-mono text-xs">{c.barcode}</Td>
                <Td>{c.shelfLocation}</Td>
                <Td className="tabular-nums">{money(c.acquisitionCost)}</Td>
                <Td className="text-xs text-text-muted">{c.condition}</Td>
                <Td><StatusBadge status={c.status} /></Td>
                <Td>
                  {c.loans[0] ? (
                    <span className="text-text">
                      {c.loans[0].student?.firstName} {c.loans[0].student?.lastName}
                      <span className="text-text-muted text-xs ml-1">due {dateFmt(c.loans[0].dueAt)}</span>
                    </span>
                  ) : <span className="text-text-muted">—</span>}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function Field({ l, v }: { l: string; v: string }) {
  return <div><div className="text-xs text-text-muted uppercase tracking-wide">{l}</div><div>{v}</div></div>;
}
