
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

export interface PaymentData {
  method: 'debito' | 'credito' | 'dinheiro' | 'pix' | '';
  pixKeyType?: 'cpf' | 'cnpj' | 'celular' | 'email';
  pixKeyValue?: string;
}

interface PaymentOptionsProps {
  isSaleMode: boolean;
  onPaymentChange: (data: PaymentData) => void;
  paymentData: PaymentData;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  isSaleMode,
  onPaymentChange,
  paymentData
}) => {
  const [showPixFields, setShowPixFields] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;

  // Define "dinheiro" como padrão se não há método selecionado
  const currentMethod = paymentData.method || 'dinheiro';

  const handlePaymentMethodChange = (method: PaymentData['method']) => {
    // Em modo venda, não precisa dos campos PIX detalhados
    if (isSaleMode) {
      onPaymentChange({ method });
    } else {
      // Em modo compra, mantém a lógica original
      if (method === 'pix') {
        setShowPixFields(true);
        onPaymentChange({ 
          method, 
          pixKeyType: paymentData.pixKeyType || 'cpf',
          pixKeyValue: paymentData.pixKeyValue || ''
        });
      } else {
        setShowPixFields(false);
        onPaymentChange({ method });
      }
    }
  };

  const handlePixKeyTypeChange = (keyType: 'cpf' | 'cnpj' | 'celular' | 'email') => {
    onPaymentChange({
      ...paymentData,
      pixKeyType: keyType,
      pixKeyValue: ''
    });
  };

  // Format CPF: 000.000.000-00
  const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // Format CNPJ: 00.000.000/0000-00
  const formatCNPJ = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  // Format Phone: (00) 00000-0000
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Format Email: just lowercase and basic validation
  const formatEmail = (value: string): string => {
    return value.toLowerCase().trim();
  };

  const handlePixKeyValueChange = (value: string) => {
    let formattedValue = value;
    
    if (paymentData.pixKeyType === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (paymentData.pixKeyType === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (paymentData.pixKeyType === 'celular') {
      formattedValue = formatPhone(value);
    } else if (paymentData.pixKeyType === 'email') {
      formattedValue = formatEmail(value);
    }
    
    onPaymentChange({
      ...paymentData,
      pixKeyValue: formattedValue
    });
  };

  const handlePixCheckboxChange = (checked: boolean) => {
    if (checked) {
      setShowPixFields(true);
      onPaymentChange({ 
        method: 'pix',
        pixKeyType: 'cpf',
        pixKeyValue: ''
      });
    } else {
      setShowPixFields(false);
      onPaymentChange({ method: '' });
    }
  };

  if (isSaleMode) {
    return (
      <Card className="bg-gray-800 border-gray-700 h-fit">
        <CardContent className="p-4">
          <Label className={`text-white font-bold mb-4 block ${
            isMobileOrTablet ? 'text-sm' : 'text-2xl'
          }`}>Forma de Pagamento:</Label>
          
          <RadioGroup 
            value={currentMethod} 
            onValueChange={(value) => handlePaymentMethodChange(value as PaymentData['method'])}
            className={`mb-4 ${
              isMobileOrTablet ? 'grid grid-cols-2 gap-1' : 'space-y-2'
            }`}
          >
            <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
              currentMethod === 'debito' 
                ? 'border-2 border-[#10B981] bg-[#0d9156]' 
                : 'border border-gray-600 hover:border-gray-500'
            }`}>
              <RadioGroupItem value="debito" id="debito" className="border-white text-white" />
              <Label htmlFor="debito" className={`text-white cursor-pointer flex-1 ${
                isMobileOrTablet ? 'text-sm' : 'text-xl'
              }`}>Débito</Label>
            </div>
            <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
              currentMethod === 'credito' 
                ? 'border-2 border-[#10B981] bg-[#0d9156]' 
                : 'border border-gray-600 hover:border-gray-500'
            }`}>
              <RadioGroupItem value="credito" id="credito" className="border-white text-white" />
              <Label htmlFor="credito" className={`text-white cursor-pointer flex-1 ${
                isMobileOrTablet ? 'text-sm' : 'text-xl'
              }`}>Crédito</Label>
            </div>
            <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
              currentMethod === 'dinheiro' 
                ? 'border-2 border-[#10B981] bg-[#0d9156]' 
                : 'border border-gray-600 hover:border-gray-500'
            }`}>
              <RadioGroupItem value="dinheiro" id="dinheiro" className="border-white text-white" />
              <Label htmlFor="dinheiro" className={`text-white cursor-pointer flex-1 ${
                isMobileOrTablet ? 'text-sm' : 'text-xl'
              }`}>Dinheiro</Label>
            </div>
            <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
              currentMethod === 'pix' 
                ? 'border-2 border-[#10B981] bg-[#0d9156]' 
                : 'border border-gray-600 hover:border-gray-500'
            }`}>
              <RadioGroupItem value="pix" id="pix" className="border-white text-white" />
              <Label htmlFor="pix" className={`text-white cursor-pointer flex-1 ${
                isMobileOrTablet ? 'text-sm' : 'text-xl'
              }`}>PIX</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    );
  }

  // Modo compra - apenas Dinheiro e PIX
  return (
    <Card className="bg-gray-800 border-gray-700 h-fit">
      <CardContent className="p-4">
        <Label className={`text-white font-bold mb-4 block ${
          isMobileOrTablet ? 'text-sm' : 'text-2xl'
        }`}>Forma de Pagamento:</Label>
        
        <RadioGroup 
          value={currentMethod} 
          onValueChange={(value) => handlePaymentMethodChange(value as PaymentData['method'])}
          className={`mb-4 ${
            isMobileOrTablet ? 'grid grid-cols-2 gap-1' : 'space-y-2'
          }`}
        >
          <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
            currentMethod === 'dinheiro' 
              ? 'border-2 border-[#10B981] bg-[#0d9156]' 
              : 'border border-gray-600 hover:border-gray-500'
          }`}>
            <RadioGroupItem value="dinheiro" id="purchase-dinheiro" className="border-white text-white" />
            <Label htmlFor="purchase-dinheiro" className={`text-white cursor-pointer flex-1 ${
              isMobileOrTablet ? 'text-sm' : 'text-xl'
            }`}>Dinheiro</Label>
          </div>
          <div className={`flex items-center space-x-2 p-2 rounded transition-colors ${
            currentMethod === 'pix' 
              ? 'border-2 border-[#10B981] bg-[#0d9156]' 
              : 'border border-gray-600 hover:border-gray-500'
          }`}>
            <RadioGroupItem value="pix" id="purchase-pix" className="border-white text-white" />
            <Label htmlFor="purchase-pix" className={`text-white cursor-pointer flex-1 ${
              isMobileOrTablet ? 'text-sm' : 'text-xl'
            }`}>PIX</Label>
          </div>
        </RadioGroup>

        {currentMethod === 'pix' && (
          <div className="bg-gray-700 rounded-lg p-3 space-y-3">
            <Label className={`text-white font-bold ${
              isMobileOrTablet ? 'text-sm' : 'text-xl'
            }`}>Chave PIX:</Label>
            
            <RadioGroup 
              value={paymentData.pixKeyType} 
              onValueChange={handlePixKeyTypeChange}
              className={isMobileOrTablet ? 'grid grid-cols-2 gap-1' : 'space-y-2'}
            >
              <div className={`flex items-center space-x-2 ${
                paymentData.pixKeyType === 'cpf' 
                  ? 'border-2 border-[#10B981] bg-[#0d9156] p-1 rounded' 
                  : ''
              }`}>
                <RadioGroupItem value="cpf" id="pix-cpf" className="border-white text-white" />
                <Label htmlFor="pix-cpf" className={`text-white cursor-pointer ${
                  isMobileOrTablet ? 'text-sm' : 'text-xl'
                }`}>CPF</Label>
              </div>
              <div className={`flex items-center space-x-2 ${
                paymentData.pixKeyType === 'cnpj' 
                  ? 'border-2 border-[#10B981] bg-[#0d9156] p-1 rounded' 
                  : ''
              }`}>
                <RadioGroupItem value="cnpj" id="pix-cnpj" className="border-white text-white" />
                <Label htmlFor="pix-cnpj" className={`text-white cursor-pointer ${
                  isMobileOrTablet ? 'text-sm' : 'text-xl'
                }`}>CNPJ</Label>
              </div>
              <div className={`flex items-center space-x-2 ${
                paymentData.pixKeyType === 'celular' 
                  ? 'border-2 border-[#10B981] bg-[#0d9156] p-1 rounded' 
                  : ''
              }`}>
                <RadioGroupItem value="celular" id="pix-celular" className="border-white text-white" />
                <Label htmlFor="pix-celular" className={`text-white cursor-pointer ${
                  isMobileOrTablet ? 'text-sm' : 'text-xl'
                }`}>Celular</Label>
              </div>
              <div className={`flex items-center space-x-2 ${
                paymentData.pixKeyType === 'email' 
                  ? 'border-2 border-[#10B981] bg-[#0d9156] p-1 rounded' 
                  : ''
              }`}>
                <RadioGroupItem value="email" id="pix-email" className="border-white text-white" />
                <Label htmlFor="pix-email" className={`text-white cursor-pointer ${
                  isMobileOrTablet ? 'text-sm' : 'text-xl'
                }`}>Email</Label>
              </div>
            </RadioGroup>
            
            <Input
              placeholder={`Digite ${paymentData.pixKeyType === 'cpf' ? 'CPF' : paymentData.pixKeyType === 'cnpj' ? 'CNPJ' : paymentData.pixKeyType === 'celular' ? 'Celular' : 'Email'}`}
              value={paymentData.pixKeyValue || ''}
              onChange={(e) => handlePixKeyValueChange(e.target.value)}
              className={`bg-gray-600 border-gray-500 text-white placeholder-gray-400 ${
                isMobileOrTablet ? 'text-sm' : 'text-xl'
              }`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentOptions;
