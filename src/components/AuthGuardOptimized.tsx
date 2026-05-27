// FASE 2-3: AUTHGUARD ULTRA-OTIMIZADO
// Componente com cache inteligente, verificação assíncrona e performance máxima

import React, { memo, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionOptimized } from '@/contexts/SubscriptionOptimizedContext';
import { createUltraMemoize, scheduleUltraTask } from '@/utils/ultraPerformanceUtils';
import { createLogger } from '@/utils/performanceUtils';

const logger = createLogger('[AuthGuardOptimized]');

interface AuthGuardOptimizedProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

// Cache de verificações para evitar re-computação
const createVerificationCache = () => {
  const cache = new Map<string, { result: boolean; timestamp: number }>();
  const TTL = 60000; // 1 minuto de cache

  return {
    get: (key: string): boolean | null => {
      const entry = cache.get(key);
      if (!entry || Date.now() - entry.timestamp > TTL) {
        cache.delete(key);
        return null;
      }
      return entry.result;
    },
    set: (key: string, result: boolean): void => {
      cache.set(key, { result, timestamp: Date.now() });
    },
    clear: (): void => {
      cache.clear();
    }
  };
};

const verificationCache = createVerificationCache();

// Limpar cache quando assinatura for removida
if (typeof window !== 'undefined') {
  window.addEventListener('subscriptionCleared', () => {
    verificationCache.clear();
  });
}

// Função memoizada para verificação de autorização
const createAuthorizationCheck = createUltraMemoize((
  isAuthenticated: boolean,
  hasSubscription: boolean,
  requireSubscription: boolean,
  userId?: string
): { authorized: boolean; reason: string } => {
  
  const cacheKey = `auth_${userId}_${isAuthenticated}_${hasSubscription}_${requireSubscription}`;
  
  // Verificar cache primeiro
  const cached = verificationCache.get(cacheKey);
  if (cached !== null) {
    logger.log('Usando resultado do cache de autorização');
    return { authorized: cached, reason: cached ? 'authorized_cached' : 'unauthorized_cached' };
  }

  let authorized = false;
  let reason = '';

  if (!isAuthenticated) {
    reason = 'user_not_authenticated';
  } else if (requireSubscription && !hasSubscription) {
    reason = 'subscription_required';
  } else {
    authorized = true;
    reason = 'authorized';
  }

  // Cache o resultado
  verificationCache.set(cacheKey, authorized);
  
  logger.log('Verificação de autorização:', { authorized, reason, userId });
  
  return { authorized, reason };
});

const AuthGuardOptimizedComponent: React.FC<AuthGuardOptimizedProps> = ({
  children,
  requireSubscription = false,
  fallback = null,
  onUnauthorized
}) => {
  const { user, loading: authLoading } = useAuth();
  const { 
    isActive: hasActiveSubscription, 
    loading: subscriptionLoading,
    checkSubscriptionStatus 
  } = useSubscriptionOptimized();

  // Verificação otimizada com memoização
  const authorizationResult = useMemo(() => {
    // Se ainda está carregando, não fazer verificação
    if (authLoading || (requireSubscription && subscriptionLoading)) {
      return { authorized: false, reason: 'loading', loading: true };
    }

    const result = createAuthorizationCheck(
      !!user,
      hasActiveSubscription,
      requireSubscription,
      user?.id
    );

    return { ...result, loading: false };
  }, [user, hasActiveSubscription, requireSubscription, authLoading, subscriptionLoading]);

  // Callback otimizado para ações não autorizadas
  const handleUnauthorized = useCallback(() => {
    if (onUnauthorized) {
      scheduleUltraTask(() => {
        logger.log('Executando callback de não autorização');
        onUnauthorized();
      }, 'high');
    }
  }, [onUnauthorized]);

  // Efeito colateral para callback de não autorização
  React.useEffect(() => {
    if (!authorizationResult.loading && !authorizationResult.authorized) {
      handleUnauthorized();
    }
  }, [authorizationResult, handleUnauthorized]);

  // Loading state otimizado
  if (authorizationResult.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Estado não autorizado
  if (!authorizationResult.authorized) {
    logger.warn('Acesso negado:', authorizationResult.reason);
    
    if (fallback) {
      return <>{fallback}</>;
    }

    // UI padrão para diferentes tipos de não autorização
    switch (authorizationResult.reason) {
      case 'user_not_authenticated':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Você precisa estar logado para acessar esta área.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.href = '/login'}
            >
              Fazer Login
            </button>
          </div>
        );

      case 'subscription_required':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-xl font-semibold mb-4">Assinatura Necessária</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Você precisa de uma assinatura ativa para acessar esta funcionalidade.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.href = '/planos'}
            >
              Ver Planos
            </button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-xl font-semibold mb-4">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </div>
        );
    }
  }

  // Autorizado - renderizar children
  logger.log('Acesso autorizado, renderizando conteúdo protegido');
  return <>{children}</>;
};

// Memo otimizado com comparação customizada
export const AuthGuardOptimized = memo(AuthGuardOptimizedComponent, (prevProps, nextProps) => {
  // Comparação otimizada das props
  return (
    prevProps.requireSubscription === nextProps.requireSubscription &&
    prevProps.fallback === nextProps.fallback &&
    prevProps.onUnauthorized === nextProps.onUnauthorized &&
    React.isValidElement(prevProps.children) && 
    React.isValidElement(nextProps.children) &&
    prevProps.children.type === nextProps.children.type
  );
});

AuthGuardOptimized.displayName = 'AuthGuardOptimized';

// Hook complementar para verificações programáticas
export const useAuthGuardOptimized = (requireSubscription: boolean = false) => {
  const { user, loading: authLoading } = useAuth();
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscriptionOptimized();

  const isAuthorized = useMemo(() => {
    if (authLoading || (requireSubscription && subscriptionLoading)) {
      return { authorized: false, loading: true, reason: 'loading' };
    }

    const result = createAuthorizationCheck(
      !!user,
      hasActiveSubscription,
      requireSubscription,
      user?.id
    );

    return { ...result, loading: false };
  }, [user, hasActiveSubscription, requireSubscription, authLoading, subscriptionLoading]);

  const checkAuth = useCallback(() => {
    return isAuthorized.authorized;
  }, [isAuthorized.authorized]);

  const getAuthStatus = useCallback(() => {
    return {
      isAuthenticated: !!user,
      hasSubscription: hasActiveSubscription,
      isLoading: authLoading || subscriptionLoading,
      reason: isAuthorized.reason
    };
  }, [user, hasActiveSubscription, authLoading, subscriptionLoading, isAuthorized.reason]);

  return {
    isAuthorized: isAuthorized.authorized,
    isLoading: isAuthorized.loading,
    reason: isAuthorized.reason,
    checkAuth,
    getAuthStatus
  };
};