import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface NumberPadAutomaticMode {
  connected: boolean;
  weight: number | null;
  stable?: boolean;
  error?: string | null;
  nickname?: string;
  onReconnect?: () => void;
  onZero?: () => void;
  onUseManual?: () => void;
}

interface NumberPadOptimizedProps {
  onSubmit: (value: number) => void;
  onClear: () => void;
  value?: string | number;
  disableAutoFocus?: boolean;
  automaticMode?: NumberPadAutomaticMode | null;
}

const NumberPadOptimized: React.FC<NumberPadOptimizedProps> = ({ 
  onSubmit, 
  onClear, 
  value, 
  disableAutoFocus = false,
  automaticMode = null,
}) => {
  const [internalValue, setInternalValue] = useState(0);
  const displayRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<number>();
  const lastSubmittedRef = useRef<number>(0);

  // Sync external value - otimizado
  useEffect(() => {
    if (value !== undefined && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const newValue = isNaN(numValue) ? 0 : numValue;
      if (newValue !== internalValue) {
        setInternalValue(newValue);
      }
    } else if (internalValue !== 0) {
      setInternalValue(0);
    }
  }, [value]);

  // Auto-focus apenas no mount inicial
  useEffect(() => {
    if (!disableAutoFocus && displayRef.current) {
      displayRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Formatação do visor otimizada
  const formatDisplay = useCallback((num: number): string => {
    const formatted = num.toFixed(3);
    const [integerPart, decimalPart] = formatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger},${decimalPart}`;
  }, []);

  // Submit otimizado - SEM debounce para resposta instantânea
  useEffect(() => {
    // Evita submits duplicados
    if (internalValue === lastSubmittedRef.current) return;

    if (submitTimeoutRef.current) {
      cancelAnimationFrame(submitTimeoutRef.current);
    }

    // Resposta instantânea sem setTimeout
    submitTimeoutRef.current = requestAnimationFrame(() => {
      if (internalValue !== lastSubmittedRef.current) {
        lastSubmittedRef.current = internalValue;
        onSubmit(internalValue);
      }
    });

    return () => {
      if (submitTimeoutRef.current) {
        cancelAnimationFrame(submitTimeoutRef.current);
      }
    };
  }, [internalValue, onSubmit]);

  // Handler para clique nos números - otimizado
  const handleDigitClick = useCallback((digit: string) => {
    setInternalValue(prevValue => {
      const currentStr = prevValue.toFixed(3).replace('.', '');
      const newStr = (currentStr + digit).slice(-9);
      return parseInt(newStr) / 1000;
    });
  }, []);

  // Handler para clear - otimizado
  const handleClear = useCallback(() => {
    setInternalValue(prevValue => {
      const currentStr = prevValue.toFixed(3).replace('.', '');
      const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
      return parseInt(newStr) / 1000;
    });
  }, []);

  // Handler para zerar balança
  const handleZeroScale = useCallback(() => {
    setInternalValue(0);
    lastSubmittedRef.current = 0;
    onClear();
  }, [onClear]);

  // Handler para entrada via teclado - otimizado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    
    if (e.key >= '0' && e.key <= '9') {
      handleDigitClick(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleClear();
    } else if (e.key === 'Escape') {
      handleZeroScale();
    }
  }, [handleDigitClick, handleClear, handleZeroScale]);

  // Handler de blur - não tenta recuperar foco (o listener global cuida da entrada)
  const handleBlur = useCallback(() => {
    // Não faz nada - o listener global de teclado cuida da entrada
  }, []);

  const isAuto = !!automaticMode;
  const statusColor = isAuto
    ? automaticMode!.error
      ? 'bg-red-500'
      : automaticMode!.connected
        ? 'bg-emerald-500'
        : 'bg-amber-500'
    : 'bg-slate-500';
  const statusLabel = isAuto
    ? automaticMode!.error
      ? 'Desconectada'
      : automaticMode!.connected
        ? `Conectada${automaticMode!.nickname ? ' • ' + automaticMode!.nickname : ''}`
        : 'Conectando...'
    : '';

  return (
    <div data-tutorial="number-pad" className="flex flex-col h-full min-h-0 w-full p-2 pb-1 bg-slate-900 overflow-hidden relative">
      {/* Display - altura responsiva */}
      <div 
        ref={displayRef}
        className="h-20 lg:h-24 flex-shrink-0 bg-slate-950 flex items-center justify-center px-4 py-2 outline-none cursor-text border border-slate-700 rounded-sm gpu-accelerated"
        tabIndex={disableAutoFocus || isAuto ? -1 : 0}
        onKeyDown={isAuto ? undefined : handleKeyDown}
        onBlur={handleBlur}
        style={{ userSelect: 'none' }}
      >
        <span className="text-4xl lg:text-5xl font-sans font-bold text-emerald-400 leading-none">
          {formatDisplay(internalValue)}
        </span>
      </div>

      {/* Overlay de status (modo automático) - logo abaixo do visor */}
      {isAuto && (
        <div className="flex-shrink-0 mt-1 rounded-md border border-emerald-500/30 bg-slate-950/95 backdrop-blur px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
            <span className="text-slate-200 truncate">{statusLabel}</span>
            {automaticMode!.connected && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${automaticMode!.stable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {automaticMode!.stable ? 'ESTÁVEL' : 'AJUSTANDO'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {automaticMode!.onZero && (
              <button
                onClick={automaticMode!.onZero}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
              >
                Zerar
              </button>
            )}
            {automaticMode!.error && automaticMode!.onReconnect && (
              <button
                onClick={automaticMode!.onReconnect}
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px]"
              >
                Reconectar
              </button>
            )}
            {automaticMode!.onUseManual && (
              <button
                onClick={automaticMode!.onUseManual}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                title="Usar teclado manual nesta venda"
              >
                Manual
              </button>
            )}
          </div>
        </div>
      )}

      {/* Teclado numérico - permite shrink */}
      <div
        className={`flex-1 min-h-0 grid grid-cols-3 auto-rows-fr gap-1 p-1 bg-slate-800 mt-1 transition-opacity ${isAuto ? 'opacity-40 pointer-events-none select-none' : ''}`}
        aria-disabled={isAuto}
        title={isAuto ? 'Modo automático ativo — peso vem da balança' : undefined}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button 
            key={digit}
            className="numpad-btn-optimized" 
            onClick={() => handleDigitClick(digit)}
            disabled={isAuto}
          >
            {digit}
          </button>
        ))}
        
        <button 
          className="numpad-btn-optimized col-span-2" 
          onClick={() => handleDigitClick('0')}
          disabled={isAuto}
        >
          0
        </button>
        <button 
          className="numpad-btn-optimized clear-btn" 
          onClick={handleClear}
          disabled={isAuto}
        >
          C
        </button>
      </div>

      {/* Botão Zerar Balança - altura fixa garantida */}
      <div className={`shrink-0 grid grid-cols-1 gap-[2px] p-[2px] bg-slate-800 mt-1 ${isAuto ? 'opacity-40 pointer-events-none' : ''}`}>
        <button 
          className="numpad-btn-optimized zero-scale-btn text-base lg:text-lg h-11 lg:h-12 min-h-11" 
          onClick={handleZeroScale}
          disabled={isAuto}
        >
          ZERAR BALANÇA
        </button>
      </div>
    </div>
  );
};

export default React.memo(NumberPadOptimized);
