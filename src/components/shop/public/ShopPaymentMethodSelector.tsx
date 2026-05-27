import { CreditCard, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'pix' | 'card';

interface ShopPaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  primaryColor?: string;
}

export function ShopPaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  primaryColor = '#10B981'
}: ShopPaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Forma de Pagamento</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* PIX Option */}
        <button
          type="button"
          onClick={() => onMethodChange('pix')}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[100px]",
            selectedMethod === 'pix'
              ? "border-current bg-opacity-10"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
          style={{
            borderColor: selectedMethod === 'pix' ? primaryColor : undefined,
            backgroundColor: selectedMethod === 'pix' ? `${primaryColor}10` : undefined
          }}
        >
          <QrCode 
            className="w-7 h-7 mb-2" 
            style={{ color: selectedMethod === 'pix' ? primaryColor : '#6B7280' }}
          />
          <span 
            className="font-semibold text-sm"
            style={{ color: selectedMethod === 'pix' ? primaryColor : '#374151' }}
          >
            PIX
          </span>
          <span className="text-xs text-gray-500 mt-1">Pagamento instantâneo</span>
        </button>

        {/* Card Option */}
        <button
          type="button"
          onClick={() => onMethodChange('card')}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[100px]",
            selectedMethod === 'card'
              ? "border-current bg-opacity-10"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
          style={{
            borderColor: selectedMethod === 'card' ? primaryColor : undefined,
            backgroundColor: selectedMethod === 'card' ? `${primaryColor}10` : undefined
          }}
        >
          <CreditCard 
            className="w-7 h-7 mb-2" 
            style={{ color: selectedMethod === 'card' ? primaryColor : '#6B7280' }}
          />
          <span 
            className="font-semibold text-sm"
            style={{ color: selectedMethod === 'card' ? primaryColor : '#374151' }}
          >
            Cartão
          </span>
          <span className="text-xs text-gray-500 mt-1">Até 12x sem juros</span>
        </button>
      </div>
    </div>
  );
}
