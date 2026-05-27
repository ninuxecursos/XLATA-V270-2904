import { useCallback, useEffect, useState } from 'react';
import { useScale } from './useScale';

const SESSION_OVERRIDE_KEY = 'pdv_scale_manual_override';

/**
 * Combina o modo configurado da balança default (manual/automatic) com:
 * - Auto-conexão quando automatic
 * - Override temporário "usar teclado manual nesta venda" (sessão)
 */
export function usePdvScaleMode() {
  const scale = useScale(true);
  const [overrideManual, setOverrideManualState] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_OVERRIDE_KEY) === '1'; } catch { return false; }
  });

  const setOverrideManual = useCallback((v: boolean) => {
    setOverrideManualState(v);
    try { sessionStorage.setItem(SESSION_OVERRIDE_KEY, v ? '1' : '0'); } catch {}
  }, []);

  const configuredMode: 'manual' | 'automatic' =
    (scale.config?.pdv_input_mode as any) === 'automatic' ? 'automatic' : 'manual';
  const effectiveMode: 'manual' | 'automatic' =
    overrideManual ? 'manual' : configuredMode;

  // Auto-conecta quando o usuário ativa modo automático
  useEffect(() => {
    if (effectiveMode === 'automatic' && scale.config && !scale.connected && !scale.error) {
      scale.connect().catch(() => {});
    }
    if (effectiveMode === 'manual' && scale.connected) {
      scale.disconnect().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMode, scale.config?.id]);

  return {
    mode: effectiveMode,
    configuredMode,
    overrideManual,
    setOverrideManual,
    scale,
  };
}
