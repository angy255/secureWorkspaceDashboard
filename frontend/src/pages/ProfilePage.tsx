import { useState, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient, queryKeys } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ProfileData {
  id:              number;
  name:            string;
  email:           string;
  role_name:       string;
  organization_id: number;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin:   'bg-red-100 text-red-700',
  manager: 'bg-amber-100 text-amber-700',
  member:  'bg-emerald-100 text-emerald-700',
  viewer:  'bg-slate-100 text-slate-500',
};

function FeedbackBanner({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
      isError
        ? 'bg-red-50 border border-red-100 text-red-600'
        : 'bg-sage-50 border border-sage-100 text-sage-700'
    }`}>
      {isError
        ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
        : <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />}
      <span>{message}</span>
    </div>
  );
}

// ─── Account Info Section ─────────────────────────────────────
function AccountInfoSection({ profile }: { profile: ProfileData }) {
  const queryClient = useQueryClient();
  const [email, setEmail]       = useState(profile.email);
  const [feedback, setFeedback] = useState<{ msg: string; error: boolean } | null>(null);

  const mutation = useMutation({
    mutationFn: (newEmail: string) =>
      apiClient.patch('/me', { email: newEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setFeedback({ msg: 'Email updated successfully.', error: false });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Failed to update email.';
      setFeedback({ msg, error: true });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || email === profile.email) return;
    setFeedback(null);
    mutation.mutate(email.trim());
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <User size={16} className="text-sage-600" />
        <h2 className="text-base font-semibold text-charcoal">Account Info</h2>
      </div>

      {/* Read-only fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-pewter mb-1">Full Name</label>
          <div className="w-full px-3 py-2 bg-soft-white border border-light-gray rounded-lg text-sm text-charcoal/60 select-none">
            {profile.name}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-pewter mb-1">Role</label>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge capitalize text-xs ${ROLE_BADGE_COLORS[profile.role_name] ?? 'bg-slate-100 text-slate-500'}`}>
              {profile.role_name}
            </span>
            <span className="text-xs text-pewter">(managed by admin)</span>
          </div>
        </div>
      </div>

      {/* Editable email */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-light-gray">
        <div>
          <label className="block text-xs font-medium text-charcoal mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setFeedback(null); }}
            className="input-field"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {feedback && <FeedbackBanner message={feedback.msg} isError={feedback.error} />}

        <button
          type="submit"
          disabled={mutation.isPending || email === profile.email || !email.trim()}
          className="btn-primary"
        >
          {mutation.isPending && <LoadingSpinner size="sm" />}
          Save Email
        </button>
      </form>
    </div>
  );
}

// ─── Change Password Section ──────────────────────────────────
function ChangePasswordSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [feedback, setFeedback] = useState<{ msg: string; error: boolean } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch('/me/password', {
        currentPassword: form.current,
        newPassword:     form.next,
      }),
    onSuccess: () => {
      setForm({ current: '', next: '', confirm: '' });
      setFeedback({ msg: 'Password changed. A confirmation email has been sent.', error: false });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Failed to change password.';
      setFeedback({ msg, error: true });
    },
  });

  function validate(): string | null {
    if (!form.current)          return 'Current password is required.';
    if (form.next.length < 8)   return 'New password must be at least 8 characters.';
    if (form.next !== form.confirm) return 'Passwords do not match.';
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setFeedback({ msg: err, error: true }); return; }
    setFeedback(null);
    mutation.mutate();
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        setFeedback(null);
      },
    };
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lock size={16} className="text-cadet-600" />
        <h2 className="text-base font-semibold text-charcoal">Change Password</h2>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-charcoal mb-1.5">Current Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Your current password"
            autoComplete="current-password"
            {...field('current')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal mb-1.5">New Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            {...field('next')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal mb-1.5">Confirm New Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Repeat new password"
            autoComplete="new-password"
            {...field('confirm')}
          />
        </div>

        {feedback && <FeedbackBanner message={feedback.msg} isError={feedback.error} />}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending && <LoadingSpinner size="sm" />}
          Change Password
        </button>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export function ProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: ProfileData }>('/me');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card p-6 text-center text-sm text-red-500">
        Failed to load profile. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">My Profile</h1>
        <p className="text-sm text-pewter mt-1">Manage your account details and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountInfoSection profile={data} />
        <ChangePasswordSection />
      </div>
    </div>
  );
}
