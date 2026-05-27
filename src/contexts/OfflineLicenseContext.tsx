/**
 * OfflineLicenseContext
 *
 * Disponível apenas no build offline (VITE_OFFLINE_BUILD=true).
 * Carrega a licença local via /api/license e expõe o plano (pro|essencial)
 * para o restante da aplicação (useFeatureAccess, FeatureGuard, etc).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

export type OfflinePlan = 'pro' | 'essencial';

export interface OfflineLicense {
  plan: OfflinePlan;
  client_name: string;
  expires_at: string | null;
  valid: boolean;
  license_key?: string;
}

interface Ctx {
  license: OfflineLicense | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OfflineLicenseContext = createContext<Ctx>({
  license: null,
  loading: true,
  refresh: async () => {},
});

export function useOfflineLicense() {
  return useContext(OfflineLicenseContext);
}

function normalizePlan(raw: any): OfflinePlan {
  const v = String(raw || '').toLowerCase().trim();
  if (v === 'pro' || v === 'controle') return 'pro';
  return 'essencial';
}

export const OfflineLicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<OfflineLicense | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await fetch('/api/license', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao consultar licença');
      const data = await r.json();
      setLicense({
        plan: normalizePlan(data.plan),
        client_name: data.client_name || 'Cliente',
        expires_at: data.expires_at || null,
        valid: !!data.valid,
        license_key: data.license_key,
      });
    } catch (e) {
      console.error('License error:', e);
      setLicense(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <OfflineLicenseContext.Provider value={{ license, loading, refresh }}>
      {children}
    </OfflineLicenseContext.Provider>
  );
};
