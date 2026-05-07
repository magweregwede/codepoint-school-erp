// Seed: realistic mock data covering all 8 modules.
// Run with `npm run db:seed`.

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { ROLE_DEFINITIONS } from '../src/lib/rbac';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set.');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: dbUrl }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rng(seed: number): () => number {
  let s = seed % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
const rand = rng(20260504);
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const dateAdd = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

const FIRST_NAMES_M = ['Ethan','Liam','Noah','Mason','James','Lucas','Aiden','Caleb','Jordan','Daniel','Samuel','David','Tinashe','Tendai','Kudzai','Tafadzwa','Munashe','Farai','Tatenda','Simba'];
const FIRST_NAMES_F = ['Emma','Olivia','Ava','Sophia','Mia','Chloe','Grace','Zoe','Lily','Hannah','Sarah','Ruth','Chiedza','Rufaro','Nyasha','Rumbidzai','Tariro','Tanyaradzwa','Vimbai','Anesu'];
const LAST_NAMES = ['Smith','Johnson','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Wilson','Moyo','Ncube','Sibanda','Dube','Mhlanga','Banda','Phiri','Nyathi','Mpofu','Chigumba','Marongedza'];

function pickStudentName(gender: string) {
  const first = gender === 'F' ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last = pick(LAST_NAMES);
  return { first, last };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding SchoolERP demo data...');

  // Wipe in dependency order. Sequential — Postgres serverless transactions
  // have a 5s timeout and deleting 70 tables in a single tx blows past it.
  console.log('  Cleaning existing data...');
  const wipes: Array<() => Promise<unknown>> = [
    () => prisma.messageRecipient.deleteMany(),
    () => prisma.message.deleteMany(),
    () => prisma.consumableMovement.deleteMany(),
    () => prisma.consumableItem.deleteMany(),
    () => prisma.vehicleTrip.deleteMany(),
    () => prisma.vehicle.deleteMany(),
    () => prisma.assetMovement.deleteMany(),
    () => prisma.asset.deleteMany(),
    () => prisma.assetCategory.deleteMany(),
    () => prisma.location.deleteMany(),
    () => prisma.libraryFine.deleteMany(),
    () => prisma.libraryLoan.deleteMany(),
    () => prisma.libraryCopy.deleteMany(),
    () => prisma.libraryTitle.deleteMany(),
    () => prisma.payslip.deleteMany(),
    () => prisma.payrollRun.deleteMany(),
    () => prisma.leaveRequest.deleteMany(),
    () => prisma.leaveBalance.deleteMany(),
    () => prisma.leaveType.deleteMany(),
    () => prisma.employeeAttendance.deleteMany(),
    () => prisma.contract.deleteMany(),
    () => prisma.qualification.deleteMany(),
    () => prisma.paymentVoucher.deleteMany(),
    () => prisma.supplierInvoice.deleteMany(),
    () => prisma.gRNLine.deleteMany(),
    () => prisma.gRN.deleteMany(),
    () => prisma.pOLine.deleteMany(),
    () => prisma.purchaseOrder.deleteMany(),
    () => prisma.supplier.deleteMany(),
    () => prisma.feeReceiptAllocation.deleteMany(),
    () => prisma.feeReceipt.deleteMany(),
    () => prisma.feeInvoiceLine.deleteMany(),
    () => prisma.feeInvoice.deleteMany(),
    () => prisma.feeItem.deleteMany(),
    () => prisma.feeStructure.deleteMany(),
    () => prisma.withdrawal.deleteMany(),
    () => prisma.bankAccount.deleteMany(),
    () => prisma.journalLine.deleteMany(),
    () => prisma.journal.deleteMany(),
    () => prisma.chartOfAccount.deleteMany(),
    () => prisma.timetableSlot.deleteMany(),
    () => prisma.reportCard.deleteMany(),
    () => prisma.termResult.deleteMany(),
    () => prisma.mark.deleteMany(),
    () => prisma.assessment.deleteMany(),
    () => prisma.subjectOffering.deleteMany(),
    () => prisma.studentAttendance.deleteMany(),
    () => prisma.enrolment.deleteMany(),
    () => prisma.studentGuardian.deleteMany(),
    () => prisma.guardian.deleteMany(),
    () => prisma.student.deleteMany(),
    () => prisma.employee.deleteMany(),
    () => prisma.userRole.deleteMany(),
    () => prisma.role.deleteMany(),
    () => prisma.user.deleteMany(),
    () => prisma.subject.deleteMany(),
    () => prisma.schoolClass.deleteMany(),
    () => prisma.classLevel.deleteMany(),
    () => prisma.term.deleteMany(),
    () => prisma.academicYear.deleteMany(),
    () => prisma.auditLog.deleteMany(),
    () => prisma.configuration.deleteMany(),
  ];
  for (const wipe of wipes) await wipe();

  // ── Configuration ──────────────────────────────────────────────────────────
  console.log('  Creating configuration...');
  await prisma.configuration.createMany({
    data: [
      { key: 'school.name', value: JSON.stringify('Greenfields High School') },
      { key: 'school.motto', value: JSON.stringify('Knowledge, Integrity, Excellence') },
      { key: 'school.address', value: JSON.stringify('45 Acacia Avenue, Springfield') },
      { key: 'school.phone', value: JSON.stringify('+1 555 0100') },
      { key: 'school.email', value: JSON.stringify('admin@school.demo') },
      { key: 'fees.holdThreshold', value: JSON.stringify(500) },
    ],
  });

  // ── Roles ──────────────────────────────────────────────────────────────────
  console.log('  Creating roles...');
  const roles = await Promise.all(
    Object.entries(ROLE_DEFINITIONS).map(([name, def]) =>
      prisma.role.create({
        data: {
          name,
          description: def.description,
          permissions: JSON.stringify(def.permissions === '*' ? ['*'] : def.permissions),
        },
      })
    )
  );
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  // ── Users (mock + linked employees) ────────────────────────────────────────
  console.log('  Creating users...');
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const userSpecs: Array<{ email: string; name: string; role: string }> = [
    { email: 'admin@school.demo',           name: 'Alex Adminstone',     role: 'System Administrator' },
    { email: 'principal@school.demo',       name: 'Patricia Pendleton',  role: 'Principal' },
    { email: 'academic@school.demo',        name: 'Andrew Akingbade',    role: 'Academic Head' },
    { email: 'bursar@school.demo',          name: 'Beatrice Banda',      role: 'Bursar' },
    { email: 'cashier@school.demo',         name: 'Carlos Cazares',      role: 'Cashier' },
    { email: 'hr@school.demo',              name: 'Helena Hartwell',     role: 'HR Manager' },
    { email: 'teacher.class@school.demo',   name: 'Tendai Tafadzwa',     role: 'Class Teacher' },
    { email: 'teacher.subject@school.demo', name: 'Susan Stevens',       role: 'Subject Teacher' },
    { email: 'librarian@school.demo',       name: 'Lara Lindgren',       role: 'Librarian' },
    { email: 'stores@school.demo',          name: 'Stephen Sithole',     role: 'Stores Officer' },
    { email: 'auditor@school.demo',         name: 'Aiden Ashworth',      role: 'Auditor' },
    { email: 'comms@school.demo',           name: 'Camille Cromwell',    role: 'Communications Officer' },
  ];

  const users = await Promise.all(
    userSpecs.map(async (s) => {
      const u = await prisma.user.create({
        data: { email: s.email, name: s.name, passwordHash, isActive: true },
      });
      await prisma.userRole.create({ data: { userId: u.id, roleId: roleByName[s.role].id } });
      return { ...u, role: s.role };
    })
  );
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  // ── Academic year + terms + class levels + subjects + classes ──────────────
  console.log('  Creating academic structure...');
  const year = await prisma.academicYear.create({
    data: {
      code: '2026',
      startDate: new Date('2026-01-12'),
      endDate: new Date('2026-12-04'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });
  const terms = await Promise.all([
    prisma.term.create({ data: { academicYearId: year.id, name: 'Term 1', startDate: new Date('2026-01-12'), endDate: new Date('2026-04-10'), isCurrent: false } }),
    prisma.term.create({ data: { academicYearId: year.id, name: 'Term 2', startDate: new Date('2026-05-04'), endDate: new Date('2026-08-07'), isCurrent: true } }),
    prisma.term.create({ data: { academicYearId: year.id, name: 'Term 3', startDate: new Date('2026-09-07'), endDate: new Date('2026-12-04'), isCurrent: false } }),
  ]);

  const classLevelNames = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const classLevels = await Promise.all(
    classLevelNames.map((name, i) =>
      prisma.classLevel.create({ data: { name, orderNo: i + 1 } })
    )
  );

  const subjectSpecs = [
    { code: 'MAT', name: 'Mathematics',   department: 'Sciences' },
    { code: 'ENG', name: 'English',       department: 'Languages' },
    { code: 'PHY', name: 'Physics',       department: 'Sciences' },
    { code: 'CHE', name: 'Chemistry',     department: 'Sciences' },
    { code: 'BIO', name: 'Biology',       department: 'Sciences' },
    { code: 'GEO', name: 'Geography',     department: 'Humanities' },
    { code: 'HIS', name: 'History',       department: 'Humanities' },
    { code: 'ART', name: 'Visual Arts',   department: 'Arts' },
    { code: 'CSC', name: 'Computer Science', department: 'Sciences' },
    { code: 'PED', name: 'Physical Ed.',  department: 'Sports' },
  ];
  const subjects = await Promise.all(
    subjectSpecs.map((s) => prisma.subject.create({ data: s }))
  );

  // 6 levels × 3 streams = 18 classes
  const streams = ['A', 'B', 'C'];
  const schoolClasses = [];
  for (const lvl of classLevels) {
    for (const stream of streams) {
      const c = await prisma.schoolClass.create({
        data: {
          academicYearId: year.id,
          classLevelId: lvl.id,
          name: `${lvl.name}${stream}`,
          stream,
          capacity: 40,
        },
      });
      schoolClasses.push(c);
    }
  }

  // ── Employees (~60) ────────────────────────────────────────────────────────
  console.log('  Creating employees...');
  const employees: Array<{ id: string; name: string; category: string; department?: string | null }> = [];

  // First, create employees backed by users for the staff in userSpecs (so login users are also employees)
  const userBackedEmployees = [
    { email: 'principal@school.demo',       jobTitle: 'Principal',                category: 'TEACHING', department: 'Administration', salary: 9000 },
    { email: 'academic@school.demo',        jobTitle: 'Academic Head',            category: 'TEACHING', department: 'Administration', salary: 7500 },
    { email: 'bursar@school.demo',          jobTitle: 'Bursar',                   category: 'ADMIN',    department: 'Finance',         salary: 6500 },
    { email: 'cashier@school.demo',         jobTitle: 'Cashier',                  category: 'ADMIN',    department: 'Finance',         salary: 2800 },
    { email: 'hr@school.demo',              jobTitle: 'HR Manager',               category: 'ADMIN',    department: 'Human Resources', salary: 6200 },
    { email: 'teacher.class@school.demo',   jobTitle: 'Class Teacher',            category: 'TEACHING', department: 'Sciences',        salary: 4200 },
    { email: 'teacher.subject@school.demo', jobTitle: 'Subject Teacher',          category: 'TEACHING', department: 'Languages',       salary: 4000 },
    { email: 'librarian@school.demo',       jobTitle: 'Head Librarian',           category: 'ADMIN',    department: 'Library',         salary: 3800 },
    { email: 'stores@school.demo',          jobTitle: 'Stores Officer',           category: 'SUPPORT',  department: 'Operations',      salary: 2400 },
    { email: 'auditor@school.demo',         jobTitle: 'Internal Auditor',         category: 'ADMIN',    department: 'Audit',           salary: 5000 },
    { email: 'comms@school.demo',           jobTitle: 'Communications Officer',   category: 'ADMIN',    department: 'Communications',  salary: 3500 },
    { email: 'admin@school.demo',           jobTitle: 'IT System Administrator',  category: 'SUPPORT',  department: 'IT',              salary: 5500 },
  ];

  let empCounter = 100;
  for (const ue of userBackedEmployees) {
    const u = userByEmail[ue.email];
    const [first, ...rest] = u.name.split(' ');
    const e = await prisma.employee.create({
      data: {
        userId: u.id,
        employeeNo: `EMP-${empCounter++}`,
        firstName: first,
        lastName: rest.join(' ') || first,
        gender: between(0, 1) ? 'F' : 'M',
        dateOfBirth: new Date(1980 + between(0, 20), between(0, 11), between(1, 28)),
        phone: `+1 555 0${between(100, 999)}`,
        email: u.email,
        category: ue.category,
        department: ue.department,
        jobTitle: ue.jobTitle,
        hireDate: new Date(2018 + between(0, 7), between(0, 11), between(1, 28)),
        basicSalary: ue.salary,
      },
    });
    employees.push({ id: e.id, name: u.name, category: ue.category, department: ue.department });
  }

  // Bulk teaching staff (no login)
  for (let i = 0; i < 35; i++) {
    const gender = between(0, 1) ? 'F' : 'M';
    const { first, last } = pickStudentName(gender);
    const dept = pick(['Sciences','Languages','Humanities','Arts','Sports']);
    const e = await prisma.employee.create({
      data: {
        employeeNo: `EMP-${empCounter++}`,
        firstName: first,
        lastName: last,
        gender,
        dateOfBirth: new Date(1975 + between(0, 25), between(0, 11), between(1, 28)),
        phone: `+1 555 0${between(100, 999)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@school.demo`,
        category: 'TEACHING',
        department: dept,
        jobTitle: 'Teacher',
        hireDate: new Date(2019 + between(0, 6), between(0, 11), between(1, 28)),
        basicSalary: 3500 + between(0, 1500),
      },
    });
    employees.push({ id: e.id, name: `${first} ${last}`, category: 'TEACHING', department: dept });
  }
  // Support staff
  for (let i = 0; i < 13; i++) {
    const gender = between(0, 1) ? 'F' : 'M';
    const { first, last } = pickStudentName(gender);
    const dept = pick(['Operations','Security','Catering','Cleaning','Maintenance']);
    const e = await prisma.employee.create({
      data: {
        employeeNo: `EMP-${empCounter++}`,
        firstName: first,
        lastName: last,
        gender,
        dateOfBirth: new Date(1970 + between(0, 30), between(0, 11), between(1, 28)),
        phone: `+1 555 0${between(100, 999)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i + 50}@school.demo`,
        category: 'SUPPORT',
        department: dept,
        jobTitle: pick(['Driver','Groundskeeper','Cook','Cleaner','Security Guard','IT Technician']),
        hireDate: new Date(2017 + between(0, 8), between(0, 11), between(1, 28)),
        basicSalary: 1800 + between(0, 800),
      },
    });
    employees.push({ id: e.id, name: `${first} ${last}`, category: 'SUPPORT', department: dept });
  }

  const teachers = employees.filter((e) => e.category === 'TEACHING');

  // Qualifications + contracts
  for (const e of employees) {
    if (e.category === 'TEACHING') {
      await prisma.qualification.create({
        data: {
          employeeId: e.id, type: "Bachelor's",
          institution: pick(['State University','Greenfields College','National Teacher Training']),
          field: pick(subjectSpecs).name, yearObtained: 2010 + between(0, 13),
        },
      });
    }
    await prisma.contract.create({
      data: {
        employeeId: e.id,
        type: pick(['PERMANENT','PERMANENT','PERMANENT','FIXED_TERM']),
        startDate: new Date(2019 + between(0, 6), between(0, 11), between(1, 28)),
        endDate: null,
        basicSalary: 3500 + between(0, 2000),
      },
    });
  }

  // Assign class teachers to first 18 teachers
  for (let i = 0; i < schoolClasses.length && i < teachers.length; i++) {
    await prisma.schoolClass.update({
      where: { id: schoolClasses[i].id },
      data: { classTeacherId: teachers[i].id },
    });
  }

  // ── Subject offerings (each class × each subject → assigned teacher) ───────
  console.log('  Creating subject offerings + timetable...');
  const offerings: Array<{ id: string; classId: string; subjectId: string; teacherId: string }> = [];
  for (const c of schoolClasses) {
    for (const s of subjects) {
      const teacher = teachers[between(0, teachers.length - 1)];
      const o = await prisma.subjectOffering.create({
        data: { classId: c.id, subjectId: s.id, teacherId: teacher.id, academicYearId: year.id },
      });
      offerings.push({ id: o.id, classId: c.id, subjectId: s.id, teacherId: teacher.id });
    }
  }

  // Timetable: 5 days × 8 periods per class
  const periodTimes = ['08:00','08:45','09:30','10:30','11:15','12:00','13:30','14:15'];
  const periodEnds  = ['08:45','09:30','10:15','11:15','12:00','12:45','14:15','15:00'];
  for (const c of schoolClasses) {
    const classOfferings = offerings.filter((o) => o.classId === c.id);
    for (let day = 1; day <= 5; day++) {
      for (let p = 0; p < 8; p++) {
        const offering = classOfferings[(day * 8 + p) % classOfferings.length];
        await prisma.timetableSlot.create({
          data: {
            classId: c.id,
            subjectOfferingId: offering.id,
            dayOfWeek: day,
            periodNo: p + 1,
            startTime: periodTimes[p],
            endTime: periodEnds[p],
            room: `R${between(1, 30)}`,
          },
        });
      }
    }
  }

  // ── Students (~600) + guardians ────────────────────────────────────────────
  console.log('  Creating students + guardians...');
  let admCounter = 1;
  const students: Array<{ id: string; classId: string }> = [];
  for (const c of schoolClasses) {
    const count = between(28, 36);
    for (let i = 0; i < count; i++) {
      const gender = between(0, 1) ? 'F' : 'M';
      const { first, last } = pickStudentName(gender);
      const admissionNo = `2026-${String(admCounter++).padStart(4, '0')}`;
      const ageOffset = parseInt(c.name.replace(/[^\d]/g, '')) + 12;
      const s = await prisma.student.create({
        data: {
          admissionNo,
          firstName: first,
          lastName: last,
          gender,
          dateOfBirth: new Date(2026 - ageOffset, between(0, 11), between(1, 28)),
          address: `${between(1, 999)} ${pick(['Acacia','Mulberry','Cedar','Willow'])} St, Springfield`,
          bloodGroup: pick(['A+','O+','B+','AB+','A-','O-']),
          previousSchool: pick(['Springfield Primary','Riverside Primary','St. Marys Primary']),
          admissionDate: new Date(2026 - between(0, 5), 1, 12),
          status: 'ACTIVE',
        },
      });
      students.push({ id: s.id, classId: c.id });

      // Enrolment
      await prisma.enrolment.create({
        data: {
          studentId: s.id,
          academicYearId: year.id,
          classId: c.id,
          startDate: new Date('2026-01-12'),
          status: 'ACTIVE',
        },
      });

      // Guardian (1 primary)
      const gGender = between(0, 1) ? 'F' : 'M';
      const gName = pickStudentName(gGender);
      const g = await prisma.guardian.create({
        data: {
          firstName: gName.first,
          lastName: last,
          relationship: gGender === 'F' ? 'Mother' : 'Father',
          phone: `+1 555 0${between(100, 999)}`,
          email: `${gName.first.toLowerCase()}.${last.toLowerCase()}@parent.demo`,
          occupation: pick(['Engineer','Teacher','Nurse','Farmer','Trader','Driver','Accountant']),
          isPrimary: true,
        },
      });
      await prisma.studentGuardian.create({
        data: {
          studentId: s.id, guardianId: g.id,
          relationship: gGender === 'F' ? 'Mother' : 'Father',
          isPrimary: true, receivesReports: true, receivesBilling: true,
        },
      });
    }
  }
  console.log(`    ${students.length} students created`);

  // ── Student attendance (last 14 school days, 90% present) ──────────────────
  console.log('  Creating attendance records...');
  const today = new Date();
  const attendanceRows: Array<{ studentId: string; classId: string; date: Date; status: string }> = [];
  for (let dayBack = 0; dayBack < 14; dayBack++) {
    const d = new Date(today.getTime() - dayBack * 86400000);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const s of students) {
      const r = rand();
      let status = 'P';
      if (r < 0.05) status = 'A';
      else if (r < 0.08) status = 'L';
      else if (r < 0.10) status = 'AA';
      attendanceRows.push({ studentId: s.id, classId: s.classId, date: new Date(d.toDateString()), status });
    }
  }
  // Bulk insert
  for (let i = 0; i < attendanceRows.length; i += 1000) {
    await prisma.studentAttendance.createMany({ data: attendanceRows.slice(i, i + 1000) });
  }

  // ── Assessments + marks (Term 2 — current term) ────────────────────────────
  console.log('  Creating assessments + marks...');
  const term2 = terms[1];
  const assessments: Array<{ id: string; subjectOfferingId: string }> = [];
  for (const o of offerings) {
    const a = await prisma.assessment.create({
      data: {
        subjectOfferingId: o.id,
        termId: term2.id,
        name: 'Mid-Term Test',
        type: 'TEST',
        maxScore: 100,
        weightPercent: 30,
        date: new Date('2026-06-15'),
        status: pick(['DRAFT','SUBMITTED','APPROVED','APPROVED','APPROVED']),
      },
    });
    assessments.push({ id: a.id, subjectOfferingId: o.id });
  }

  // Marks: each assessment, marks for all students in that class
  console.log('  Creating marks (this takes a moment)...');
  let markBuf: { assessmentId: string; studentId: string; rawScore: number }[] = [];
  for (const a of assessments) {
    const offering = offerings.find((o) => o.id === a.subjectOfferingId)!;
    const classStudents = students.filter((s) => s.classId === offering.classId);
    for (const s of classStudents) {
      markBuf.push({
        assessmentId: a.id,
        studentId: s.id,
        rawScore: between(35, 95),
      });
      if (markBuf.length >= 1000) {
        await prisma.mark.createMany({ data: markBuf });
        markBuf = [];
      }
    }
  }
  if (markBuf.length) await prisma.mark.createMany({ data: markBuf });

  // ── Chart of accounts (subset) ─────────────────────────────────────────────
  console.log('  Creating chart of accounts + bank...');
  const coa = {
    cashAtBank: await prisma.chartOfAccount.create({ data: { code: '1000', name: 'Cash at Bank',           type: 'ASSET' } }),
    feesReceivable: await prisma.chartOfAccount.create({ data: { code: '1100', name: 'Fees Receivable',     type: 'ASSET' } }),
    suppliersPayable: await prisma.chartOfAccount.create({ data: { code: '2000', name: 'Suppliers Payable', type: 'LIABILITY' } }),
    equity: await prisma.chartOfAccount.create({ data: { code: '3000', name: 'Capital',                     type: 'EQUITY' } }),
    feeIncome: await prisma.chartOfAccount.create({ data: { code: '4000', name: 'Tuition Fees Income',      type: 'INCOME' } }),
    boardingIncome: await prisma.chartOfAccount.create({ data: { code: '4100', name: 'Boarding Fees Income',type: 'INCOME' } }),
    salaries: await prisma.chartOfAccount.create({ data: { code: '5000', name: 'Salaries & Wages',          type: 'EXPENSE' } }),
    utilities: await prisma.chartOfAccount.create({ data: { code: '5100', name: 'Utilities',                type: 'EXPENSE' } }),
    supplies: await prisma.chartOfAccount.create({ data: { code: '5200', name: 'Office Supplies',           type: 'EXPENSE' } }),
    repairs: await prisma.chartOfAccount.create({ data: { code: '5300', name: 'Repairs & Maintenance',      type: 'EXPENSE' } }),
  };

  // Bank accounts
  const bank1 = await prisma.bankAccount.create({
    data: { name: 'Operating Account', bankName: 'First National Bank', accountNo: '0123-4567-8901', openingBalance: 125000 },
  });
  const bank2 = await prisma.bankAccount.create({
    data: { name: 'Fees Collection Account', bankName: 'First National Bank', accountNo: '0123-4567-8902', openingBalance: 45000 },
  });
  const pettyCash = await prisma.bankAccount.create({
    data: { name: 'Petty Cash', bankName: 'On-site Cash Box', accountNo: 'CASH-001', openingBalance: 1500 },
  });

  // Sample withdrawals
  for (let i = 0; i < 8; i++) {
    await prisma.withdrawal.create({
      data: {
        voucherNo: `WV-2026-${String(i + 1).padStart(4, '0')}`,
        bankAccountId: pick([bank1.id, bank2.id]),
        date: dateAdd(today, -between(1, 30)),
        amount: between(200, 5000),
        recipient: pick(['Springfield Hardware','City Power','Acme Stationery','Acacia Caterers']),
        purpose: pick(['Maintenance supplies','Utility payment','Office supplies','Lunch program']),
        authorisedBy: userByEmail['bursar@school.demo'].id,
      },
    });
  }

  // ── Fee structure + invoices + receipts ────────────────────────────────────
  console.log('  Creating fee structures, invoices, receipts...');
  for (const lvl of classLevels) {
    for (const term of terms) {
      const fs = await prisma.feeStructure.create({
        data: {
          academicYearId: year.id,
          classLevelId: lvl.id,
          termId: term.id,
          name: `${lvl.name} • ${term.name}`,
        },
      });
      const tuitionAmt = 600 + parseInt(lvl.name.replace(/[^\d]/g, '')) * 50;
      await prisma.feeItem.createMany({
        data: [
          { feeStructureId: fs.id, name: 'Tuition',  amount: tuitionAmt, isCompulsory: true,  appliesTo: 'ALL' },
          { feeStructureId: fs.id, name: 'Sports Levy', amount: 50, isCompulsory: true, appliesTo: 'ALL' },
          { feeStructureId: fs.id, name: 'Library Levy', amount: 30, isCompulsory: true, appliesTo: 'ALL' },
          { feeStructureId: fs.id, name: 'Boarding', amount: 800, isCompulsory: false, appliesTo: 'BOARDERS' },
        ],
      });
    }
  }

  // Invoices for current term (Term 2) for every student
  console.log('  Creating invoices for current term...');
  let invCounter = 1;
  for (const s of students) {
    const studentRow = await prisma.student.findUnique({ where: { id: s.id } });
    if (!studentRow) continue;
    const cls = schoolClasses.find((c) => c.id === s.classId)!;
    const lvl = classLevels.find((l) => l.id === cls.classLevelId)!;
    const tuition = 600 + parseInt(lvl.name.replace(/[^\d]/g, '')) * 50;
    const subtotal = tuition + 50 + 30;
    const inv = await prisma.feeInvoice.create({
      data: {
        studentId: s.id,
        termId: term2.id,
        invoiceNo: `INV-2026-${String(invCounter++).padStart(5, '0')}`,
        date: new Date('2026-05-04'),
        dueDate: new Date('2026-06-15'),
        subtotal,
        discount: 0,
        total: subtotal,
        balance: subtotal,
        status: 'ISSUED',
      },
    });
    await prisma.feeInvoiceLine.createMany({
      data: [
        { invoiceId: inv.id, description: `Tuition — ${lvl.name}`, amount: tuition, netAmount: tuition },
        { invoiceId: inv.id, description: 'Sports Levy', amount: 50, netAmount: 50 },
        { invoiceId: inv.id, description: 'Library Levy', amount: 30, netAmount: 30 },
      ],
    });

    // 70% have at least a partial payment
    if (rand() < 0.7) {
      const payAmt = rand() < 0.5 ? subtotal : Math.floor(subtotal * (0.3 + rand() * 0.5));
      const r = await prisma.feeReceipt.create({
        data: {
          receiptNo: `REC-2026-${String(invCounter).padStart(5, '0')}`,
          date: dateAdd(new Date('2026-05-04'), between(1, 30)),
          studentId: s.id,
          paidBy: 'Parent / Guardian',
          method: pick(['CASH','EFT','MOBILE','CARD']),
          reference: `TXN${between(100000, 999999)}`,
          bankAccountId: bank2.id,
          totalAmount: payAmt,
          receivedById: userByEmail['cashier@school.demo'].id,
        },
      });
      await prisma.feeReceiptAllocation.create({
        data: { receiptId: r.id, invoiceId: inv.id, amountApplied: payAmt },
      });
      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: { balance: subtotal - payAmt, status: payAmt >= subtotal ? 'PAID' : 'PARTIAL' },
      });
    }
  }

  // Some sample journal entries (for trial balance)
  console.log('  Creating sample journal entries...');
  for (let i = 0; i < 20; i++) {
    const amount = between(500, 4500);
    const j = await prisma.journal.create({
      data: {
        date: dateAdd(today, -between(1, 60)),
        reference: `JV-2026-${String(i + 1).padStart(4, '0')}`,
        narration: pick(['Fee receipt batch','Salary posting','Utility expense','Supplier payment','Petty cash reimbursement']),
        sourceModule: pick(['FEES','PAYROLL','BANK','AP','MANUAL']),
      },
    });
    await prisma.journalLine.createMany({
      data: [
        { journalId: j.id, accountId: pick([coa.cashAtBank.id, coa.feesReceivable.id]), debit: amount, credit: 0 },
        { journalId: j.id, accountId: pick([coa.feeIncome.id, coa.salaries.id, coa.utilities.id]), debit: 0, credit: amount },
      ],
    });
  }

  // ── Suppliers + POs ────────────────────────────────────────────────────────
  console.log('  Creating suppliers + POs...');
  const supplierNames = ['Springfield Hardware','Acme Stationery Co','Acacia Caterers','City Power','TechSavvy IT','Sportz Equipment Ltd','Greenleaf Cleaning','BookWorld Distributors'];
  const suppliers = [];
  for (let i = 0; i < supplierNames.length; i++) {
    const sp = await prisma.supplier.create({
      data: {
        code: `SUP-${String(i + 1).padStart(3, '0')}`,
        name: supplierNames[i],
        taxId: `TAX${between(10000000, 99999999)}`,
        contactName: `${pick(FIRST_NAMES_M)} ${pick(LAST_NAMES)}`,
        phone: `+1 555 0${between(100, 999)}`,
        email: `accounts@${supplierNames[i].toLowerCase().replace(/[^a-z]/g, '')}.com`,
        address: `${between(1, 999)} Industrial Blvd, Springfield`,
      },
    });
    suppliers.push(sp);
  }
  for (let i = 0; i < 12; i++) {
    const sup = pick(suppliers);
    const sub = between(500, 8000);
    const po = await prisma.purchaseOrder.create({
      data: {
        poNo: `PO-2026-${String(i + 1).padStart(4, '0')}`,
        supplierId: sup.id,
        date: dateAdd(today, -between(1, 90)),
        expectedDate: dateAdd(today, -between(0, 60)),
        status: pick(['APPROVED','RECEIVED','RECEIVED','CLOSED','SENT']),
        subtotal: sub,
        tax: Math.round(sub * 0.15),
        total: sub + Math.round(sub * 0.15),
      },
    });
    await prisma.pOLine.createMany({
      data: [
        { poId: po.id, description: 'Item A — bulk', quantity: between(5, 50), unitPrice: between(10, 200), lineTotal: Math.round(sub * 0.6) },
        { poId: po.id, description: 'Item B — bulk', quantity: between(5, 50), unitPrice: between(10, 200), lineTotal: Math.round(sub * 0.4) },
      ],
    });
  }

  // ── HR: leave types + balances + sample requests + payroll ─────────────────
  console.log('  Creating leave types + balances + payroll...');
  const annualLeave = await prisma.leaveType.create({ data: { name: 'Annual Leave',     maxDaysPerYear: 21, isPaid: true } });
  const sickLeave   = await prisma.leaveType.create({ data: { name: 'Sick Leave',       maxDaysPerYear: 14, isPaid: true, requiresDoc: true } });
  const compassion  = await prisma.leaveType.create({ data: { name: 'Compassionate',    maxDaysPerYear: 5,  isPaid: true } });
  const study       = await prisma.leaveType.create({ data: { name: 'Study Leave',      maxDaysPerYear: 10, isPaid: false } });

  for (const e of employees) {
    for (const lt of [annualLeave, sickLeave, compassion, study]) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: e.id,
          leaveTypeId: lt.id,
          year: 2026,
          entitledDays: lt.maxDaysPerYear,
          usedDays: between(0, Math.floor(lt.maxDaysPerYear / 2)),
        },
      });
    }
  }

  // Sample leave requests
  for (let i = 0; i < 18; i++) {
    const emp = pick(employees);
    const lt = pick([annualLeave, sickLeave, compassion]);
    const start = dateAdd(today, between(-30, 30));
    const days = between(1, 5);
    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        leaveTypeId: lt.id,
        startDate: start,
        endDate: dateAdd(start, days - 1),
        days,
        reason: pick(['Family event','Medical appointment','Personal','Bereavement','Conference']),
        status: pick(['PENDING','APPROVED','APPROVED','APPROVED','DECLINED']),
      },
    });
  }

  // Employee attendance — last 5 working days
  for (let dayBack = 0; dayBack < 7; dayBack++) {
    const d = new Date(today.getTime() - dayBack * 86400000);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const rows = employees.map((e) => ({
      employeeId: e.id,
      date: new Date(d.toDateString()),
      checkIn: new Date(d.toDateString() + ' 07:45'),
      checkOut: new Date(d.toDateString() + ' 16:30'),
      status: rand() < 0.92 ? 'P' : pick(['A','L','LEAVE']),
      source: 'MANUAL',
    }));
    await prisma.employeeAttendance.createMany({ data: rows });
  }

  // Payroll runs — last 3 months
  for (let m = 4; m <= 6; m++) {
    const totalGross = employees.reduce((sum, e) => sum + (e.category === 'TEACHING' ? 4500 : 2200), 0);
    const totalNet = Math.round(totalGross * 0.78);
    const run = await prisma.payrollRun.create({
      data: {
        month: m,
        year: 2026,
        status: m === 6 ? 'DRAFT' : 'PAID',
        totalGross,
        totalNet,
      },
    });
    const slipRows = employees.map((e) => {
      const gross = e.category === 'TEACHING' ? 4500 : 2200;
      const paye = Math.round(gross * 0.15);
      const pension = Math.round(gross * 0.07);
      const net = gross - paye - pension;
      return {
        payrollRunId: run.id,
        employeeId: e.id,
        gross,
        totalDeductions: paye + pension,
        net,
        components: JSON.stringify({ basic: gross, paye, pension }),
      };
    });
    for (let i = 0; i < slipRows.length; i += 100) {
      await prisma.payslip.createMany({ data: slipRows.slice(i, i + 100) });
    }
  }

  // ── Library ────────────────────────────────────────────────────────────────
  console.log('  Creating library catalogue + loans...');
  const titleSpecs = [
    { title: 'Algebra Made Simple', authors: ['M. Carter'],    subject: 'Mathematics',     dewey: '512' },
    { title: 'A History of Civilizations', authors: ['F. Braudel'], subject: 'History',    dewey: '909' },
    { title: 'Principles of Physics', authors: ['D. Halliday','R. Resnick'], subject: 'Physics', dewey: '530' },
    { title: 'The Gene', authors: ['S. Mukherjee'],            subject: 'Biology',         dewey: '572.8' },
    { title: 'Things Fall Apart', authors: ['C. Achebe'],      subject: 'Literature',      dewey: '823' },
    { title: 'A Brief History of Time', authors: ['S. Hawking'],subject: 'Astronomy',     dewey: '523.1' },
    { title: 'Sapiens', authors: ['Y. N. Harari'],             subject: 'History',         dewey: '909' },
    { title: 'The Double Helix', authors: ['J. Watson'],       subject: 'Biology',         dewey: '572.8' },
    { title: 'Letters to a Young Poet', authors: ['R. M. Rilke'], subject: 'Literature',  dewey: '831' },
    { title: 'Mathematical Methods', authors: ['K. F. Riley'], subject: 'Mathematics',     dewey: '510' },
    { title: 'World Geography Today', authors: ['C. Salter'],  subject: 'Geography',       dewey: '910' },
    { title: 'Introduction to Algorithms', authors: ['T. Cormen'], subject: 'Computer Science', dewey: '004' },
    { title: 'Chemistry: The Central Science', authors: ['T. Brown'], subject: 'Chemistry', dewey: '540' },
    { title: 'A Long Walk to Freedom', authors: ['N. Mandela'], subject: 'Biography',      dewey: '968' },
    { title: 'Half of a Yellow Sun', authors: ['C. N. Adichie'],subject: 'Literature',     dewey: '823' },
    { title: 'The Periodic Kingdom', authors: ['P. Atkins'],   subject: 'Chemistry',       dewey: '546' },
    { title: 'Cosmos', authors: ['C. Sagan'],                  subject: 'Astronomy',       dewey: '523' },
    { title: 'The Story of Art', authors: ['E. H. Gombrich'],  subject: 'Visual Arts',     dewey: '709' },
    { title: 'A People’s History', authors: ['H. Zinn'],  subject: 'History',         dewey: '973' },
    { title: 'Calculus', authors: ['J. Stewart'],              subject: 'Mathematics',     dewey: '515' },
  ];
  const titles = [];
  for (let i = 0; i < titleSpecs.length; i++) {
    const t = titleSpecs[i];
    const ti = await prisma.libraryTitle.create({
      data: {
        isbn: `978-0-${between(100000, 999999)}-${between(10, 99)}-${between(0, 9)}`,
        title: t.title,
        authors: JSON.stringify(t.authors),
        publisher: pick(['Penguin','Pearson','OUP','Wiley','Macmillan','Random House']),
        edition: `${between(1, 8)}th`,
        year: between(1990, 2024),
        subject: t.subject,
        deweyCode: t.dewey,
        summary: 'A standard reference work used across the curriculum.',
      },
    });
    titles.push(ti);

    // 5–15 copies per title
    const numCopies = between(5, 15);
    for (let c = 0; c < numCopies; c++) {
      await prisma.libraryCopy.create({
        data: {
          titleId: ti.id,
          accessionNo: `ACC-${String(i * 100 + c).padStart(5, '0')}`,
          barcode: `BC${String(1000000 + i * 100 + c)}`,
          shelfLocation: `${pick(['A','B','C','D'])}${between(1, 20)}`,
          acquisitionCost: between(15, 80),
          status: 'AVAILABLE',
        },
      });
    }
  }

  // 50 active loans
  const allCopies = await prisma.libraryCopy.findMany();
  for (let i = 0; i < 50; i++) {
    const copy = allCopies[i];
    const student = pick(students);
    const issuedAt = dateAdd(today, -between(1, 30));
    const dueAt = dateAdd(issuedAt, 14);
    await prisma.libraryLoan.create({
      data: {
        copyId: copy.id,
        studentId: student.id,
        loanType: 'SHORT_TERM',
        issuedAt,
        dueAt,
        returnedAt: null,
        issuedById: userByEmail['librarian@school.demo'].id,
      },
    });
    await prisma.libraryCopy.update({ where: { id: copy.id }, data: { status: 'ON_LOAN' } });
  }
  // Some overdue + fines
  const overdueLoans = await prisma.libraryLoan.findMany({
    where: { returnedAt: null }, take: 8,
  });
  for (const l of overdueLoans) {
    await prisma.libraryLoan.update({ where: { id: l.id }, data: { dueAt: dateAdd(today, -between(3, 14)) } });
    await prisma.libraryFine.create({
      data: {
        loanId: l.id,
        studentId: l.studentId,
        amount: between(2, 20),
        reason: 'Overdue',
        status: pick(['OUTSTANDING','OUTSTANDING','PAID']),
      },
    });
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  console.log('  Creating inventory + assets + vehicles...');
  const cats = {
    classroomFurn: await prisma.assetCategory.create({ data: { name: 'Classroom Furniture' } }),
    officeFurn:    await prisma.assetCategory.create({ data: { name: 'Office Furniture' } }),
    sports:        await prisma.assetCategory.create({ data: { name: 'Sports Equipment' } }),
    vehicles:      await prisma.assetCategory.create({ data: { name: 'Vehicles' } }),
    it:            await prisma.assetCategory.create({ data: { name: 'IT Equipment' } }),
    lab:           await prisma.assetCategory.create({ data: { name: 'Laboratory Apparatus' } }),
  };

  const locations = [];
  for (const lvl of classLevels) {
    for (const stream of streams) {
      const loc = await prisma.location.create({
        data: { name: `${lvl.name}${stream} Classroom`, type: 'CLASSROOM', building: 'Block A' },
      });
      locations.push(loc);
    }
  }
  locations.push(await prisma.location.create({ data: { name: 'Principal Office', type: 'OFFICE', building: 'Admin Block' } }));
  locations.push(await prisma.location.create({ data: { name: 'Bursar Office',    type: 'OFFICE', building: 'Admin Block' } }));
  locations.push(await prisma.location.create({ data: { name: 'Chemistry Lab',    type: 'LAB',    building: 'Science Block' } }));
  locations.push(await prisma.location.create({ data: { name: 'Sports Field',     type: 'FIELD',  building: 'Sports Complex' } }));
  locations.push(await prisma.location.create({ data: { name: 'Main Store',       type: 'STORE',  building: 'Operations' } }));

  const assets = [];
  let assetTagCounter = 1;
  // Furniture
  for (let i = 0; i < 60; i++) {
    const a = await prisma.asset.create({
      data: {
        assetTag: `AST-${String(assetTagCounter++).padStart(5, '0')}`,
        categoryId: pick([cats.classroomFurn.id, cats.officeFurn.id]),
        description: pick(['Student Desk','Teacher Desk','Chair','Bookshelf','Filing Cabinet','Whiteboard']),
        brand: pick(['Generic','Steelcase','OakWorks']),
        acquisitionCost: between(40, 400),
        usefulLifeMonths: 120,
        currentLocationId: pick(locations).id,
        condition: pick(['GOOD','GOOD','GOOD','FAIR','EXCELLENT']),
        status: 'IN_USE',
      },
    });
    assets.push(a);
  }
  // Sports
  for (let i = 0; i < 25; i++) {
    const a = await prisma.asset.create({
      data: {
        assetTag: `AST-${String(assetTagCounter++).padStart(5, '0')}`,
        categoryId: cats.sports.id,
        description: pick(['Football','Basketball','Volleyball Net','Cricket Bat Set','Tennis Racket','Hockey Stick']),
        acquisitionCost: between(15, 250),
        currentLocationId: locations[locations.length - 2].id,
        condition: pick(['GOOD','FAIR']),
      },
    });
    assets.push(a);
  }
  // IT
  for (let i = 0; i < 30; i++) {
    const a = await prisma.asset.create({
      data: {
        assetTag: `AST-${String(assetTagCounter++).padStart(5, '0')}`,
        categoryId: cats.it.id,
        description: pick(['Desktop PC','Laptop','Projector','Printer','Network Switch','Tablet']),
        brand: pick(['Dell','HP','Lenovo','Acer','Brother']),
        model: `Model ${between(100, 999)}`,
        serialNo: `SN${between(10000000, 99999999)}`,
        acquisitionCost: between(300, 1500),
        currentLocationId: pick(locations).id,
      },
    });
    assets.push(a);
  }
  // Lab
  for (let i = 0; i < 20; i++) {
    const a = await prisma.asset.create({
      data: {
        assetTag: `AST-${String(assetTagCounter++).padStart(5, '0')}`,
        categoryId: cats.lab.id,
        description: pick(['Microscope','Bunsen Burner','Pipette Set','Bench Balance','Test Tube Rack','Centrifuge']),
        brand: pick(['Olympus','LabTech','Generic']),
        acquisitionCost: between(50, 1500),
        currentLocationId: locations[locations.length - 3].id,
      },
    });
    assets.push(a);
  }
  // Vehicles
  const vehicleSpecs = [
    { make: 'Toyota', model: 'Coaster Bus',   reg: 'BUS-001', cap: 28, fuel: 'Diesel' },
    { make: 'Toyota', model: 'Hiace Van',     reg: 'VAN-001', cap: 14, fuel: 'Diesel' },
    { make: 'Ford',   model: 'Ranger Pickup', reg: 'PIK-001', cap: 5,  fuel: 'Diesel' },
    { make: 'Mazda',  model: 'BT-50',         reg: 'PIK-002', cap: 5,  fuel: 'Petrol' },
  ];
  for (const v of vehicleSpecs) {
    const a = await prisma.asset.create({
      data: {
        assetTag: `AST-${String(assetTagCounter++).padStart(5, '0')}`,
        categoryId: cats.vehicles.id,
        description: `${v.make} ${v.model}`,
        brand: v.make, model: v.model,
        serialNo: `VIN${between(100000000, 999999999)}`,
        acquisitionCost: between(15000, 60000),
        usefulLifeMonths: 120,
      },
    });
    const veh = await prisma.vehicle.create({
      data: {
        assetId: a.id, registrationNo: v.reg, make: v.make, model: v.model,
        year: 2018 + between(0, 7), capacity: v.cap, fuelType: v.fuel,
        insuranceExpiry: dateAdd(today, between(30, 365)),
        licenceExpiry: dateAdd(today, between(60, 400)),
      },
    });
    // a few trips
    for (let t = 0; t < between(3, 6); t++) {
      const startKm = between(50000, 120000);
      await prisma.vehicleTrip.create({
        data: {
          vehicleId: veh.id,
          driverName: pick(employees.filter((e) => e.category === 'SUPPORT')).name,
          date: dateAdd(today, -between(1, 20)),
          startKm,
          endKm: startKm + between(20, 250),
          fuelLitres: between(15, 80),
          purpose: pick(['School run AM','School run PM','Sports trip','Supplies pickup']),
        },
      });
    }
  }

  // Asset movements
  for (let i = 0; i < 25; i++) {
    const a = pick(assets);
    await prisma.assetMovement.create({
      data: {
        assetId: a.id,
        fromLocationId: pick(locations).id,
        toLocationId: pick(locations).id,
        movementType: pick(['TRANSFER','ISSUE','RETURN']),
        date: dateAdd(today, -between(1, 60)),
        reason: pick(['Re-allocation','Term issue','Repair return']),
      },
    });
  }

  // Consumables
  console.log('  Creating consumables...');
  const consumableSpecs = [
    { name: 'A4 Printing Paper',     category: 'Stationery', unit: 'ream',   reorder: 20, stock: 45 },
    { name: 'Whiteboard Markers',    category: 'Stationery', unit: 'box',    reorder: 10, stock: 8 },
    { name: 'Toilet Paper',          category: 'Sanitation', unit: 'roll',   reorder: 100, stock: 220 },
    { name: 'Soap (Liquid)',         category: 'Sanitation', unit: 'litre',  reorder: 30, stock: 12 },
    { name: 'Cooking Oil',           category: 'Catering',   unit: 'litre',  reorder: 40, stock: 75 },
    { name: 'Maize Meal',            category: 'Catering',   unit: 'kg',     reorder: 100, stock: 320 },
    { name: 'Cleaning Cloths',       category: 'Sanitation', unit: 'each',   reorder: 50, stock: 28 },
    { name: 'Pencils',               category: 'Stationery', unit: 'each',   reorder: 200, stock: 450 },
    { name: 'Notebooks',             category: 'Stationery', unit: 'each',   reorder: 100, stock: 180 },
    { name: 'Printer Toner',         category: 'IT',         unit: 'each',   reorder: 5,  stock: 3 },
  ];
  for (const c of consumableSpecs) {
    const ci = await prisma.consumableItem.create({
      data: {
        name: c.name, category: c.category, unit: c.unit,
        reorderLevel: c.reorder, currentStock: c.stock,
      },
    });
    // 3 movements each
    for (let i = 0; i < 3; i++) {
      await prisma.consumableMovement.create({
        data: {
          itemId: ci.id,
          movementType: pick(['IN','OUT','OUT']),
          quantity: between(5, 50),
          date: dateAdd(today, -between(1, 60)),
          reference: `MOV-${between(1000, 9999)}`,
          department: pick(['Office','Sciences','Catering','Operations']),
        },
      });
    }
  }

  // ── Communications ────────────────────────────────────────────────────────
  console.log('  Creating message log...');
  const messageSpecs = [
    { channel: 'SMS',   subject: null, body: 'Reminder: PTA meeting on Friday at 16:00', audience: 'All Parents', count: 480 },
    { channel: 'EMAIL', subject: 'End-of-Term Reports Published', body: 'Dear Parent/Guardian, the end-of-term reports for Term 1 are now available on the parent portal.', audience: 'All Parents', count: 480 },
    { channel: 'SMS',   subject: null, body: 'Sports day rescheduled to next Wednesday due to weather.', audience: 'Form 4 Parents', count: 96 },
    { channel: 'EMAIL', subject: 'Fee Statement Available', body: 'Your child’s fee statement for Term 2 is available.', audience: 'All Parents', count: 480 },
    { channel: 'IN_APP', subject: 'Staff Meeting', body: 'Reminder: HOD meeting Friday 14:00 in conference room.', audience: 'All HoDs', count: 8 },
    { channel: 'SMS',   subject: null, body: 'Library books due back by end of week.', audience: 'Borrowers with overdue', count: 8 },
  ];
  for (let i = 0; i < messageSpecs.length; i++) {
    const m = messageSpecs[i];
    const sentAt = dateAdd(today, -i);
    const msg = await prisma.message.create({
      data: {
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        senderId: userByEmail['comms@school.demo'].id,
        audience: JSON.stringify({ type: 'AD_HOC', filter: m.audience }),
        sentAt,
        status: 'SENT',
        recipientCount: m.count,
      },
    });
    // Sample recipients (just 5 — realistic but not 480)
    for (let r = 0; r < 5; r++) {
      await prisma.messageRecipient.create({
        data: {
          messageId: msg.id,
          recipientType: 'GUARDIAN',
          recipientName: `${pick(FIRST_NAMES_M)} ${pick(LAST_NAMES)}`,
          contactUsed: m.channel === 'EMAIL' ? `parent${r}@email.demo` : `+1555010${r}`,
          deliveryStatus: rand() < 0.95 ? 'DELIVERED' : 'FAILED',
        },
      });
    }
  }

  // ── Initial audit log ──────────────────────────────────────────────────────
  console.log('  Creating sample audit log entries...');
  const { createHash } = await import('node:crypto');
  let prevHash = '';
  for (let i = 0; i < 25; i++) {
    const u = users[i % users.length];
    const action = pick(['CREATE','UPDATE','DELETE','LOGIN','APPROVE'] as const);
    const tableName = pick(['User','Student','FeeInvoice','FeeReceipt','LeaveRequest','Asset']);
    const recordId = `mock-${between(1000, 9999)}`;
    const fp = [prevHash, u.id, action, tableName, recordId, '', '', new Date().toISOString().slice(0, 10)].join('|');
    const rowHash = createHash('sha256').update(fp).digest('hex');
    await prisma.auditLog.create({
      data: {
        userId: u.id,
        userEmail: u.email,
        action,
        tableName,
        recordId,
        prevHash,
        rowHash,
        ip: '127.0.0.1',
        userAgent: 'Seed/1.0',
        createdAt: dateAdd(today, -between(1, 30)),
      },
    });
    prevHash = rowHash;
  }

  console.log('✅ Seed complete!');
  console.log(`   Users: ${users.length}, Employees: ${employees.length}, Students: ${students.length}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
