import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];

export default async function TimetablePage(props: { searchParams: Promise<{ class?: string }> }) {
  const sp = await props.searchParams;
  const classes = await prisma.schoolClass.findMany({ orderBy: [{ classLevel: { orderNo: 'asc' } }, { stream: 'asc' }] });
  const classId = sp.class ?? classes[0]?.id;

  const slots = classId ? await prisma.timetableSlot.findMany({
    where: { classId },
    include: { subjectOffering: { include: { subject: true, teacher: true } } },
    orderBy: [{ periodNo: 'asc' }, { dayOfWeek: 'asc' }],
  }) : [];

  const periods = Array.from(new Set(slots.map((s) => s.periodNo))).sort((a, b) => a - b);
  const slotByDayPeriod = new Map<string, typeof slots[number]>();
  for (const s of slots) slotByDayPeriod.set(`${s.dayOfWeek}-${s.periodNo}`, s);

  const cls = classes.find((c) => c.id === classId);

  return (
    <div>
      <PageHeader title="Timetable" description={cls ? `Weekly schedule for ${cls.name}` : 'Pick a class'} />

      <form className="bg-surface border border-border rounded-md p-3 mb-4 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Class</label>
          <select name="class" defaultValue={classId} className="h-9 px-2 rounded-md border border-border bg-surface text-sm">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">Show</button>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium border-r border-border">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-3 py-2 text-left font-medium border-r border-border last:border-r-0">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {periods.map((p) => {
                const sample = slotByDayPeriod.get(`1-${p}`);
                return (
                  <tr key={p}>
                    <td className="px-3 py-3 align-top border-r border-border bg-surface-2/40">
                      <div className="font-semibold">P{p}</div>
                      {sample && <div className="text-text-muted">{sample.startTime}–{sample.endTime}</div>}
                    </td>
                    {DAYS.map((_, i) => {
                      const slot = slotByDayPeriod.get(`${i + 1}-${p}`);
                      return (
                        <td key={i} className="px-3 py-3 align-top border-r border-border last:border-r-0">
                          {slot ? (
                            <>
                              <div className="font-medium">{slot.subjectOffering.subject.code}</div>
                              <div className="text-text-muted">{slot.subjectOffering.subject.name}</div>
                              <div className="text-text-muted mt-1 text-[10px]">{slot.subjectOffering.teacher.lastName} • {slot.room}</div>
                            </>
                          ) : <span className="text-text-soft">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
