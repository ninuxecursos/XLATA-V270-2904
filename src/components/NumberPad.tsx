import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NumberPadProps {
  onSubmit: (value: number) => void;
  onClear: () => void;
  value?: string | number;
  disableAutoFocus?: boolean;
}

const NumberPad: React.FC<NumberPadProps> = ({ onSubmit, onClear, value, disableAutoFocus = false }) => {
  // Estado interno com valor numérico limpo (sem formatação)
  const [internalValue, setInternalValue] = useState(0);
  const [hasModalOpen, setHasModalOpen] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);
  const focusIntervalRef = useRef<NodeJS.Timeout>();
  const modalObserverRef = useRef<MutationObserver>();

  useEffect(() => {
    if (value !== undefined && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      setInternalValue(isNaN(numValue) ? 0 : numValue);
    } else {
      setInternalValue(0);
    }
  }, [value]);

  // Detecta se há modais abertos no DOM com melhor precisão
  const checkForModals = useCallback(() => {
    // Verifica por diferentes tipos de modais e overlays
    const modalSelectors = [
      '[role="dialog"]',
      '[data-state="open"]',
      '.modal',
      '.dialog',
      '[data-radix-dialog-content]',
      '[data-radix-alert-dialog-content]',
      '.fixed.z-50', // Overlay padrão do shadcn
      'div[style*="position: fixed"]' // Modais com position fixed
    ];
    
    const modals = document.querySelectorAll(modalSelectors.join(', '));
    
    // Filtra apenas modais que estão realmente visíveis
    const visibleModals = Array.from(modals).filter(modal => {
      const style = window.getComputedStyle(modal as Element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    
    // Verifica também se há inputs com foco (especialmente inputs de senha)
    const activeElement = document.activeElement;
    const hasInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    const hasModal = visibleModals.length > 0 || hasInputFocused;
    setHasModalOpen(hasModal);
    
    // Log removido para performance
    
    return hasModal;
  }, []);

  // Observer para detectar mudanças no DOM (abertura/fechamento de modais)
  useEffect(() => {
    checkForModals();

    modalObserverRef.current = new MutationObserver(() => {
      // Immediate check for better responsiveness
      requestAnimationFrame(checkForModals);
    });

    modalObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'data-state', 'class', 'style']
    });

    // Listener para mudanças de foco
    const handleFocusChange = () => {
      requestAnimationFrame(checkForModals);
    };

    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);

    return () => {
      if (modalObserverRef.current) {
        modalObserverRef.current.disconnect();
      }
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, [checkForModals]);

  // Sistema de auto-focus - agora mais inteligente
  const maintainFocus = useCallback(() => {
    // Não faz nada se o auto-focus estiver desabilitado ou se há modal aberto
    if (disableAutoFocus || hasModalOpen) return;
    
    // Verifica novamente se não há inputs focados antes de focar no display
    const activeElement = document.activeElement;
    const hasInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    if (hasInputFocused) return;
    
    if (displayRef.current && document.activeElement !== displayRef.current) {
      displayRef.current.focus();
    }
  }, [disableAutoFocus, hasModalOpen]);

  // Auto-focus inicial quando o componente é montado
  useEffect(() => {
    if (!disableAutoFocus && !hasModalOpen) {
      const timer = setTimeout(maintainFocus, 16); // 60fps timing
      return () => clearTimeout(timer);
    }
  }, [maintainFocus, disableAutoFocus, hasModalOpen]);

  // Sistema de auto-focus contínuo - mais conservador
  useEffect(() => {
    // Se o auto-focus estiver desabilitado ou há modal aberto, limpa qualquer interval existente
    if (disableAutoFocus || hasModalOpen) {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = undefined;
      }
      return;
    }

    // Configura interval para manter o foco - menos agressivo
    focusIntervalRef.current = setInterval(() => {
      maintainFocus();
    }, 500); // Reduzido de 100ms para 500ms

    // Event listeners para capturar mudanças de foco - mais seletivos
    const handleFocusOut = (e: FocusEvent) => {
      // Só tenta recuperar o foco se não for para um input ou modal
      const relatedTarget = e.relatedTarget as Element;
      if (relatedTarget && (
        relatedTarget.tagName === 'INPUT' || 
        relatedTarget.tagName === 'TEXTAREA' ||
        relatedTarget.closest('[role="dialog"]') ||
        relatedTarget.closest('.modal')
      )) {
        return; // Não tenta recuperar o foco
      }
      
      if (!disableAutoFocus && !hasModalOpen) {
        requestAnimationFrame(maintainFocus);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !disableAutoFocus && !hasModalOpen) {
        requestAnimationFrame(maintainFocus);
      }
    };

    // Adiciona event listeners
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Limpa o interval
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
      
      // Remove event listeners
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [maintainFocus, disableAutoFocus, hasModalOpen]);

  // Força foco após qualquer mudança no valor interno - mais seletivo
  useEffect(() => {
    if (!disableAutoFocus && !hasModalOpen) {
      // Só tenta focar se não há inputs ativos
      const activeElement = document.activeElement;
      const hasInputActive = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA'
      );
      
      if (!hasInputActive) {
        requestAnimationFrame(maintainFocus);
      }
    }
  }, [internalValue, maintainFocus, disableAutoFocus, hasModalOpen]);

  // Formatação do visor com máscara "999.999,999"
  const formatDisplay = useCallback((num: number): string => {
    const formatted = num.toFixed(3);
    const [integerPart, decimalPart] = formatted.split('.');
    
    // Adiciona pontos a cada 3 dígitos na parte inteira
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedInteger},${decimalPart}`;
  }, []);

  // Handler para entrada via teclado físico
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Se há modal aberto, não processa teclas
    if (hasModalOpen) {
      return;
    }
    
    e.preventDefault();
    
    if (e.key >= '0' && e.key <= '9') {
      handleDigitClick(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleClear();
    } else if (e.key === 'Escape') {
      handleZeroScale();
    }
    
    // Garante que o foco permaneça após qualquer tecla (apenas se não estiver desabilitado e sem modais)
    if (!disableAutoFocus && !hasModalOpen) {
      requestAnimationFrame(maintainFocus);
    }
  }, [maintainFocus, disableAutoFocus, hasModalOpen]);

  // Handler para clique nos números
  const handleDigitClick = useCallback((digit: string) => {
    setInternalValue(prevValue => {
      // Converte o valor atual para string sem vírgula para manipulação
      const currentStr = prevValue.toFixed(3).replace('.', '');
      
      // Adiciona o novo dígito à direita e mantém no máximo 9 dígitos
      const newStr = (currentStr + digit).slice(-9);
      
      // Converte de volta para número com 3 casas decimais
      const newValue = parseInt(newStr) / 1000;
      
      return newValue;
    });
  }, []);

  // Handler para o botão "C" (Clear/Limpar)
  const handleClear = useCallback(() => {
    setInternalValue(prevValue => {
      // Converte para string sem vírgula e remove o último dígito
      const currentStr = prevValue.toFixed(3).replace('.', '');
      
      // Remove o último dígito e adiciona zero à esquerda
      const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
      
      // Converte de volta para número
      const newValue = parseInt(newStr) / 1000;
      
      return newValue;
    });
  }, []);

  // Handler para zerar a balança
  const handleZeroScale = useCallback(() => {
    setInternalValue(0);
    onClear();
  }, [onClear]);

  // Submit automático quando o valor muda
  useEffect(() => {
    const timer = setTimeout(() => {
      onSubmit(internalValue);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [internalValue, onSubmit]);

  return (
    <div className="flex flex-col h-full w-full p-2 bg-slate-900 min-h-0">
      {/* Display com formatação de balança - mantendo verde original */}
      <div 
        ref={displayRef}
        className="h-24 shrink-0 bg-slate-950 flex items-center justify-center px-4 py-2 outline-none cursor-text border border-slate-700 rounded-sm"
        tabIndex={disableAutoFocus || hasModalOpen ? -1 : 0}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          const relatedTarget = e.relatedTarget as Element;
          if (relatedTarget && (
            relatedTarget.tagName === 'INPUT' || 
            relatedTarget.tagName === 'TEXTAREA' ||
            relatedTarget.closest('[role="dialog"]') ||
            relatedTarget.closest('.modal')
          )) {
            return;
          }
          
          if (!disableAutoFocus && !hasModalOpen) {
            maintainFocus();
          }
        }}
        onFocus={() => {}}
        style={{ userSelect: 'none' }}
      >
        <span className="text-5xl font-sans font-bold text-emerald-400">
          {formatDisplay(internalValue)}
        </span>
      </div>

      {/* Teclado numérico */}
      <div className="flex-1 grid grid-cols-3 auto-rows-fr gap-[2px] p-[2px] bg-slate-800 mt-1 min-h-0">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button 
            key={digit}
            className="numpad-btn transform active:scale-95 transition-all duration-150" 
            onClick={() => handleDigitClick(digit)}
          >
            {digit}
          </button>
        ))}
        
        {/* Quarta linha: 0 (2 colunas) e C (1 coluna) */}
        <button 
          className="numpad-btn col-span-2 transform active:scale-95 transition-all duration-150" 
          onClick={() => handleDigitClick('0')}
        >
          0
        </button>
        <button 
          className="numpad-btn clear-btn transform active:scale-95 transition-all duration-150" 
          onClick={handleClear}
        >
          C
        </button>
      </div>

      {/* Botão Zerar Balança */}
      <div className="shrink-0 grid grid-cols-1 gap-[2px] p-[2px] bg-slate-800 mt-1">
        <button 
          className="numpad-btn zero-scale-btn text-zerar-scale text-xl min-h-12 transform active:scale-95 transition-all duration-150" 
          onClick={handleZeroScale}
        >
          ZERAR BALANÇA
        </button>
      </div>
    </div>
  );
};

export default NumberPad;
