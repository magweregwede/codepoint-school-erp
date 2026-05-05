import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <ShieldAlert className="w-12 h-12 text-warn mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-text-muted mt-2 text-sm">
          You don&apos;t have the necessary permissions to view this page.
          Sign in with a different role or contact your system administrator.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/dashboard" className="px-4 py-2 rounded-md bg-brand text-brand-fg text-sm font-medium hover:bg-brand/90">
            Back to dashboard
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-2">
            Switch user
          </Link>
        </div>
      </div>
    </div>
  );
}
