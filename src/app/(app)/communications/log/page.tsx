import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { dateTimeFmt } from '@/lib/money';
import { Mail, MessageSquare, Smartphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MessageLogPage() {
  const messages = await prisma.message.findMany({
    take: 50, orderBy: { createdAt: 'desc' },
    include: { sender: true, _count: { select: { recipients: true } } },
  });

  const channelCounts = messages.reduce<Record<string, number>>((acc, m) => {
    acc[m.channel] = (acc[m.channel] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Message log" description="All sent & queued communications (SRS §FR-COM-004)." />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <ChannelStat icon={<Smartphone className="w-4 h-4" />} label="SMS" count={channelCounts.SMS ?? 0} />
        <ChannelStat icon={<Mail className="w-4 h-4" />} label="Email" count={channelCounts.EMAIL ?? 0} />
        <ChannelStat icon={<MessageSquare className="w-4 h-4" />} label="In-app" count={channelCounts.IN_APP ?? 0} />
      </div>

      <Card>
        <CardHeader title="Recent messages" />
        <Table>
          <THead><tr><Th>Sent</Th><Th>Channel</Th><Th>Subject / preview</Th><Th>Audience</Th><Th>Sender</Th><Th className="text-right">Recipients</Th><Th>Status</Th></tr></THead>
          <TBody>
            {messages.map((m) => {
              const audience = JSON.parse(m.audience);
              return (
                <Tr key={m.id}>
                  <Td className="text-text-muted">{dateTimeFmt(m.sentAt ?? m.createdAt)}</Td>
                  <Td><Badge tone={m.channel === 'SMS' ? 'info' : m.channel === 'EMAIL' ? 'success' : 'default'}>{m.channel}</Badge></Td>
                  <Td className="max-w-md">
                    {m.subject && <div className="font-medium">{m.subject}</div>}
                    <div className="text-text-muted text-xs truncate">{m.body}</div>
                  </Td>
                  <Td className="text-xs">{audience.filter}</Td>
                  <Td>{m.sender?.name ?? '—'}</Td>
                  <Td className="text-right tabular-nums">{m.recipientCount}</Td>
                  <Td><StatusBadge status={m.status} /></Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function ChannelStat({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-2 text-xs text-text-muted uppercase">{icon} {label}</div>
      <div className="text-2xl font-semibold mt-1">{count}</div>
    </div>
  );
}
