// RBAC: permission codenames + role definitions per SRS §7
// Permissions are <module>.<verb>_<object> per SRS §7.1

export const ALL_PERMISSIONS = [
  // Academics
  'academics.view_student', 'academics.create_student', 'academics.edit_student',
  'academics.mark_attendance', 'academics.enter_marks', 'academics.approve_marks',
  'academics.view_reports', 'academics.publish_reports', 'academics.manage_timetable',
  // Finance
  'finance.view_invoice', 'finance.create_invoice', 'finance.create_receipt',
  'finance.view_supplier', 'finance.create_po', 'finance.approve_payment',
  'finance.process_withdrawal', 'finance.close_period', 'finance.view_ledger',
  // HR
  'hr.view_employee', 'hr.create_employee', 'hr.mark_attendance', 'hr.approve_leave',
  'hr.run_payroll', 'hr.approve_payroll',
  // Library
  'library.view_catalogue', 'library.manage_catalogue', 'library.issue_loan', 'library.manage_fine',
  // Inventory
  'inventory.view_asset', 'inventory.create_asset', 'inventory.move_asset',
  'inventory.dispose_asset', 'inventory.manage_consumables', 'inventory.manage_vehicle',
  // Communications
  'comms.send_message', 'comms.view_log',
  // Reports
  'reports.view_dashboard', 'reports.view_canned',
  // Admin
  'admin.manage_users', 'admin.manage_roles', 'admin.view_audit', 'admin.manage_config',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_DEFINITIONS: Record<string, { description: string; permissions: Permission[] | '*' }> = {
  'System Administrator': {
    description: 'Full access. User/role management, configuration, backups, audit review.',
    permissions: '*',
  },
  Principal: {
    description: 'Read all, approve high-value transactions, publish results, release reports.',
    permissions: [
      'academics.view_student', 'academics.view_reports', 'academics.publish_reports',
      'academics.approve_marks',
      'finance.view_invoice', 'finance.approve_payment', 'finance.process_withdrawal',
      'finance.close_period', 'finance.view_ledger',
      'hr.view_employee', 'hr.approve_leave', 'hr.approve_payroll',
      'library.view_catalogue',
      'inventory.view_asset', 'inventory.dispose_asset',
      'comms.send_message', 'comms.view_log',
      'reports.view_dashboard', 'reports.view_canned',
      'admin.view_audit',
    ],
  },
  'Academic Head': {
    description: 'Academic calendar, assessment schemes, result approval, timetable.',
    permissions: [
      'academics.view_student', 'academics.enter_marks', 'academics.approve_marks',
      'academics.view_reports', 'academics.publish_reports', 'academics.manage_timetable',
      'reports.view_dashboard', 'reports.view_canned',
    ],
  },
  Bursar: {
    description: 'Full finance: approve payments, period close.',
    permissions: [
      'finance.view_invoice', 'finance.create_invoice', 'finance.create_receipt',
      'finance.view_supplier', 'finance.create_po', 'finance.approve_payment',
      'finance.process_withdrawal', 'finance.close_period', 'finance.view_ledger',
      'reports.view_dashboard', 'reports.view_canned',
    ],
  },
  Cashier: {
    description: 'Receive fee payments, issue receipts. No approvals.',
    permissions: [
      'finance.view_invoice', 'finance.create_receipt',
      'reports.view_dashboard',
    ],
  },
  'HR Manager': {
    description: 'Full HR + payroll approval.',
    permissions: [
      'hr.view_employee', 'hr.create_employee', 'hr.mark_attendance',
      'hr.approve_leave', 'hr.run_payroll', 'hr.approve_payroll',
      'reports.view_dashboard', 'reports.view_canned',
    ],
  },
  'Class Teacher': {
    description: 'Attendance, comments, report cards for the assigned class.',
    permissions: [
      'academics.view_student', 'academics.mark_attendance', 'academics.enter_marks',
      'academics.view_reports',
      'reports.view_dashboard',
    ],
  },
  'Subject Teacher': {
    description: 'Enter marks for subjects they teach.',
    permissions: [
      'academics.view_student', 'academics.enter_marks',
      'reports.view_dashboard',
    ],
  },
  Librarian: {
    description: 'Full library.',
    permissions: [
      'library.view_catalogue', 'library.manage_catalogue', 'library.issue_loan',
      'library.manage_fine',
      'reports.view_dashboard',
    ],
  },
  'Stores Officer': {
    description: 'Inventory movements, stocktakes.',
    permissions: [
      'inventory.view_asset', 'inventory.create_asset', 'inventory.move_asset',
      'inventory.manage_consumables', 'inventory.manage_vehicle',
      'reports.view_dashboard',
    ],
  },
  Auditor: {
    description: 'Read-only access to financial transactions and audit logs.',
    permissions: [
      'finance.view_invoice', 'finance.view_ledger', 'finance.view_supplier',
      'hr.view_employee',
      'inventory.view_asset',
      'admin.view_audit',
      'reports.view_dashboard', 'reports.view_canned',
    ],
  },
  'Communications Officer': {
    description: 'Send announcements, manage message log.',
    permissions: [
      'comms.send_message', 'comms.view_log',
      'academics.view_student', 'hr.view_employee',
      'reports.view_dashboard',
    ],
  },
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

export function expandPermissions(roles: string[]): string[] {
  const set = new Set<string>();
  for (const role of roles) {
    const def = ROLE_DEFINITIONS[role];
    if (!def) continue;
    if (def.permissions === '*') {
      ALL_PERMISSIONS.forEach((p) => set.add(p));
      return Array.from(set);
    }
    def.permissions.forEach((p) => set.add(p));
  }
  return Array.from(set);
}

export function can(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function canAny(user: SessionUser | null | undefined, perms: Permission[]): boolean {
  if (!user) return false;
  return perms.some((p) => user.permissions.includes(p));
}

export type ModuleKey =
  | 'dashboard' | 'academics' | 'finance' | 'hr' | 'library' | 'inventory'
  | 'communications' | 'reports' | 'admin';

export const MODULE_PERMISSIONS: Record<ModuleKey, Permission[]> = {
  dashboard: ['reports.view_dashboard'],
  academics: ['academics.view_student', 'academics.mark_attendance', 'academics.enter_marks', 'academics.view_reports'],
  finance: ['finance.view_invoice', 'finance.view_supplier', 'finance.view_ledger'],
  hr: ['hr.view_employee'],
  library: ['library.view_catalogue', 'library.issue_loan'],
  inventory: ['inventory.view_asset', 'inventory.manage_consumables', 'inventory.manage_vehicle'],
  communications: ['comms.send_message', 'comms.view_log'],
  reports: ['reports.view_canned'],
  admin: ['admin.manage_users', 'admin.view_audit', 'admin.manage_config'],
};

export function visibleModules(user: SessionUser | null | undefined): ModuleKey[] {
  if (!user) return [];
  return (Object.keys(MODULE_PERMISSIONS) as ModuleKey[]).filter((m) =>
    canAny(user, MODULE_PERMISSIONS[m])
  );
}
