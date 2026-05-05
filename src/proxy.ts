// Next.js 16 renamed `middleware` → `proxy`. The `auth` helper from NextAuth v5
// returns a request-handler we can re-export. We add the `/login` page to the
// public list so the auth gate doesn't loop on itself.

import { auth } from '@/lib/auth';

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublic = pathname === '/login'
    || pathname.startsWith('/api/auth')
    || pathname.startsWith('/_next')
    || pathname === '/favicon.ico';

  if (isPublic) return;

  if (!isLoggedIn) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
