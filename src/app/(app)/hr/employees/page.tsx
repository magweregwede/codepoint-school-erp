import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { money, dateFmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage(props: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const sp = await props.searchParams;
  const where: Record<string, unknown> = { isActive: true };
  if (sp.category) where.category = sp.category;
  if (sp.q) where.OR = [
    { firstName: { contains: sp.q } },
    { lastName: { contains: sp.q } },
    { employeeNo: { contains: sp.q } },
  ];

  const employees = await prisma.employee.findMany({
    where, orderBy: { lastName: 'asc' }, take: 100,
  });

  return (
    <div>
      <PageHeader title="Employees" description={`${employees.length} active employees`} />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Search</label>
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Name or employee #" className="h-9 px-3 rounded-md border border-border bg-surface text-sm w-64" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
          <select name="category" defaultValue={sp.category ?? ''} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            <option value="">All</option>
            <option value="TEACHING">Teaching</option>
            <option value="ADMIN">Administrative</option>
            <option value="SUPPORT">Support</option>
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Apply</button>
      </form>

      <Card>
        <Table>
          <THead>
            <tr><Th>Emp #</Th><Th>Name</Th><Th>Job title</Th><Th>Department</Th><Th>Category</Th><Th>Hired</Th><Th className="text-right">Salary</Th><Th></Th></tr>
          </THead>
          <TBody>
            {employees.map((e) => (
              <Tr key={e.id}>
                <Td className="font-medium">{e.employeeNo}</Td>
                <Td>{e.firstName} {e.lastName}</Td>
                <Td>{e.jobTitle}</Td>
                <Td>{e.department ?? '—'}</Td>
                <Td><StatusBadge status={e.category} /></Td>
                <Td>{dateFmt(e.hireDate)}</Td>
                <Td className="text-right tabular-nums">{money(e.basicSalary)}</Td>
                <Td className="text-right">
                  <Link href={`/hr/employees/${e.id}`} className="text-brand text-xs font-medium hover:underline">View →</Link>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
