import type { ReactNode } from 'react';

export function PageHeader({
  title, description, breadcrumbs, action,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { href?: string; label: string }[];
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-xs text-text-muted mb-2 flex items-center gap-1">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {b.href ? (
                <a href={b.href} className="hover:text-text">{b.label}</a>
              ) : (
                <span>{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="text-text-soft">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
