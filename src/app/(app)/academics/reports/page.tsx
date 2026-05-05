import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ReportsHome(props: { searchParams: Promise<{ student?: string }> }) {
  const sp = await props.searchParams;
  const student = sp.student ? await prisma.student.findUnique({
    where: { id: sp.student },
    include: {
      enrolments: { take: 1, orderBy: { startDate: 'desc' }, include: { schoolClass: { include: { classLevel: true } } } },
    },
  }) : null;

  // For demo: pick the first student's marks for current term, build a simple report card
  const sample = student ?? await prisma.student.findFirst({ orderBy: { admissionNo: 'asc' } });
  if (!sample) return <p>No students.</p>;

  const enrolment = await prisma.enrolment.findFirst({
    where: { studentId: sample.id, status: 'ACTIVE' },
    include: { schoolClass: { include: { classLevel: true } } },
  });

  const term = await prisma.term.findFirst({ where: { isCurrent: true } });
  if (!term) return <p>No active term.</p>;

  const marks = enrolment ? await prisma.mark.findMany({
    where: {
      studentId: sample.id,
      assessment: { subjectOffering: { classId: enrolment.classId }, termId: term.id },
    },
    include: { assessment: { include: { subjectOffering: { include: { subject: true, teacher: true } } } } },
  }) : [];

  const overallAvg = marks.length > 0 ? marks.reduce((s, m) => s + (m.rawScore / m.assessment.maxScore) * 100, 0) / marks.length : 0;

  return (
    <div>
      <PageHeader
        title="End-of-Term Report Card"
        description={`${term.name} • ${enrolment?.schoolClass.name ?? '—'}`}
        action={<PrintButton />}
      />

      <Card className="print-area max-w-3xl mx-auto">
        <CardHeader title="Greenfields High School" subtitle="Knowledge, Integrity, Excellence" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="text-text-muted text-xs uppercase">Student</div>
              <div className="font-semibold">{sample.firstName} {sample.lastName}</div>
              <div className="text-text-muted">Adm. No: {sample.admissionNo}</div>
            </div>
            <div className="text-right">
              <div className="text-text-muted text-xs uppercase">Class / Term</div>
              <div className="font-semibold">{enrolment?.schoolClass.name}</div>
              <div className="text-text-muted">{term.name} • Academic Year 2026</div>
            </div>
          </div>

          <table className="w-full text-sm border border-border">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium border border-border">Subject</th>
                <th className="px-3 py-2 text-right font-medium border border-border">Score</th>
                <th className="px-3 py-2 text-right font-medium border border-border">Max</th>
                <th className="px-3 py-2 text-right font-medium border border-border">%</th>
                <th className="px-3 py-2 text-center font-medium border border-border">Grade</th>
                <th className="px-3 py-2 text-left font-medium border border-border">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => {
                const pct = (m.rawScore / m.assessment.maxScore) * 100;
                const grade = pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2 border border-border">{m.assessment.subjectOffering.subject.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums border border-border">{m.rawScore}</td>
                    <td className="px-3 py-2 text-right tabular-nums border border-border">{m.assessment.maxScore}</td>
                    <td className="px-3 py-2 text-right tabular-nums border border-border">{pct.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-center font-semibold border border-border">{grade}</td>
                    <td className="px-3 py-2 border border-border">{m.assessment.subjectOffering.teacher.firstName} {m.assessment.subjectOffering.teacher.lastName}</td>
                  </tr>
                );
              })}
              <tr className="bg-surface-2 font-semibold">
                <td className="px-3 py-2 border border-border">Overall Average</td>
                <td colSpan={2} className="border border-border" />
                <td className="px-3 py-2 text-right tabular-nums border border-border">{overallAvg.toFixed(1)}%</td>
                <td colSpan={2} className="border border-border" />
              </tr>
            </tbody>
          </table>

          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium">Class Teacher's Comment</div>
              <p className="text-text-muted mt-1">A diligent and consistent performer. Continue to put in this level of effort and you will go far. Well done.</p>
              <div className="mt-4 pt-2 border-t border-border-soft text-xs text-text-muted">Class Teacher signature</div>
            </div>
            <div>
              <div className="font-medium">Principal's Comment</div>
              <p className="text-text-muted mt-1">A pleasing report. Greenfields High wishes you continued success.</p>
              <div className="mt-4 pt-2 border-t border-border-soft text-xs text-text-muted">Principal signature</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

