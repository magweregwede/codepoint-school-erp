import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ComposeForm } from './form';

export const dynamic = 'force-dynamic';

export default async function ComposePage() {
  const classes = await prisma.schoolClass.findMany({ orderBy: [{ classLevel: { orderNo: 'asc' } }, { stream: 'asc' }] });
  const studentCount = await prisma.student.count({ where: { isActive: true } });
  const employeeCount = await prisma.employee.count({ where: { isActive: true } });
  const guardianCount = await prisma.guardian.count();

  return (
    <div>
      <PageHeader
        title="Compose message"
        description="SMS / email / in-app announcements (SRS §FR-COM-002)."
      />

      <Card className="max-w-3xl">
        <CardHeader title="Message" />
        <CardBody>
          <ComposeForm classes={classes} totals={{ students: studentCount, employees: employeeCount, guardians: guardianCount }} />
        </CardBody>
      </Card>
    </div>
  );
}
