import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockBackend } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockBackend) {
      // Mock user for UI testing
      setUser({ id: '1', email: 'mockuser@example.com', user_metadata: { name: 'Mock User' } });
      setLoading(false);
      return;
    }

    // Real Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    if (isMockBackend) return { data: { user: { email } }, error: null };
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password) => {
    if (isMockBackend) return { data: { user: { email } }, error: null };
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    if (isMockBackend) { setUser(null); return { error: null }; }
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
