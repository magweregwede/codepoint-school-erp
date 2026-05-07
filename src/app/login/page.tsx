'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

const MOCK_USERS = [
  { role: 'System Administrator',    email: 'admin@school.demo',           name: 'Alex Adminstone',    color: 'slate' },
  { role: 'Principal',               email: 'principal@school.demo',       name: 'Patricia Pendleton', color: 'blue' },
  { role: 'Academic Head',           email: 'academic@school.demo',        name: 'Andrew Akingbade',   color: 'indigo' },
  { role: 'Bursar',                  email: 'bursar@school.demo',          name: 'Beatrice Banda',    color: 'emerald' },
  { role: 'Cashier',                 email: 'cashier@school.demo',         name: 'Carlos Cazares',    color: 'teal' },
  { role: 'HR Manager',              email: 'hr@school.demo',              name: 'Helena Hartwell',   color: 'fuchsia' },
  { role: 'Class Teacher',           email: 'teacher.class@school.demo',   name: 'Tendai Tafadzwa',   color: 'purple' },
  { role: 'Subject Teacher',         email: 'teacher.subject@school.demo', name: 'Susan Stevens',     color: 'violet' },
  { role: 'Librarian',               email: 'librarian@school.demo',       name: 'Lara Lindgren',     color: 'amber' },
  { role: 'Stores Officer',          email: 'stores@school.demo',          name: 'Stephen Sithole',   color: 'orange' },
  { role: 'Auditor',                 email: 'auditor@school.demo',         name: 'Aiden Ashworth',    color: 'rose' },
  { role: 'Communications Officer',  email: 'comms@school.demo',           name: 'Camille Cromwell',  color: 'cyan' },
] as const;

const COLOR_CLASSES: Record<string, string> = {
  slate:   'bg-slate-50  text-slate-700  border-slate-200  hover:bg-slate-100',
  blue:    'bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  teal:    'bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-100',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
  purple:  'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  violet:  'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  amber:   'bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100',
  orange:  'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  rose:    'bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-100',
  cyan:    'bg-cyan-50   text-cyan-700   border-cyan-200   hover:bg-cyan-100',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fillCredentials(u: { email: string }) {
    setEmail(u.email);
    setPassword('demo1234');
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
      if (!res || res.error) {
        setError('Invalid email or password.');
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left: brand + role chips */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-8 lg:p-12 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur p-2 rounded-lg border border-white/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold">Greenfields High</div>
            <div className="text-xs text-white/60">School ERP • Demo</div>
          </div>
        </div>

        <div className="mt-12 lg:mt-20 max-w-xl">
          <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
            One platform for the whole school
          </h1>
          <p className="text-white/70 mt-3 text-sm lg:text-base leading-relaxed">
            Finance, HR, Academics, Library, Inventory, Communications, Reports
            and System Admin — built to the SRS spec.
            All data is mock. Click any role below to fill the login form.
          </p>
        </div>

        <div className="mt-8 lg:mt-10">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-3">
            Sign in as one of 12 demo users
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
            {MOCK_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillCredentials(u)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${COLOR_CLASSES[u.color]}`}
                data-testid={`role-chip-${u.role.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="text-sm font-semibold">{u.role}</div>
                <div className="text-xs opacity-75 mt-0.5 truncate">{u.email}</div>
              </button>
            ))}
          </div>
          <div className="text-xs text-white/50 mt-3">
            Password for all demo users: <code className="bg-white/10 px-1.5 py-0.5 rounded">demo1234</code>
          </div>
        </div>

        <div className="mt-auto pt-8 text-xs text-white/40">
          © 2026 Greenfields High School ERP demo. Mock data only.
        </div>
      </div>

      {/* Right: login form */}
      <div className="bg-bg flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-text-muted mt-1">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-danger-soft text-danger text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 rounded-md bg-brand text-brand-fg font-medium hover:bg-brand/90
                         disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-text-muted mt-6">
            Tip: click a coloured role chip on the left to populate this form,
            then press Sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
