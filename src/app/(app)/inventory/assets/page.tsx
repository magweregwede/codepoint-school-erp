import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function AssetsPage(props: { searchParams: Promise<{ category?: string; status?: string }> }) {
  const sp = await props.searchParams;
  const where: Record<string, unknown> = { isActive: true };
  if (sp.category) where.categoryId = sp.category;
  if (sp.status) where.status = sp.status;

  const [assets, categories] = await Promise.all([
    prisma.asset.findMany({
      where, take: 100, orderBy: { assetTag: 'asc' },
      include: { category: true, currentLocation: true },
    }),
    prisma.assetCategory.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Asset register"
        description={`${assets.length} active assets • SRS §FR-INV-001`}
      />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
          <select name="category" defaultValue={sp.category ?? ''} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
          <select name="status" defaultValue={sp.status ?? ''} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All</option>
            <option value="IN_USE">In use</option>
            <option value="IN_STORE">In store</option>
            <option value="UNDER_REPAIR">Under repair</option>
            <option value="DISPOSED">Disposed</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Apply</button>
      </form>

      <Card>
        <Table>
          <THead>
            <tr>
              <Th>Tag</Th><Th>Description</Th><Th>Category</Th><Th>Location</Th>
              <Th>Condition</Th><Th>Status</Th><Th className="text-right">Cost</Th><Th>Acquired</Th>
            </tr>
          </THead>
          <TBody>
            {assets.map((a) => (
              <Tr key={a.id}>
                <Td className="font-mono text-xs font-medium">{a.assetTag}</Td>
                <Td>
                  <Link href={`/inventory/assets/${a.id}`} className="hover:underline">{a.description}</Link>
                  {a.brand && <span className="text-text-muted text-xs ml-1">({a.brand})</span>}
                </Td>
                <Td>{a.category.name}</Td>
                <Td className="text-text-muted">{a.currentLocation?.name ?? '—'}</Td>
                <Td><span className="text-xs">{a.condition}</span></Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td className="text-right tabular-nums">{money(a.acquisitionCost)}</Td>
                <Td className="text-text-muted text-xs">{dateFmt(a.acquisitionDate)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
