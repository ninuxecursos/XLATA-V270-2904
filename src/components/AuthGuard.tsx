import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NoSubscriptionBlocker from './NoSubscriptionBlocker';
import { createLogger } from '@/utils/logger';
import { useEmployee } from '@/contexts/EmployeeContext';
import { activateFreeTrial, hasUserUsedTrial } from '@/utils/subscriptionStorage';

interface AuthGuardProps {
  children: React.ReactNode;
}

const logger = createLogger('[AuthGuard]');

// Build offline standalone: nao ha autenticacao Supabase nem assinatura.
// O OfflineLicenseGate ja barra o acesso quando a licenca local e invalida.
const IS_OFFLINE_BUILD = (import.meta as any).env?.VITE_OFFLINE_BUILD === 'true';

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  if (IS_OFFLINE_BUILD) {
    return <>{children}</>;
  }
  return <AuthGuardOnline>{children}</AuthGuardOnline>;
};

const AuthGuardOnline: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isEmployee, hasActiveSubscription: employeeHasSubscription, loading: employeeLoading } = useEmployee();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);
  const [subscriptionCheckTrigger, setSubscriptionCheckTrigger] = useState(0);

  // Cache de verificações de role
  const roleCache = React.useRef<Map<string, { isAdmin: boolean, timestamp: number }>>(new Map());
  const CACHE_TTL = 1 * 60 * 1000; // 1 minuto - reduzido para maior segurança

  // SEGURANÇA CRÍTICA: Limpar cache quando o usuário mudar ou sair
  useEffect(() => {
    roleCache.current.clear();
    setIsAdmin(false);
    setIsSubscriptionActive(false);
    setDataLoading(true);
    
    logger.debug('Role cache cleared - user changed:', user?.id || 'no user');
  }, [user?.id]);

  // Escutar evento de limpeza de cache do AuthProvider
  useEffect(() => {
    const handleCacheClear = () => {
      logger.debug('Received cache clear event - clearing roleCache');
      roleCache.current.clear();
      setIsAdmin(false);
      setIsSubscriptionActive(false);
    };

    window.addEventListener('authCacheClear', handleCacheClear);
    
    return () => {
      window.removeEventListener('authCacheClear', handleCacheClear);
    };
  }, []);

  useEffect(() => {
    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (dataLoading) {
        setDataLoading(false);
      }
    }, 5000);

    // Aguardar carregamento do contexto de funcionário
    if (employeeLoading) {
      return () => clearTimeout(timeoutId);
    }

    if (user && !loading) {
      fetchUserData();
    } else if (!loading) {
      setDataLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [user, loading, subscriptionCheckTrigger, employeeLoading]);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionSync = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        logger.debug('Subscription sync event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
      }
    };

    const handleTrialActivation = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        logger.debug('Trial activation event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
        setShowSubscriptionBlocker(false);
      }
    };

    const handleAdminActions = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        logger.debug('Admin subscription action event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
      }
    };

    const handleSubscriptionCleared = (event: any) => {
      if (user && (!event.detail?.userId || event.detail.userId === user.id)) {
        logger.debug('Subscription cleared event - blocking access immediately');
        setIsSubscriptionActive(false);
        // Não bloquear se o usuário está em rota pública (planos/renovação/etc)
        const publicPaths = ['/landing', '/login', '/register', '/planos', '/renovar', '/renovacao', '/'];
        if (!publicPaths.includes(location.pathname)) {
          setShowSubscriptionBlocker(true);
        }
      }
    };

    window.addEventListener('subscriptionSynced', handleSubscriptionSync);
    window.addEventListener('trialActivated', handleTrialActivation);
    window.addEventListener('adminSubscriptionCreated', handleAdminActions);
    window.addEventListener('adminSubscriptionDeactivated', handleAdminActions);
    window.addEventListener('subscriptionCleared', handleSubscriptionCleared);

    return () => {
      window.removeEventListener('subscriptionSynced', handleSubscriptionSync);
      window.removeEventListener('trialActivated', handleTrialActivation);
      window.removeEventListener('adminSubscriptionCreated', handleAdminActions);
      window.removeEventListener('adminSubscriptionDeactivated', handleAdminActions);
      window.removeEventListener('subscriptionCleared', handleSubscriptionCleared);
    };
  }, [user]);

  const fetchUserData = async () => {
    if (!user) {
      // SEGURANÇA: Limpar tudo se não há usuário
      roleCache.current.clear();
      setIsAdmin(false);
      setIsSubscriptionActive(false);
      return;
    }
    
    try {
      logger.debug('Fetching user data for:', user.id);
      
      // SEGURANÇA: Limpar entradas de outros usuários do cache
      roleCache.current.forEach((_, key) => {
        if (key !== user.id) {
          roleCache.current.delete(key);
        }
      });
      
      // SEGURANÇA: Verificar se é admin via RPC com cache
      const cached = roleCache.current.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setIsAdmin(cached.isAdmin);
        logger.debug('Using cached admin status for user:', user.id);
      } else {
        const { data: adminCheck, error: adminError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });
        
        if (!adminError && adminCheck !== null) {
          setIsAdmin(adminCheck);
          roleCache.current.set(user.id, { isAdmin: adminCheck, timestamp: Date.now() });
          logger.debug('Admin check via RPC (cached)');
        }
      }

      // Se é funcionário, usar assinatura do dono (já verificada no EmployeeContext)
      if (isEmployee) {
        setIsSubscriptionActive(employeeHasSubscription);
        logger.debug('Employee using owner subscription:', employeeHasSubscription);
      } else {
        // SEGURANÇA: Verificar assinatura ativa via RPC (server-side validation)
        const { data: subscriptionActive, error: subError } = await supabase
          .rpc('validate_subscription_access', { target_user_id: user.id });
        
        if (!subError && subscriptionActive !== null) {
          if (subscriptionActive) {
            setIsSubscriptionActive(true);
            logger.debug('Subscription validated server-side');
          } else {
            // Sem assinatura ativa - tentar ativar teste grátis automaticamente
            if (!isAdmin) {
              logger.debug('No active subscription, checking if trial can be auto-activated...');
              try {
                const trialUsed = await hasUserUsedTrial(user.id);
                if (!trialUsed) {
                  logger.debug('Auto-activating free trial for new user:', user.id);
                  const trialResult = await activateFreeTrial(user.id);
                  if (trialResult) {
                    setIsSubscriptionActive(true);
                    logger.debug('Free trial auto-activated successfully');
                    
                    // NÃO marcar first_login_completed aqui - o WelcomeScreen cuida disso após o OnboardingWizard
                    
                    window.dispatchEvent(new CustomEvent('trialActivated', {
                      detail: { userId: user.id, subscription: trialResult }
                    }));
                  } else {
                    setIsSubscriptionActive(false);
                  }
                } else {
                  setIsSubscriptionActive(false);
                  logger.debug('Trial already used, no active subscription');
                }
              } catch (trialError) {
                logger.error('Error auto-activating trial');
                setIsSubscriptionActive(false);
              }
            } else {
              setIsSubscriptionActive(false);
            }
          }
        }
      }

    } catch (error) {
      logger.error('Error fetching user data');
    } finally {
      setDataLoading(false);
    }
  };

  // REMOVIDA: Verificação de assinatura agora é feita via RPC no fetchUserData()
  // A função foi eliminada para seguir as melhores práticas de segurança

  useEffect(() => {
    if (loading || dataLoading || employeeLoading) return;

    logger.debug('AuthGuard checking route:', {
      pathname: location.pathname,
      user: user?.email,
      isAdmin,
      isSubscriptionActive,
      isEmployee
    });

    // Public routes that don't require authentication
    const publicRoutes = ['/landing', '/login', '/register', '/planos', '/renovar', '/renovacao', '/reset-password', '/termos-de-uso', '/'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Se entrou em rota pública (especialmente /planos), garante que o blocker some
    if (isPublicRoute && showSubscriptionBlocker) {
      setShowSubscriptionBlocker(false);
    }

    // Admin-only route
    const isAdminRoute = location.pathname === '/covildomal';

    // All non-public, non-admin routes require subscription
    const requiresSubscription = !isPublicRoute && !isAdminRoute;

    // Funcionários não podem acessar página de planos ou funcionários
    if (isEmployee && (location.pathname === '/planos' || location.pathname === '/funcionarios')) {
      logger.debug('Employee cannot access plans or employees page, redirecting to home');
      navigate('/');
      return;
    }
    
    // A rota "/" é pública para mostrar o WelcomeSplash - não redirecionar
    if (location.pathname === '/') {
      logger.debug('Home route - allowing access to show WelcomeSplash');
      return;
    }
    
    if (!user && !isPublicRoute) {
      setTimeout(() => {
        navigate('/landing', { replace: true });
      }, 10);
    } else if (user && isPublicRoute && !['/planos', '/renovar', '/renovacao', '/landing', '/'].includes(location.pathname)) {
      if (!isAdmin) {
        logger.debug('User authenticated, redirecting from public page to home');
        navigate('/');
      } else {
        logger.debug('Admin has free access to all pages including landing');
      }
    } else if (user && isAdminRoute) {
      if (!isAdmin) {
        logger.debug('User is not admin, redirecting to home');
        navigate('/');
        return;
      }
      logger.debug('Admin accessing admin panel');
    } else if (user && requiresSubscription) {
      if (isAdmin) {
        logger.debug('Admin has direct access to all routes');
        return;
      }
      
      if (!isSubscriptionActive) {
        logger.debug('User without active subscription, showing subscription blocker');
        setShowSubscriptionBlocker(true);
        return;
      }
      
      logger.debug('User has active subscription, accessing route');
    }
  }, [user, loading, dataLoading, employeeLoading, navigate, location.pathname, isSubscriptionActive, isAdmin, isEmployee]);

  // Show loading while checking authentication
  if (loading || dataLoading || employeeLoading) {
    return (
      <div className="min-h-screen bg-pdv-dark flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Show subscription blocker for users without subscription (usando verificação segura via RPC)
  if (showSubscriptionBlocker && user && !isAdmin && !isSubscriptionActive) {
    return (
      <NoSubscriptionBlocker 
        userName={user.email} 
        onTrialActivated={async () => {
          logger.debug('Trial activation callback triggered');
          setShowSubscriptionBlocker(false);
          setTimeout(() => {
            setSubscriptionCheckTrigger(prev => prev + 1);
          }, 500);
        }}
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;