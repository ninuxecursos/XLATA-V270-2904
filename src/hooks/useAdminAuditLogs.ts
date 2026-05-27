import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  actionType: string;
  targetTable: string | null;
  targetRecordId: string | null;
  targetUserId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsFilters {
  adminId?: string;
  actionType?: string;
  targetUserId?: string;
  targetTable?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAdminAuditLogs(filters: AuditLogsFilters = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.targetUserId) {
        query = query.eq('target_user_id', filters.targetUserId);
      }
      if (filters.targetTable) {
        query = query.eq('target_table', filters.targetTable);
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

      const mappedLogs: AuditLog[] = (data || []).map(l => ({
        id: l.id,
        adminId: l.admin_id,
        adminEmail: l.admin_email,
        actionType: l.action_type,
        targetTable: l.target_table,
        targetRecordId: l.target_record_id,
        targetUserId: l.target_user_id,
        oldValue: l.old_value as Record<string, unknown> | null,
        newValue: l.new_value as Record<string, unknown> | null,
        description: l.description,
        ipAddress: l.ip_address as string | null,
        userAgent: l.user_agent,
        createdAt: l.created_at
      }));

      setLogs(mappedLogs);
      setTotalCount(count || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [filters.adminId, filters.actionType, filters.targetUserId, filters.targetTable, filters.startDate, filters.endDate, filters.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionTypes = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_audit_logs')
        .select('action_type')
        .limit(1000);

      if (fetchError) throw fetchError;

      const types = new Set((data || []).map(l => l.action_type));
      return Array.from(types).sort();
    } catch (err) {
      console.error('Error fetching action types:', err);
      return [];
    }
  }, []);

  const getUserActivityTimeline = useCallback(async (userId: string, limit = 50) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return (data || []).map(l => ({
        id: l.id,
        adminEmail: l.admin_email,
        actionType: l.action_type,
        description: l.description,
        createdAt: l.created_at
      }));
    } catch (err) {
      console.error('Error fetching user activity timeline:', err);
      return [];
    }
  }, []);

  return {
    logs,
    loading,
    error,
    totalCount,
    refetch: fetchLogs,
    getActionTypes,
    getUserActivityTimeline
  };
}
