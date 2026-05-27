import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { MainContent } from './MainContent';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { hasUserUsedTrial } from '@/utils/subscriptionStorage';
import { createLogger } from '@/utils/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileAppHeader from './mobile/MobileAppHeader';
import MobileAppNavigation from './mobile/MobileAppNavigation';

const logger = createLogger('[HomeLayout]');

interface HomeLayoutProps {
  onOpenCashRegister: () => void;
}

export function HomeLayout({ onOpenCashRegister }: HomeLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.status === 'admin';

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

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
    
    logger.debug('Fetching subscription for user:', user.email);
    
    const { data: supabaseSubscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supabaseSubscription && supabaseSubscription.is_active && new Date(supabaseSubscription.expires_at) > new Date()) {
      logger.success('Active subscription found in Supabase');
      setSubscription(supabaseSubscription);
      return;
    }

    const adminActivatedSubscription = localStorage.getItem(`subscription_${user.id}`);
    if (adminActivatedSubscription) {
      try {
        const subscription = JSON.parse(adminActivatedSubscription);
        if (subscription.is_active && new Date(subscription.expires_at) > new Date()) {
          setSubscription(subscription);
          return;
        }
      } catch (error) {
        logger.error('Error parsing subscription:', error);
      }
    }

    setSubscription(null);
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;
    setHasUnsavedChanges(true);
    setProfile({ ...profile, ...updates });
  };

  const saveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        company: profile.company,
        whatsapp: profile.whatsapp,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setHasUnsavedChanges(false);
      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "Digite sua senha atual",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro ao alterar senha",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro ao alterar senha",
            description: "Senha atual incorreta",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao alterar senha",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi alterada com sucesso.",
        });
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      logger.error('Error updating password:', error);
      toast({
        title: "Erro ao alterar senha",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleNavigateToPlans = () => {
    navigate('/planos');
  };

  const handleNavigateToGuide = () => {
    navigate('/guia-completo');
  };

  const mainContentProps = {
    profile,
    subscription,
    isAdmin,
    isEditingPassword,
    currentPassword,
    newPassword,
    confirmPassword,
    hasUnsavedChanges,
    onUpdateProfile: updateProfile,
    onSaveProfile: saveProfile,
    onPasswordChange: handlePasswordChange,
    onSetIsEditingPassword: setIsEditingPassword,
    onSetCurrentPassword: setCurrentPassword,
    onSetNewPassword: setNewPassword,
    onSetConfirmPassword: setConfirmPassword,
    onNavigateToPlans: handleNavigateToPlans,
    onNavigateToGuide: handleNavigateToGuide,
    onShowReferralSystem: () => navigate('/sistema-indicacoes'),
    onShowErrorReportModal: () => navigate('/relatar-erro'),
    onOpenCashRegister,
    onNavigate: handleNavigation,
  };

  // ─── MOBILE: usar layout nativo com bottom nav ───
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex flex-col">
        <MobileAppHeader />
        <main className="flex-1 overflow-y-auto pb-mobile-nav hide-scrollbar momentum-scroll">
          <MainContent {...mainContentProps} />
        </main>
        <MobileAppNavigation />
      </div>
    );
  }

  // ─── DESKTOP: sidebar layout ───
  return (
    <SidebarProvider>
      <div data-tutorial="pdv-main" className="min-h-screen flex w-full bg-gray-900">
        <AppSidebar
          isAdmin={isAdmin}
          subscription={subscription}
          onOpenCashRegister={onOpenCashRegister}
        />
        <div className="flex-1 flex flex-col">
          <MainContent {...mainContentProps} />
        </div>
      </div>
    </SidebarProvider>
  );
}