/**
 * auth-store.ts
 * Zustand store for auth state.
 * Token is kept in memory only; we persist only userId so the app
 * knows whether the user was previously logged in.
 */
import { create } from 'zustand';

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: 'user' | 'admin';
  settings?: {
    language?: 'vi' | 'en';
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
    reduceMotion?: boolean;
    disableConfetti?: boolean;
    textScale?: number;
  };
};

type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isLoading: false }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
  setLoading: (v) => set({ isLoading: v }),
}));
