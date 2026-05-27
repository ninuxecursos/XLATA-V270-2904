import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlockType = 'ip' | 'user' | 'email' | 'device';

interface SecurityBlock {
  id: string;
  identifier: string;
  blockType: BlockType;
  reason: string;
  blockedUntil: string | null;
  isPermanent: boolean;
  autoBlocked: boolean;
  attemptCount: number;
  createdBy: string | null;
  createdAt: string;
}

export function useSecurityBlocks() {
  const [blocks, setBlocks] = useState<SecurityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('security_blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedBlocks: SecurityBlock[] = (data || []).map(b => ({
        id: b.id,
        identifier: b.identifier,
        blockType: b.block_type as BlockType,
        reason: b.reason,
        blockedUntil: b.blocked_until,
        isPermanent: b.is_permanent,
        autoBlocked: b.auto_blocked,
        attemptCount: b.attempt_count,
        createdBy: b.created_by,
        createdAt: b.created_at
      }));

      setBlocks(mappedBlocks);
      setError(null);
    } catch (err) {
      console.error('Error fetching security blocks:', err);
      setError('Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = useCallback(async (
    identifier: string,
    blockType: BlockType,
    reason: string,
    isPermanent = false,
    blockedUntil?: Date
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('security_blocks')
        .insert({
          identifier,
          block_type: blockType,
          reason,
          is_permanent: isPermanent,
          blocked_until: isPermanent ? null : (blockedUntil?.toISOString() || null),
          auto_blocked: false
        });

      if (insertError) throw insertError;

      await fetchBlocks();
      return true;
    } catch (err) {
      console.error('Error creating security block:', err);
      return false;
    }
  }, [fetchBlocks]);

  const removeBlock = useCallback(async (blockId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('security_blocks')
        .delete()
        .eq('id', blockId);

      if (deleteError) throw deleteError;

      await fetchBlocks();
      return true;
    } catch (err) {
      console.error('Error removing security block:', err);
      return false;
    }
  }, [fetchBlocks]);

  const isBlocked = useCallback((identifier: string, blockType: BlockType): boolean => {
    const block = blocks.find(b => 
      b.identifier === identifier && 
      b.blockType === blockType
    );

    if (!block) return false;
    if (block.isPermanent) return true;
    if (!block.blockedUntil) return false;

    return new Date(block.blockedUntil) > new Date();
  }, [blocks]);

  const getActiveBlocks = useCallback((): SecurityBlock[] => {
    const now = new Date();
    return blocks.filter(b => 
      b.isPermanent || 
      (b.blockedUntil && new Date(b.blockedUntil) > now)
    );
  }, [blocks]);

  const getBlocksByType = useCallback((blockType: BlockType): SecurityBlock[] => {
    return blocks.filter(b => b.blockType === blockType);
  }, [blocks]);

  return {
    blocks,
    loading,
    error,
    refetch: fetchBlocks,
    createBlock,
    removeBlock,
    isBlocked,
    getActiveBlocks,
    getBlocksByType
  };
}
