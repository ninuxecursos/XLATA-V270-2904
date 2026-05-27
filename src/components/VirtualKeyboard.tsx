
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onInput,
  onDelete,
  onClear,
  onClose
}) => {
  const [shift, setShift] = useState(false);

  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', ',', '-']
  ];

  const handleKeyPress = (key: string) => {
    const finalKey = shift ? key.toUpperCase() : key;
    onInput(finalKey);
    if (shift) setShift(false); // Reset shift after use
  };

  const handleSpace = () => {
    onInput(' ');
  };

  const handleShift = () => {
    setShift(!shift);
  };

  return (
    <div className="bg-pdv-dark border border-gray-600 rounded-lg p-4 mt-4">
      <div className="grid grid-cols-10 gap-1 mb-2">
        {keys[0].map((key) => (
          <Button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
            size="sm"
          >
            {key}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-10 gap-1 mb-2">
        {keys[1].map((key) => (
          <Button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
            size="sm"
          >
            {shift ? key.toUpperCase() : key}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-10 gap-1 mb-2">
        {keys[2].map((key) => (
          <Button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
            size="sm"
          >
            {shift ? key.toUpperCase() : key}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-10 gap-1 mb-2">
        {keys[3].map((key) => (
          <Button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
            size="sm"
          >
            {key}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-5 gap-1">
        <Button
          onClick={handleShift}
          className={`h-10 text-white border border-gray-600 ${
            shift ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          size="sm"
        >
          Shift
        </Button>
        <Button
          onClick={handleSpace}
          className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 col-span-2"
          size="sm"
        >
          Espaço
        </Button>
        <Button
          onClick={onDelete}
          className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
          size="sm"
        >
          ⌫
        </Button>
        <Button
          onClick={onClose}
          className="h-10 text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
          size="sm"
        >
          Fechar
        </Button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
