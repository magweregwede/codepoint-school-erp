import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function CataloguePage(props: { searchParams: Promise<{ q?: string }> }) {
  const sp = await props.searchParams;
  const q = (sp.q ?? '').trim();
  const where: Record<string, unknown> = {};
  if (q) where.OR = [
    { title: { contains: q } },
    { authors: { contains: q } },
    { subject: { contains: q } },
    { isbn: { contains: q } },
  ];

  const titles = await prisma.libraryTitle.findMany({
    where, orderBy: { title: 'asc' },
    include: { _count: { select: { copies: true } }, copies: { where: { status: 'AVAILABLE' }, select: { id: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Catalogue (OPAC)"
        description={`${titles.length} titles • Online Public Access Catalogue`}
      />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-muted mb-1">Search</label>
          <input name="q" defaultValue={q} placeholder="Title, author, subject or ISBN" className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm" />
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Search</button>
      </form>

      <Card>
        <Table>
          <THead><tr><Th>Title</Th><Th>Authors</Th><Th>Subject</Th><Th>Year</Th><Th>Dewey</Th><Th className="text-right">Copies</Th><Th className="text-right">Available</Th></tr></THead>
          <TBody>
            {titles.map((t) => {
              const authors = JSON.parse(t.authors) as string[];
              return (
                <Tr key={t.id}>
                  <Td><Link href={`/library/catalogue/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                    <div className="text-xs text-text-muted">ISBN {t.isbn}</div>
                  </Td>
                  <Td>{authors.join(', ')}</Td>
                  <Td>{t.subject}</Td>
                  <Td className="text-text-muted">{t.year}</Td>
                  <Td className="font-mono text-xs text-text-muted">{t.deweyCode}</Td>
                  <Td className="text-right tabular-nums">{t._count.copies}</Td>
                  <Td className="text-right">
                    {t.copies.length > 0
                      ? <Badge tone="success">{t.copies.length} avail</Badge>
                      : <Badge tone="warn">0 avail</Badge>}
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
