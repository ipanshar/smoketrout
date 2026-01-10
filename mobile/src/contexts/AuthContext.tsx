import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import api from '../lib/api';

interface Permission {
  name: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: Permission[];
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // Замените на ваш Web Client ID из Google Cloud Console
      offlineAccess: true,
    });
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const response = await api.get('/user');
        setUser(response.data);
      }
    } catch {
      await AsyncStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/login', {email, password});
    const {access_token, user: userData} = response.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const loginWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('Не удалось получить ID token от Google');
      }

      const response = await api.post('/auth/google/mobile', {id_token: idToken});
      const {access_token, user: userData} = response.data;
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      // Если пользователь отменил вход, не показываем ошибку
      if (error.code === 'SIGN_IN_CANCELLED') {
        return;
      }
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
  ) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    const {access_token, user: userData} = response.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
      // Также выходим из Google если были авторизованы через него
      try {
        await GoogleSignin.signOut();
      } catch {
        // Игнорируем ошибку если не были авторизованы через Google
      }
    } finally {
      await AsyncStorage.removeItem('token');
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
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        setUser,
        login,
        loginWithGoogle,
        register,
        logout,
        hasPermission,
        hasModuleAccess,
      }}>
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
