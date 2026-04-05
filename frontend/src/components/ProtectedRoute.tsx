import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

/**
 * ProtectedRoute
 *
 * 1. If unauthenticated → redirect to /login (preserves intended destination).
 * 2. If a requiredPermission is given and the user lacks it → show a 403 card.
 * 3. Otherwise → render children.
 *
 * Note: Permission checks here are for UX only. Authoritative enforcement
 * is always done server-side by requirePermission() middleware.
 */
export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Access Denied</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            You don't have the <code className="font-mono bg-slate-100 px-1 rounded text-xs">{requiredPermission}</code> permission required to view this page.
            Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
