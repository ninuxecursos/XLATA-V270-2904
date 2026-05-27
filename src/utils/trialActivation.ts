
import { activateFreeTrial, hasUserUsedTrial } from './subscriptionStorage';
import { useAuth } from '@/hooks/useAuth';

export const useTrialActivation = () => {
  const { user } = useAuth();

  const activateUserTrial = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      console.log('🎯 Iniciando ativação do teste gratuito para:', user.email);

      // CRITICAL: Check if trial was already used (including expired trials)
      const trialAlreadyUsed = await hasUserUsedTrial(user.id);
      if (trialAlreadyUsed) {
        console.log('❌ Teste gratuito já foi usado anteriormente');
        return { success: false, message: 'Você já utilizou seu teste gratuito de 7 dias.' };
      }

      // Activate trial using the enhanced function
      const trialSubscription = await activateFreeTrial(user.id);

      if (trialSubscription) {
        console.log('✅ Teste gratuito ativado com sucesso');
        
        // Dispatch custom event for immediate UI updates
        window.dispatchEvent(new CustomEvent('trialActivated', {
          detail: { 
            userId: user.id,
            subscription: trialSubscription
          }
        }));
        
        return { 
          success: true, 
          message: `Teste gratuito de 7 dias ativado! Válido até ${new Date(trialSubscription.expires_at).toLocaleDateString('pt-BR')}.` 
        };
      } else {
        return { success: false, message: 'Erro ao ativar teste gratuito' };
      }

    } catch (error: any) {
      console.error('💥 Erro ao ativar teste gratuito:', error);
      
      // Handle specific error messages
      if (error.message?.includes('já utilizou o teste gratuito')) {
        return { success: false, message: 'Você já utilizou seu teste gratuito de 7 dias.' };
      }
      
      if (error.message?.includes('já possui uma assinatura ativa')) {
        return { success: false, message: 'Você já possui uma assinatura ativa.' };
      }
      
      return { 
        success: false, 
        message: error.message || 'Erro ao ativar teste gratuito. Tente novamente.' 
      };
    }
  };

  return { activateUserTrial };
};
