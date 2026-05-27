
import React, { useState, useCallback, memo, useMemo } from 'react';
import { Button } from "@/components/ui/button";

interface NumericKeyboardInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

// Memoizar botões individuais para evitar re-renders
const KeypadButton = memo(({ 
  children, 
  onClick, 
  variant = "outline",
  className = "",
  disabled = false 
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "outline" | "destructive" | "default";
  className?: string;
  disabled?: boolean;
}) => (
  <Button
    variant={variant}
    onClick={onClick}
    className={`h-12 text-lg font-semibold transition-all duration-75 active:scale-95 ${className}`}
    disabled={disabled}
  >
    {children}
  </Button>
));

KeypadButton.displayName = 'KeypadButton';

const NumericKeyboardInputOptimized: React.FC<NumericKeyboardInputProps> = ({ 
  value, 
  onChange, 
  className = "" 
}) => {
  const [displayValue, setDisplayValue] = useState(value.toFixed(2).replace('.', ','));

  // Otimizar formatação com useMemo
  const formattedValue = useMemo(() => {
    return `R$ ${displayValue}`;
  }, [displayValue]);

  // Handlers otimizados com useCallback
  const handleNumberClick = useCallback((num: string) => {
    setDisplayValue(prev => {
      const currentValue = prev.replace(',', '');
      let newValue = currentValue + num;
      
      // Limitar a 8 dígitos antes da vírgula
      if (newValue.length > 8) {
        return prev;
      }
      
      // Converter para formato de moeda
      const numericValue = parseInt(newValue) / 100;
      const formatted = numericValue.toFixed(2).replace('.', ',');
      
      // Atualizar valor imediatamente sem debounce para melhor responsividade
      onChange(numericValue);
      
      return formatted;
    });
  }, [onChange]);

  const handleClear = useCallback(() => {
    setDisplayValue('0,00');
    onChange(0);
  }, [onChange]);

  const handleBackspace = useCallback(() => {
    setDisplayValue(prev => {
      const currentValue = prev.replace(',', '');
      if (currentValue.length <= 1) {
        onChange(0);
        return '0,00';
      }
      
      const newValue = currentValue.slice(0, -1) || '0';
      const numericValue = parseInt(newValue) / 100;
      const formatted = numericValue.toFixed(2).replace('.', ',');
      
      onChange(numericValue);
      return formatted;
    });
  }, [onChange]);

  // Memoizar layout dos botões para evitar recriações
  const numberButtons = useMemo(() => [
    ['7', '8', '9'],
    ['4', '5', '6'], 
    ['1', '2', '3'],
    ['0']
  ], []);

  return (
    <div className={`flex flex-col items-center w-full max-w-xs mx-auto ${className}`}>
      {/* Display do valor com transição suave */}
      <div className="w-full mb-4">
        <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-pdv-green transition-all duration-100">
            {formattedValue}
          </div>
        </div>
      </div>

      {/* Teclado numérico otimizado */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {numberButtons.flat().map((num) => (
          <KeypadButton
            key={num}
            onClick={() => handleNumberClick(num)}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            {num}
          </KeypadButton>
        ))}
        
        {/* Botões de ação */}
        <KeypadButton
          onClick={handleBackspace}
          className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
        >
          ⌫
        </KeypadButton>
        
        <KeypadButton
          onClick={handleClear}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Limpar
        </KeypadButton>
      </div>
    </div>
  );
};

export default memo(NumericKeyboardInputOptimized);
