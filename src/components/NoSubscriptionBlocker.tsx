import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, Crown, ArrowRight, Sparkles, Loader2, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SystemLogo from './SystemLogo';
import { useTrialActivation } from '@/utils/trialActivation';
import { hasUserUsedTrial } from '@/utils/subscriptionStorage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const goToPlans = () => {
  // Hard navigation evita race conditions com AuthGuard/eventos de subscriptionCleared
  window.location.assign('/planos');
};

interface NoSubscriptionBlockerProps {
  userName?: string;
  onTrialActivated?: () => void;
}

const NoSubscriptionBlocker: React.FC<NoSubscriptionBlockerProps> = ({ 
  userName, 
  onTrialActivated 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);
  const [trialAlreadyUsed, setTrialAlreadyUsed] = useState(true); // default true to hide button while loading
  const { activateUserTrial } = useTrialActivation();

  useEffect(() => {
    const checkTrial = async () => {
      if (user?.id) {
        const used = await hasUserUsedTrial(user.id);
        setTrialAlreadyUsed(used);
      }
    };
    checkTrial();
  }, [user?.id]);

  const handleActivateTrial = async () => {
    setIsActivating(true);
    
    try {
      const result = await activateUserTrial();
      
      if (result.success) {
        setTrialActivated(true);
        toast({
          title: "✅ Teste Grátis Ativado!",
          description: result.message,
        });
        
        // Call callback if provided
        if (onTrialActivated) {
          onTrialActivated();
        }
        
        // Redirect to guide after 1.5s
        setTimeout(() => {
          navigate('/guia-completo');
        }, 1500);
      } else {
        toast({
          title: "❌ Erro na Ativação",
          description: result.message,
          variant: "destructive",
        });
        setIsActivating(false);
      }
    } catch (error) {
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao ativar o teste. Tente novamente.",
        variant: "destructive",
      });
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SystemLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao Sistema PDV, {userName || 'usuário'}!
          </h1>
          <p className="text-gray-300 text-lg">
            Para acessar todas as funcionalidades, você precisa ativar um plano.
          </p>
        </div>

        {/* Card Principal */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Restrito</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Você precisa de uma assinatura ativa para acessar o sistema completo.
              <br />
              {trialAlreadyUsed 
                ? 'Seu teste gratuito já foi utilizado. Contrate um plano para continuar usando o sistema.'
                : 'Comece com nosso teste gratuito de 7 dias!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {trialAlreadyUsed ? (
              <div className="py-4">
                <Card className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-600">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-orange-800 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Teste Gratuito Já Utilizado
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Seu período de teste gratuito de 7 dias já foi utilizado.
                      Para continuar acessando todas as funcionalidades, contrate um dos nossos planos.
                    </p>
                    <Button
                      onClick={goToPlans}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white font-bold py-6"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      VER PLANOS DISPONÍVEIS
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="py-4">
                <Card className="bg-gradient-to-r from-black-300/40 to-green-300/40 border-green-600">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-orange-800 rounded-full flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Ative seu Teste Grátis
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Para ativar seu teste grátis de 7 dias, acesse as configurações do sistema 
                      ou aguarde o modal de primeiro login.
                    </p>
                    <Button
                      onClick={handleActivateTrial}
                      disabled={isActivating || trialActivated}
                      className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold py-6 disabled:opacity-70"
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          ATIVANDO...
                        </>
                      ) : trialActivated ? (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          ATIVADO! REDIRECIONANDO...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          ATIVAR TESTE GRÁTIS DE 7 DIAS
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {!trialAlreadyUsed && (
              <div className="text-sm text-gray-400">
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Acesso completo por 7 dias
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Todas as funcionalidades liberadas
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Sem compromisso
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Permitidas */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/30 border-gray-600 hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-white font-semibold">Guia Completo</h3>
                    <p className="text-gray-400 text-sm">Aprenda a usar o sistema</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/guia-completo')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-600 hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h3 className="text-white font-semibold">Ver Planos</h3>
                    <p className="text-gray-400 text-sm">Conheça nossas opções</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={goToPlans}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer com saída de emergência */}
        <div className="text-center text-gray-500 text-sm space-y-3">
          <p>Dúvidas? Entre em contato conosco através do suporte.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try { await supabase.auth.signOut(); } catch {}
              window.location.assign('/landing');
            }}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoSubscriptionBlocker;
