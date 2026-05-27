import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface TrialActivationButtonProps {
  onTrialActivated?: () => void;
}

/**
 * @deprecated Este componente não é mais usado. 
 * A ativação do teste grátis agora é feita manualmente através do FirstLoginModal.
 */
const TrialActivationButton: React.FC<TrialActivationButtonProps> = () => {
  return (
    <Card className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-600">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Ative seu Teste Grátis
        </h3>
        <p className="text-gray-300">
          Para ativar seu teste grátis de 7 dias, acesse as configurações do sistema 
          ou aguarde o modal de primeiro login.
        </p>
      </CardContent>
    </Card>
  );
};

export default TrialActivationButton;