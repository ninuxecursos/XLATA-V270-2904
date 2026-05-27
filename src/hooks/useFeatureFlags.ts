import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  enabledForUsers: string[];
  enabledPercentage: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      const mappedFlags: FeatureFlag[] = (data || []).map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        isEnabled: f.is_enabled,
        enabledForUsers: f.enabled_for_users || [],
        enabledPercentage: f.enabled_percentage,
        metadata: (f.metadata as Record<string, unknown>) || {},
        createdAt: f.created_at,
        updatedAt: f.updated_at
      }));

      setFlags(mappedFlags);
      setError(null);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError('Erro ao carregar feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    const flag = flags.find(f => f.name === featureName);
    if (!flag) return false;

    // Globally enabled
    if (flag.isEnabled) return true;

    // User-specific
    if (user && flag.enabledForUsers.includes(user.id)) return true;

    // Percentage rollout
    if (flag.enabledPercentage > 0 && user) {
      const hash = Math.abs(hashCode(user.id));
      return (hash % 100) < flag.enabledPercentage;
    }

    return false;
  }, [flags, user]);

  const toggleFlag = useCallback(async (flagId: string, enabled: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', flagId);

      if (updateError) throw updateError;

      await fetchFlags();
      return true;
    } catch (err) {
      console.error('Error toggling feature flag:', err);
      return false;
    }
  }, [fetchFlags]);

  const createFlag = useCallback(async (
    name: string,
    description?: string,
    isEnabled = false
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('feature_flags')
        .insert({
          name,
          description,
          is_enabled: isEnabled
        });

      if (insertError) throw insertError;

      await fetchFlags();
      return true;
    } catch (err) {
      console.error('Error creating feature flag:', err);
      return false;
    }
  }, [fetchFlags]);

  const updateFlagPercentage = useCallback(async (flagId: string, percentage: number) => {
    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ 
          enabled_percentage: Math.min(100, Math.max(0, percentage)),
          updated_at: new Date().toISOString() 
        })
        .eq('id', flagId);

      if (updateError) throw updateError;

      await fetchFlags();
      return true;
    } catch (err) {
      console.error('Error updating feature flag percentage:', err);
      return false;
    }
  }, [fetchFlags]);

  const deleteFlag = useCallback(async (flagId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', flagId);

      if (deleteError) throw deleteError;

      await fetchFlags();
      return true;
    } catch (err) {
      console.error('Error deleting feature flag:', err);
      return false;
    }
  }, [fetchFlags]);

  return {
    flags,
    loading,
    error,
    refetch: fetchFlags,
    isFeatureEnabled,
    toggleFlag,
    createFlag,
    updateFlagPercentage,
    deleteFlag
  };
}

// Simple hash function for percentage rollout
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
