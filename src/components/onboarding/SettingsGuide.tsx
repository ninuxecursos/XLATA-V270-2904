import React, { useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingGuideBanner } from './OnboardingGuideBanner';

interface SettingsGuideProps {
  settings: {
    logo: string | null;
    whatsapp1: string;
    address: string;
  };
  /** Mantido por compat — não é mais usado para navegação automática */
  onStepComplete?: () => void;
}

/**
 * Guia da etapa 1 (Configurar Empresa).
 *
 * Versão simplificada: apenas observa o estado dos campos e marca sub-steps
 * concluídos automaticamente. Toda a UI fica concentrada em
 * <OnboardingGuideBanner /> — sem spotlight nem pulses que possam "buggar"
 * quando o usuário interage com inputs.
 */
export function SettingsGuide({ settings }: SettingsGuideProps) {
  const {
    progress,
    isOnboardingActive,
    completeSubStep,
    isSubStepCompleted,
    skipOnboarding,
  } = useOnboarding();

  // Detectar preenchimento automático dos campos
  useEffect(() => {
    if (!isOnboardingActive || progress.currentStep !== 1) return;

    if (settings.logo && !isSubStepCompleted(1, 'logo')) {
      completeSubStep(1, 'logo');
    }
    if (
      settings.whatsapp1 &&
      settings.whatsapp1.length >= 10 &&
      !isSubStepCompleted(1, 'whatsapp1')
    ) {
      completeSubStep(1, 'whatsapp1');
    }
    if (
      settings.address &&
      settings.address.length >= 10 &&
      !isSubStepCompleted(1, 'address')
    ) {
      completeSubStep(1, 'address');
    }
  }, [settings, isOnboardingActive, progress.currentStep, completeSubStep, isSubStepCompleted]);

  if (!isOnboardingActive || progress.currentStep !== 1) return null;

  const logoDone = !!settings.logo;
  const whatsappDone = !!settings.whatsapp1 && settings.whatsapp1.length >= 10;
  const addressDone = !!settings.address && settings.address.length >= 10;

  return (
    <OnboardingGuideBanner
      step={1}
      title="Configure os dados da empresa"
      subtitle="Esses dados aparecem nos comprovantes impressos para seus clientes."
      instructions={[
        { text: 'Adicione o logo da empresa (toque na foto à esquerda)', done: logoDone },
        { text: 'Informe o WhatsApp principal (com DDD)', done: whatsappDone },
        { text: 'Preencha o endereço completo', done: addressDone },
        { text: 'Toque em "Salvar configurações" no fim da página', done: false },
      ]}
      successMessage='Tudo preenchido! Agora é só tocar em "Salvar configurações".'
      onSkip={skipOnboarding}
      className="mb-4"
    />
  );
}

// Export a hook for Settings page to use
export function useSettingsGuide() {
  const { isOnboardingActive, progress, completeSubStep, completeStep, isSubStepCompleted } = useOnboarding();

  const handleSaveWithOnboarding = async (saveFunction: () => Promise<void>) => {
    await saveFunction();

    if (isOnboardingActive && progress.currentStep === 1) {
      await completeSubStep(1, 'save');
      await completeStep(1);
    }
  };

  return {
    handleSaveWithOnboarding,
    isOnboardingActive,
    currentStep: progress.currentStep
  };
}
