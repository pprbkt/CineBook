import { create } from 'zustand';
import { authAPI } from '../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: null,

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    set({ user: res.data.data.user, isAuthenticated: true, token: res.data.data.accessToken });
  },

  register: async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    set({ user: res.data.data.user, isAuthenticated: true, token: res.data.data.accessToken });
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    set({ user: null, isAuthenticated: false, token: null });
  },

  checkAuth: async () => {
    try {
      const res = await authAPI.me();
      set({ user: res.data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
