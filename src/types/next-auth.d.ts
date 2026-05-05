import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    roles?: string[];
    permissions?: string[];
  }
}
