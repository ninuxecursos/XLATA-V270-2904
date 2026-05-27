import { useState, useEffect } from 'react';
import { isValidCPF } from '@/utils/cpfValidator';
 import { CheckCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Sheet, SheetContent } from '@/components/ui/sheet';
 import { useShopCart } from '@/hooks/useShopCart';
 import { useShopConfig } from '@/hooks/useShopConfig';
 import { useShopAuth } from '@/contexts/ShopAuthContext';
 import { useCreateOrder } from '@/hooks/useShopOrders';
 import { ShopPixPayment } from './ShopPixPayment';
 import { ShopCardPayment } from './ShopCardPayment';
 import { type PaymentMethod } from './ShopPaymentMethodSelector';
 import { CheckoutStepIndicator, type CheckoutStep } from '../checkout/CheckoutStepIndicator';
 import { CheckoutStepPersonal, type PersonalData } from '../checkout/CheckoutStepPersonal';
 import { CheckoutStepDelivery, type DeliveryMethod, type AddressData } from '../checkout/CheckoutStepDelivery';
 import { CheckoutStepReview } from '../checkout/CheckoutStepReview';
 import { cn } from '@/lib/utils';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 interface ShopCheckoutProps {
   isOpen: boolean;
   onClose: () => void;
   onBack: () => void;
 }
 
 interface PersonalErrors {
   name?: string;
   email?: string;
   phone?: string;
   cpf?: string;
 }
 
 interface AddressErrors {
   cep?: string;
   street?: string;
   number?: string;
   neighborhood?: string;
   city?: string;
   state?: string;
 }
 
 export function ShopCheckout({ isOpen, onClose, onBack }: ShopCheckoutProps) {
   const { items, totalPrice, clearCart } = useShopCart();
   const { data: config } = useShopConfig();
   const { shopUser } = useShopAuth();
   const createOrder = useCreateOrder();
   const isMobile = useIsMobile();
 
   const [step, setStep] = useState<CheckoutStep>('personal');
   const [personalData, setPersonalData] = useState<PersonalData>({
     name: '',
     email: '',
     phone: '',
     cpf: ''
   });
   const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
   const [address, setAddress] = useState<AddressData>({
     cep: '',
     street: '',
     number: '',
     complement: '',
     neighborhood: '',
     city: '',
     state: ''
   });
   const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({});
   const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
   const [orderId, setOrderId] = useState<string | null>(null);
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
 
   const primaryColor = config?.primary_color || '#10B981';
   const hasPhoneFromRegistration = !!shopUser?.phone;
 
   useEffect(() => {
     if (shopUser) {
       setPersonalData(prev => ({
         ...prev,
         name: shopUser.name || prev.name,
         email: shopUser.email || prev.email,
         phone: shopUser.phone || prev.phone
       }));
     }
   }, [shopUser]);
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL'
     }).format(value);
   };
 
   const validatePersonalData = (): boolean => {
     const fieldErrors: PersonalErrors = {};
     
     if (!personalData.name.trim()) {
       fieldErrors.name = 'Nome é obrigatório';
     } else if (personalData.name.trim().length < 3) {
       fieldErrors.name = 'Nome deve ter pelo menos 3 caracteres';
     }
 
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!personalData.email.trim()) {
       fieldErrors.email = 'Email é obrigatório';
     } else if (!emailRegex.test(personalData.email)) {
       fieldErrors.email = 'Email inválido';
     }
 
     if (!hasPhoneFromRegistration && !personalData.phone.trim()) {
       fieldErrors.phone = 'Telefone é obrigatório';
     } else if (personalData.phone && personalData.phone.replace(/\D/g, '').length < 10) {
       fieldErrors.phone = 'Telefone inválido';
     }
 
      const cleanCpf = personalData.cpf.replace(/\D/g, '');
      if (!cleanCpf) {
        fieldErrors.cpf = 'CPF é obrigatório para pagamento';
      } else if (!isValidCPF(cleanCpf)) {
        fieldErrors.cpf = 'CPF inválido';
      }
 
     setPersonalErrors(fieldErrors);
     return Object.keys(fieldErrors).length === 0;
   };
 
   const validateAddress = (): boolean => {
     if (deliveryMethod === 'pickup') return true;
     
     const fieldErrors: AddressErrors = {};
     
     const cleanCep = address.cep.replace(/\D/g, '');
     if (!cleanCep) {
       fieldErrors.cep = 'CEP é obrigatório';
     } else if (cleanCep.length !== 8) {
       fieldErrors.cep = 'CEP inválido';
     }
     
     if (!address.street.trim()) fieldErrors.street = 'Endereço é obrigatório';
     if (!address.number.trim()) fieldErrors.number = 'Obrigatório';
     if (!address.neighborhood.trim()) fieldErrors.neighborhood = 'Bairro é obrigatório';
     if (!address.city.trim()) fieldErrors.city = 'Cidade é obrigatória';
     if (!address.state.trim()) fieldErrors.state = 'UF';
     
     setAddressErrors(fieldErrors);
     return Object.keys(fieldErrors).length === 0;
   };
 
   const handlePersonalContinue = () => {
     if (validatePersonalData()) setStep('delivery');
   };
 
   const handleDeliveryContinue = () => {
     if (validateAddress()) setStep('review');
   };
 
   const handleReviewContinue = async () => {
     try {
       const shippingAddress = deliveryMethod === 'delivery' ? {
         method: 'delivery',
         cep: address.cep,
         street: address.street,
         number: address.number,
         complement: address.complement,
         neighborhood: address.neighborhood,
         city: address.city,
         state: address.state,
       } : { method: 'pickup' };
 
       const newOrderId = await createOrder.mutateAsync({
         shopUserId: shopUser?.id,
         customerName: personalData.name,
         customerEmail: personalData.email,
         customerPhone: personalData.phone || undefined,
         customerDocument: personalData.cpf?.replace(/\D/g, '') || undefined,
         items,
         shippingAddress,
       });
 
       if (newOrderId) {
         setOrderId(newOrderId as string);
         setStep('payment');
       }
     } catch (error) {
       console.error('Error creating order:', error);
     }
   };
 
   const handlePersonalChange = (field: keyof PersonalData, value: string) => {
     setPersonalData(prev => ({ ...prev, [field]: value }));
     if (personalErrors[field]) setPersonalErrors(prev => ({ ...prev, [field]: undefined }));
   };
 
   const handleAddressChange = (field: keyof AddressData, value: string) => {
     setAddress(prev => ({ ...prev, [field]: value }));
     if (addressErrors[field as keyof AddressErrors]) {
       setAddressErrors(prev => ({ ...prev, [field]: undefined }));
     }
   };
 
   const handlePaymentSuccess = () => {
     clearCart();
     setStep('success');
   };
 
   if (step === 'success') {
     return (
       <Sheet open={isOpen} onOpenChange={onClose}>
         <SheetContent 
           side={isMobile ? "top" : "right"}
           className={cn(
             "flex flex-col bg-white overflow-y-auto",
             isMobile ? "w-full h-[100dvh] inset-0" : "w-full sm:max-w-lg"
           )}
         >
           <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div 
               className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
               style={{ backgroundColor: `${primaryColor}20` }}
             >
               <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
             <p className="text-gray-500 max-w-xs">
               Seu pedido foi pago com sucesso. Em breve entraremos em contato para envio.
             </p>
             <Button 
               className="mt-8 text-white"
               style={{ backgroundColor: primaryColor }}
               onClick={onClose}
             >
               Voltar à Loja
             </Button>
           </div>
         </SheetContent>
       </Sheet>
     );
   }
 
   if (step === 'payment' && orderId) {
     return (
       <Sheet open={isOpen} onOpenChange={onClose}>
         <SheetContent 
           side={isMobile ? "top" : "right"}
           className={cn(
             "flex flex-col bg-white overflow-y-auto",
             isMobile ? "w-full h-[100dvh] inset-0" : "w-full sm:max-w-lg"
           )}
         >
           <div className="flex-1 overflow-y-auto p-4 pb-safe">
             {paymentMethod === 'pix' ? (
               <ShopPixPayment
                 orderId={orderId}
                 totalAmount={totalPrice}
                 customerData={personalData}
                 onPaymentSuccess={handlePaymentSuccess}
                 onBack={() => setStep('review')}
                 primaryColor={primaryColor}
               />
             ) : (
               <ShopCardPayment
                 orderId={orderId}
                 totalAmount={totalPrice}
                 customerData={personalData}
                 onPaymentSuccess={handlePaymentSuccess}
                 onBack={() => setStep('review')}
                 primaryColor={primaryColor}
               />
             )}
           </div>
         </SheetContent>
       </Sheet>
     );
   }
 
   return (
     <Sheet open={isOpen} onOpenChange={onClose}>
       <SheetContent 
         side={isMobile ? "top" : "right"}
         className={cn(
           "flex flex-col bg-white p-0 overflow-hidden",
           isMobile ? "w-full h-[100dvh] inset-0" : "w-full sm:max-w-lg"
         )}
       >
         <div className="border-b px-4">
           <CheckoutStepIndicator currentStep={step} primaryColor={primaryColor} />
         </div>
 
         <div className="flex-1 overflow-y-auto p-4">
           {step === 'personal' && (
             <CheckoutStepPersonal
               data={personalData}
               errors={personalErrors}
               onChange={handlePersonalChange}
               onContinue={handlePersonalContinue}
               onBack={onBack}
               primaryColor={primaryColor}
               hasPhoneFromRegistration={hasPhoneFromRegistration}
             />
           )}
 
           {step === 'delivery' && (
             <CheckoutStepDelivery
               deliveryMethod={deliveryMethod}
               address={address}
               errors={addressErrors}
               onMethodChange={setDeliveryMethod}
               onAddressChange={handleAddressChange}
               onContinue={handleDeliveryContinue}
               onBack={() => setStep('personal')}
               primaryColor={primaryColor}
             />
           )}
 
           {step === 'review' && (
             <CheckoutStepReview
               personalData={personalData}
               deliveryMethod={deliveryMethod}
               address={address}
               items={items}
               totalPrice={totalPrice}
               paymentMethod={paymentMethod}
               onPaymentMethodChange={setPaymentMethod}
               onEditPersonal={() => setStep('personal')}
               onEditDelivery={() => setStep('delivery')}
               onContinue={handleReviewContinue}
               onBack={() => setStep('delivery')}
               primaryColor={primaryColor}
               isLoading={createOrder.isPending}
             />
           )}
         </div>
       </SheetContent>
     </Sheet>
   );
 }
