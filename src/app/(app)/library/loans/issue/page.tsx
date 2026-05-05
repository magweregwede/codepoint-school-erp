import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { IssueLoanForm } from './form';

export const dynamic = 'force-dynamic';

export default async function IssueLoanPage() {
  const [titles, students] = await Promise.all([
    prisma.libraryTitle.findMany({
      take: 50,
      include: { copies: { where: { status: 'AVAILABLE' }, take: 1 } },
    }),
    prisma.student.findMany({ take: 50, orderBy: { admissionNo: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Issue loan"
        description="Scan or select a copy and a borrower."
        breadcrumbs={[{ href: '/library/loans', label: 'Loans' }, { label: 'Issue' }]}
      />

      <Card className="max-w-2xl">
        <CardHeader title="Loan details" />
        <CardBody>
          <IssueLoanForm titles={titles.filter((t) => t.copies.length > 0)} students={students} />
        </CardBody>
      </Card>
    </div>
  );
}
