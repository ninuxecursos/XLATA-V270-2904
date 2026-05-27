
import React, { useEffect, useRef } from 'react';
import { FormControl, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CashRegisterFinalAmountProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

const CashRegisterFinalAmount: React.FC<CashRegisterFinalAmountProps> = ({
  inputValue,
  onInputChange,
  autoFocus = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when component mounts or when autoFocus prop is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Immediate focus for better responsiveness
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [autoFocus]);

  return (
    <FormControl>
      <Input 
        ref={inputRef}
        placeholder="R$ 0,00" 
        type="text"
        value={inputValue}
        onChange={onInputChange}
        className="bg-gray-700 border-gray-600 text-[#10b981] text-center font-bold focus:outline-none focus:ring-0 focus:border-gray-600 w-full"
        style={{ 
          fontSize: '1.8rem', // Reduced from 2.25rem (20% reduction)
          boxShadow: 'none',
          height: '60px',
          paddingTop: '8px',
          paddingBottom: '8px'
        }}
      />
    </FormControl>
  );
};

export default CashRegisterFinalAmount;
