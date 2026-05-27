
import React, { useState } from 'react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [previousOperand, setPreviousOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewOperand, setWaitingForNewOperand] = useState(false);
  const [showOperator, setShowOperator] = useState<string | null>(null);

  const clearAll = () => {
    setDisplay('0');
    setPreviousOperand(null);
    setOperator(null);
    setWaitingForNewOperand(false);
    setShowOperator(null);
  };
  
  const inputDigit = (digit: string) => {
    if (waitingForNewOperand) {
      setDisplay(digit);
      setWaitingForNewOperand(false);
      setShowOperator(null);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
      setShowOperator(null);
    }
  };
  
  const inputDecimal = () => {
    if (waitingForNewOperand) {
      setDisplay('0.');
      setWaitingForNewOperand(false);
      return;
    }
    
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };
  
  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    
    if (previousOperand !== null && operator && !waitingForNewOperand) {
      const result = performCalculation();
      setDisplay(String(result));
      setPreviousOperand(result);
    } else {
      setPreviousOperand(inputValue);
    }
    
    setWaitingForNewOperand(true);
    setOperator(nextOperator);
    setShowOperator(getOperatorSymbol(nextOperator));
  };
  
  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };
  
  const performCalculation = () => {
    const inputValue = parseFloat(display);
    
    if (previousOperand === null || operator === null) {
      return inputValue;
    }
    
    switch (operator) {
      case '+':
        return previousOperand + inputValue;
      case '-':
        return previousOperand - inputValue;
      case '*':
        return previousOperand * inputValue;
      case '/':
        return inputValue !== 0 ? previousOperand / inputValue : 0;
      default:
        return inputValue;
    }
  };
  
  const handleEquals = () => {
    if (operator && previousOperand !== null) {
      const result = performCalculation();
      setDisplay(String(result));
      setPreviousOperand(null);
      setOperator(null);
      setWaitingForNewOperand(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-24 bg-black flex items-center justify-end p-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-mono font-bold text-white text-right truncate">
            {display.length > 12 ? display.slice(-12) : display}
          </span>
          {showOperator && (
            <span className="text-3xl font-mono font-bold text-orange-500">
              {showOperator}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-1 p-1 bg-gray-900">
        {/* First row */}
        <button className="calc-btn bg-gray-700" onClick={clearAll}>AC</button>
        <button className="calc-btn bg-gray-700" onClick={() => setDisplay(String(parseFloat(display) * -1))}>+/-</button>
        <button className="calc-btn bg-gray-700" onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</button>
        <button className="calc-btn bg-orange-500" onClick={() => handleOperator('/')}>÷</button>
        
        {/* Second row */}
        <button className="calc-btn" onClick={() => inputDigit('7')}>7</button>
        <button className="calc-btn" onClick={() => inputDigit('8')}>8</button>
        <button className="calc-btn" onClick={() => inputDigit('9')}>9</button>
        <button className="calc-btn bg-orange-500" onClick={() => handleOperator('*')}>×</button>
        
        {/* Third row */}
        <button className="calc-btn" onClick={() => inputDigit('4')}>4</button>
        <button className="calc-btn" onClick={() => inputDigit('5')}>5</button>
        <button className="calc-btn" onClick={() => inputDigit('6')}>6</button>
        <button className="calc-btn bg-orange-500" onClick={() => handleOperator('-')}>−</button>
        
        {/* Fourth row */}
        <button className="calc-btn" onClick={() => inputDigit('1')}>1</button>
        <button className="calc-btn" onClick={() => inputDigit('2')}>2</button>
        <button className="calc-btn" onClick={() => inputDigit('3')}>3</button>
        <button className="calc-btn bg-orange-500" onClick={() => handleOperator('+')}>+</button>
        
        {/* Fifth row */}
        <button className="calc-btn col-span-2" onClick={() => inputDigit('0')}>0</button>
        <button className="calc-btn" onClick={inputDecimal}>.</button>
        <button className="calc-btn bg-orange-500" onClick={handleEquals}>=</button>
      </div>
    </div>
  );
};

export default Calculator;
