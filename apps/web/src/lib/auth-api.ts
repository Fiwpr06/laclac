/**
 * auth-api.ts - Mobile auth API client
 */
import { AuthUser } from '../store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://fiwpr.id.vn/api/v1';

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

async function put<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    post<AuthResponse>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),

  googleLogin: (idToken: string) =>
    post<AuthResponse>('/auth/google', { idToken }),

  me: async (token: string): Promise<AuthUser> => {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
    return json.data as AuthUser;
  },

  updateAvatar: (avatarUrl: string, token: string) =>
    put<AuthUser>('/auth/me/avatar', { avatarUrl }, token),

  updateSettings: (
    settings: {
      language?: 'vi' | 'en';
      soundEnabled?: boolean;
      hapticEnabled?: boolean;
      reduceMotion?: boolean;
      disableConfetti?: boolean;
      textScale?: number;
    },
    token: string,
  ) => put<AuthUser>('/auth/me/settings', settings, token),

  logout: (token: string) => post('/auth/logout', {}, token),
};
