import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AdminViewContextType {
  // Admin view state
  isAdminView: boolean;
  adminViewingUser: string | null;
  adminViewingUserName: string | null;
  isCurrentUserAdmin: boolean;
  
  // Actions
  setAdminView: (userId: string, userName: string) => void;
  clearAdminView: () => void;
  
  // Helper to get the effective user ID for data queries
  getEffectiveUserId: () => string | null;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

interface AdminViewProviderProps {
  children: ReactNode;
  currentUserId?: string;
}

export function AdminViewProvider({ children, currentUserId }: AdminViewProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [adminViewingUser, setAdminViewingUser] = useState<string | null>(null);
  const [adminViewingUserName, setAdminViewingUserName] = useState<string | null>(null);

  // Check if current user is admin on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data } = await supabase.rpc('is_admin');
        setIsCurrentUserAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsCurrentUserAdmin(false);
      }
    };
    checkAdmin();
  }, [currentUserId]);

  // Initialize from location state (for navigation persistence)
  useEffect(() => {
    if (location.state?.adminViewingUser) {
      setAdminViewingUser(location.state.adminViewingUser);
      setAdminViewingUserName(location.state.adminViewingUserName || null);
    }
  }, [location.state]);

  const setAdminView = (userId: string, userName: string) => {
    setAdminViewingUser(userId);
    setAdminViewingUserName(userName);
    
    // Navigate to current path with updated state
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        adminViewingUser: userId,
        adminViewingUserName: userName
      }
    });
  };

  const clearAdminView = () => {
    setAdminViewingUser(null);
    setAdminViewingUserName(null);
    
    // Navigate to current path without admin state
    navigate(location.pathname + location.search, {
      replace: true,
      state: {}
    });
  };

  const getEffectiveUserId = (): string | null => {
    // If admin is viewing another user, return that user's ID
    // Otherwise return the current user's ID
    return adminViewingUser || currentUserId || null;
  };

  const value: AdminViewContextType = {
    isAdminView: !!adminViewingUser,
    adminViewingUser,
    adminViewingUserName,
    isCurrentUserAdmin,
    setAdminView,
    clearAdminView,
    getEffectiveUserId
  };

  return (
    <AdminViewContext.Provider value={value}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (context === undefined) {
    throw new Error('useAdminView must be used within an AdminViewProvider');
  }
  return context;
}

// Optional hook that returns null if used outside provider (for conditional usage)
export function useAdminViewOptional() {
  return useContext(AdminViewContext);
}
