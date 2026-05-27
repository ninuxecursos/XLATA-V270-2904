import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OwnerSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
}

interface EmployeeContextType {
  isEmployee: boolean;
  isOwner: boolean;
  ownerUserId: string | null;
  employeeId: string | null;
  employeeRole: string | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  // Novos campos para herança de assinatura
  ownerSubscription: OwnerSubscription | null;
  hasActiveSubscription: boolean;
  isSubscriptionFromOwner: boolean;
  effectiveUserId: string | null;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerSubscription, setOwnerSubscription] = useState<OwnerSubscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubscriptionFromOwner, setIsSubscriptionFromOwner] = useState(false);

  const checkUserRole = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setIsEmployee(false);
      setIsOwner(true);
      setOwnerUserId(null);
      setEmployeeId(null);
      setEmployeeRole(null);
      setPermissions([]);
      setOwnerSubscription(null);
      setHasActiveSubscription(false);
      setIsSubscriptionFromOwner(false);
      return;
    }

    try {
      // Check if user is an employee of any depot
      const { data: employeeData, error: employeeError } = await supabase
        .from('depot_employees')
        .select('id, owner_user_id, role, is_active')
        .eq('employee_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (employeeError) {
        console.error('Error checking employee status:', employeeError);
        // Default to owner if error
        setIsEmployee(false);
        setIsOwner(true);
        setOwnerUserId(user.id);
        setLoading(false);
        return;
      }

      if (employeeData) {
        // User is an employee
        setIsEmployee(true);
        setIsOwner(false);
        setOwnerUserId(employeeData.owner_user_id);
        setEmployeeId(employeeData.id);
        setEmployeeRole(employeeData.role);
        setIsSubscriptionFromOwner(true);

        // Fetch employee permissions
        const { data: permData, error: permError } = await supabase
          .from('employee_permissions')
          .select('permission')
          .eq('employee_id', employeeData.id);

        if (permError) {
          console.error('Error fetching permissions:', permError);
        } else {
          setPermissions(permData?.map(p => p.permission) || []);
        }

        // Fetch owner's subscription (funcionário herda assinatura do dono)
        const { data: ownerSubData, error: ownerSubError } = await supabase
          .from('user_subscriptions')
          .select('id, user_id, plan_type, is_active, expires_at')
          .eq('user_id', employeeData.owner_user_id)
          .eq('is_active', true)
          .order('expires_at', { ascending: false })
          .maybeSingle();

        if (!ownerSubError && ownerSubData) {
          setOwnerSubscription(ownerSubData);
          const isActive = ownerSubData.is_active && new Date(ownerSubData.expires_at) > new Date();
          setHasActiveSubscription(isActive);
          console.log('✅ Funcionário herdou assinatura do dono:', { ownerSubData, isActive });
        } else {
          setOwnerSubscription(null);
          setHasActiveSubscription(false);
          console.log('⚠️ Dono não tem assinatura ativa');
        }

        // Update last login
        await supabase
          .from('depot_employees')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', employeeData.id);

        // Mark first login as completed for employees (they don't need trial modal)
        await supabase
          .from('profiles')
          .update({ first_login_completed: true })
          .eq('id', user.id);

      } else {
        // User is a depot owner
        setIsEmployee(false);
        setIsOwner(true);
        setOwnerUserId(user.id);
        setEmployeeId(null);
        setEmployeeRole(null);
        setPermissions([]);
        setOwnerSubscription(null);
        setIsSubscriptionFromOwner(false);

        // Check owner's own subscription
        const { data: ownSubData, error: ownSubError } = await supabase
          .from('user_subscriptions')
          .select('id, user_id, plan_type, is_active, expires_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('expires_at', { ascending: false })
          .maybeSingle();

        if (!ownSubError && ownSubData) {
          const isActive = ownSubData.is_active && new Date(ownSubData.expires_at) > new Date();
          setHasActiveSubscription(isActive);
        } else {
          setHasActiveSubscription(false);
        }
      }
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      // Default to owner if error
      setIsEmployee(false);
      setIsOwner(true);
      setOwnerUserId(user?.id || null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  const hasPermission = useCallback((permission: string): boolean => {
    // Owners have all permissions
    if (isOwner) return true;
    return permissions.includes(permission);
  }, [isOwner, permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    // Owners have all permissions
    if (isOwner) return true;
    return perms.some(p => permissions.includes(p));
  }, [isOwner, permissions]);

  const refreshPermissions = useCallback(async () => {
    await checkUserRole();
  }, [checkUserRole]);

  // Effective user ID for data queries (owner's ID if employee)
  const effectiveUserId = isEmployee ? ownerUserId : user?.id || null;

  const value: EmployeeContextType = {
    isEmployee,
    isOwner,
    ownerUserId,
    employeeId,
    employeeRole,
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    refreshPermissions,
    ownerSubscription,
    hasActiveSubscription,
    isSubscriptionFromOwner,
    effectiveUserId,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee(): EmployeeContextType {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}
