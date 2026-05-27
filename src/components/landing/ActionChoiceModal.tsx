import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, MessageCircle, ArrowRight, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ActionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

const ActionChoiceModal: React.FC<ActionChoiceModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber = '5511963512105',
}) => {
  const navigate = useNavigate();

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      'Olá! Vi o site do XLata e quero saber mais sobre o sistema para meu depósito.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-lg p-6 sm:p-8">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white text-center text-2xl font-bold">
            Como você prefere começar no XLata?
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center text-base mt-2">
            Cada depósito é diferente. Escolha o jeito mais confortável pra você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Opção 1 - Testar Sozinho (DESTAQUE) */}
          <button
            onClick={handleRegister}
            className="w-full p-5 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl ring-2 ring-green-500/50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-3">
                  Quero testar sozinho
                </h3>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-green-100/90 text-sm">
                    <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
                    Cadastro rápido
                  </li>
                  <li className="flex items-center gap-2 text-green-100/90 text-sm">
                    <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
                    Acesso completo por 7 dias
                  </li>
                  <li className="flex items-center gap-2 text-green-100/90 text-sm">
                    <Check className="h-4 w-4 text-green-300 flex-shrink-0" />
                    Vídeos explicativos passo a passo
                  </li>
                </ul>
                <p className="text-green-200/70 text-xs italic">
                  Ideal pra quem gosta de explorar no próprio ritmo.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <span className="inline-flex items-center gap-1 text-white font-semibold text-sm bg-white/10 px-4 py-2 rounded-lg group-hover:bg-white/20 transition-colors">
                COMEÇAR TESTE GRÁTIS
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>

          {/* Opção 2 - Falar com Atendente */}
          <button
            onClick={handleWhatsApp}
            className="w-full p-5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-3">
                  Quero ajuda para começar
                </h3>
                <ul className="space-y-1.5 mb-3">
                  <li className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="h-4 w-4 text-green-400/70 flex-shrink-0" />
                    Explicação pelo WhatsApp
                  </li>
                  <li className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="h-4 w-4 text-green-400/70 flex-shrink-0" />
                    Tiramos suas dúvidas antes de usar
                  </li>
                  <li className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="h-4 w-4 text-green-400/70 flex-shrink-0" />
                    Você entra sabendo exatamente o que fazer
                  </li>
                </ul>
                <p className="text-gray-500 text-xs italic">
                  Ideal pra quem prefere segurança desde o primeiro dia.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <span className="inline-flex items-center gap-1 text-gray-300 font-semibold text-sm bg-gray-700/50 px-4 py-2 rounded-lg group-hover:bg-gray-700 transition-colors">
                FALAR COM ATENDENTE
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>
        </div>

        <p className="text-gray-500 text-sm text-center pt-4">
          Sem compromisso. Você pode mudar de opção quando quiser.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ActionChoiceModal;
