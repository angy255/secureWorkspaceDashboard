import { useQuery } from '@tanstack/react-query';
import { Users, Shield, Activity, ScrollText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, queryKeys } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface StatsData {
  users:   { total: number };
  roles:   { data: unknown[] };
  logins:  { data: { count: number }[] };
  audits:  { data: { count: number }[] };
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  link?: string;
}) {
  const content = (
    <div className={`card p-5 flex items-center gap-4 ${link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-pewter uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-charcoal mt-0.5">{value}</p>
      </div>
      {link && <ArrowRight size={16} className="ml-auto text-slate-300" />}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users({ limit: 1 }),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: { total: number } }>('/users', { params: { limit: 1 } });
      return res.data.data;
    },
    enabled: hasPermission('view_users'),
  });

  const { data: rolesData } = useQuery({
    queryKey: queryKeys.roles(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: unknown[] }>('/roles');
      return res.data.data;
    },
  });

  const { data: loginActivity } = useQuery({
    queryKey: queryKeys.analytics.loginActivity(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: { count: number }[] }>('/analytics/login-activity');
      return res.data.data;
    },
    enabled: hasPermission('view_analytics'),
  });

  const { data: auditData } = useQuery({
    queryKey: queryKeys.auditLogs({ limit: 1 }),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: { total: number } }>('/audit-logs', { params: { limit: 1 } });
      return res.data.data;
    },
    enabled: hasPermission('view_audit_logs'),
  });

  const totalLogins = loginActivity?.reduce((sum, d) => sum + Number(d.count), 0) ?? '—';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-pewter mt-1">
          Here's a snapshot of your workspace activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {usersLoading ? (
          <div className="card p-5 flex items-center justify-center col-span-1">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <StatCard
            icon={Users}
            label="Total Users"
            value={usersData?.total ?? '—'}
            color="bg-sage-600"
            link={hasPermission('view_users') ? '/dashboard/users' : undefined}
          />
        )}

        <StatCard
          icon={Shield}
          label="Active Roles"
          value={rolesData?.length ?? '—'}
          color="bg-cadet-600"
          link={hasPermission('assign_roles') ? '/dashboard/roles' : undefined}
        />

        <StatCard
          icon={Activity}
          label="Logins (30d)"
          value={totalLogins}
          color="bg-pewter"
          link={hasPermission('view_analytics') ? '/dashboard/analytics' : undefined}
        />

        <StatCard
          icon={ScrollText}
          label="Audit Events"
          value={auditData?.total ?? '—'}
          color="bg-purple-taupe"
          link={hasPermission('view_audit_logs') ? '/dashboard/audit-logs' : undefined}
        />
      </div>

      {/* Quick nav */}
      <div>
        <h2 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wide">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hasPermission('view_users') && (
            <Link to="/dashboard/users" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
              <Users size={18} className="text-sage-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-charcoal">Manage Users</p>
                <p className="text-xs text-pewter">Search, create, edit, and delete users</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-light-gray group-hover:text-sage-500 transition-colors" />
            </Link>
          )}
          {hasPermission('view_analytics') && (
            <Link to="/dashboard/analytics" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
              <Activity size={18} className="text-cadet-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-charcoal">Analytics</p>
                <p className="text-xs text-pewter">Growth charts and login trends</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-light-gray group-hover:text-cadet-500 transition-colors" />
            </Link>
          )}
          {hasPermission('view_audit_logs') && (
            <Link to="/dashboard/audit-logs" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
              <ScrollText size={18} className="text-purple-taupe flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-charcoal">Audit Logs</p>
                <p className="text-xs text-pewter">Track admin actions and changes</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-light-gray group-hover:text-purple-taupe transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
