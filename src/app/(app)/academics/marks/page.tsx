import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function MarksPage(props: { searchParams: Promise<{ class?: string; subject?: string }> }) {
  const sp = await props.searchParams;
  const classes = await prisma.schoolClass.findMany({ orderBy: [{ classLevel: { orderNo: 'asc' } }, { stream: 'asc' }] });
  const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
  const classId = sp.class ?? classes[0]?.id;
  const subjectId = sp.subject ?? subjects[0]?.id;

  const offering = classId && subjectId
    ? await prisma.subjectOffering.findFirst({
        where: { classId, subjectId },
        include: {
          assessments: { include: { marks: { include: { student: true } } } },
          schoolClass: true, subject: true, teacher: true,
        },
      })
    : null;

  const assessment = offering?.assessments[0];

  return (
    <div>
      <PageHeader title="Marks entry" description="Enter and approve subject marks per assessment." />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Class</label>
          <select name="class" defaultValue={classId} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Subject</label>
          <select name="subject" defaultValue={subjectId} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Load mark sheet</button>
      </form>

      {!offering || !assessment ? (
        <Card>
          <div className="p-6 text-sm text-text-muted">No assessment found for this class/subject combination.</div>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${offering.subject.name} — ${offering.schoolClass.name}`}
            subtitle={`${assessment.name} • Max ${assessment.maxScore} • Teacher: ${offering.teacher.firstName} ${offering.teacher.lastName}`}
            action={<StatusBadge status={assessment.status} />}
          />
          <Table>
            <THead>
              <tr>
                <Th>Student</Th>
                <Th className="text-right">Score</Th>
                <Th className="text-right">Out of</Th>
                <Th className="text-right">%</Th>
                <Th>Grade</Th>
              </tr>
            </THead>
            <TBody>
              {assessment.marks.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName)).map((m) => {
                const pct = (m.rawScore / assessment.maxScore) * 100;
                const grade = pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                return (
                  <Tr key={m.id}>
                    <Td>{m.student.lastName}, {m.student.firstName}</Td>
                    <Td className="text-right tabular-nums font-medium">{m.rawScore}</Td>
                    <Td className="text-right tabular-nums text-text-muted">{assessment.maxScore}</Td>
                    <Td className="text-right tabular-nums">{pct.toFixed(1)}%</Td>
                    <Td><span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold ${
                      grade === 'A' ? 'bg-success-soft text-success' :
                      grade === 'F' ? 'bg-danger-soft text-danger' :
                      'bg-info-soft text-info'
                    }`}>{grade}</span></Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
