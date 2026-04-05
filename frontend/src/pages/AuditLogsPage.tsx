import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { apiClient, queryKeys } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface AuditLog {
  id:          number;
  action:      string;
  entity_type: string | null;
  entity_id:   number | null;
  timestamp:   string;
  user_name:   string;
  user_email:  string;
}

interface AuditResponse {
  logs:       AuditLog[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_USER:     'bg-emerald-100 text-emerald-700',
  UPDATE_USER:     'bg-blue-100 text-blue-700',
  DELETE_USER:     'bg-red-100 text-red-700',
  ASSIGN_ROLE:     'bg-violet-100 text-violet-700',
  VIEW_REPORT:     'bg-slate-100 text-slate-600',
  EXPORT_DATA:     'bg-amber-100 text-amber-700',
  RESET_PASSWORD:  'bg-orange-100 text-orange-700',
  REVOKE_SESSION:  'bg-rose-100 text-rose-700',
};

export function AuditLogsPage() {
  const [action,    setAction]    = useState('');
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [page,      setPage]      = useState(1);

  const queryParams = {
    action: action || undefined,
    from:   from   || undefined,
    to:     to     || undefined,
    page,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.auditLogs(queryParams),
    queryFn: async () => {
      const res = await apiClient.get<{ data: AuditResponse }>('/audit-logs', {
        params: { ...queryParams, limit: 20 },
      });
      return res.data.data;
    },
    placeholderData: prev => prev,
  });

  // Distinct actions for the dropdown
  const { data: actionsData } = useQuery({
    queryKey: queryKeys.auditActions(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: string[] }>('/audit-logs/actions');
      return res.data.data;
    },
  });

  function clearFilters() {
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  const hasFilters  = action || from || to;
  const logs        = data?.logs       ?? [];
  const total       = data?.total      ?? 0;
  const totalPages  = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Audit Logs</h1>
        <p className="text-sm text-pewter mt-0.5">
          Complete trail of admin and manager actions in the workspace.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">Filter</span>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Action</label>
            <select
              value={action}
              onChange={e => { setAction(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs w-44 bg-white appearance-none"
            >
              <option value="">All Actions</option>
              {(actionsData ?? []).map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs w-36"
            />
          </div>

          {/* To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs w-36"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors mt-4"
            >
              <RotateCcw size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-20"><LoadingSpinner fullPage /></div>
        ) : isError ? (
          <div className="py-20 text-center text-sm text-red-500">
            Failed to load audit logs. Please refresh.
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">{total} records found</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm">
                        No audit logs found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors duration-75">
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-700 text-sm">{log.user_name}</p>
                          <p className="text-xs text-slate-400">{log.user_email}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`badge text-[10px] font-mono ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 text-xs font-mono">
                          {log.entity_type
                            ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ''}`
                            : '—'
                          }
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            year:  'numeric',
                            hour:  '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500
                               hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500
                               hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
