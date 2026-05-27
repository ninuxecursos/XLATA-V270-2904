import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsDesktop, useIsMobile } from '@/hooks/use-mobile';
import MobileAppLayout from './mobile/MobileAppLayout';
import { AdminUserViewSelector } from './admin/AdminUserViewSelector';
import { AdminViewBanner } from './admin/AdminViewBanner';

interface MainLayoutProps {
  children?: React.ReactNode;
  onOpenCashRegister?: () => void;
}

export function MainLayout({ children, onOpenCashRegister }: MainLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  // Admin view state from location
  const adminViewingUser = location.state?.adminViewingUser;
  const adminViewingUserName = location.state?.adminViewingUserName;
  const isAdminView = !!adminViewingUser;

  // Check if user is admin
  const isAdmin = profile?.status === 'admin';

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase.rpc('is_admin');
      setIsCurrentUserAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsCurrentUserAdmin(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    // Buscar assinatura do Supabase primeiro
    const { data: supabaseSubscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supabaseSubscription && supabaseSubscription.is_active && new Date(supabaseSubscription.expires_at) > new Date()) {
      setSubscription(supabaseSubscription);
      return;
    }

    // Verificar localStorage
    const adminActivatedSubscription = localStorage.getItem(`subscription_${user.id}`);
    if (adminActivatedSubscription) {
      try {
        const subscription = JSON.parse(adminActivatedSubscription);
        if (subscription.is_active && new Date(subscription.expires_at) > new Date()) {
          setSubscription(subscription);
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao parsear assinatura:', error);
      }
    }

    setSubscription(null);
  };

  const handleExitAdminView = () => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {}
    });
  };

  // Mobile: usar layout de app nativo
  if (!isDesktop) {
    return <MobileAppLayout>{children}</MobileAppLayout>;
  }

  // Desktop: layout original com sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-950">
        {/* Sidebar */}
        <AppSidebar
          isAdmin={isAdmin}
          subscription={subscription}
          onOpenCashRegister={onOpenCashRegister}
        />

        {/* Main Content Area - sem margem/padding extra */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with mobile menu trigger */}
          <header className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-white hover:bg-gray-800" />
              <h1 className="text-white font-bold text-base">Sistema PDV</h1>
            </div>
            {profile?.name && (
              <span className="text-gray-400 text-xs">
                Olá, {profile.name}!
              </span>
            )}
          </header>

          {/* Global Admin User Selector for desktop - always visible for admins */}
          {isCurrentUserAdmin && !isMobile && (
            <div className="hidden lg:flex bg-slate-900 border-b border-slate-700 px-4 py-2 items-center justify-between">
              {/* Banner when viewing as another user */}
              {isAdminView ? (
                <AdminViewBanner 
                  adminViewingUserName={adminViewingUserName}
                  onExit={handleExitAdminView}
                  showBackToAdmin={true}
                />
              ) : (
                <div />
              )}
              
              {/* User selector always on the right */}
              <AdminUserViewSelector
                currentViewingUser={adminViewingUser}
                currentViewingUserName={adminViewingUserName}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
