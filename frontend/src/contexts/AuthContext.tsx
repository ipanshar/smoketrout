import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: {
    id: number;
    name: string;
    display_name: string;
    permissions: Array<{ name: string; module: string }>;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('/user');
          setUser(response.data);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await api.post('/register', { name, email, password, password_confirmation });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    if (user.role.name === 'admin') return true;
    return user.role.permissions.some(p => p.name === permission);
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!user?.role) return false;
    if (user.role.name === 'admin') return true;
    return user.role.permissions.some(p => p.module === module);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, hasPermission, hasModuleAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
