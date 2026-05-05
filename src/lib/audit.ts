import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

type AuditPayload = {
  userId?: string | null;
  userEmail?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGIN_FAILED' | 'EXPORT' | 'APPROVE';
  tableName?: string;
  recordId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
};

export async function audit(payload: AuditPayload): Promise<void> {
  const last = await prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' } });
  const prevHash = last?.rowHash ?? '';

  const beforeJson = payload.before === undefined ? null : JSON.stringify(payload.before);
  const afterJson = payload.after === undefined ? null : JSON.stringify(payload.after);

  const fingerprint = [
    prevHash,
    payload.userId ?? '',
    payload.action,
    payload.tableName ?? '',
    payload.recordId ?? '',
    beforeJson ?? '',
    afterJson ?? '',
    new Date().toISOString().slice(0, 10),
  ].join('|');

  const rowHash = createHash('sha256').update(fingerprint).digest('hex');

  await prisma.auditLog.create({
    data: {
      userId: payload.userId ?? null,
      userEmail: payload.userEmail ?? null,
      action: payload.action,
      tableName: payload.tableName ?? null,
      recordId: payload.recordId ?? null,
      beforeJson,
      afterJson,
      ip: payload.ip ?? null,
      userAgent: payload.userAgent ?? null,
      prevHash,
      rowHash,
    },
  });
}
