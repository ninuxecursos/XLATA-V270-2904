
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";

interface KeyboardInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
  onKeyboardClose?: () => void;
  numeric?: boolean;
  currencyMode?: boolean; // New prop for currency input mode
  style?: React.CSSProperties; // Add style prop
}

const KeyboardInput: React.FC<KeyboardInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  label,
  id,
  onKeyboardClose,
  numeric = false,
  currencyMode = false,
  style
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleFocus = () => {
    setShowKeyboard(true);
  };

  const handleKeyPress = (key: string) => {
    let newValue = inputValue;
    
    switch(key) {
      case 'Shift':
        setIsShiftPressed(!isShiftPressed);
        return;
      case 'Espaço':
        newValue += ' ';
        break;
      case 'Limpar':
        newValue = '';
        break;
      case 'Fechar':
        setShowKeyboard(false);
        if (onKeyboardClose) onKeyboardClose();
        return;
      case '⌫':
        newValue = newValue.slice(0, -1);
        break;
      default:
        if (numeric || currencyMode) {
          // For currency mode, only allow numbers
          if (/^[0-9]$/.test(key)) {
            newValue += key;
          }
        } else {
          // Apply shift case to letters
          const finalKey = isShiftPressed && /^[a-z]$/.test(key) ? key.toUpperCase() : key;
          newValue += finalKey;
        }
    }
    
    setInputValue(newValue);
    onChange(newValue);
  };

  // Define keyboard layout based on mode
  let row1, row2, row3, row4, row5;
  
  if (currencyMode) {
    // Currency mode: only numeric keys for currency input
    row1 = ['1', '2', '3'];
    row2 = ['4', '5', '6'];
    row3 = ['7', '8', '9'];
    row4 = ['⌫', '0', 'Limpar'];
    row5 = ['Fechar'];
  } else if (numeric) {
    // Regular numeric mode
    row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    row2 = [];
    row3 = [',', '.'];
    row4 = [];
    row5 = ['⌫', 'Limpar', 'Fechar'];
  } else {
    // Full QWERTY keyboard
    row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    row2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    row3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'];
    row4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', ',', '-'];
    row5 = ['Shift', 'Espaço', '⌫', 'Limpar', 'Fechar'];
  }

  const renderKey = (key: string) => {
    let keyClass = "bg-pdv-dark border border-white rounded p-3 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors text-white text-lg";
    
    // Make special keys wider in currency mode
    if (currencyMode) {
      if (['⌫', 'Limpar', 'Fechar'].includes(key)) {
        keyClass += " col-span-1";
      }
    } else {
      // Make special keys wider in other modes
      if (['Shift', 'Espaço', 'Limpar', 'Fechar'].includes(key)) {
        keyClass += " col-span-2";
      }
    }

    // Highlight shift when pressed
    if (key === 'Shift' && isShiftPressed) {
      keyClass = keyClass.replace('bg-pdv-dark', 'bg-blue-600');
    }
    
    return (
      <div 
        key={key} 
        className={keyClass}
        onClick={() => handleKeyPress(key)}
      >
        {key === 'Shift' && isShiftPressed ? 'SHIFT' : key}
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <Input
        ref={inputRef}
        type="text"
        id={id}
        className={`bg-gray-900 border border-gray-700 rounded text-white ${currencyMode ? 'text-center text-2xl font-bold' : ''} ${className || ''}`}
        style={currencyMode ? { color: '#10B981', fontSize: '1.69em', ...style } : style}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={handleFocus}
      />
      
      {showKeyboard && (
        <div className="mt-2 bg-[#1A1F2C] border border-gray-700 p-4 rounded-md">
          <div className="grid gap-1">
            {currencyMode ? (
              <>
                <div className="grid grid-cols-3 gap-1">
                  {row1.map(renderKey)}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {row2.map(renderKey)}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {row3.map(renderKey)}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {row4.map(renderKey)}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {row5.map(renderKey)}
                </div>
              </>
            ) : (
              <>
                {row1.length > 0 && (
                  <div className="grid grid-cols-10 gap-1">
                    {row1.map(renderKey)}
                  </div>
                )}
                {row2.length > 0 && (
                  <div className="grid grid-cols-10 gap-1">
                    {row2.map(renderKey)}
                  </div>
                )}
                {row3.length > 0 && (
                  <div className="grid grid-cols-10 gap-1">
                    {row3.map(renderKey)}
                  </div>
                )}
                {row4.length > 0 && (
                  <div className="grid grid-cols-10 gap-1">
                    {row4.map(renderKey)}
                  </div>
                )}
                {row5.length > 0 && (
                  <div className="grid grid-cols-10 gap-1">
                    {row5.map(renderKey)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardInput;
