import React from 'react';
import { Check, CreditCard, QrCode, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'form' | 'qrcode' | 'verifying' | 'approved' | 'rejected';

interface CheckoutProgressBarProps {
  currentStep: CheckoutStep;
}

const steps = [
  { id: 'form', label: 'Dados', icon: CreditCard },
  { id: 'qrcode', label: 'QR Code', icon: QrCode },
  { id: 'verifying', label: 'Verificando', icon: Clock },
  { id: 'approved', label: 'Aprovado', icon: CheckCircle },
];

export const CheckoutProgressBar: React.FC<CheckoutProgressBarProps> = ({ currentStep }) => {
  const getCurrentIndex = () => {
    if (currentStep === 'rejected') return 2;
    return steps.findIndex(s => s.id === currentStep);
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="w-full px-2 py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress Line Background */}
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted rounded-full" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isRejected = currentStep === 'rejected' && index === 2;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && !isRejected && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                  isRejected && "bg-destructive border-destructive text-destructive-foreground ring-4 ring-destructive/20",
                  !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors",
                  (isCompleted || isCurrent) && !isRejected && "text-primary",
                  isRejected && "text-destructive",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {isRejected ? 'Rejeitado' : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutProgressBar;
