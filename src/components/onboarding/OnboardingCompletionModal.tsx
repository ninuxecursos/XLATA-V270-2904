import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, 
  PartyPopper, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingCompletionModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

const unlockedFeatures = [
  { icon: LayoutDashboard, name: 'Dashboard', description: 'Visão geral do seu negócio' },
  { icon: Package, name: 'Estoque', description: 'Controle de materiais' },
  { icon: Receipt, name: 'Transações', description: 'Histórico completo' },
  { icon: TrendingUp, name: 'Fluxo Diário', description: 'Análise financeira' },
];

export function OnboardingCompletionModal({ open, onClose, userName }: OnboardingCompletionModalProps) {
  const navigate = useNavigate();

  const handleExplore = () => {
    onClose();
    navigate('/dashboard');
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800 text-white p-0 overflow-hidden max-h-[92vh] flex flex-col gap-0">
        {/* Header com celebração */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-5 py-4 text-center relative overflow-hidden flex-shrink-0">
          {/* Confetes animados */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <PartyPopper className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold text-white break-words leading-tight">
                  Parabéns{userName ? `, ${userName.split(' ')[0]}` : ''}! 🎉
                </DialogTitle>
              </DialogHeader>
              <p className="text-green-50/90 text-xs sm:text-sm mt-0.5">
                Você configurou tudo com sucesso!
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          {/* Checklist de conquistas */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Configurações Completas
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {['Empresa configurada', 'Materiais cadastrados', 'Primeiro caixa aberto'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features desbloqueadas */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Funcionalidades Desbloqueadas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {unlockedFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.name}
                    className="bg-gray-800/50 border-gray-700 p-2 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-md bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-xs leading-tight">{feature.name}</p>
                      <p className="text-[10px] text-gray-500 leading-tight truncate">{feature.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Dica */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            <p className="text-blue-400 text-xs leading-snug">
              💡 <strong>Dica:</strong> Acesse o <strong>Guia Completo</strong> no menu para aprender mais sobre cada funcionalidade.
            </p>
          </div>
        </div>

        {/* Botões — fixos no rodapé */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900 flex flex-col gap-2 flex-shrink-0">
          <Button 
            onClick={handleExplore}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold h-11"
          >
            EXPLORAR DASHBOARD
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            onClick={handleContinue}
            variant="ghost" 
            size="sm"
            className="w-full text-gray-400 hover:text-white hover:bg-gray-800 h-8"
          >
            Continuar operando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
