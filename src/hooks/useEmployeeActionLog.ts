import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmployee } from '@/contexts/EmployeeContext';

export function useEmployeeActionLog() {
  const { user } = useAuth();
  const { isEmployee, ownerUserId, isOwner } = useEmployee();

  const logAction = useCallback(async (
    actionType: string,
    actionDetail?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;

    const ownerIdForLog = isEmployee ? ownerUserId : user.id;
    if (!ownerIdForLog) return;

    try {
      await supabase.from('employee_action_logs').insert({
        owner_user_id: ownerIdForLog,
        employee_user_id: user.id,
        employee_name: user.user_metadata?.name || user.email || 'Desconhecido',
        action_type: actionType,
        action_detail: actionDetail || null,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || {},
      });
    } catch (err) {
      // Silent - logging should never break the app
      console.warn('Failed to log employee action:', err);
    }
  }, [user, isEmployee, ownerUserId]);

  return { logAction };
}
