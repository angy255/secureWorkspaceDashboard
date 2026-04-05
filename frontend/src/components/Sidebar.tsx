import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed:     boolean;
  onToggle:      () => void;
  mobileOpen:    boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard',             label: 'Dashboard',  icon: LayoutDashboard, permission: null },
  { to: '/dashboard/users',       label: 'Users',      icon: Users,           permission: 'view_users' },
  { to: '/dashboard/roles',       label: 'Roles',      icon: Shield,          permission: 'assign_roles' },
  { to: '/dashboard/analytics',   label: 'Analytics',  icon: BarChart2,       permission: 'view_analytics' },
  { to: '/dashboard/audit-logs',  label: 'Audit Logs', icon: ScrollText,      permission: 'view_audit_logs' },
] as const;

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { hasPermission } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    item => item.permission === null || hasPermission(item.permission)
  );

  return (
    <aside
      className={`
        bg-charcoal text-slate-100 flex flex-col flex-shrink-0
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 z-30
        lg:relative lg:translate-x-0 lg:flex
        ${collapsed ? 'lg:w-16' : 'lg:w-64'}
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">AA</span>
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="ml-3 font-semibold text-white truncate tracking-tight">
            AuthAxis
          </span>
        )}
        {/* Close button visible only on mobile */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 text-slate-400 hover:text-white lg:hidden"
            title="Close menu"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={(collapsed && !mobileOpen) ? label : undefined}
              onClick={mobileOpen ? onMobileClose : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150 group
                ${isActive
                  ? 'bg-sage-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                }
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
              {isActive && (!collapsed || mobileOpen) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="
          hidden lg:flex items-center justify-center h-12 flex-shrink-0
          border-t border-slate-700
          text-slate-500 hover:text-slate-200 hover:bg-slate-700
          transition-colors duration-150
        "
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && (
          <span className="text-xs ml-2 text-slate-500">Collapse</span>
        )}
      </button>
    </aside>
  );
}
