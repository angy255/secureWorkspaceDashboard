import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Pencil, X, Check } from 'lucide-react';
import { apiClient, queryKeys } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Permission {
  id:              number;
  permission_name: string;
}

interface Role {
  id:          number;
  role_name:   string;
  description: string | null;
  permissions: Permission[];
}

const ROLE_COLORS: Record<string, { card: string; badge: string; icon: string }> = {
  admin:   { card: 'border-red-200 bg-red-50/30',     badge: 'bg-red-100 text-red-700',     icon: 'text-red-500' },
  manager: { card: 'border-amber-200 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
  member:  { card: 'border-emerald-200 bg-emerald-50/30', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' },
  viewer:  { card: 'border-slate-200 bg-slate-50/30', badge: 'bg-slate-100 text-slate-500', icon: 'text-slate-400' },
};

// ─── Permissions Edit Modal ───────────────────────────────────
interface PermissionsModalProps {
  role:        Role;
  allPerms:    Permission[];
  onClose:     () => void;
  onSuccess:   () => void;
}

function PermissionsModal({ role, allPerms, onClose, onSuccess }: PermissionsModalProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(role.permissions.map(p => p.id))
  );
  const [description, setDescription] = useState(role.description ?? '');
  const [submitError, setSubmitError]  = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/roles/${role.id}`, {
        description: description || undefined,
        permissions: Array.from(selected),
      }),
    onSuccess,
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.error ?? 'Failed to update role.');
    },
  });

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800 capitalize">
              Edit {role.role_name} Role
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Adjust permissions and description</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe this role…"
                className="input-field"
              />
            </div>

            {/* Permission checkboxes */}
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Permissions</p>
              <div className="space-y-2">
                {allPerms.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                        ${selected.has(p.id)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-300 bg-white'
                        }
                      `}
                    >
                      {selected.has(p.id) && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="text-sm font-mono text-slate-600">{p.permission_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-light-gray">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending && <LoadingSpinner size="sm" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function RolesPage() {
  const { hasPermission }     = useAuth();
  const queryClient           = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: queryKeys.roles(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: Role[] }>('/roles');
      return res.data.data;
    },
  });

  const { data: permsData } = useQuery({
    queryKey: queryKeys.permissions(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: Permission[] }>('/roles/permissions');
      return res.data.data;
    },
  });

  const roles   = rolesData ?? [];
  const allPerms = permsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Roles & Permissions</h1>
        <p className="text-sm text-pewter mt-0.5">
          View and manage what each role can do in the workspace.
        </p>
      </div>

      {rolesLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => {
            const colors = ROLE_COLORS[role.role_name] ?? ROLE_COLORS.viewer;
            return (
              <div
                key={role.id}
                className={`card border-2 ${colors.card} p-5 flex flex-col gap-4`}
              >
                {/* Role header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                      <Shield size={18} className={colors.icon} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal capitalize">{role.role_name}</h3>
                      <p className="text-xs text-pewter mt-0.5 leading-relaxed">
                        {role.description ?? 'No description provided.'}
                      </p>
                    </div>
                  </div>
                  {hasPermission('assign_roles') && (
                    <button
                      onClick={() => setEditingRole(role)}
                      title="Edit permissions"
                      className="p-1.5 text-pewter hover:text-sage-600 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <p className="text-xs font-medium text-pewter mb-2">
                    {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </p>
                  {role.permissions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No permissions assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(p => (
                        <span
                          key={p.id}
                          className={`badge font-mono text-[10px] ${colors.badge}`}
                        >
                          {p.permission_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingRole && (
        <PermissionsModal
          role={editingRole}
          allPerms={allPerms}
          onClose={() => setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}
    </div>
  );
}
