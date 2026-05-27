import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: string;
}

interface ShopAuthContextType {
  shopUser: ShopUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<boolean>;
  logout: () => void;
}

const ShopAuthContext = createContext<ShopAuthContextType | undefined>(undefined);

const SHOP_USER_KEY = 'xlata_shop_user';

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  const [shopUser, setShopUser] = useState<ShopUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recuperar sessão do localStorage
    const stored = localStorage.getItem(SHOP_USER_KEY);
    if (stored) {
      try {
        setShopUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(SHOP_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('shop_user_authenticate', {
        p_email: email,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        return false;
      }

      const user: ShopUser = {
        id: data[0].user_id,
        email: data[0].user_email,
        name: data[0].user_name,
        phone: data[0].user_phone || undefined,
        status: data[0].user_status
      };

      setShopUser(user);
      localStorage.setItem(SHOP_USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Shop login error:', error);
      return false;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    phone?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('shop_user_register', {
        p_email: email,
        p_password: password,
        p_name: name,
        p_phone: phone || null
      });

      if (error) {
        console.error('Register error:', error);
        return false;
      }

      // Fazer login automático após registro
      return await login(email, password);
    } catch (error) {
      console.error('Shop register error:', error);
      return false;
    }
  };

  const logout = () => {
    setShopUser(null);
    localStorage.removeItem(SHOP_USER_KEY);
  };

  return (
    <ShopAuthContext.Provider 
      value={{ 
        shopUser, 
        isLoading, 
        isAuthenticated: !!shopUser,
        login, 
        register, 
        logout 
      }}
    >
      {children}
    </ShopAuthContext.Provider>
  );
}

export function useShopAuth() {
  const context = useContext(ShopAuthContext);
  if (context === undefined) {
    throw new Error('useShopAuth must be used within a ShopAuthProvider');
  }
  return context;
}
