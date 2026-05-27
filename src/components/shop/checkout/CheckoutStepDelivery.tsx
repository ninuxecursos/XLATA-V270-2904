 import { useState } from 'react';
 import { AlertCircle, Loader2, Store, Truck } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 
 export type DeliveryMethod = 'delivery' | 'pickup';
 
 export interface AddressData {
   cep: string;
   street: string;
   number: string;
   complement: string;
   neighborhood: string;
   city: string;
   state: string;
 }
 
 interface FormErrors {
   cep?: string;
   street?: string;
   number?: string;
   neighborhood?: string;
   city?: string;
   state?: string;
 }
 
 interface CheckoutStepDeliveryProps {
   deliveryMethod: DeliveryMethod;
   address: AddressData;
   errors: FormErrors;
   onMethodChange: (method: DeliveryMethod) => void;
   onAddressChange: (field: keyof AddressData, value: string) => void;
   onContinue: () => void;
   onBack: () => void;
   primaryColor?: string;
   storeAddress?: string;
   storeHours?: string;
 }
 
 const formatCEP = (value: string) => {
   const clean = value.replace(/\D/g, '');
   return clean.replace(/(\d{5})(\d{0,3})/, '$1-$2');
 };
 
 export function CheckoutStepDelivery({
   deliveryMethod,
   address,
   errors,
   onMethodChange,
   onAddressChange,
   onContinue,
   onBack,
   primaryColor = '#10B981',
   storeAddress = 'Rua Principal, 123 - Centro',
   storeHours = 'Seg-Sex: 9h às 18h | Sáb: 9h às 13h',
 }: CheckoutStepDeliveryProps) {
   const [loadingCep, setLoadingCep] = useState(false);
 
   const handleCepChange = async (value: string) => {
     const formatted = formatCEP(value);
     onAddressChange('cep', formatted);
 
     const cleanCep = formatted.replace(/\D/g, '');
     if (cleanCep.length === 8) {
       setLoadingCep(true);
       try {
         const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
         const data = await response.json();
         
         if (!data.erro) {
           onAddressChange('street', data.logradouro || '');
           onAddressChange('neighborhood', data.bairro || '');
           onAddressChange('city', data.localidade || '');
           onAddressChange('state', data.uf || '');
         }
       } catch (error) {
         console.error('Erro ao buscar CEP:', error);
       } finally {
         setLoadingCep(false);
       }
     }
   };
 
   return (
     <div className="flex flex-col h-full">
       <div className="flex-1 space-y-4 pb-4">
         <h3 className="font-semibold text-gray-900 text-lg">Como deseja receber?</h3>
         
         {/* Delivery Method Selector */}
         <div className="grid grid-cols-2 gap-3">
           <button
             type="button"
             onClick={() => onMethodChange('delivery')}
             className={cn(
               "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
               deliveryMethod === 'delivery'
                 ? "border-opacity-100 bg-opacity-5"
                 : "border-gray-200 hover:border-gray-300"
             )}
             style={{
               borderColor: deliveryMethod === 'delivery' ? primaryColor : undefined,
               backgroundColor: deliveryMethod === 'delivery' ? `${primaryColor}10` : undefined,
             }}
           >
             <Truck
               className="w-6 h-6"
               style={{ color: deliveryMethod === 'delivery' ? primaryColor : '#6B7280' }}
             />
             <span
               className={cn(
                 "text-sm font-medium",
                 deliveryMethod === 'delivery' ? "text-gray-900" : "text-gray-600"
               )}
             >
               Entrega
             </span>
           </button>
 
           <button
             type="button"
             onClick={() => onMethodChange('pickup')}
             className={cn(
               "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
               deliveryMethod === 'pickup'
                 ? "border-opacity-100 bg-opacity-5"
                 : "border-gray-200 hover:border-gray-300"
             )}
             style={{
               borderColor: deliveryMethod === 'pickup' ? primaryColor : undefined,
               backgroundColor: deliveryMethod === 'pickup' ? `${primaryColor}10` : undefined,
             }}
           >
             <Store
               className="w-6 h-6"
               style={{ color: deliveryMethod === 'pickup' ? primaryColor : '#6B7280' }}
             />
             <span
               className={cn(
                 "text-sm font-medium",
                 deliveryMethod === 'pickup' ? "text-gray-900" : "text-gray-600"
               )}
             >
               Retirar na Loja
             </span>
           </button>
         </div>
 
         {/* Delivery Address Form */}
         {deliveryMethod === 'delivery' && (
           <div className="space-y-3 pt-2">
             <div className="space-y-2">
               <Label htmlFor="checkout-cep" className="text-gray-900">CEP *</Label>
               <div className="relative">
                 <Input
                   id="checkout-cep"
                   value={address.cep}
                   onChange={(e) => handleCepChange(e.target.value)}
                   placeholder="00000-000"
                   maxLength={9}
                   className={cn(
                     "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl pr-10",
                     errors.cep && "border-red-500 focus:ring-red-500"
                   )}
                 />
                 {loadingCep && (
                   <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                 )}
               </div>
               {errors.cep && (
                 <p className="text-sm text-red-500 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   {errors.cep}
                 </p>
               )}
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="checkout-street" className="text-gray-900">Endereço *</Label>
               <Input
                 id="checkout-street"
                 value={address.street}
                 onChange={(e) => onAddressChange('street', e.target.value)}
                 placeholder="Rua, Avenida..."
                 className={cn(
                   "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
                   errors.street && "border-red-500 focus:ring-red-500"
                 )}
               />
               {errors.street && (
                 <p className="text-sm text-red-500 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   {errors.street}
                 </p>
               )}
             </div>
 
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-2">
                 <Label htmlFor="checkout-number" className="text-gray-900">Número *</Label>
                 <Input
                   id="checkout-number"
                   value={address.number}
                   onChange={(e) => onAddressChange('number', e.target.value)}
                   placeholder="123"
                   className={cn(
                     "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
                     errors.number && "border-red-500 focus:ring-red-500"
                   )}
                 />
                 {errors.number && (
                   <p className="text-sm text-red-500 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" />
                     {errors.number}
                   </p>
                 )}
               </div>
 
               <div className="col-span-2 space-y-2">
                 <Label htmlFor="checkout-complement" className="text-gray-900">Complemento</Label>
                 <Input
                   id="checkout-complement"
                   value={address.complement}
                   onChange={(e) => onAddressChange('complement', e.target.value)}
                   placeholder="Apt, Bloco..."
                   className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl"
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="checkout-neighborhood" className="text-gray-900">Bairro *</Label>
               <Input
                 id="checkout-neighborhood"
                 value={address.neighborhood}
                 onChange={(e) => onAddressChange('neighborhood', e.target.value)}
                 placeholder="Seu bairro"
                 className={cn(
                   "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
                   errors.neighborhood && "border-red-500 focus:ring-red-500"
                 )}
               />
               {errors.neighborhood && (
                 <p className="text-sm text-red-500 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   {errors.neighborhood}
                 </p>
               )}
             </div>
 
             <div className="grid grid-cols-3 gap-3">
               <div className="col-span-2 space-y-2">
                 <Label htmlFor="checkout-city" className="text-gray-900">Cidade *</Label>
                 <Input
                   id="checkout-city"
                   value={address.city}
                   onChange={(e) => onAddressChange('city', e.target.value)}
                   placeholder="Sua cidade"
                   className={cn(
                     "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl",
                     errors.city && "border-red-500 focus:ring-red-500"
                   )}
                 />
                 {errors.city && (
                   <p className="text-sm text-red-500 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" />
                     {errors.city}
                   </p>
                 )}
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="checkout-state" className="text-gray-900">UF *</Label>
                 <Input
                   id="checkout-state"
                   value={address.state}
                   onChange={(e) => onAddressChange('state', e.target.value.toUpperCase())}
                   placeholder="SP"
                   maxLength={2}
                   className={cn(
                     "bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 h-12 rounded-xl uppercase",
                     errors.state && "border-red-500 focus:ring-red-500"
                   )}
                 />
                 {errors.state && (
                   <p className="text-sm text-red-500 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" />
                     {errors.state}
                   </p>
                 )}
               </div>
             </div>
           </div>
         )}
 
         {/* Pickup Info */}
         {deliveryMethod === 'pickup' && (
           <div
             className="p-4 rounded-xl border-2"
             style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}05` }}
           >
             <div className="flex items-start gap-3">
               <div
                 className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: `${primaryColor}20` }}
               >
                 <Store className="w-5 h-5" style={{ color: primaryColor }} />
               </div>
               <div>
                 <h4 className="font-medium text-gray-900 mb-1">Retirar na Loja</h4>
                 <p className="text-sm text-gray-600 mb-2">{storeAddress}</p>
                 <p className="text-xs text-gray-500">{storeHours}</p>
                 <p className="text-xs mt-2" style={{ color: primaryColor }}>
                   Você será notificado quando seu pedido estiver pronto!
                 </p>
               </div>
             </div>
           </div>
         )}
       </div>
 
       <div className="pt-4 border-t space-y-3 pb-safe">
         <Button
           type="button"
           className="w-full text-white h-14 text-base font-semibold rounded-xl"
           style={{ backgroundColor: primaryColor }}
           onClick={onContinue}
         >
           Revisar Pedido
         </Button>
         
         <Button
           type="button"
           variant="outline"
           className="w-full h-12 rounded-xl"
           onClick={onBack}
         >
           Voltar
         </Button>
       </div>
     </div>
   );
 }