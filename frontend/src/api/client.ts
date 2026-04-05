import axios, { AxiosRequestConfig } from 'axios';

// SECURITY: API base URL from env var — no secrets baked into bundle
export const apiClient = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,         // Sends httpOnly refresh-token cookie automatically
  headers:         { 'Content-Type': 'application/json' },
  timeout:         10_000,
});

// ─────────────────────────────────────────────────────────────
// Request Interceptor
// Attach Bearer access token from localStorage on every request.
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────
// Response Interceptor — 401 token refresh + single retry
// ─────────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh logic for auth endpoints — let the caller handle the error
    const url = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Queue subsequent 401s while refresh is in-flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh endpoint — httpOnly cookie is sent automatically
      const res  = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
      const newToken = res.data.data.accessToken;

      localStorage.setItem('accessToken', newToken);
      processQueue(null, newToken);

      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      // Refresh failed — force logout
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Query Key constants — single source of truth for React Query
// ─────────────────────────────────────────────────────────────
export const queryKeys = {
  me:           ()           => ['me']                as const,
  users:        (params?: unknown) => ['users', params]     as const,
  user:         (id: number) => ['user', id]          as const,
  roles:        ()           => ['roles']             as const,
  permissions:  ()           => ['permissions']       as const,
  auditLogs:    (params?: unknown) => ['auditLogs', params] as const,
  auditActions: ()           => ['auditActions']      as const,
  analytics: {
    userGrowth:       () => ['analytics', 'userGrowth']       as const,
    roleDistribution: () => ['analytics', 'roleDistribution'] as const,
    loginActivity:    () => ['analytics', 'loginActivity']    as const,
    auditFrequency:   () => ['analytics', 'auditFrequency']   as const,
    topUsers:         () => ['analytics', 'topUsers']         as const,
  },
} as const;
