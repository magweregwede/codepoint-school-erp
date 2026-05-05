import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { dateTimeFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const [configs, currentYear, currentTerm] = await Promise.all([
    prisma.configuration.findMany({ orderBy: { key: 'asc' } }),
    prisma.academicYear.findFirst({ where: { isCurrent: true } }),
    prisma.term.findFirst({ where: { isCurrent: true }, include: { academicYear: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Configuration" description="System-wide settings and academic calendar." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Current academic period" />
          <div className="px-5 pb-4 text-sm space-y-2">
            <Row l="Academic year" v={currentYear?.code ?? '—'} />
            <Row l="Current term"  v={currentTerm?.name ?? '—'} />
            <Row l="Term starts"   v={currentTerm ? new Date(currentTerm.startDate).toLocaleDateString() : '—'} />
            <Row l="Term ends"     v={currentTerm ? new Date(currentTerm.endDate).toLocaleDateString() : '—'} />
          </div>
        </Card>
        <Card>
          <CardHeader title="System info" />
          <div className="px-5 pb-4 text-sm space-y-2">
            <Row l="App version" v="1.0-demo" />
            <Row l="Database"    v="SQLite (file)" />
            <Row l="Auth"        v="NextAuth Credentials + JWT" />
            <Row l="Build"       v="Next.js 16 + React 19 + Tailwind v4" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Stored configuration" subtitle="Read-only key/value pairs (SRS §FR-SYS-001)" />
        <Table>
          <THead><tr><Th>Key</Th><Th>Value</Th><Th>Last updated</Th></tr></THead>
          <TBody>
            {configs.map((c) => (
              <Tr key={c.id}>
                <Td className="font-mono text-xs">{c.key}</Td>
                <Td className="font-mono text-xs text-text-muted">{c.value}</Td>
                <Td className="text-xs text-text-muted">{dateTimeFmt(c.updatedAt)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="grid grid-cols-3 gap-2"><div className="text-text-muted text-xs uppercase">{l}</div><div className="col-span-2">{v}</div></div>;
}
