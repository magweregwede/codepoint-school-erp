import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ReceiptForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewReceiptPage() {
  const banks = await prisma.bankAccount.findMany({ where: { isActive: true } });
  // Find an example student with an open balance for the demo
  const exampleStudent = await prisma.student.findFirst({
    where: { feeInvoices: { some: { status: { in: ['ISSUED', 'PARTIAL'] } } } },
    include: { feeInvoices: { where: { status: { in: ['ISSUED', 'PARTIAL'] } } } },
  });

  return (
    <div>
      <PageHeader
        title="Record fee receipt"
        description="Allocate a payment across one or more open invoices."
        breadcrumbs={[{ href: '/finance/fees', label: 'Fees' }, { label: 'New receipt' }]}
      />

      <Card className="max-w-2xl">
        <CardHeader title="Receipt details" subtitle="Demo only — does not persist or post to GL" />
        <CardBody>
          <ReceiptForm
            banks={banks}
            studentName={exampleStudent ? `${exampleStudent.firstName} ${exampleStudent.lastName} (${exampleStudent.admissionNo})` : ''}
            balance={exampleStudent?.feeInvoices.reduce((s, i) => s + i.balance, 0) ?? 0}
          />
        </CardBody>
      </Card>
    </div>
  );
}
