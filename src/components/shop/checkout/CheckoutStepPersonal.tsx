 import { AlertCircle } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import { formatPhone, formatCPF } from '@/lib/validations/checkout';
 
 export interface PersonalData {
   name: string;
   email: string;
   phone: string;
   cpf: string;
 }
 
 interface FormErrors {
   name?: string;
   email?: string;
   phone?: string;
   cpf?: string;
 }
 
 interface CheckoutStepPersonalProps {
   data: PersonalData;
   errors: FormErrors;
   onChange: (field: keyof PersonalData, value: string) => void;
   onContinue: () => void;
   onBack: () => void;
   primaryColor?: string;
   hasPhoneFromRegistration?: boolean;
 }
 
 export function CheckoutStepPersonal({
   data,
   errors,
   onChange,
   onContinue,
   onBack,
   primaryColor = '#10B981',
   hasPhoneFromRegistration = false,
 }: CheckoutStepPersonalProps) {
   const handlePhoneChange = (value: string) => {
     onChange('phone', formatPhone(value));
   };
 
   const handleCpfChange = (value: string) => {
     onChange('cpf', formatCPF(value));
   };
 
   return (
     <div className="flex flex-col h-full">
       <div className="flex-1 space-y-4 pb-4">
         <h3 className="font-semibold text-gray-900 text-lg">Seus Dados</h3>
         
         <div className="space-y-2">
           <Label htmlFor="checkout-name" className="text-gray-900">
             Nome Completo *
           </Label>
           <Input
             id="checkout-name"
             value={data.name}
             onChange={(e) => onChange('name', e.target.value)}
             placeholder="Seu nome completo"
             className={cn(
               "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
               errors.name && "border-red-500 focus:ring-red-500"
             )}
           />
           {errors.name && (
             <p className="text-sm text-red-500 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" />
               {errors.name}
             </p>
           )}
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="checkout-email" className="text-gray-900">
             Email *
           </Label>
           <Input
             id="checkout-email"
             type="email"
             value={data.email}
             onChange={(e) => onChange('email', e.target.value)}
             placeholder="seu@email.com"
             className={cn(
               "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
               errors.email && "border-red-500 focus:ring-red-500"
             )}
           />
           {errors.email && (
             <p className="text-sm text-red-500 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" />
               {errors.email}
             </p>
           )}
         </div>
 
         {!hasPhoneFromRegistration && (
           <div className="space-y-2">
             <Label htmlFor="checkout-phone" className="text-gray-900">
               Telefone (WhatsApp) *
             </Label>
             <Input
               id="checkout-phone"
               type="tel"
               value={data.phone}
               onChange={(e) => handlePhoneChange(e.target.value)}
               placeholder="(11) 99999-9999"
               maxLength={15}
               className={cn(
                 "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
                 errors.phone && "border-red-500 focus:ring-red-500"
               )}
             />
             {errors.phone && (
               <p className="text-sm text-red-500 flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" />
                 {errors.phone}
               </p>
             )}
           </div>
         )}
 
         <div className="space-y-2">
           <Label htmlFor="checkout-cpf" className="text-gray-900">
             CPF *
           </Label>
           <Input
             id="checkout-cpf"
             value={data.cpf}
             onChange={(e) => handleCpfChange(e.target.value)}
             placeholder="000.000.000-00"
             maxLength={14}
             className={cn(
               "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
               errors.cpf && "border-red-500 focus:ring-red-500"
             )}
           />
           {errors.cpf && (
             <p className="text-sm text-red-500 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" />
               {errors.cpf}
             </p>
           )}
           <p className="text-xs text-gray-500">
             Necessário para emissão do comprovante de pagamento
           </p>
         </div>
       </div>
 
       <div className="pt-4 border-t space-y-3 pb-safe">
         <Button
           type="button"
           className="w-full text-white h-14 text-base font-semibold rounded-xl"
           style={{ backgroundColor: primaryColor }}
           onClick={onContinue}
         >
           Continuar para Entrega
         </Button>
         
         <Button
           type="button"
           variant="outline"
           className="w-full h-12 rounded-xl"
           onClick={onBack}
         >
           Voltar ao Carrinho
         </Button>
       </div>
     </div>
   );
 }