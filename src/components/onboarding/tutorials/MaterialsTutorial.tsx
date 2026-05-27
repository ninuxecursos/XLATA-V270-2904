import React, { useState, useEffect } from 'react';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingSpotlight } from '../OnboardingSpotlight';
import { toast } from 'sonner';
import { useTutorialMobile } from '@/hooks/useTutorialMobile';
import { useNavigate } from 'react-router-dom';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

// Steps para a página de materiais
const MAIN_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Página de Materiais',
    description: 'Aqui você cadastra todos os materiais que compra e vende. Vamos configurar juntos!',
    targetSelector: '[data-tutorial="materials-header"]',
    position: 'bottom'
  },
  {
    id: 'config-button',
    title: 'Configurações',
    description: 'Clique aqui para acessar configurações avançadas como importar/exportar materiais.',
    targetSelector: '[data-tutorial="config-button"]',
    position: 'bottom'
  },
  {
    id: 'default-materials',
    title: 'Adicionar em Massa',
    description: 'Use "Materiais Padrão" para adicionar rapidamente uma lista de materiais comuns. Você pode editar os preços depois!',
    targetSelector: '[data-tutorial="default-materials-button"]',
    position: 'bottom'
  },
  {
    id: 'add-material',
    title: 'Adicionar Individual',
    description: 'Ou clique aqui para adicionar um material manualmente com nome e preços personalizados.',
    targetSelector: '[data-tutorial="add-material-button"]',
    position: 'bottom'
  },
  {
    id: 'material-card',
    title: 'Editar Preços',
    description: 'Para configurar preço de compra e venda, clique em qualquer material cadastrado.',
    targetSelector: '[data-tutorial="material-card"]',
    position: 'right'
  }
];

// Steps para quando o modal de edição estiver aberto
const EDIT_MODAL_STEPS: TutorialStep[] = [
  {
    id: 'price-buy',
    title: 'Preço de Compra',
    description: 'Digite o valor que você PAGA por kg deste material. Este é o preço de aquisição.',
    targetSelector: '[data-tutorial="price-buy-input"]',
    position: 'bottom'
  },
  {
    id: 'price-sell',
    title: 'Preço de Venda',
    description: 'Digite o valor que você VENDE por kg. A diferença entre venda e compra é seu lucro!',
    targetSelector: '[data-tutorial="price-sell-input"]',
    position: 'bottom'
  },
  {
    id: 'save-material',
    title: 'Salvar Material',
    description: 'Clique em Salvar para gravar as alterações. Configure os preços de todos os materiais que usar.',
    targetSelector: '[data-tutorial="save-material-button"]',
    position: 'top'
  }
];

interface MaterialsTutorialProps {
  isActive: boolean;
  materialsCount?: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function MaterialsTutorial({ isActive, materialsCount = 0, onComplete, onSkip }: MaterialsTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRef, setTargetRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { getResponsivePosition, getResponsivePadding } = useTutorialMobile();
  const navigate = useNavigate();

  // Detectar se o modal de edição está aberto
  useEffect(() => {
    if (!isActive) return;

    const checkForModal = () => {
      const modalElement = document.querySelector('[data-tutorial="price-buy-input"]');
      const wasOpen = isEditModalOpen;
      const isNowOpen = !!modalElement;
      
      if (isNowOpen && !wasOpen) {
        setIsEditModalOpen(true);
        setCurrentStep(0); // Reset para primeiro step do modal
      } else if (!isNowOpen && wasOpen) {
        setIsEditModalOpen(false);
        // Quando modal fecha, volta para o step de material-card
        const materialCardIndex = MAIN_STEPS.findIndex(s => s.id === 'material-card');
        setCurrentStep(materialCardIndex >= 0 ? materialCardIndex : 0);
      }
    };

    // Checar inicialmente
    checkForModal();

    // Observar mudanças no DOM
    const observer = new MutationObserver(checkForModal);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isActive, isEditModalOpen]);

  // Selecionar os steps corretos baseado no estado do modal
  const currentSteps = isEditModalOpen ? EDIT_MODAL_STEPS : MAIN_STEPS;

  useEffect(() => {
    if (!isActive) return;

    const step = currentSteps[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetRef({ current: element });
      } else {
        // Se não encontrar o elemento específico, tenta o próximo step
        if (currentStep < currentSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, isActive, currentSteps]);

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Se estiver no modal e terminou os steps do modal
      if (isEditModalOpen) {
        toast.success('Ótimo! Você configurou o material.', {
          description: 'Configure os preços de outros materiais ou finalize.'
        });
        // Volta para os steps principais no último step
        setIsEditModalOpen(false);
        setCurrentStep(MAIN_STEPS.length - 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Verificar se há materiais cadastrados
    if (materialsCount === 0) {
      toast.warning('Cadastre ao menos um material!', {
        description: 'É necessário ter materiais cadastrados para abrir o caixa.'
      });
      return;
    }
    
    toast.success('Materiais configurados!', {
      description: 'Agora vamos abrir o caixa para começar a operar.'
    });
    onComplete();
    // Redirecionar automaticamente para o PDV
    navigate('/');
  };

  if (!isActive) return null;

  const step = currentSteps[currentStep];

  return (
    <>
      {targetRef.current && (
        <>
          <OnboardingSpotlight
            targetRef={targetRef}
            isActive={true}
            padding={getResponsivePadding(12)}
          />
          <OnboardingTooltip
            targetRef={targetRef}
            title={step.title}
            description={step.description}
            step={currentStep + 1}
            totalSteps={currentSteps.length}
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
