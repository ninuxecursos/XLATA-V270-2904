
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      // Simply mark as initialized without creating default data
      setIsInitialized(true);
    }
  }, [user]);

  return { isInitialized };
};
