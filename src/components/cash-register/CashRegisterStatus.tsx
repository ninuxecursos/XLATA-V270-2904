
import React from 'react';

interface CashRegisterStatusProps {
  difference: number;
}

const CashRegisterStatus: React.FC<CashRegisterStatusProps> = ({ difference }) => {
  const differenceClass = difference === 0 
    ? "text-pdv-green" 
    : difference > 0 
      ? "text-blue-400" 
      : "text-pdv-red";

  const statusText = difference === 0 ? 'CONFERE' : difference > 0 ? 'SOBRA' : 'FALTA';

  return (
    <div className="bg-gray-800 p-4 rounded-sm text-center flex flex-col justify-center">
      <div className="text-gray-300 text-sm mb-2">Status do Caixa</div>
      <div className={`text-4xl font-bold ${differenceClass}`}>
        {statusText}
      </div>
      <div className={`text-lg font-semibold mt-1 ${differenceClass}`}>
        R$ {Math.abs(difference).toFixed(2)}
      </div>
    </div>
  );
};

export default CashRegisterStatus;
