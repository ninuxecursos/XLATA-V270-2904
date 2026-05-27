import React, { useState, useRef, useEffect } from 'react';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingSpotlight } from '../OnboardingSpotlight';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTutorialMobile } from '@/hooks/useTutorialMobile';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'logo',
    title: 'Logo da Empresa',
    description: 'Clique aqui para adicionar o logo da sua empresa. Ele aparecerá nos comprovantes.',
    targetSelector: '[data-tutorial="logo-upload"]',
    position: 'right'
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp para Contato',
    description: 'Informe os números de WhatsApp para que seus clientes possam entrar em contato.',
    targetSelector: '[data-tutorial="whatsapp-input"]',
    position: 'right'
  },
  {
    id: 'address',
    title: 'Endereço do Depósito',
    description: 'Adicione o endereço completo. Isso aparece no comprovante e ajuda seus clientes.',
    targetSelector: '[data-tutorial="address-input"]',
    position: 'top'
  },
  {
    id: 'receipt',
    title: 'Formato do Comprovante',
    description: 'Escolha entre 50mm ou 80mm conforme sua impressora térmica.',
    targetSelector: '[data-tutorial="receipt-format"]',
    position: 'left'
  },
  {
    id: 'save',
    title: 'Salvar Configurações',
    description: 'Ótimo! Agora clique em Salvar para continuar para a próxima etapa.',
    targetSelector: '[data-tutorial="save-button"]',
    position: 'top'
  }
];

interface SettingsTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function SettingsTutorial({ isActive, onComplete, onSkip }: SettingsTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRef, setTargetRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const navigate = useNavigate();
  const { getResponsivePosition, getResponsivePadding } = useTutorialMobile();

  useEffect(() => {
    if (!isActive) return;

    const step = TUTORIAL_STEPS[currentStep];
    if (!step) return;

    // Pequeno delay para garantir que os elementos estão renderizados
    const timer = setTimeout(() => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetRef({ current: element });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
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
    toast.success('Configurações salvas!', {
      description: 'Agora vamos cadastrar seus materiais.'
    });
    onComplete();
    // Redirecionar automaticamente para a página de materiais
    navigate('/materiais');
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive) return null;

  const step = TUTORIAL_STEPS[currentStep];

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
            totalSteps={TUTORIAL_STEPS.length}
            position={getResponsivePosition(step.position)}
            onNext={handleNext}
            onPrev={currentStep > 0 ? handlePrev : undefined}
            onSkip={handleSkip}
          />
        </>
      )}
    </>
  );
}
