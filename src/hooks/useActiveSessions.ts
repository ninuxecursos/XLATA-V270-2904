import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  lastActivity: string;
  createdAt: string;
  isActive: boolean;
}

export function useActiveSessions(userId?: string) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mappedSessions: ActiveSession[] = (data || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        sessionToken: s.session_token,
        ipAddress: s.ip_address as string | null,
        userAgent: s.user_agent,
        deviceType: s.device_type,
        browser: s.browser,
        os: s.os,
        country: s.country,
        city: s.city,
        lastActivity: s.last_activity,
        createdAt: s.created_at,
        isActive: s.is_active
      }));

      setSessions(mappedSessions);
      setError(null);
    } catch (err) {
      console.error('Error fetching active sessions:', err);
      setError('Erro ao carregar sessões ativas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      await fetchSessions();
      return true;
    } catch (err) {
      console.error('Error terminating session:', err);
      return false;
    }
  }, [fetchSessions]);

  const terminateAllUserSessions = useCallback(async (targetUserId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', targetUserId);

      if (updateError) throw updateError;

      await fetchSessions();
      return true;
    } catch (err) {
      console.error('Error terminating all user sessions:', err);
      return false;
    }
  }, [fetchSessions]);

  const getSessionCount = useCallback((): number => {
    return sessions.length;
  }, [sessions]);

  const getSessionsByDevice = useCallback((): Record<string, number> => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      const device = s.deviceType || 'unknown';
      counts[device] = (counts[device] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    terminateSession,
    terminateAllUserSessions,
    getSessionCount,
    getSessionsByDevice
  };
}
