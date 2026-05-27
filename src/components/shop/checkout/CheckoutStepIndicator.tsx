 import { Check, User, Truck, ClipboardCheck, CreditCard } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 export type CheckoutStep = 'personal' | 'delivery' | 'review' | 'payment' | 'success';
 
 interface CheckoutStepIndicatorProps {
   currentStep: CheckoutStep;
   primaryColor?: string;
 }
 
 const steps = [
   { id: 'personal' as const, label: 'Dados', icon: User },
   { id: 'delivery' as const, label: 'Entrega', icon: Truck },
   { id: 'review' as const, label: 'Revisão', icon: ClipboardCheck },
   { id: 'payment' as const, label: 'Pagamento', icon: CreditCard },
 ];
 
 export function CheckoutStepIndicator({ currentStep, primaryColor = '#10B981' }: CheckoutStepIndicatorProps) {
   const getStepIndex = (step: CheckoutStep) => {
     if (step === 'success') return 4;
     return steps.findIndex(s => s.id === step);
   };
 
   const currentIndex = getStepIndex(currentStep);
 
   return (
     <div className="flex items-center justify-between w-full px-2 py-4">
       {steps.map((step, index) => {
         const isCompleted = index < currentIndex;
         const isCurrent = index === currentIndex;
         const StepIcon = step.icon;
 
         return (
           <div key={step.id} className="flex items-center flex-1 last:flex-none">
             <div className="flex flex-col items-center">
               <div
                 className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                   isCompleted && "text-white",
                   isCurrent && "text-white ring-4",
                   !isCompleted && !isCurrent && "bg-gray-200 text-gray-500"
                 )}
                 style={{
                   backgroundColor: isCompleted || isCurrent ? primaryColor : undefined,
                   boxShadow: isCurrent ? `0 0 0 4px ${primaryColor}30` : undefined,
                 }}
               >
                 {isCompleted ? (
                   <Check className="w-5 h-5" />
                 ) : (
                   <StepIcon className="w-5 h-5" />
                 )}
               </div>
               <span
                 className={cn(
                   "text-xs mt-1.5 font-medium",
                   isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                 )}
               >
                 {step.label}
               </span>
             </div>
             
             {index < steps.length - 1 && (
               <div
                 className={cn(
                   "flex-1 h-0.5 mx-2",
                   isCompleted ? "bg-opacity-100" : "bg-gray-200"
                 )}
                 style={{
                   backgroundColor: isCompleted ? primaryColor : undefined,
                 }}
               />
             )}
           </div>
         );
       })}
     </div>
   );
 }