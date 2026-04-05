import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, queryKeys } from '../api/client';
import { LoadingSpinner } from './LoadingSpinner';

interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
  organization_id: number;
}

interface Role {
  id: number;
  role_name: string;
  description: string | null;
}

interface UserModalProps {
  user:      User | null; // null = create mode
  onClose:   () => void;
  onSuccess: () => void;
}

interface FormState {
  name:    string;
  email:   string;
  password: string;
  role_id: string;
}

interface FieldErrors {
  name?:     string;
  email?:    string;
  password?: string;
  role_id?:  string;
  submit?:   string;
}

const INITIAL_FORM: FormState = { name: '', email: '', password: '', role_id: '3' };

export function UserModal({ user, onClose, onSuccess }: UserModalProps) {
  const isEdit = user !== null;
  const [form, setForm]     = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role_id: '' });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [user]);

  // Fetch roles for the dropdown
  const { data: rolesData } = useQuery({
    queryKey: queryKeys.roles(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Role[] }>('/roles');
      return res.data.data;
    },
  });
  const roles = rolesData ?? [];

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        return apiClient.put(`/users/${user!.id}`, payload);
      }
      return apiClient.post('/users', payload);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Something went wrong. Please try again.';
      setErrors(prev => ({ ...prev, submit: msg }));
    },
  });

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.name.trim())     next.name    = 'Name is required.';
    if (!form.email.trim())    next.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (!isEdit && form.password.length < 8)  next.password = 'Password must be at least 8 characters.';
    if (!form.role_id)          next.role_id = 'Role is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      name:    form.name.trim(),
      email:   form.email.trim(),
      role_id: parseInt(form.role_id, 10),
    };
    if (!isEdit) payload.password        = form.password;
    if (!isEdit) payload.organization_id = 1;

    mutation.mutate(payload);
  }

  function field(key: keyof FormState) {
    return {
      value:    form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value })),
    };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray">
          <h2 className="text-base font-semibold text-charcoal">
            {isEdit ? 'Edit User' : 'Add User'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-pewter hover:text-charcoal hover:bg-soft-white rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                {...field('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="jane@example.com"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                {...field('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password (create only) */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  className={`input-field ${errors.password ? 'input-error' : ''}`}
                  {...field('password')}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                className={`input-field bg-white ${errors.role_id ? 'input-error' : ''}`}
                value={isEdit ? (roles.find(r => r.role_name === user?.role_name)?.id.toString() ?? form.role_id) : form.role_id}
                onChange={(e) => setForm(prev => ({ ...prev, role_id: e.target.value }))}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.role_name}</option>
                ))}
              </select>
              {errors.role_id && <p className="mt-1 text-xs text-red-500">{errors.role_id}</p>}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-light-gray">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending && <LoadingSpinner size="sm" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
