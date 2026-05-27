import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from 'lucide-react';

interface BalanceProtectionProps {
  balance: number;
  className?: string;
}

const BalanceProtection: React.FC<BalanceProtectionProps> = ({ balance, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleShowBalance = () => {
    setIsVisible(true);
    
    // Hide balance after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isVisible ? (
        <span className="text-sm text-gray-300">
          Saldo atual: <span className="text-pdv-green font-semibold">{formatCurrency(balance)}</span>
        </span>
      ) : (
        <>
          <span className="text-sm text-gray-300">
            Saldo atual: <span className="text-gray-500">••••••</span>
          </span>
          <Button 
            onClick={handleShowBalance}
            className="h-6 w-6 p-0 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};

export default BalanceProtection;
