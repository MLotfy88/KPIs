import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/api';
import { User } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { MODE } from '@/config';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (MODE === 'supabase') {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setIsLoading(false);
        }
      };

      getSession();

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      // In local mode, we don't need to check for a session on load.
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          email: supabaseUser.email!,
          name: data.name,
          role: data.role,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (MODE === 'local') {
      // Password is not checked in local mode for simplicity
      try {
        const foundUser = await getUserByEmail(email);
        if (foundUser) {
          setUser(foundUser);
          return { success: true };
        } else {
          return { success: false, error: 'المستخدم غير موجود في قاعدة البيانات المحلية' };
        }
      } catch (error) {
        return { success: false, error: 'فشل الاتصال بقاعدة البيانات المحلية' };
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }
      return { success: true };
    }
  };

  const logout = async () => {
    if (MODE === 'supabase') {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
