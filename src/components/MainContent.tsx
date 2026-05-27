import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Key, 
  BarChart3, 
  Archive, 
  ShoppingCart, 
  Shield,
  Settings,
  BookOpen,
  PhoneCall,
  AlertCircle,
  Crown,
  CheckCircle,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MainContentProps {
  profile: any;
  subscription: any;
  isAdmin: boolean;
  isEditingPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  hasUnsavedChanges: boolean;
  onUpdateProfile: (updates: any) => void;
  onSaveProfile: () => void;
  onPasswordChange: () => void;
  onSetIsEditingPassword: (editing: boolean) => void;
  onSetCurrentPassword: (password: string) => void;
  onSetNewPassword: (password: string) => void;
  onSetConfirmPassword: (password: string) => void;
  onNavigateToPlans: () => void;
  onNavigateToGuide: () => void;
  onShowReferralSystem: () => void;
  onShowErrorReportModal: () => void;
  onOpenCashRegister: () => void;
  onNavigate: (path: string) => void;
}

export function MainContent({
  profile,
  subscription,
  isAdmin,
  isEditingPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  hasUnsavedChanges,
  onUpdateProfile,
  onSaveProfile,
  onPasswordChange,
  onSetIsEditingPassword,
  onSetCurrentPassword,
  onSetNewPassword,
  onSetConfirmPassword,
  onNavigateToPlans,
  onNavigateToGuide,
  onShowReferralSystem,
  onShowErrorReportModal,
  onOpenCashRegister,
  onNavigate
}: MainContentProps) {
  const isMobile = useIsMobile();
  const { resetOnboarding, startOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const handleStartOnboarding = async () => {
    try {
      await resetOnboarding();
      await startOnboarding();
      toast({
        title: '🎯 Onboarding iniciado!',
        description: 'Siga o passo a passo para configurar e testar o sistema.',
      });
      navigate('/guia-completo');
    } catch (e) {
      toast({
        title: 'Erro ao iniciar onboarding',
        description: 'Tente novamente em instantes.',
        variant: 'destructive' as any,
      });
    }
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const calculateRemainingDays = (expiresAt: string): number => {
    const expirationDate = new Date(expiresAt);
    const currentDate = new Date();
    const timeDiff = expirationDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  };

  const getPlanDisplayName = (planType: string): string => {
    switch (planType) {
      case 'trial': return 'Teste Gratuito';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return 'Plano';
    }
  };

  const quickAccessCards = [
    {
      title: "Abrir Caixa",
      description: "Iniciar operação",
      icon: ShoppingCart,
      action: onOpenCashRegister,
      dataTutorial: "open-register-button"
    },
    {
      title: "Dashboard",
      description: "Métricas e relatórios",
      icon: BarChart3,
      action: () => onNavigate('/dashboard')
    },
    {
      title: "Estoque",
      description: "Gerenciar materiais",
      icon: Archive,
      action: () => onNavigate('/current-stock')
    },
    {
      title: "Configurações",
      description: "Personalizar sistema",
      icon: Settings,
      action: () => onNavigate('/configuracoes')
    },
  ];

  const supportOptions = [
    {
      title: "WhatsApp",
      description: "Suporte direto",
      icon: PhoneCall,
      action: () => {
        const message = encodeURIComponent('Olá, preciso de suporte relacionado ao sistema XLATA.');
        window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      }
    },
    {
      title: "Relatar Erro",
      description: "Reportar problemas",
      icon: AlertCircle,
      action: onShowErrorReportModal
    },
    {
      title: "Guia",
      description: "Tutorial completo",
      icon: BookOpen,
      action: onNavigateToGuide
    }
  ];

  // ─── MOBILE NATIVE LAYOUT ───
  if (isMobile) {
    return (
      <div className="flex-1 overflow-auto bg-[#0b1220] pb-24">
        {/* Greeting */}
        <div className="px-5 pt-4 pb-2">
          <h1 className="text-xl font-bold text-white">
            Olá, {profile?.name || 'Bem-vindo'}! 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão completa para seu negócio
          </p>
        </div>

        {/* Botão Iniciar Onboarding */}
        <div className="px-4 pt-2 pb-1">
          <button
            onClick={handleStartOnboarding}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-transparent border border-slate-700/60 hover:border-emerald-500/40 active:scale-[0.98] transition-all text-slate-400 hover:text-emerald-400 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Iniciar guia onboarding
          </button>
        </div>

        {/* Quick Access */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-2.5">
            {quickAccessCards.map((card, index) => (
              <button
                key={index}
                onClick={card.action}
                data-tutorial={(card as any).dataTutorial}
                className="bg-[#111827] rounded-2xl p-4 border border-slate-700/40 text-left active:scale-[0.97] transition-all group hover:border-emerald-500/30"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-500/10 transition-colors">
                  <card.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-4 py-2">
          <div className="bg-[#111827] rounded-2xl border border-slate-700/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Meu Perfil</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label className="text-emerald-500/80 text-[11px] mb-1 block">Nome</Label>
                <Input
                  value={profile?.name || ""}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm placeholder:text-slate-600"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label className="text-emerald-500/80 text-[11px] mb-1 block">Empresa</Label>
                <Input
                  value={profile?.company || ""}
                  onChange={(e) => onUpdateProfile({ company: e.target.value })}
                  className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm placeholder:text-slate-600"
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label className="text-emerald-500/80 text-[11px] mb-1 block">WhatsApp</Label>
                <Input
                  value={profile?.whatsapp || ""}
                  onChange={(e) => onUpdateProfile({ whatsapp: formatWhatsApp(e.target.value) })}
                  maxLength={15}
                  className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm placeholder:text-slate-600"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>

              {/* Password */}
              <div className="pt-2 border-t border-slate-700/40">
                <Label className="text-slate-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3 w-3" /> Senha
                </Label>
                {!isEditingPassword ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value="********"
                      disabled
                      className="bg-slate-800/30 border-slate-700/30 text-slate-500 h-11 rounded-xl text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => onSetIsEditingPassword(true)}
                      className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 h-11 rounded-xl text-xs px-4"
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input type="password" placeholder="Senha atual" value={currentPassword} onChange={(e) => onSetCurrentPassword(e.target.value)} className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm" />
                    <Input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => onSetNewPassword(e.target.value)} className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm" />
                    <Input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={(e) => onSetConfirmPassword(e.target.value)} className="bg-slate-800/60 border-slate-700/50 text-white h-11 rounded-xl text-sm" />
                    <div className="flex gap-2">
                      <Button onClick={onPasswordChange} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl text-sm font-medium">Salvar</Button>
                      <Button variant="outline" onClick={() => onSetIsEditingPassword(false)} className="flex-1 bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700 h-11 rounded-xl text-sm">Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>

              {hasUnsavedChanges && (
                <Button onClick={onSaveProfile} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-sm font-semibold mt-2">
                  Salvar Perfil
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Subscription / Admin */}
        <div className="px-4 py-2">
          <div className="bg-[#111827] rounded-2xl border border-slate-700/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-slate-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">
                  {isAdmin ? 'Administrador' : 'Assinatura'}
                </h2>
              </div>
            </div>
            <div className="p-4">
              {isAdmin ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-emerald-400 font-medium text-sm">Acesso Total</p>
                      <p className="text-slate-500 text-[11px]">Sem limitações</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onNavigate('/covildomal')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 h-11 rounded-xl text-sm font-medium"
                  >
                    Painel Admin
                  </Button>
                </div>
              ) : subscription ? (
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-500">Status</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-emerald-500 text-xs font-semibold">{getPlanDisplayName(subscription.plan_type)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-500">Expira em</span>
                      <span className="text-white text-xs font-medium">{new Date(subscription.expires_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-500">Dias restantes</span>
                      <span className="text-white text-xs font-bold">{calculateRemainingDays(subscription.expires_at)}</span>
                    </div>
                  </div>
                  <Button onClick={onNavigateToPlans} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-sm font-semibold">
                    Gerenciar Plano
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Você precisa de uma assinatura ativa para acessar todas as funcionalidades.</p>
                  <Button onClick={onNavigateToPlans} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-sm font-semibold">
                    Ver Planos
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-4 py-2">
          <div className="bg-[#111827] rounded-2xl border border-slate-700/40 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-white mb-2">Segurança</h3>
                <ul className="space-y-1.5">
                  {["Autenticação segura", "Backup automático", "Dados criptografados"].map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white mb-2">Recursos</h3>
                <ul className="space-y-1.5">
                  {["Controle de caixa", "Gestão de estoque", "Relatórios detalhados"].map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="px-4 py-2 mb-4">
          <h2 className="text-xs font-semibold text-slate-500 mb-2 px-1">SUPORTE</h2>
          <div className="bg-[#111827] rounded-2xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">
            {supportOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-800/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <option.icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white">{option.title}</h3>
                  <p className="text-[11px] text-slate-500">{option.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
        {/* Logout */}
        <div className="px-4 py-2 mb-8">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast({ title: "Desconectado com sucesso" });
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium active:scale-[0.97] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ───
  return (
    <div className="flex-1 overflow-auto p-3 lg:p-4 bg-gray-950">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white mb-0.5">Sistema PDV</h1>
          <p className="text-gray-500 text-[11px]">
            {profile?.name ? `Olá, ${profile.name}` : 'Bem-vindo'} — Gestão completa para seu negócio
          </p>
        </div>
        <Button
          onClick={handleStartOnboarding}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 gap-2 text-xs font-medium border border-slate-700/60 hover:border-emerald-500/40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Iniciar guia onboarding
        </Button>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {quickAccessCards.map((card, index) => (
          <Card 
            key={index} 
            className="bg-gray-900 border-gray-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer group"
            onClick={card.action}
            data-tutorial={(card as any).dataTutorial}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gray-800 text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                  <card.icon className="h-4 w-4" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-xs font-medium text-white mb-0.5">{card.title}</h3>
              <p className="text-[10px] text-gray-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Profile Section */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-500 text-[10px]">Nome</Label>
                <Input value={profile?.name || ""} onChange={(e) => onUpdateProfile({ name: e.target.value })} className="bg-gray-800 border-gray-700 text-white mt-1 h-8 text-xs" placeholder="Seu nome" />
              </div>
              <div>
                <Label className="text-gray-500 text-[10px]">Empresa</Label>
                <Input value={profile?.company || ""} onChange={(e) => onUpdateProfile({ company: e.target.value })} className="bg-gray-800 border-gray-700 text-white mt-1 h-8 text-xs" placeholder="Nome da empresa" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-500 text-[10px]">WhatsApp</Label>
                <Input value={profile?.whatsapp || ""} onChange={(e) => onUpdateProfile({ whatsapp: formatWhatsApp(e.target.value) })} maxLength={15} className="bg-gray-800 border-gray-700 text-white mt-1 h-8 text-xs" placeholder="(XX) XXXXX-XXXX" />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-3 w-3 text-gray-500" />
                <Label className="text-gray-500 text-[10px]">Senha</Label>
              </div>
              {!isEditingPassword ? (
                <div className="flex items-center gap-2">
                  <Input type="password" value="********" disabled className="bg-gray-800 border-gray-700 text-gray-500 h-8 text-xs" />
                  <Button variant="outline" onClick={() => onSetIsEditingPassword(true)} className="bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white h-8 text-xs px-3">Alterar</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input type="password" placeholder="Senha atual" value={currentPassword} onChange={(e) => onSetCurrentPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white h-8 text-xs" />
                  <Input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => onSetNewPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white h-8 text-xs" />
                  <Input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={(e) => onSetConfirmPassword(e.target.value)} className="bg-gray-800 border-gray-700 text-white h-8 text-xs" />
                  <div className="flex gap-2">
                    <Button onClick={onPasswordChange} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Salvar</Button>
                    <Button variant="outline" onClick={() => onSetIsEditingPassword(false)} className="bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 h-8 text-xs">Cancelar</Button>
                  </div>
                </div>
              )}
            </div>

            {hasUnsavedChanges && (
              <Button onClick={onSaveProfile} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Salvar Perfil</Button>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-gray-500" />
              {isAdmin ? 'Administrador' : 'Assinatura'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {isAdmin ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-emerald-400 font-medium text-xs">Acesso Total</p>
                    <p className="text-gray-500 text-[10px]">Sem limitações</p>
                  </div>
                </div>
                <Button onClick={() => onNavigate('/covildomal')} className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-8 text-xs">Painel Admin</Button>
              </div>
            ) : subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-500 text-[10px] font-medium">{getPlanDisplayName(subscription.plan_type)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Expira em</span>
                  <span className="text-white text-[10px]">{new Date(subscription.expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Dias restantes</span>
                  <span className="text-white text-[10px] font-medium">{calculateRemainingDays(subscription.expires_at)}</span>
                </div>
                <Button onClick={onNavigateToPlans} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Gerenciar Plano</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500">Você precisa de uma assinatura ativa para acessar todas as funcionalidades.</p>
                <Button onClick={onNavigateToPlans} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">Ver Planos</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
        {[
          { title: "Segurança", items: ["Autenticação segura", "Backup automático", "Dados criptografados"] },
          { title: "Recursos", items: ["Controle de caixa", "Gestão de estoque", "Relatórios detalhados"] }
        ].map((feature, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <h3 className="text-white font-medium text-xs mb-2">{feature.title}</h3>
              <ul className="space-y-1.5">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2 text-gray-400 text-[10px]">
                    <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Options */}
      <div className="mt-3">
        <h2 className="text-[11px] font-medium text-gray-500 mb-1.5">Suporte</h2>
        <div className="grid grid-cols-3 gap-2">
          {supportOptions.map((option, index) => (
            <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all cursor-pointer" onClick={option.action}>
              <CardContent className="p-2.5 text-center">
                <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-gray-800 text-gray-400 mb-1.5">
                  <option.icon className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-medium text-white text-[10px]">{option.title}</h3>
                <p className="text-[9px] text-gray-500">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
