import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { expandPermissions } from '@/lib/rbac';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } },
        });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: { increment: 1 } },
          }).catch(() => undefined);
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date(), failedLogins: 0 },
        }).catch(() => undefined);

        const roleNames = user.roles.map((r) => r.role.name);
        const permissions = expandPermissions(roleNames);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roleNames,
          permissions,
        } as unknown as { id: string; email: string; name: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; roles: string[]; permissions: string[] };
        token.uid = u.id;
        token.roles = u.roles ?? [];
        token.permissions = u.permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      const ses = session as typeof session & {
        user: typeof session.user & { id: string; roles: string[]; permissions: string[] };
      };
      ses.user.id = (token.uid as string) ?? '';
      ses.user.roles = (token.roles as string[]) ?? [];
      ses.user.permissions = (token.permissions as string[]) ?? [];
      return ses;
    },
  },
});
