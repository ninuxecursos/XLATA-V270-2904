import React, { useState, useEffect } from 'react';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingSpotlight } from '../OnboardingSpotlight';
import { toast } from 'sonner';
import { useTutorialMobile } from '@/hooks/useTutorialMobile';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

// Steps antes de abrir o caixa
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao PDV!',
    description: 'Este é o coração do sistema - o Ponto de Venda. Aqui você registra todas as compras e vendas de materiais.',
    targetSelector: '[data-tutorial="pdv-main"]',
    position: 'bottom'
  },
  {
    id: 'open-register',
    title: 'Abrir Caixa',
    description: 'Primeiro, você precisa ABRIR O CAIXA. Clique neste botão e informe o valor inicial em dinheiro.',
    targetSelector: '[data-tutorial="open-register-button"]',
    position: 'bottom'
  }
];

// Steps após abrir o caixa - Fluxo completo do PDV
const AFTER_OPEN_STEPS: TutorialStep[] = [
  {
    id: 'weight',
    title: '1. Digitar o Peso',
    description: 'Use o teclado numérico para digitar o peso mostrado na balança. O sistema aceita casas decimais.',
    targetSelector: '[data-tutorial="number-pad"]',
    position: 'left'
  },
  {
    id: 'material',
    title: '2. Selecionar o Material',
    description: 'Agora toque no material correspondente. O valor será calculado automaticamente com base no peso digitado.',
    targetSelector: '[data-tutorial="material-grid"]',
    position: 'left'
  },
  {
    id: 'tara-optional',
    title: '3. Tara (Opcional)',
    description: 'Ao adicionar um material, você pode descontar o peso da embalagem usando o botão "Tara" no modal.',
    targetSelector: '[data-tutorial="tara-button"]',
    position: 'top'
  },
  {
    id: 'discount-optional',
    title: '4. Desconto/Acréscimo (Opcional)',
    description: 'Você também pode aplicar descontos ou acréscimos no valor usando o botão "Diferença".',
    targetSelector: '[data-tutorial="discount-button"]',
    position: 'top'
  },
  {
    id: 'order-items',
    title: '5. Revisar Itens',
    description: 'Aqui aparecem todos os itens do pedido. Você pode adicionar mais materiais ou remover itens.',
    targetSelector: '[data-tutorial="order-details"]',
    position: 'left'
  },
  {
    id: 'complete-button',
    title: '6. Encerrar Pedido',
    description: 'Quando terminar de adicionar itens, clique em FINALIZAR para encerrar o pedido.',
    targetSelector: '[data-tutorial="complete-button"]',
    position: 'top'
  }
];

// Steps do modal de conclusão do pedido
const COMPLETION_MODAL_STEPS: TutorialStep[] = [
  {
    id: 'review-items',
    title: 'Revisar Pedido',
    description: 'Confira todos os itens, quantidades e valores antes de finalizar.',
    targetSelector: '[data-tutorial="order-review-table"]',
    position: 'bottom'
  },
  {
    id: 'payment-method',
    title: 'Forma de Pagamento',
    description: 'Escolha como o cliente vai pagar: Dinheiro, PIX, Cartão ou Fiado.',
    targetSelector: '[data-tutorial="payment-options"]',
    position: 'left'
  },
  {
    id: 'print-save',
    title: 'Imprimir ou Salvar',
    description: 'Clique em IMPRIMIR para gerar o comprovante, ou SÓ SALVAR para registrar sem imprimir. Parabéns, você aprendeu o fluxo completo!',
    targetSelector: '[data-tutorial="print-button"]',
    position: 'top'
  }
];

interface PDVTutorialProps {
  isActive: boolean;
  isCashRegisterOpen: boolean;
  isModalOpen?: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function PDVTutorial({ isActive, isCashRegisterOpen, isModalOpen = false, onComplete, onSkip }: PDVTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRef, setTargetRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const [showAfterOpenSteps, setShowAfterOpenSteps] = useState(false);
  const [showCompletionModalSteps, setShowCompletionModalSteps] = useState(false);
  const { getResponsivePosition, getResponsivePadding } = useTutorialMobile();

  // Determinar quais steps usar
  const steps = showCompletionModalSteps 
    ? COMPLETION_MODAL_STEPS 
    : showAfterOpenSteps 
      ? AFTER_OPEN_STEPS 
      : TUTORIAL_STEPS;

  // Quando o caixa abrir, mudar para os steps seguintes
  useEffect(() => {
    if (isCashRegisterOpen && !showAfterOpenSteps) {
      // Limpar ref atual para forçar recálculo
      setTargetRef({ current: null });
      
      // Pequeno delay para permitir que a UI atualize
      const timer = setTimeout(() => {
        setShowAfterOpenSteps(true);
        setCurrentStep(0);
        toast.success('Caixa aberto com sucesso!', {
          description: 'Agora vamos aprender a registrar operações.'
        });
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isCashRegisterOpen, showAfterOpenSteps]);

  // Detectar abertura do modal de conclusão
  useEffect(() => {
    if (!isActive || !showAfterOpenSteps || showCompletionModalSteps) return;

    const checkForCompletionModal = () => {
      const modal = document.querySelector('[data-tutorial="order-review-table"]');
      if (modal) {
        setShowCompletionModalSteps(true);
        setCurrentStep(0);
        toast.info('Agora vamos aprender a finalizar o pedido!');
      }
    };

    // Usar MutationObserver para detectar mudanças no DOM
    const observer = new MutationObserver(checkForCompletionModal);
    observer.observe(document.body, { childList: true, subtree: true });

    // Verificar imediatamente também
    checkForCompletionModal();

    return () => observer.disconnect();
  }, [isActive, showAfterOpenSteps, showCompletionModalSteps]);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetRef({ current: element });
      } else {
        // Se o elemento não for encontrado, tentar novamente após um delay
        setTimeout(() => {
          const retryElement = document.querySelector(step.targetSelector) as HTMLElement;
          if (retryElement) {
            setTargetRef({ current: retryElement });
          }
        }, 500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (showCompletionModalSteps) {
      // Tutorial completo!
      toast.success('🎉 Parabéns! Você concluiu o tutorial!', {
        description: 'Agora você está pronto para usar o sistema PDV.'
      });
      onComplete();
    } else if (showAfterOpenSteps) {
      // Não fazer nada, aguardar o modal de conclusão abrir
      toast.info('Agora adicione itens e clique em FINALIZAR para continuar o tutorial!');
    } else {
      // Aguardar abrir o caixa
      toast.info('Clique em "Abrir Caixa" para continuar!');
    }
  };

  // Pausar tutorial quando modal estiver aberto ou não estiver ativo
  if (!isActive || isModalOpen) return null;

  const step = steps[currentStep];

  return (
    <>
      {targetRef.current && (
        <>
          <OnboardingSpotlight
            targetRef={targetRef}
            isActive={true}
            padding={getResponsivePadding(16)}
          />
          <OnboardingTooltip
            targetRef={targetRef}
            title={step.title}
            description={step.description}
            step={currentStep + 1}
            totalSteps={steps.length}
            position={getResponsivePosition(step.position)}
            onNext={handleNext}
            onPrev={currentStep > 0 ? handlePrev : undefined}
            onSkip={onSkip}
          />
        </>
      )}
    </>
  );
}
