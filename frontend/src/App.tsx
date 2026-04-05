import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute }   from './components/ProtectedRoute';
import { DashboardLayout }  from './components/DashboardLayout';
import { LandingPage }      from './pages/LandingPage';
import { LoginPage }        from './pages/LoginPage';
import { DashboardPage }    from './pages/DashboardPage';
import { UsersPage }        from './pages/UsersPage';
import { RolesPage }        from './pages/RolesPage';
import { AnalyticsPage }    from './pages/AnalyticsPage';
import { AuditLogsPage }    from './pages/AuditLogsPage';
import { ProfilePage }      from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,  // 1 minute
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected shell */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              <Route
                path="users"
                element={
                  <ProtectedRoute requiredPermission="view_users">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="roles"
                element={
                  <ProtectedRoute requiredPermission="assign_roles">
                    <RolesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="analytics"
                element={
                  <ProtectedRoute requiredPermission="view_analytics">
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute requiredPermission="view_audit_logs">
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
