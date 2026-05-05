'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  GraduationCap, LayoutDashboard, Users, Wallet, Briefcase, BookOpen,
  Package, MessageSquare, BarChart3, Shield, LogOut, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleKey } from '@/lib/rbac';
import { useState } from 'react';

const NAV_ITEMS: Array<{ key: ModuleKey; href: string; label: string; icon: React.ReactNode }> = [
  { key: 'dashboard',      href: '/dashboard',      label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'academics',      href: '/academics',      label: 'Academics',      icon: <Users className="w-4 h-4" /> },
  { key: 'finance',        href: '/finance',        label: 'Finance',        icon: <Wallet className="w-4 h-4" /> },
  { key: 'hr',             href: '/hr',             label: 'HR',             icon: <Briefcase className="w-4 h-4" /> },
  { key: 'library',        href: '/library',        label: 'Library',        icon: <BookOpen className="w-4 h-4" /> },
  { key: 'inventory',      href: '/inventory',      label: 'Inventory',      icon: <Package className="w-4 h-4" /> },
  { key: 'communications', href: '/communications', label: 'Communications', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'reports',        href: '/reports',        label: 'Reports',        icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'admin',          href: '/admin',          label: 'System Admin',   icon: <Shield className="w-4 h-4" /> },
];

export function AppShell({
  children, visibleModules, user,
}: {
  children: React.ReactNode;
  visibleModules: ModuleKey[];
  user: { name: string; email: string; roles: string[] };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((n) => visibleModules.includes(n.key));

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="app-sidebar w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col fixed inset-y-0 left-0">
        <div className="px-4 h-14 flex items-center gap-2 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="font-semibold text-sm leading-tight">
            Greenfields High
            <div className="text-[10px] text-slate-400 font-normal">SchoolERP</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((it) => {
            const active = it.href === '/dashboard'
              ? pathname === it.href
              : pathname.startsWith(it.href);
            return (
              <Link
                key={it.key}
                href={it.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                {it.icon}
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="px-2">v1.0 demo • mock data</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 min-w-0">
        {/* Top bar */}
        <header className="app-topbar h-14 border-b border-border bg-surface sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="text-sm text-text-muted">
            {pathname === '/dashboard' ? 'Dashboard' : (
              <span className="capitalize">{pathname.split('/').filter(Boolean).join(' / ')}</span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
            >
              <div className="w-7 h-7 bg-brand text-brand-fg rounded-full flex items-center justify-center text-xs font-semibold">
                {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs text-text-muted leading-tight">{user.roles.join(', ')}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-surface border border-border rounded-md shadow-lg py-1 text-sm"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-border-soft">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-text-muted">{user.email}</div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-3 py-2 hover:bg-surface-2 text-danger flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6 print-area">{children}</main>
      </div>
    </div>
  );
}
