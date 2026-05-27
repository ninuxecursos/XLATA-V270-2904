import React, { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingCompletionModal } from './OnboardingCompletionModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper que detecta quando o onboarding é concluído e exibe o modal de celebração.
 * Usa uma ref para detectar a transição de ativo → completo.
 */
export function OnboardingCompletionWrapper() {
  const { isOnboardingActive, progress } = useOnboarding();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState('');
  const wasActiveRef = useRef(false);

  // Detectar transição de onboarding ativo → completo
  useEffect(() => {
    if (isOnboardingActive) {
      wasActiveRef.current = true;
    } else if (wasActiveRef.current && progress.completedAt) {
      // Onboarding acabou de ser completado (não pulado)
      // Verificar se todos os 3 steps foram completados
      const allCompleted = [1, 2, 3].every(s => progress.completedSteps.includes(s));
      if (allCompleted) {
        setShowModal(true);
      }
      wasActiveRef.current = false;
    }
  }, [isOnboardingActive, progress.completedAt, progress.completedSteps]);

  // Carregar nome do usuário
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.name) setUserName(data.name);
      });
  }, [user]);

  return (
    <OnboardingCompletionModal
      open={showModal}
      onClose={() => setShowModal(false)}
      userName={userName}
    />
  );
}