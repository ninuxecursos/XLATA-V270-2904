import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScaleConfig, ScaleDriver, ScaleReading } from '@/lib/scale/types';
import { createDriver } from '@/lib/scale/scaleAdapter';

interface UseScaleResult {
  config: ScaleConfig | null;
  loading: boolean;
  connected: boolean;
  weight: number | null;
  lastReading: ScaleReading | null;
  error: string | null;
  connect: (overrideConfig?: ScaleConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  requestWeight: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useScale(autoLoadDefault = true): UseScaleResult {
  const { user } = useAuth();
  const [config, setConfig] = useState<ScaleConfig | null>(null);
  const [loading, setLoading] = useState(autoLoadDefault);
  const [connected, setConnected] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [lastReading, setLastReading] = useState<ScaleReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const driverRef = useRef<ScaleDriver | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_scale_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle();
    if (data) setConfig(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (autoLoadDefault) reload(); }, [reload, autoLoadDefault]);

  const connect = useCallback(async (overrideConfig?: ScaleConfig) => {
    setError(null);
    const cfg = overrideConfig || config;
    if (!cfg) { setError('Nenhuma configuração de balança disponível.'); return; }
    try {
      if (driverRef.current) await driverRef.current.disconnect().catch(() => {});
      const d = createDriver(cfg);
      d.onReading((r) => { setWeight(r.weight); setLastReading(r); });
      d.onError((e) => setError(e.message));
      await d.connect();
      driverRef.current = d;
      setConnected(true);
    } catch (e: any) {
      setError(e.message || 'Erro ao conectar.');
      setConnected(false);
    }
  }, [config]);

  const disconnect = useCallback(async () => {
    if (driverRef.current) {
      await driverRef.current.disconnect().catch(() => {});
      driverRef.current = null;
    }
    setConnected(false);
  }, []);

  const requestWeight = useCallback(async () => {
    if (driverRef.current?.requestWeight) {
      await driverRef.current.requestWeight();
    }
  }, []);

  useEffect(() => () => { driverRef.current?.disconnect().catch(() => {}); }, []);

  return { config, loading, connected, weight, lastReading, error, connect, disconnect, requestWeight, reload };
}
