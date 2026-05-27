import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useShopUserManagement() {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ 
      userId, 
      status 
    }: { 
      userId: string; 
      status: 'active' | 'inactive';
    }) => {
      const { data, error } = await supabase
        .from('shop_users')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
    }
  });

  const banUser = useMutation({
    mutationFn: async ({ 
      userId, 
      reason 
    }: { 
      userId: string; 
      reason: string;
    }) => {
      // Update user status to banned
      const { error: userError } = await supabase
        .from('shop_users')
        .update({ status: 'banned' })
        .eq('id', userId);

      if (userError) throw userError;

      // Create security block record
      const { error: blockError } = await supabase
        .from('security_blocks')
        .insert({
          identifier: userId,
          block_type: 'user',
          reason: reason,
          is_permanent: true,
          auto_blocked: false
        });

      if (blockError) throw blockError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
      queryClient.invalidateQueries({ queryKey: ['security-blocks'] });
    }
  });

  const blockUser = useMutation({
    mutationFn: async ({ 
      userId, 
      reason,
      durationHours 
    }: { 
      userId: string; 
      reason: string;
      durationHours: number;
    }) => {
      const blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + durationHours);

      // Update user status
      const { error: userError } = await supabase
        .from('shop_users')
        .update({ status: 'blocked' })
        .eq('id', userId);

      if (userError) throw userError;

      // Create security block record
      const { error: blockError } = await supabase
        .from('security_blocks')
        .insert({
          identifier: userId,
          block_type: 'user',
          reason: reason,
          is_permanent: false,
          blocked_until: blockedUntil.toISOString(),
          auto_blocked: false
        });

      if (blockError) throw blockError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
      queryClient.invalidateQueries({ queryKey: ['security-blocks'] });
    }
  });

  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      // Update user status back to active
      const { error: userError } = await supabase
        .from('shop_users')
        .update({ status: 'active' })
        .eq('id', userId);

      if (userError) throw userError;

      // Remove security block
      const { error: blockError } = await supabase
        .from('security_blocks')
        .delete()
        .eq('identifier', userId)
        .eq('block_type', 'user');

      if (blockError) throw blockError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
      queryClient.invalidateQueries({ queryKey: ['security-blocks'] });
    }
  });

  const resetPassword = useMutation({
    mutationFn: async (userId: string) => {
      // Get user email
      const { data: user, error: userError } = await supabase
        .from('shop_users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // In a real implementation, this would send an email
      // For now, we'll just log it
      console.log(`Password reset requested for: ${user.email}`);
      
      return { success: true, email: user.email };
    }
  });

  const verifyEmail = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('shop_users')
        .update({ email_verified: true })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-users'] });
    }
  });

  return {
    updateStatus,
    banUser,
    blockUser,
    unblockUser,
    resetPassword,
    verifyEmail
  };
}
