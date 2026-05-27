import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationModal } from '@/components/NotificationModal';

// Mapeamento de rotas para títulos
const routeTitles: Record<string, string> = {
  '/': 'PDV',
  '/dashboard': 'Dashboard',
  '/purchase-orders': 'Compras',
  '/sales-orders': 'Vendas',
  '/transactions': 'Transações',
  '/materials': 'Materiais',
  '/depot-clients': 'Clientes',
  '/employees': 'Funcionários',
  '/daily-flow': 'Fluxo Diário',
  '/current-stock': 'Estoque',
  '/expenses': 'Despesas',
  '/settings': 'Configurações',
  '/referral-system': 'Indicações',
  '/pdv': 'PDV',
  '/materiais': 'Materiais',
  '/clientes': 'Clientes',
  '/funcionarios': 'Funcionários',
  '/configuracoes': 'Configurações',
};

interface ProfileData {
  name?: string | null;
  company?: string | null;
}

const MobileAppHeader: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Hook de notificações
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  // Busca perfil do usuário
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('name, company')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          name: data.name,
          company: data.company
        });
      }
    };

    fetchProfile();
  }, [user]);

  // Monitor de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Título da página atual
  const pageTitle = useMemo(() => {
    return routeTitles[location.pathname] || 'XLata';
  }, [location.pathname]);

  // Iniciais do nome da empresa para fallback
  const companyInitials = useMemo(() => {
    const displayName = profile?.company || profile?.name || 'XLata';
    return displayName
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }, [profile?.company, profile?.name]);

  // Nome da empresa para exibição
  const companyName = profile?.company || profile?.name;

  return (
    <header className="sticky top-0 z-20 bg-[#0b1220]/95 backdrop-blur-xl border-b border-slate-700/50">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo e título */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white text-sm font-bold tracking-tight">{companyInitials}</span>
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-white font-semibold text-lg leading-tight truncate">{pageTitle}</span>
            {companyName && (
              <span className="text-slate-400 text-xs truncate max-w-[160px]">
                {companyName}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {/* Indicador de conexão */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isOnline 
              ? 'bg-emerald-500/15 text-emerald-500' 
              : 'bg-red-500/15 text-red-500'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
              </>
            )}
          </div>

          {/* Botão de notificações */}
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 text-slate-400 hover:text-white transition-all rounded-xl hover:bg-slate-700/50 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Notificações */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        isLoading={isLoading}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
    </header>
  );
};

export default MobileAppHeader;
