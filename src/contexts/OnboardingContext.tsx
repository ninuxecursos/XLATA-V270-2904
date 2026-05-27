import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  pageVisits: Record<string, boolean>;
  featureUnlocks: string[];
  startedAt: string | null;
  completedAt: string | null;
  subStepsCompleted: Record<number, string[]>; // stepId -> [subStepIds]
  currentSubStep: string | null;
}

interface OnboardingContextType {
  // Estado
  progress: OnboardingProgress;
  isOnboardingActive: boolean;
  isLoading: boolean;
  shouldOpenCashRegister: boolean;
  isCashOpeningModalVisible: boolean;
  
  // Ações
  startOnboarding: () => Promise<void>;
  completeStep: (step: number) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  markPageVisited: (page: string) => Promise<void>;
  unlockFeature: (feature: string) => Promise<void>;
  completeSubStep: (stepId: number, subStepId: string) => Promise<void>;
  setCurrentSubStep: (subStepId: string | null) => void;
  requestOpenCashRegister: () => void;
  clearOpenCashRegisterRequest: () => void;
  setCashOpeningModalVisible: (v: boolean) => void;
  
  // Helpers
  isStepCompleted: (step: number) => boolean;
  isFeatureUnlocked: (feature: string) => boolean;
  hasVisitedPage: (page: string) => boolean;
  getUnlockedFeatures: () => string[];
  isSubStepCompleted: (stepId: number, subStepId: string) => boolean;
  getSubStepProgress: (stepId: number) => { completed: number; total: number };
}

const defaultProgress: OnboardingProgress = {
  currentStep: 0,
  completedSteps: [],
  pageVisits: {},
  featureUnlocks: [],
  startedAt: null,
  completedAt: null,
  subStepsCompleted: {},
  currentSubStep: null
};

