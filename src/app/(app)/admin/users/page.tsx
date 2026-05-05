import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { dateTimeFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function UsersAndRolesPage() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: { roles: { include: { role: true } } },
    }),
    prisma.role.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } }),
  ]);

  return (
    <div>
      <PageHeader title="Users & Roles" description="User accounts and role assignments (SRS §FR-SYS-001)." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={`Users (${users.length})`} />
          <Table>
            <THead><tr><Th>Name</Th><Th>Email</Th><Th>Roles</Th><Th>Last login</Th><Th>Status</Th></tr></THead>
            <TBody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-text-muted">{u.email}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => <Badge key={r.id} tone="info">{r.role.name}</Badge>)}
                    </div>
                  </Td>
                  <Td className="text-text-muted text-xs">{u.lastLogin ? dateTimeFmt(u.lastLogin) : 'Never'}</Td>
                  <Td><StatusBadge status={u.isActive ? 'ACTIVE' : 'SUSPENDED'} /></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title={`Roles (${roles.length})`} />
          <Table>
            <THead><tr><Th>Role</Th><Th>Description</Th><Th className="text-right">Users</Th></tr></THead>
            <TBody>
              {roles.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-text-muted">{r.description}</Td>
                  <Td className="text-right tabular-nums">{r._count.users}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
