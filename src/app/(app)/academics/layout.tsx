import { requireAnyPermission } from '@/lib/session';
import { TabNav } from '@/components/TabNav';

const TABS = [
  { href: '/academics/students',    label: 'Students' },
  { href: '/academics/attendance',  label: 'Attendance' },
  { href: '/academics/marks',       label: 'Marks' },
  { href: '/academics/reports',     label: 'Reports' },
  { href: '/academics/timetable',   label: 'Timetable' },
];

export default async function AcademicsLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPermission(['academics.view_student','academics.mark_attendance','academics.enter_marks','academics.view_reports']);
  return (
    <div>
      <TabNav tabs={TABS} />
      {children}
    </div>
  );
}
