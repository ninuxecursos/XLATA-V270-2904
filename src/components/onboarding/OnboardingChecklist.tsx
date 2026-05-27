import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ChevronRight, X, Settings, Package, DollarSign, Loader2, MousePointerClick } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS, STEP_SUB_STEPS } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OnboardingStepProgress } from './OnboardingStepProgress';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

const stepIcons = {
  1: Settings,
  2: Package,
  3: DollarSign
};

const stepRoutes = {
  1: '/configuracoes',
  2: '/materiais',
  3: '/pdv'
};

export function OnboardingChecklist() {
  const { 
    progress, 
    isOnboardingActive, 
    isStepCompleted, 
    skipOnboarding,
    getSubStepProgress,
    isSubStepCompleted,
    markPageVisited,
    requestOpenCashRegister,
    isCashOpeningModalVisible
  } = useOnboarding();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (!isOnboardingActive) return null;
  // Oculta o checklist enquanto o modal de Abertura de Caixa estiver aberto
  // para evitar sobreposição com a UI do modal.
  if (isCashOpeningModalVisible) return null;

  const completedCount = progress.completedSteps.length;
  const totalSteps = ONBOARDING_STEPS.length - 1;
  const progressPercent = (completedCount / totalSteps) * 100;

  const handleStepClick = async (stepId: number) => {
    const route = stepRoutes[stepId as keyof typeof stepRoutes];
    if (route) {
      setIsNavigating(true);
      
      // Marcar página como visitada
      await markPageVisited(route);
      
      // Se for o step 3 (Abrir Caixa), sinalizar para abrir o modal
      if (stepId === 3) {
        requestOpenCashRegister();
      }
      
      // Minimizar modal primeiro
      setIsMinimized(true);
      
      // Aguardar um frame para garantir que o modal fechou e então navegar
      requestAnimationFrame(() => {
        navigate(route);
        setIsNavigating(false);
      });
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  // Minimized state - FAB style for all devices
  if (isMinimized) {
    return (
      <div className={cn(
        "fixed z-[70]",
        isMobile ? "bottom-20 right-4 safe-area-bottom" : "bottom-4 right-4"
      )}>
        <Button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl flex items-center gap-2 transition-all duration-300 animate-pulse-normal ring-2 ring-emerald-400/60",
            isMobile 
              ? "rounded-full w-14 h-14 p-0 justify-center" 
              : "rounded-full px-4 py-2"
          )}
        >
          {isNavigating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className={cn(
              "font-bold",
              isMobile ? "text-sm" : "text-base"
            )}>
              {Math.round(progressPercent)}%
            </span>
          )}
          {!isMobile && <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  // Mobile: Modal que abre do TOPO
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[70] pointer-events-none">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={() => setIsMinimized(true)}
        />
        
        {/* Sheet - Abre do TOPO */}
        <div className="absolute top-0 left-0 right-0 animate-in slide-in-from-top duration-300 pointer-events-auto safe-area-top">
          <Card className="bg-slate-900 border-slate-700 rounded-b-3xl overflow-hidden shadow-2xl max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-lg">Configuração</span>
                  <p className="text-white/70 text-sm">{completedCount}/{totalSteps} etapas</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
                onClick={() => setIsMinimized(true)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3 border-b border-slate-800">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Progresso</span>
                <span className="font-medium text-emerald-400">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>

            {/* Steps - Scrollable */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 hide-scrollbar">
              {ONBOARDING_STEPS.slice(1).map((step) => {
                const Icon = stepIcons[step.id as keyof typeof stepIcons];
                const completed = isStepCompleted(step.id);
                const isCurrent = progress.currentStep === step.id;
                const subStepProgress = getSubStepProgress(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={isNavigating}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left active:scale-[0.98] relative",
                      completed 
                        ? "bg-emerald-500/15 border border-emerald-500/30" 
                        : isCurrent 
                          ? "bg-slate-800 ring-2 ring-emerald-500/70 animate-pulse-strong shadow-lg shadow-emerald-500/20" 
                          : "bg-slate-800/50",
                      isNavigating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isCurrent && !completed && (
                      <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                        AGORA
                      </span>
                    )}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      completed ? "bg-emerald-500" : isCurrent ? "bg-emerald-600 animate-pulse-normal" : "bg-slate-700"
                    )}>
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : Icon ? (
                        <Icon className="w-6 h-6 text-white" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-base font-semibold",
                        completed ? "text-emerald-400" : "text-white"
                      )}>
                        {step.name}
                      </p>
                      <p className="text-sm text-slate-400 line-clamp-1">{step.description}</p>
                    </div>
                    {isCurrent && !completed && (
                      <>
                        <span className="text-sm bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-semibold">
                          {subStepProgress.completed}/{subStepProgress.total}
                        </span>
                        <ChevronRight className="w-5 h-5 text-emerald-400 animate-bounce-x flex-shrink-0" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Skip button */}
            <div className="px-5 py-4 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isNavigating}
                className="w-full text-slate-400 hover:text-slate-200 h-12 rounded-xl"
              >
                Pular configuração
              </Button>
            </div>

            {/* Handle bar no final */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Tablet: Card no topo direito
  if (isTablet) {
    return (
      <Card className="fixed top-4 right-4 z-[70] w-80 bg-gray-900/98 border-gray-700 shadow-2xl overflow-hidden rounded-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base">Configuração Inicial</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              onClick={() => setIsMinimized(true)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progresso</span>
            <span className="font-medium">{completedCount}/{totalSteps} completos</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Steps */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {ONBOARDING_STEPS.slice(1).map((step) => {
              const Icon = stepIcons[step.id as keyof typeof stepIcons];
              const completed = isStepCompleted(step.id);
              const isCurrent = progress.currentStep === step.id;
              const subStepProgress = getSubStepProgress(step.id);
              const subSteps = STEP_SUB_STEPS[step.id] || [];

              return (
                <div key={step.id}>
                  <button
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left relative",
                      completed
                        ? "bg-green-500/10"
                        : isCurrent
                          ? "bg-gray-800 ring-2 ring-green-500/70 animate-pulse-strong shadow-lg shadow-emerald-500/20"
                          : "bg-gray-800/50 hover:bg-gray-800"
                    )}
                  >
                    {isCurrent && !completed && (
                      <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                        AGORA
                      </span>
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      completed ? "bg-green-500" : isCurrent ? "bg-green-600 animate-pulse-normal" : "bg-gray-700"
                    )}>
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        completed ? "text-green-400" : "text-white"
                      )}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{step.description}</p>
                    </div>
                    {isCurrent && !completed && (
                      <>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg">
                          {subStepProgress.completed}/{subStepProgress.total}
                        </span>
                        <ChevronRight className="w-4 h-4 text-emerald-400 animate-bounce-x flex-shrink-0" />
                      </>
                    )}
                  </button>

                  {isCurrent && !completed && subSteps && subSteps.length > 0 && (
                    <OnboardingStepProgress
                      stepName={step.name}
                      subSteps={subSteps.map(s => ({
                        id: s.id,
                        label: s.label,
                        completed: isSubStepCompleted(step.id, s.id)
                      }))}
                      className="mt-2 ml-13"
                    />
                  )}
                </div>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="w-full text-gray-500 hover:text-gray-300 text-sm mt-2"
            >
              Pular configuração
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Desktop: Original layout with minor improvements
  return (
    <Card className="fixed bottom-[4.5rem] right-4 z-[70] w-72 bg-gray-900 border-gray-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Configuração Inicial</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Progresso</span>
          <span>{completedCount}/{totalSteps} completos</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {ONBOARDING_STEPS.slice(1).map((step) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons];
            const completed = isStepCompleted(step.id);
            const isCurrent = progress.currentStep === step.id;
            const subStepProgress = getSubStepProgress(step.id);
            const subSteps = STEP_SUB_STEPS[step.id] || [];

            return (
              <div key={step.id}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left relative",
                    completed
                      ? "bg-green-500/10"
                      : isCurrent
                        ? "bg-gray-800 ring-2 ring-green-500/70 animate-pulse-strong shadow-lg shadow-emerald-500/20"
                        : "bg-gray-800/50 hover:bg-gray-800"
                  )}
                >
                  {isCurrent && !completed && (
                    <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                      AGORA
                    </span>
                  )}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    completed ? "bg-green-500" : isCurrent ? "bg-green-600 animate-pulse-normal" : "bg-gray-700"
                  )}>
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : Icon ? (
                      <Icon className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      completed ? "text-green-400" : "text-white"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  </div>
                  {isCurrent && !completed && (
                    <>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        {subStepProgress.completed}/{subStepProgress.total}
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-400 animate-bounce-x flex-shrink-0" />
                    </>
                  )}
                </button>

                {isCurrent && !completed && subSteps && subSteps.length > 0 && (
                  <OnboardingStepProgress
                    stepName={step.name}
                    subSteps={subSteps.map(s => ({
                      id: s.id,
                      label: s.label,
                      completed: isSubStepCompleted(step.id, s.id)
                    }))}
                    className="mt-2 ml-11"
                  />
                )}
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="w-full text-gray-500 hover:text-gray-300 text-xs mt-2"
          >
            Pular configuração
          </Button>
        </div>
      )}
    </Card>
  );
}
