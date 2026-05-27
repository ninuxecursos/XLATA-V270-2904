import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Package, DollarSign, CheckCircle2, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

const stepIcons = [
  null, // Step 0 não tem ícone
  Settings,
  Package,
  DollarSign
];

const stepColors = [
  '',
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600'
];

export function OnboardingWizard({ open, onClose, userName }: OnboardingWizardProps) {
  const { startOnboarding, skipOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startOnboarding();
      onClose();
      navigate('/configuracoes');
    } catch (error) {
      console.error('Erro ao iniciar onboarding:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Bem-vindo ao XLata{userName ? `, ${userName.split(' ')[0]}` : ''}! 🎉
            </DialogTitle>
          </DialogHeader>
          <p className="text-green-100 mt-2">
            Vamos configurar seu sistema em 3 passos simples
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tempo estimado */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Tempo estimado: 10 minutos</span>
          </div>

          {/* Passos */}
          <div className="space-y-3">
            {ONBOARDING_STEPS.slice(1).map((step, index) => {
              const Icon = stepIcons[step.id];
              return (
                <Card 
                  key={step.id}
                  className="bg-gray-800/50 border-gray-700 p-4 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stepColors[step.id]} flex items-center justify-center flex-shrink-0`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium">Passo {index + 1}</span>
                    </div>
                    <h3 className="font-semibold text-white">{step.name}</h3>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </Card>
              );
            })}
          </div>

          {/* Benefícios */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
            <p className="text-green-400 text-sm text-center">
              ✨ Ao completar, você terá acesso a todas as funcionalidades do sistema
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-3 pt-2 pb-safe">
            <Button 
              onClick={handleStart}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-5 sm:py-6 text-base sm:text-lg"
            >
              {isStarting ? (
                'Iniciando...'
              ) : (
                <>
                  COMEÇAR CONFIGURAÇÃO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleSkip}
              variant="ghost" 
              className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Pular e explorar sozinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
