import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Token helpers ──────────────────────────────────────────────────────────────
// Single source of truth: Zustand persists to 'saas-auth' key.
// These helpers read/write from that same structure so everything stays in sync.

export function getStoredToken(key: 'accessToken' | 'refreshToken'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('saas-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.[key] ?? null;
  } catch {
    return null;
  }
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('saas-auth');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state) {
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      localStorage.setItem('saas-auth', JSON.stringify(parsed));
    }
  } catch {
    localStorage.removeItem('saas-auth');
  }
}

// ── Request interceptor — inject Bearer token ──────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — refresh on 401 ─────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });

        // Write new tokens back into the Zustand persist structure
        const raw = localStorage.getItem('saas-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state) {
            parsed.state.accessToken = data.accessToken;
            parsed.state.refreshToken = data.refreshToken;
            localStorage.setItem('saas-auth', JSON.stringify(parsed));
          }
        }

        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearStoredTokens();
        // Soft redirect — avoids hard reload loop
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