// Definição de sub-passos para cada etapa
export const STEP_SUB_STEPS: Record<number, { id: string; label: string; hint: string; selector: string }[]> = {
  1: [
    { id: 'logo', label: 'Adicionar logo', hint: 'Clique para adicionar o logo', selector: '[data-tutorial="logo-upload"]' },
    { id: 'whatsapp1', label: 'Preencher WhatsApp', hint: 'Informe seu WhatsApp', selector: '[data-tutorial="whatsapp-input"]' },
    { id: 'address', label: 'Preencher endereço', hint: 'Informe o endereço', selector: '[data-tutorial="address-input"]' },
    { id: 'receipt', label: 'Escolher formato', hint: 'Escolha o formato do comprovante', selector: '[data-tutorial="receipt-format"]' },
    { id: 'save', label: 'Salvar configurações', hint: 'Clique em Salvar', selector: '[data-tutorial="save-button"]' },
  ],
  2: [
    { id: 'add', label: 'Adicionar material', hint: 'Adicione um material', selector: '[data-tutorial="add-material"]' },
    { id: 'price-buy', label: 'Configurar preço de compra', hint: 'Defina o preço de compra', selector: '[data-tutorial="price-buy"]' },
    { id: 'price-sell', label: 'Configurar preço de venda', hint: 'Defina o preço de venda', selector: '[data-tutorial="price-sell"]' },
  ],
  3: [
    { id: 'open', label: 'Abrir caixa', hint: 'Clique para abrir o caixa', selector: '[data-tutorial="open-cash"]' },
    { id: 'confirm', label: 'Confirmar abertura', hint: 'Confirme o valor inicial', selector: '[data-tutorial="confirm-cash"]' },
  ]
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Mapeamento de etapas para features desbloqueadas
export const STEP_FEATURE_MAP: Record<number, string[]> = {
  0: ['home', 'settings', 'guia-completo'],
  1: ['materials'], // Após configurar empresa
  2: ['dashboard', 'estoque'], // Após cadastrar materiais
  3: ['transacoes', 'pedidos-compra', 'pedidos-venda', 'fluxo-diario'], // Após primeira operação
};

// Nomes das etapas
export const ONBOARDING_STEPS = [
  { id: 0, name: 'Início', description: 'Bem-vindo ao XLata' },
  { id: 1, name: 'Configurar Empresa', description: 'Logo, WhatsApp e endereço' },
  { id: 2, name: 'Cadastrar Materiais', description: 'Preços de compra e venda' },
  { id: 3, name: 'Abrir Caixa', description: 'Primeira operação' },
];

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Use optional context access to avoid crash during initial render
  const authContext = useContext(AuthContext);
  const user: User | null = authContext?.user ?? null;
  const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    // Fallback: checar localStorage para evitar re-exibir tour se Supabase falhar
    if (typeof window !== 'undefined') {
      return localStorage.getItem('xlata_onboarding_completed') === 'true';
    }
    return false;
  });
  const [shouldOpenCashRegister, setShouldOpenCashRegister] = useState(false);
  const [isCashOpeningModalVisible, setCashOpeningModalVisible] = useState(false);

  // Carregar progresso do banco
  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setProgress(defaultProgress);
      setIsLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_progress, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const progressData = data.onboarding_progress as unknown as Partial<OnboardingProgress> | null;
        const mergedProgress: OnboardingProgress = {
          ...defaultProgress,
          ...(progressData || {}),
          subStepsCompleted: progressData?.subStepsCompleted && typeof progressData.subStepsCompleted === 'object' 
            ? progressData.subStepsCompleted 
            : {},
        };
        setProgress(mergedProgress);
        const completed = data.onboarding_completed || false;
        setOnboardingCompleted(completed);
        // Sincronizar localStorage
        if (completed) {
          localStorage.setItem('xlata_onboarding_completed', 'true');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar progresso do onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newProgress: OnboardingProgress, completed?: boolean) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {
        onboarding_progress: newProgress
      };
      
      if (completed !== undefined) {
        updateData.onboarding_completed = completed;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao salvar progresso do onboarding:', error);
      }

      setProgress(newProgress);
      if (completed !== undefined) {
        setOnboardingCompleted(completed);
        // Sincronizar localStorage como fallback
        if (completed) {
          localStorage.setItem('xlata_onboarding_completed', 'true');
        } else {
          localStorage.removeItem('xlata_onboarding_completed');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar progresso do onboarding:', error);
      // Mesmo com erro, atualizar estado local para não travar a UX
      setProgress(newProgress);
      if (completed !== undefined) {
        setOnboardingCompleted(completed);
        if (completed) {
          localStorage.setItem('xlata_onboarding_completed', 'true');
        }
      }
    }
  };

  const startOnboarding = useCallback(async () => {
    const newProgress: OnboardingProgress = {
      ...defaultProgress,
      currentStep: 1,
      startedAt: new Date().toISOString(),
      featureUnlocks: STEP_FEATURE_MAP[0] || []
    };
    await saveProgress(newProgress);
  }, [user]);

  const completeStep = useCallback(async (step: number) => {
    const newCompletedSteps = [...progress.completedSteps];
    if (!newCompletedSteps.includes(step)) {
      newCompletedSteps.push(step);
    }

    // Desbloquear features da próxima etapa
    const newUnlocks = [...progress.featureUnlocks];
    const stepFeatures = STEP_FEATURE_MAP[step] || [];
    stepFeatures.forEach(feature => {
      if (!newUnlocks.includes(feature)) {
        newUnlocks.push(feature);
      }
    });

    const nextStep = step + 1;
    const isComplete = nextStep > 3;

    const newProgress: OnboardingProgress = {
      ...progress,
      currentStep: isComplete ? 3 : nextStep,
      completedSteps: newCompletedSteps,
      featureUnlocks: newUnlocks,
      completedAt: isComplete ? new Date().toISOString() : null
    };

    await saveProgress(newProgress, isComplete);
  }, [progress, user]);

  const skipOnboarding = useCallback(async () => {
    // Desbloquear todas as features
    const allFeatures = Object.values(STEP_FEATURE_MAP).flat();
    
    const newProgress: OnboardingProgress = {
      ...progress,
      currentStep: 3,
      completedSteps: [1, 2, 3],
      featureUnlocks: allFeatures,
      completedAt: new Date().toISOString()
    };

    await saveProgress(newProgress, true);
  }, [progress, user]);

  const resetOnboarding = useCallback(async () => {
    await saveProgress(defaultProgress, false);
  }, [user]);

  const markPageVisited = useCallback(async (page: string) => {
    if (progress.pageVisits[page]) return;

    const newProgress: OnboardingProgress = {
      ...progress,
      pageVisits: {
        ...progress.pageVisits,
        [page]: true
      }
    };

    await saveProgress(newProgress);
  }, [progress, user]);

  const unlockFeature = useCallback(async (feature: string) => {
    if (progress.featureUnlocks.includes(feature)) return;

    const newProgress: OnboardingProgress = {
      ...progress,
      featureUnlocks: [...progress.featureUnlocks, feature]
    };

    await saveProgress(newProgress);
  }, [progress, user]);

  const isStepCompleted = useCallback((step: number) => {
    return progress.completedSteps.includes(step);
  }, [progress.completedSteps]);

  const isFeatureUnlocked = useCallback((feature: string) => {
    // Se onboarding completo, todas as features estão desbloqueadas
    if (onboardingCompleted) return true;
    // Se ainda não iniciou onboarding, apenas features iniciais
    if (progress.currentStep === 0) {
      return STEP_FEATURE_MAP[0]?.includes(feature) || false;
    }
    return progress.featureUnlocks.includes(feature);
  }, [progress.featureUnlocks, progress.currentStep, onboardingCompleted]);

  const hasVisitedPage = useCallback((page: string) => {
    return progress.pageVisits[page] || false;
  }, [progress.pageVisits]);

  const getUnlockedFeatures = useCallback(() => {
    if (onboardingCompleted) {
      return Object.values(STEP_FEATURE_MAP).flat();
    }
    return progress.featureUnlocks;
  }, [progress.featureUnlocks, onboardingCompleted]);

  const completeSubStep = useCallback(async (stepId: number, subStepId: string) => {
    const currentSubSteps = progress.subStepsCompleted[stepId] || [];
    if (currentSubSteps.includes(subStepId)) return;

    const newSubStepsCompleted = {
      ...progress.subStepsCompleted,
      [stepId]: [...currentSubSteps, subStepId]
    };

    const newProgress: OnboardingProgress = {
      ...progress,
      subStepsCompleted: newSubStepsCompleted
    };

    await saveProgress(newProgress);
  }, [progress, user]);

  const setCurrentSubStep = useCallback((subStepId: string | null) => {
    setProgress(prev => ({
      ...prev,
      currentSubStep: subStepId
    }));
  }, []);

  const isSubStepCompleted = useCallback((stepId: number, subStepId: string) => {
    if (!progress.subStepsCompleted || typeof progress.subStepsCompleted !== 'object') {
      return false;
    }
    const subSteps = progress.subStepsCompleted[stepId];
    if (!Array.isArray(subSteps)) {
      return false;
    }
    return subSteps.includes(subStepId);
  }, [progress.subStepsCompleted]);

  const getSubStepProgress = useCallback((stepId: number) => {
    const stepSubSteps = STEP_SUB_STEPS[stepId];
    if (!stepSubSteps || !Array.isArray(stepSubSteps)) {
      return { completed: 0, total: 0 };
    }
    
    const completedSubSteps = progress.subStepsCompleted?.[stepId];
    const completedCount = Array.isArray(completedSubSteps) ? completedSubSteps.length : 0;
    
    return {
      completed: completedCount,
      total: stepSubSteps.length
    };
  }, [progress.subStepsCompleted]);

  const requestOpenCashRegister = useCallback(() => {
    setShouldOpenCashRegister(true);
  }, []);

  const clearOpenCashRegisterRequest = useCallback(() => {
    setShouldOpenCashRegister(false);
  }, []);

  const isOnboardingActive = useMemo(() => {
    return !onboardingCompleted && progress.currentStep > 0;
  }, [onboardingCompleted, progress.currentStep]);

  const value = useMemo(() => ({
    progress,
    isOnboardingActive,
    isLoading,
    shouldOpenCashRegister,
    isCashOpeningModalVisible,
    startOnboarding,
    completeStep,
    skipOnboarding,
    resetOnboarding,
    markPageVisited,
    unlockFeature,
    completeSubStep,
    setCurrentSubStep,
    requestOpenCashRegister,
    clearOpenCashRegisterRequest,
    setCashOpeningModalVisible,
    isStepCompleted,
    isFeatureUnlocked,
    hasVisitedPage,
    getUnlockedFeatures,
    isSubStepCompleted,
    getSubStepProgress
  }), [
    progress,
    isOnboardingActive,
    isLoading,
    shouldOpenCashRegister,
    isCashOpeningModalVisible,
    startOnboarding,
    completeStep,
    skipOnboarding,
    resetOnboarding,
    markPageVisited,
    unlockFeature,
    completeSubStep,
    setCurrentSubStep,
    requestOpenCashRegister,
    clearOpenCashRegisterRequest,
    isStepCompleted,
    isFeatureUnlocked,
    hasVisitedPage,
    getUnlockedFeatures,
    isSubStepCompleted,
    getSubStepProgress
  ]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
