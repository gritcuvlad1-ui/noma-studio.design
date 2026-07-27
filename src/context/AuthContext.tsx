import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // dev fallback login
  devLogin: (email: string, password: string) => boolean;
  hasSupabaseConfig: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  devLogin: () => false,
  hasSupabaseConfig: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

// Check if Supabase is properly configured
const hasSupabaseConfig = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, skip auth check and allow dev login
    if (!hasSupabaseConfig) {
      console.warn('Supabase not configured – running in dev/offline mode');
      setLoading(false);
      return;
    }

    // Get active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If Supabase connection fails, gracefully stop loading
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    // Also clear dev user
    setUser(null);
    setSession(null);
  };

  // Development fallback login (used when Supabase admin not set up)
  const devLogin = (email: string, password: string) => {
    if (email === 'admin@noma-studio.ro' && password === 'nicu10') {
      // Create a mock user object
      const mockUser: User = {
        id: 'dev-admin',
        app_metadata: {},
        user_metadata: {},
        aud: '',
        role: 'authenticated',
        email,
        phone: null,
        confirmed_at: null,
        last_sign_in_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        identities: [],
        factors: [],
      } as unknown as User;
      setUser(mockUser);
      setSession(null);
      setLoading(false);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, devLogin, hasSupabaseConfig }}>
      {children}
    </AuthContext.Provider>
  );
};
