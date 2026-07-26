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

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  profilePhotoUrl: string | null;
  createdAt: string;
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
  profile: Profile | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  completePhone: (phone: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateProfilePhoto: (profilePhotoUrl: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>('/auth/profile');
  return data;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      if (!stored) {
        setIsLoading(false);
        return;
      }
      setSession(stored);
      try {
        const fetchedProfile = await fetchProfile();
        if (!cancelled) setProfile(fetchedProfile);
      } catch {
        if (!cancelled) {
          await clearSession();
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
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
      const fetchedProfile = await fetchProfile();
      setSession(stored);
      setProfile(fetchedProfile);
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
      const fetchedProfile = await fetchProfile();
      setSession(stored);
      setProfile(fetchedProfile);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function completePhone(phone: string) {
    try {
      const { data } = await apiClient.patch<{ phone: string }>('/auth/phone', { phone });
      setProfile((prev) => (prev ? { ...prev, phone: data.phone } : prev));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function updateName(name: string) {
    try {
      const { data } = await apiClient.patch<{ name: string }>('/auth/name', { name });
      setProfile((prev) => (prev ? { ...prev, name: data.name } : prev));
      if (session) {
        const updatedSession = { ...session, name: data.name };
        await saveSession(updatedSession);
        setSession(updatedSession);
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function updateProfilePhoto(profilePhotoUrl: string) {
    try {
      const { data } = await apiClient.patch<{ profilePhotoUrl: string | null }>(
        '/auth/profile-photo',
        { profilePhotoUrl },
      );
      setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: data.profilePhotoUrl } : prev));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function logout() {
    await clearSession();
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        login,
        register,
        completePhone,
        updateName,
        updateProfilePhoto,
        logout,
      }}
    >
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
