import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const EMPLOYEE_SLOT_DEFAULT_PRICE = 79.90;

export const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function useEmployeeSlotPrice() {
  const [price, setPrice] = useState<number>(EMPLOYEE_SLOT_DEFAULT_PRICE);
  const [loading, setLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('admin_system_config')
        .select('employee_slot_price')
        .limit(1)
        .maybeSingle();
      const v = (data as any)?.employee_slot_price;
      if (v != null) setPrice(Number(v));
    } catch (e) {
      console.error('useEmployeeSlotPrice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrice(); }, [fetchPrice]);

  return { price, formatted: formatBRL(price), loading, refetch: fetchPrice };
}
