 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, ShoppingBag, Shield, Lock, X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useShopCart } from '@/hooks/useShopCart';
 import { useShopConfig } from '@/hooks/useShopConfig';
 import { useShopAuth } from '@/contexts/ShopAuthContext';
 import { useCreateOrder } from '@/hooks/useShopOrders';
 import { ShopPixPayment } from '@/components/shop/public/ShopPixPayment';
 import { ShopCardPayment } from '@/components/shop/public/ShopCardPayment';
 import { ShopPaymentMethodSelector, type PaymentMethod } from '@/components/shop/public/ShopPaymentMethodSelector';
 import { ShopAuthModal } from '@/components/shop/public/ShopAuthModal';
 import { 
   formatPhone, 
   formatCPF,
 } from '@/lib/validations/checkout';
 import { cn } from '@/lib/utils';
 
 interface FormErrors {
   name?: string;
   email?: string;
   phone?: string;
   cpf?: string;
 }
 
 type CheckoutStep = 'form' | 'payment' | 'success';
 
 export default function ShopCheckoutPage() {
   const navigate = useNavigate();
   const { items, totalPrice, clearCart } = useShopCart();
   const { data: config } = useShopConfig();
   const { shopUser, isAuthenticated } = useShopAuth();
   const createOrder = useCreateOrder();
 
   const [formData, setFormData] = useState({
     name: '',
     email: '',
     phone: '',
     cpf: ''
   });
   const [errors, setErrors] = useState<FormErrors>({});
   const [step, setStep] = useState<CheckoutStep>('form');
   const [orderId, setOrderId] = useState<string | null>(null);
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
   const [showAuthModal, setShowAuthModal] = useState(false);
 
   const primaryColor = config?.primary_color || '#10B981';
   const hasPhoneFromRegistration = !!shopUser?.phone;
 
   // Redirect to cart if empty
   useEffect(() => {
     if (items.length === 0 && step !== 'success') {
       navigate('/shop/carrinho');
     }
   }, [items.length, step, navigate]);
 
   // Check auth on mount
   useEffect(() => {
     if (!isAuthenticated) {
       setShowAuthModal(true);
     }
   }, [isAuthenticated]);
 
   // Fill user data
   useEffect(() => {
     if (shopUser) {
       setFormData(prev => ({
         ...prev,
         name: shopUser.name || prev.name,
         email: shopUser.email || prev.email,
       phone: shopUser.phone || prev.phone,
       }));
     }
   }, [shopUser]);
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL'
     }).format(value);
   };
 
   const validateForm = (): boolean => {
     const fieldErrors: FormErrors = {};
     
     if (!formData.name.trim()) {
       fieldErrors.name = 'Nome é obrigatório';
     } else if (formData.name.trim().length < 3) {
       fieldErrors.name = 'Nome deve ter pelo menos 3 caracteres';
     }
 
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!formData.email.trim()) {
       fieldErrors.email = 'Email é obrigatório';
     } else if (!emailRegex.test(formData.email)) {
       fieldErrors.email = 'Email inválido';
     }
 
     if (!hasPhoneFromRegistration && !formData.phone.trim()) {
       fieldErrors.phone = 'Telefone é obrigatório';
     } else if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
       fieldErrors.phone = 'Telefone inválido';
     }
 
     const cleanCpf = formData.cpf.replace(/\D/g, '');
     if (!cleanCpf) {
       fieldErrors.cpf = 'CPF é obrigatório para pagamento';
     } else if (cleanCpf.length !== 11) {
       fieldErrors.cpf = 'CPF deve ter 11 dígitos';
     }
 
     setErrors(fieldErrors);
     return Object.keys(fieldErrors).length === 0;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     if (!validateForm()) {
       return;
     }
 
     try {
       const newOrderId = await createOrder.mutateAsync({
         shopUserId: shopUser?.id,
         customerName: formData.name,
         customerEmail: formData.email,
         customerPhone: formData.phone || undefined,
         customerDocument: formData.cpf?.replace(/\D/g, '') || undefined,
         items
       });
 
       if (newOrderId) {
         setOrderId(newOrderId as string);
         setStep('payment');
       }
     } catch (error) {
       console.error('Error creating order:', error);
     }
   };
 
   const handlePaymentSuccess = () => {
     clearCart();
     setStep('success');
   };
 
   const handlePhoneChange = (value: string) => {
     setFormData(prev => ({ ...prev, phone: formatPhone(value) }));
     if (errors.phone) {
       setErrors(prev => ({ ...prev, phone: undefined }));
     }
   };
 
   const handleCpfChange = (value: string) => {
     setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
     if (errors.cpf) {
       setErrors(prev => ({ ...prev, cpf: undefined }));
     }
   };
 
   const handleInputChange = (field: keyof typeof formData, value: string) => {
     setFormData(prev => ({ ...prev, [field]: value }));
     if (errors[field as keyof FormErrors]) {
       setErrors(prev => ({ ...prev, [field]: undefined }));
     }
   };
 
   const handleAuthSuccess = () => {
     setShowAuthModal(false);
   };
 
   // Success screen
   if (step === 'success') {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
           <div 
             className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ backgroundColor: `${primaryColor}20` }}
           >
             <CheckCircle 
               className="w-10 h-10"
               style={{ color: primaryColor }}
             />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">
             Pagamento Confirmado!
           </h2>
           <p className="text-gray-500 mb-8">
             Seu pedido foi pago com sucesso. Em breve entraremos em contato para envio.
           </p>
           <div className="space-y-3">
             <Button 
               className="w-full h-12 text-white rounded-xl"
               style={{ backgroundColor: primaryColor }}
               onClick={() => navigate('/shop/orders')}
             >
               Ver Meus Pedidos
             </Button>
             <Button 
               variant="outline"
               className="w-full h-12 rounded-xl"
               onClick={() => navigate('/shop')}
             >
               Continuar Comprando
             </Button>
           </div>
         </div>
       </div>
     );
   }
 
   // Payment step
   if (step === 'payment' && orderId) {
     return (
       <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-white border-b sticky top-0 z-10">
           <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
             <Button 
               variant="ghost" 
               size="icon"
               onClick={() => setStep('form')}
               className="rounded-xl"
             >
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div>
               <h1 className="text-lg font-semibold text-gray-900">Pagamento</h1>
               <p className="text-sm text-gray-500">Etapa 2 de 2</p>
             </div>
           </div>
         </header>
 
         <main className="max-w-2xl mx-auto px-4 py-6 pb-safe">
           <div className="bg-white rounded-2xl shadow-sm p-6">
             {paymentMethod === 'pix' ? (
               <ShopPixPayment
                 orderId={orderId}
                 totalAmount={totalPrice}
                 customerData={{
                   ...formData,
                   phone: formData.phone || shopUser?.phone || ''
                 }}
                 onPaymentSuccess={handlePaymentSuccess}
                 onBack={() => setStep('form')}
                 primaryColor={primaryColor}
               />
             ) : (
               <ShopCardPayment
                 orderId={orderId}
                 totalAmount={totalPrice}
                 customerData={{
                   ...formData,
                   phone: formData.phone || shopUser?.phone || ''
                 }}
                 onPaymentSuccess={handlePaymentSuccess}
                 onBack={() => setStep('form')}
                 primaryColor={primaryColor}
               />
             )}
           </div>
         </main>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-gray-50">
       {/* Header */}
       <header className="bg-white border-b sticky top-0 z-10">
         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
           <Button 
             variant="ghost" 
             size="icon"
             onClick={() => navigate('/shop/carrinho')}
             className="rounded-xl text-gray-700 hover:bg-gray-100"
           >
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="flex-1">
             <h1 className="text-lg font-semibold text-gray-900">Finalizar Compra</h1>
             <p className="text-sm text-gray-500">Etapa 1 de 2</p>
           </div>
           <div className="flex items-center gap-2 text-gray-500">
             <Lock className="w-4 h-4" />
             <span className="text-xs hidden sm:inline">Pagamento Seguro</span>
           </div>
         </div>
       </header>
 
       <main className="max-w-6xl mx-auto px-4 py-6 pb-safe">
         <div className="grid lg:grid-cols-5 gap-6">
           {/* Form Section */}
           <div className="lg:col-span-3">
             <form onSubmit={handleSubmit} className="space-y-6">
               {/* Customer Details Card */}
               <div className="bg-white rounded-2xl shadow-sm p-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                   <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">1</span>
                   Seus Dados
                 </h2>
                 
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="checkout-name" className="text-gray-700 font-medium">
                       Nome Completo *
                     </Label>
                     <Input
                       id="checkout-name"
                       value={formData.name}
                       onChange={(e) => handleInputChange('name', e.target.value)}
                       placeholder="Seu nome completo"
                       className={cn(
                          "h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors text-gray-900 placeholder:text-gray-400",
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
 
                   <div className="grid sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="checkout-email" className="text-gray-700 font-medium">
                         Email *
                       </Label>
                       <Input
                         id="checkout-email"
                         type="email"
                         value={formData.email}
                         onChange={(e) => handleInputChange('email', e.target.value)}
                         placeholder="seu@email.com"
                         className={cn(
                            "h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors text-gray-900 placeholder:text-gray-400",
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
                         <Label htmlFor="checkout-phone" className="text-gray-700 font-medium">
                           Telefone (WhatsApp) *
                         </Label>
                         <Input
                           id="checkout-phone"
                           type="tel"
                           value={formData.phone}
                           onChange={(e) => handlePhoneChange(e.target.value)}
                           placeholder="(11) 99999-9999"
                           maxLength={15}
                           className={cn(
                              "h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors text-gray-900 placeholder:text-gray-400",
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
                   </div>
 
                   <div className="space-y-2">
                     <Label htmlFor="checkout-cpf" className="text-gray-700 font-medium">
                       CPF *
                     </Label>
                     <Input
                       id="checkout-cpf"
                       value={formData.cpf}
                       onChange={(e) => handleCpfChange(e.target.value)}
                       placeholder="000.000.000-00"
                       maxLength={14}
                       className={cn(
                          "h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors text-gray-900 placeholder:text-gray-400 sm:max-w-xs",
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
               </div>
 
               {/* Payment Method Card */}
               <div className="bg-white rounded-2xl shadow-sm p-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                   <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">2</span>
                   Forma de Pagamento
                 </h2>
                 
                 <ShopPaymentMethodSelector
                   selectedMethod={paymentMethod}
                   onMethodChange={setPaymentMethod}
                   primaryColor={primaryColor}
                 />
               </div>
 
               {/* Submit Button - Mobile Only */}
               <div className="lg:hidden space-y-3">
                 <Button 
                   type="submit"
                   className="w-full h-14 text-white text-base font-semibold rounded-xl"
                   style={{ backgroundColor: primaryColor }}
                   disabled={createOrder.isPending}
                 >
                   {createOrder.isPending ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin mr-2" />
                       Processando...
                     </>
                   ) : (
                     `Continuar para Pagamento`
                   )}
                 </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-gray-600 border-gray-300 rounded-xl hover:bg-gray-50"
                    onClick={() => navigate('/shop/carrinho')}
                    disabled={createOrder.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Compra
                  </Button>
               </div>
             </form>
           </div>
 
           {/* Order Summary - Sidebar */}
           <div className="lg:col-span-2">
             <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">
                 Resumo do Pedido
               </h2>
               
               {/* Items */}
               <div className="space-y-3 mb-4">
                 {items.map((item) => (
                   <div key={item.productId} className="flex gap-3">
                     <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                       {item.image ? (
                         <img 
                           src={item.image} 
                           alt={item.name}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <ShoppingBag className="w-6 h-6 text-gray-400" />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-900 line-clamp-2">
                         {item.name}
                       </p>
                       <p className="text-xs text-gray-500 mt-1">
                         Qtd: {item.quantity}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-semibold text-gray-900">
                         {formatCurrency(item.price * item.quantity)}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
 
               <div className="border-t pt-4 space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Subtotal</span>
                   <span className="text-gray-900">{formatCurrency(totalPrice)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Frete</span>
                   <span className="text-gray-500 text-xs">A calcular</span>
                 </div>
                 <div className="flex justify-between text-lg font-bold pt-2 border-t">
                   <span className="text-gray-900">Total</span>
                   <span style={{ color: primaryColor }}>
                     {formatCurrency(totalPrice)}
                   </span>
                 </div>
               </div>
 
               {/* Submit Button - Desktop Only */}
               <div className="hidden lg:block mt-6 space-y-3">
                 <Button 
                   type="submit"
                   form="checkout-form"
                   className="w-full h-14 text-white text-base font-semibold rounded-xl"
                   style={{ backgroundColor: primaryColor }}
                   disabled={createOrder.isPending}
                   onClick={handleSubmit}
                 >
                   {createOrder.isPending ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin mr-2" />
                       Processando...
                     </>
                   ) : (
                     `Pagar ${formatCurrency(totalPrice)}`
                   )}
                 </Button>
 
                 <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                   <Shield className="w-4 h-4" />
                   <span>Compra 100% segura</span>
                 </div>

                  <Button 
                    type="button"
                    variant="ghost"
                    className="w-full h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
                    onClick={() => navigate('/shop/carrinho')}
                    disabled={createOrder.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Compra
                  </Button>
               </div>
 
               {/* Security Badges */}
               <div className="mt-4 pt-4 border-t">
                 <div className="flex items-center justify-center gap-4 text-gray-400">
                   <Lock className="w-5 h-5" />
                   <Shield className="w-5 h-5" />
                 </div>
                 <p className="text-xs text-center text-gray-400 mt-2">
                   Seus dados estão protegidos
                 </p>
               </div>
             </div>
           </div>
         </div>
       </main>
 
       {/* Auth Modal */}
       <ShopAuthModal 
         isOpen={showAuthModal} 
         onClose={() => navigate('/shop/carrinho')}
         onSuccess={handleAuthSuccess}
       />
     </div>
   );
 }