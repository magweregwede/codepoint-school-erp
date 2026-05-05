import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { can, canAny, type Permission, type SessionUser } from '@/lib/rbac';

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session.user as SessionUser;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) {
    redirect('/forbidden');
  }
  return user;
}

export async function requireAnyPermission(perms: Permission[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!canAny(user, perms)) {
    redirect('/forbidden');
  }
  return user;
}
