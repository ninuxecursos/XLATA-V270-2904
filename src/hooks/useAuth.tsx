
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearUserSessionData } from '../utils/supabaseStorage';
import { validateSupabaseConnection, clearAllLocalData } from '../utils/connectionValidator';
import { toast } from '@/hooks/use-toast';
import { detectDeviceType, detectBrowser, detectOS, getClientIPWithGeo, generateSessionToken } from '../utils/deviceDetection';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Log access event to admin_access_logs with geolocation
const logAccessEvent = async (userId: string, action: string, success: boolean, errorMessage?: string) => {
  try {
    const geoData = await getClientIPWithGeo();
    
    await supabase.from('admin_access_logs').insert({
      user_id: userId,
      action,
      ip_address: geoData.ip,
      user_agent: navigator.userAgent,
      device_type: detectDeviceType(),
      browser: detectBrowser(),
      os: detectOS(),
      country: geoData.country || null,
      city: geoData.city || null,
      success,
      error_message: errorMessage || null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging access event:', error);
  }
};

// Create or update active session with geolocation
const upsertActiveSession = async (userId: string, sessionToken: string) => {
  try {
    const geoData = await getClientIPWithGeo();
    
    // First try to deactivate any existing sessions for this user
    await supabase
      .from('active_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
    
    // Create new session with geolocation
    await supabase.from('active_sessions').insert({
      user_id: userId,
      session_token: sessionToken,
      ip_address: geoData.ip,
      user_agent: navigator.userAgent,
      device_type: detectDeviceType(),
      browser: detectBrowser(),
      os: detectOS(),
      country: geoData.country || null,
      city: geoData.city || null,
      is_active: true,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error upserting session:', error);
  }
};

// Mark session as inactive on logout
const deactivateSession = async (userId: string) => {
  try {
    await supabase
      .from('active_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
  } catch (error) {
    console.error('Error deactivating session:', error);
  }
};

// SEGURANÇA: Evento customizado para notificar limpeza de cache em memória
export const dispatchCacheClearEvent = () => {
  window.dispatchEvent(new CustomEvent('authCacheClear'));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // CRITICAL: Clear session data when user logs out or session expires
        if (event === 'SIGNED_OUT' || !session) {
          clearUserSessionData();
          clearAllLocalData();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          clearAllLocalData();
          setSession(null);
          setUser(null);
        } else if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
      } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        clearAllLocalData();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // VALIDAÇÃO: Supabase deve estar funcionando
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        const error = connectionStatus.error || 'Supabase inacessível';
        console.error('❌ Cadastro BLOQUEADO:', error);
        return { data: null, error: { message: error } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      return { data, error };

    } catch (networkError: any) {
      console.error('❌ Erro no cadastro:', networkError);
      clearAllLocalData();
      return { data: null, error: { message: 'Erro de conectividade' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // VALIDAÇÃO: Supabase deve estar funcionando
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        const error = connectionStatus.error || 'Supabase inacessível';
        console.error('❌ Login BLOQUEADO:', error);
        return { data: null, error: { message: error } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Log the login attempt
      if (data?.user) {
        // Successful login
        await logAccessEvent(data.user.id, 'login', true);
        await upsertActiveSession(data.user.id, generateSessionToken());
      }

      return { data, error };

    } catch (networkError: any) {
      console.error('❌ Erro no login:', networkError);
      clearAllLocalData();
      return { data: null, error: { message: 'Erro de conectividade' } };
    }
  };

  const signOut = async () => {
    try {
      // Log the logout
      if (user?.id) {
        await logAccessEvent(user.id, 'logout', true);
        await deactivateSession(user.id);
      }
      
      // Limpa dados locais
      clearUserSessionData();
      clearAllLocalData();
      
      // SEGURANÇA: Dispara evento para limpar caches em memória (roleCache, etc)
      dispatchCacheClearEvent();
      
      // Tenta logout no servidor
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error('Erro durante logout:', error);
      // Mesmo com erro, SEMPRE limpa dados locais
      clearUserSessionData();
      clearAllLocalData();
      dispatchCacheClearEvent();
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
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
