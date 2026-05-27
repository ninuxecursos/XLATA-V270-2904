 import { Pencil, Store, Truck } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { ShopPaymentMethodSelector, type PaymentMethod } from '../public/ShopPaymentMethodSelector';
 import type { PersonalData } from './CheckoutStepPersonal';
 import type { AddressData, DeliveryMethod } from './CheckoutStepDelivery';
 import type { CartItem } from '@/hooks/useShopCart';
 
 interface CheckoutStepReviewProps {
   personalData: PersonalData;
   deliveryMethod: DeliveryMethod;
   address: AddressData;
   items: CartItem[];
   totalPrice: number;
   paymentMethod: PaymentMethod;
   onPaymentMethodChange: (method: PaymentMethod) => void;
   onEditPersonal: () => void;
   onEditDelivery: () => void;
   onContinue: () => void;
   onBack: () => void;
   primaryColor?: string;
   isLoading?: boolean;
   storeAddress?: string;
 }
 
 export function CheckoutStepReview({
   personalData,
   deliveryMethod,
   address,
   items,
   totalPrice,
   paymentMethod,
   onPaymentMethodChange,
   onEditPersonal,
   onEditDelivery,
   onContinue,
   onBack,
   primaryColor = '#10B981',
   isLoading = false,
   storeAddress = 'Rua Principal, 123 - Centro',
 }: CheckoutStepReviewProps) {
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL'
     }).format(value);
   };
 
   const formatCPF = (cpf: string) => {
     const clean = cpf.replace(/\D/g, '');
     return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
   };
 
   return (
     <div className="flex flex-col h-full">
       <div className="flex-1 space-y-4 pb-4 overflow-y-auto">
         <h3 className="font-semibold text-gray-900 text-lg">Revise seu pedido</h3>
         
         {/* Personal Data Section */}
         <div className="bg-gray-50 rounded-xl p-4">
           <div className="flex items-center justify-between mb-3">
             <h4 className="font-medium text-gray-900">Seus Dados</h4>
             <button
               onClick={onEditPersonal}
               className="text-sm flex items-center gap-1 hover:underline"
               style={{ color: primaryColor }}
             >
               <Pencil className="w-3 h-3" />
               Editar
             </button>
           </div>
           <div className="text-sm text-gray-600 space-y-1">
             <p><span className="text-gray-500">Nome:</span> {personalData.name}</p>
             <p><span className="text-gray-500">Email:</span> {personalData.email}</p>
             {personalData.phone && (
               <p><span className="text-gray-500">Telefone:</span> {personalData.phone}</p>
             )}
             <p><span className="text-gray-500">CPF:</span> {formatCPF(personalData.cpf)}</p>
           </div>
         </div>
 
         {/* Delivery Section */}
         <div className="bg-gray-50 rounded-xl p-4">
           <div className="flex items-center justify-between mb-3">
             <h4 className="font-medium text-gray-900 flex items-center gap-2">
               {deliveryMethod === 'delivery' ? (
                 <>
                   <Truck className="w-4 h-4" style={{ color: primaryColor }} />
                   Entrega
                 </>
               ) : (
                 <>
                   <Store className="w-4 h-4" style={{ color: primaryColor }} />
                   Retirar na Loja
                 </>
               )}
             </h4>
             <button
               onClick={onEditDelivery}
               className="text-sm flex items-center gap-1 hover:underline"
               style={{ color: primaryColor }}
             >
               <Pencil className="w-3 h-3" />
               Editar
             </button>
           </div>
           <div className="text-sm text-gray-600">
             {deliveryMethod === 'delivery' ? (
               <div className="space-y-1">
                 <p>{address.street}, {address.number}</p>
                 {address.complement && <p>{address.complement}</p>}
                 <p>{address.neighborhood} - {address.city}/{address.state}</p>
                 <p>CEP: {address.cep}</p>
               </div>
             ) : (
               <p>{storeAddress}</p>
             )}
           </div>
         </div>
 
         {/* Items Section */}
         <div className="bg-gray-50 rounded-xl p-4">
           <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido</h4>
           <div className="space-y-2 text-sm">
             {items.map((item) => (
               <div key={item.productId} className="flex justify-between">
                 <span className="text-gray-600">
                   {item.quantity}x {item.name}
                 </span>
                 <span className="text-gray-900 font-medium">
                   {formatCurrency(item.price * item.quantity)}
                 </span>
               </div>
             ))}
           </div>
           <div className="border-t mt-3 pt-3 flex justify-between font-bold">
             <span>Total</span>
             <span style={{ color: primaryColor }}>
               {formatCurrency(totalPrice)}
             </span>
           </div>
         </div>
 
         {/* Payment Method Selector */}
         <div>
           <h4 className="font-medium text-gray-900 mb-3">Forma de Pagamento</h4>
           <ShopPaymentMethodSelector
             selectedMethod={paymentMethod}
             onMethodChange={onPaymentMethodChange}
             primaryColor={primaryColor}
           />
         </div>
       </div>
 
       <div className="pt-4 border-t space-y-3 pb-safe">
         <Button
           type="button"
           className="w-full text-white h-14 text-base font-semibold rounded-xl"
           style={{ backgroundColor: primaryColor }}
           onClick={onContinue}
           disabled={isLoading}
         >
           {isLoading ? 'Processando...' : `Ir para Pagamento - ${formatCurrency(totalPrice)}`}
         </Button>
         
         <Button
           type="button"
           variant="outline"
           className="w-full h-12 rounded-xl"
           onClick={onBack}
           disabled={isLoading}
         >
           Voltar
         </Button>
       </div>
     </div>
   );
 }