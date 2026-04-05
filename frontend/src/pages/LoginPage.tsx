import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface FormState {
  email:    string;
  password: string;
}

interface FieldErrors {
  email?:    string;
  password?: string;
  submit?:   string;
}

export function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname ?? '/dashboard';

  const [form,    setForm]    = useState<FormState>({ email: '', password: '' });
  const [errors,  setErrors]  = useState<FieldErrors>({});
  const [showPw,  setShowPw]  = useState(false);

  // Already authenticated → redirect
  if (user) return <Navigate to={from} replace />;

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.email.trim())    next.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (!form.password)        next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});

    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Invalid email or password. Please try again.';
      setErrors({ submit: msg });
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sage-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sage-500/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AuthAxis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`input-field pl-9 ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input-field pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Server error */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5 mt-1"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              Sign in
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Demo: <span className="font-mono text-slate-500">admin@example.com</span> /{' '}
              <span className="font-mono text-slate-500">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
