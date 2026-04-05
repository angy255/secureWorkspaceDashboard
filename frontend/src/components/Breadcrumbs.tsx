import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'users':      'Users',
  'roles':      'Roles',
  'analytics':  'Analytics',
  'audit-logs': 'Audit Logs',
  'profile':    'Profile',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  // Strip the /dashboard prefix and work with the sub-segments only
  const subPath    = pathname.replace(/^\/dashboard\/?/, '');
  const segments   = subPath.split('/').filter(Boolean);

  const crumbs = [
    { label: 'Dashboard', to: '/dashboard', icon: true },
    ...segments.map((seg, idx) => ({
      label: ROUTE_LABELS[seg] ?? seg,
      to:    '/dashboard/' + segments.slice(0, idx + 1).join('/'),
      icon:  false,
    })),
  ];

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm mb-4">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight size={13} className="text-slate-400" />}
            {isLast ? (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                {crumb.icon && <Home size={13} />}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors duration-150"
              >
                {crumb.icon && <Home size={13} />}
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
