import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogParams {
  actionType: string;
  targetTable?: string;
  targetRecordId?: string;
  targetUserId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  description?: string;
}

export function useAuditLog() {
  const logAction = useCallback(async ({
    actionType,
    targetTable,
    targetRecordId,
    targetUserId,
    oldValue,
    newValue,
    description
  }: AuditLogParams): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('log_admin_action', {
        p_action_type: actionType,
        p_target_table: targetTable || null,
        p_target_record_id: targetRecordId || null,
        p_target_user_id: targetUserId || null,
        p_old_value: oldValue ? JSON.stringify(oldValue) : null,
        p_new_value: newValue ? JSON.stringify(newValue) : null,
        p_description: description || null
      });

      if (error) {
        console.error('Error logging admin action:', error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('Error in logAction:', err);
      return null;
    }
  }, []);

  const logUserAction = useCallback(async (
    action: string,
    userId: string,
    description: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>
  ) => {
    return logAction({
      actionType: action,
      targetTable: 'profiles',
      targetUserId: userId,
      oldValue,
      newValue,
      description
    });
  }, [logAction]);

  const logSubscriptionChange = useCallback(async (
    userId: string,
    oldPlan: string,
    newPlan: string,
    description?: string
  ) => {
    return logAction({
      actionType: 'subscription_change',
      targetTable: 'user_subscriptions',
      targetUserId: userId,
      oldValue: { plan: oldPlan },
      newValue: { plan: newPlan },
      description: description || `Plano alterado de ${oldPlan} para ${newPlan}`
    });
  }, [logAction]);

  const logContentChange = useCallback(async (
    contentType: string,
    contentId: string,
    action: 'create' | 'update' | 'delete' | 'publish',
    description?: string
  ) => {
    return logAction({
      actionType: `content_${action}`,
      targetTable: contentType,
      targetRecordId: contentId,
      description
    });
  }, [logAction]);

  const logSecurityAction = useCallback(async (
    action: string,
    targetId: string,
    description: string
  ) => {
    return logAction({
      actionType: `security_${action}`,
      targetRecordId: targetId,
      description
    });
  }, [logAction]);

  const logSystemChange = useCallback(async (
    setting: string,
    oldValue: unknown,
    newValue: unknown
  ) => {
    return logAction({
      actionType: 'system_config',
      targetTable: 'admin_system_config',
      oldValue: { [setting]: oldValue },
      newValue: { [setting]: newValue },
      description: `Configuração ${setting} alterada`
    });
  }, [logAction]);

  return {
    logAction,
    logUserAction,
    logSubscriptionChange,
    logContentChange,
    logSecurityAction,
    logSystemChange
  };
}
