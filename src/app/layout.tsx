import type { Metadata } from 'next';
import './globals.css';
import NextAuthSessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'SchoolERP — Greenfields High School',
  description: 'High School Enterprise Resource Planning demo (mock data).',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
