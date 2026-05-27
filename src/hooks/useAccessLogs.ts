import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccessLog {
  id: string;
  userId: string | null;
  sessionId: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AccessLogsFilters {
  userId?: string;
  action?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAccessLogs(filters: AccessLogsFilters = {}) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_access_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      
      query = query.limit(filters.limit || 100);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const mappedLogs: AccessLog[] = (data || []).map(l => ({
        id: l.id,
        userId: l.user_id,
        sessionId: l.session_id,
        action: l.action,
        ipAddress: l.ip_address as string | null,
        userAgent: l.user_agent,
        deviceType: l.device_type,
        browser: l.browser,
        os: l.os,
        country: l.country,
        city: l.city,
        success: l.success,
        errorMessage: l.error_message,
        metadata: (l.metadata as Record<string, unknown>) || {},
        createdAt: l.created_at
      }));

      setLogs(mappedLogs);
      setTotalCount(count || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching access logs:', err);
      setError('Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  }, [filters.userId, filters.action, filters.success, filters.startDate, filters.endDate, filters.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logAccess = useCallback(async (
    action: string,
    success = true,
    errorMessage?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { error: insertError } = await supabase.rpc('log_access', {
        p_action: action,
        p_success: success,
        p_error_message: errorMessage || null,
        p_metadata: metadata ? JSON.stringify(metadata) : '{}'
      });

      if (insertError) {
        console.error('Error logging access:', insertError);
        return null;
      }

      return true;
    } catch (err) {
      console.error('Error in logAccess:', err);
      return null;
    }
  }, []);

  const getLoginAttempts = useCallback(async (userId: string, limit = 20) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_access_logs')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['login', 'login_failed'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return (data || []).map(l => ({
        id: l.id,
        action: l.action,
        success: l.success,
        ipAddress: l.ip_address,
        deviceType: l.device_type,
        browser: l.browser,
        os: l.os,
        country: l.country,
        city: l.city,
        createdAt: l.created_at
      }));
    } catch (err) {
      console.error('Error fetching login attempts:', err);
      return [];
    }
  }, []);

  const getUniqueIPs = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_access_logs')
        .select('ip_address, country, city, created_at')
        .eq('user_id', userId)
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get unique IPs with their last seen date
      const ipMap = new Map<string, { country: string | null; city: string | null; lastSeen: string }>();
      
      (data || []).forEach(l => {
        const ipAddr = l.ip_address as string | null;
        if (ipAddr && !ipMap.has(ipAddr)) {
          ipMap.set(ipAddr, {
            country: l.country,
            city: l.city,
            lastSeen: l.created_at
          });
        }
      });

      return Array.from(ipMap.entries()).map(([ip, info]) => ({
        ipAddress: ip,
        ...info
      }));
    } catch (err) {
      console.error('Error fetching unique IPs:', err);
      return [];
    }
  }, []);

  return {
    logs,
    loading,
    error,
    totalCount,
    refetch: fetchLogs,
    logAccess,
    getLoginAttempts,
    getUniqueIPs
  };
}
