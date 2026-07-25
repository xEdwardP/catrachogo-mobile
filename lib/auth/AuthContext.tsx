import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { apiClient } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/errors';
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
  type UserRole,
} from '@/lib/auth/storage';

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Extract<UserRole, 'passenger' | 'driver'>;
};

type LoginResponse = {
  token: string;
  user: { id: string; name: string; role: UserRole };
};

type RegisterResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
};

type AuthContextValue = {
  session: StoredSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((stored) => {
      if (cancelled) return;
      setSession(stored);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(input: LoginInput) {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', input);
      const stored: StoredSession = {
        token: data.token,
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
      };
      await saveSession(stored);
      setSession(stored);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function register(input: RegisterInput) {
    try {
      const { data } = await apiClient.post<RegisterResponse>('/auth/register', input);
      const stored: StoredSession = {
        token: data.token,
        id: data.id,
        name: data.name,
        role: data.role,
      };
      await saveSession(stored);
      setSession(stored);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function logout() {
    await clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
