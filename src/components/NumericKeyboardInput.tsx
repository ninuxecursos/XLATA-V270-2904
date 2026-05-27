
import React, { useState } from "react";
import { Delete } from "lucide-react";

interface NumericKeyboardInputProps {
  value: number;
  onChange: (value: number) => void;
}

const NumericKeyboardInput: React.FC<NumericKeyboardInputProps> = ({
  value,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState(String(value));

  const updateValue = (val: string) => {
    setInternalValue(val);
    const num = parseFloat(val.replace(",", "."));
    if (!isNaN(num)) {
      onChange(num);
    } else {
      onChange(0);
    }
  };

  const handleNumberClick = (digit: string) => {
    let newValue = internalValue === "0" ? digit : internalValue + digit;
    if (digit === "." && internalValue.includes(".")) return;
    if (digit === "," && internalValue.includes(",")) return;
    if (digit === "." && internalValue.includes(",")) return;
    newValue = newValue.replace(",", ".");
    updateValue(newValue);
  };

  const handleBackspace = () => {
    let newValue = internalValue.slice(0, -1) || "0";
    updateValue(newValue);
  };

  const handleClear = () => {
    updateValue("0");
  };

  React.useEffect(() => {
    setInternalValue(String(value));
  }, [value]);

  // Formatar valor para exibição
  const displayValue = `R$ ${parseFloat(internalValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Display do valor formatado */}
      <div className="w-full text-center font-bold mb-4 text-pdv-green text-3xl md:text-4xl min-h-[50px] flex items-center justify-center select-none">
        {displayValue}
      </div>

      {/* Teclado numérico profissional */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto">
        {[..."123456789"].map((n) => (
          <button
            key={n}
            type="button"
            className="bg-gray-800 text-white text-xl font-semibold h-14 rounded-xl hover:bg-pdv-green/20 active:bg-pdv-green/30 transition-colors border border-gray-700"
            onClick={() => handleNumberClick(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="bg-gray-800 text-white text-xl font-semibold h-14 rounded-xl hover:bg-pdv-green/20 active:bg-pdv-green/30 transition-colors border border-gray-700"
          onClick={() => handleNumberClick("0")}
        >
          0
        </button>
        <button
          type="button"
          className="bg-gray-800 text-white text-xl font-semibold h-14 rounded-xl hover:bg-pdv-green/20 active:bg-pdv-green/30 transition-colors border border-gray-700"
          onClick={() => handleNumberClick(".")}
        >
          ,
        </button>
        <button
          type="button"
          className="bg-red-600/20 text-red-400 text-xl font-semibold h-14 rounded-xl hover:bg-red-600/30 active:bg-red-600/40 transition-colors border border-red-600/30 flex items-center justify-center"
          onClick={handleBackspace}
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
      
      <button
        type="button"
        className="mt-3 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        onClick={handleClear}
      >
        Limpar
      </button>
    </div>
  );
};

export default NumericKeyboardInput;
