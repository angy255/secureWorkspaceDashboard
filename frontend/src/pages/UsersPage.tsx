import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient, queryKeys } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { UserModal }     from '../components/UserModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface User {
  id:              number;
  name:            string;
  email:           string;
  role_name:       string;
  organization_id: number;
  created_at:      string;
}

interface UsersResponse {
  users:      User[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-red-100 text-red-700',
  manager: 'bg-amber-100 text-amber-700',
  member:  'bg-emerald-100 text-emerald-700',
  viewer:  'bg-slate-100 text-slate-500',
};

export function UsersPage() {
  const { hasPermission } = useAuth();
  const queryClient       = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [page,         setPage]         = useState(1);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingUser,  setEditingUser]  = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const queryParams = { search: search || undefined, role: roleFilter || undefined, page };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.users(queryParams),
    queryFn: async () => {
      const res = await apiClient.get<{ data: UsersResponse }>('/users', {
        params: { ...queryParams, limit: 20 },
      });
      return res.data.data;
    },
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error ?? 'Delete failed.');
    },
  });

  function openCreate() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setModalOpen(true);
  }

  const users      = data?.users      ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Users</h1>
          <p className="text-sm text-pewter mt-0.5">{total} total users in your workspace</p>
        </div>
        {hasPermission('create_users') && (
          <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
            <Plus size={15} />
            Add User
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pewter pointer-events-none" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field pl-9 pr-10 bg-white w-48 appearance-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-20"><LoadingSpinner fullPage /></div>
        ) : isError ? (
          <div className="py-20 text-center">
            <p className="text-red-500 text-sm">Failed to load users. Please refresh.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                    {(hasPermission('edit_users') || hasPermission('delete_users')) && (
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors duration-75">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-600 font-semibold text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-slate-700">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">{u.email}</td>
                        <td className="px-6 py-3.5">
                          <span className={`badge capitalize ${ROLE_COLORS[u.role_name] ?? 'bg-slate-100 text-slate-600'}`}>
                            {u.role_name}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </td>
                        {(hasPermission('edit_users') || hasPermission('delete_users')) && (
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {hasPermission('edit_users') && (
                                <button
                                  onClick={() => openEdit(u)}
                                  title="Edit user"
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {hasPermission('delete_users') && (
                                <button
                                  onClick={() => setDeletingUser(u)}
                                  title="Delete user"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
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
                  Page {page} of {totalPages} · {total} results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500
                               hover:bg-white hover:border-slate-300 transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500
                               hover:bg-white hover:border-slate-300 transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => { setModalOpen(false); setEditingUser(null); }}
          onSuccess={() => {
            setModalOpen(false);
            setEditingUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingUser && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete "${deletingUser.name}"? This action is permanent and cannot be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deletingUser.id)}
          onCancel={() => setDeletingUser(null)}
          intent="danger"
        />
      )}
    </div>
  );
}
