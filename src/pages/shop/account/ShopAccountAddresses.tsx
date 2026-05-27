import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Trash2, Check, Loader2, Home, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShopHeader } from '@/components/shop/public/ShopHeader';
import { ShopFooter } from '@/components/shop/public/ShopFooter';
import { ShopBottomNav } from '@/components/shop/mobile/ShopBottomNav';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useShopConfig } from '@/hooks/useShopConfig';
import { 
  useShopAddresses, 
  useCreateAddress, 
  useDeleteAddress, 
  useSetDefaultAddress,
  useCepLookup
} from '@/hooks/useShopAddresses';
import { formatCEP, formatPhone } from '@/lib/validations/checkout';
import { cn } from '@/lib/utils';

export default function ShopAccountAddresses() {
  const navigate = useNavigate();
  const { shopUser, isAuthenticated } = useShopAuth();
  const { data: config } = useShopConfig();
  const { data: addresses = [], isLoading } = useShopAddresses(shopUser?.id);
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const cepLookup = useCepLookup();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Casa',
    recipient_name: '',
    phone: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    is_default: false
  });
  
  const primaryColor = config?.colors?.primary || '#10B981';

  if (!isAuthenticated) {
    navigate('/shop/account');
    return null;
  }

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    setFormData(prev => ({ ...prev, zip_code: formatted }));
    
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      try {
        const address = await cepLookup.mutateAsync(clean);
        setFormData(prev => ({
          ...prev,
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state
        }));
      } catch {
        // Error handled by hook
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUser?.id) return;
    
    await createAddress.mutateAsync({
      user_id: shopUser.id,
      ...formData
    });
    
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      label: 'Casa',
      recipient_name: shopUser?.name || '',
      phone: shopUser?.phone || '',
      zip_code: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      is_default: addresses.length === 0
    });
  };

  const handleDelete = async (addressId: string) => {
    if (!shopUser?.id) return;
    await deleteAddress.mutateAsync({ addressId, userId: shopUser.id });
  };

  const handleSetDefault = async (addressId: string) => {
    if (!shopUser?.id) return;
    await setDefaultAddress.mutateAsync({ addressId, userId: shopUser.id });
  };

  return (
    <div className="min-h-screen bg-gray-50 light" data-theme="light">
      <ShopHeader />
      
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100"
              onClick={() => navigate('/shop/account')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Meus Endereços</h1>
          </div>
          <Button
            size="sm"
            className="rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Lista de endereços */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <MapPin className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum endereço cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Adicione um endereço para facilitar suas compras
            </p>
            <Button
              className="rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 transition-all",
                  address.is_default 
                    ? "border-2" 
                    : "border-gray-100"
                )}
                style={address.is_default ? { borderColor: primaryColor } : undefined}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {address.label === 'Casa' ? (
                      <Home className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Building className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-semibold text-gray-900">{address.label}</span>
                    {address.is_default && (
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={setDefaultAddress.isPending}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Definir padrão
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(address.id)}
                      disabled={deleteAddress.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{address.recipient_name}</p>
                  <p>{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ''}</p>
                  <p>{address.neighborhood} - {address.city}/{address.state}</p>
                  <p>CEP: {address.zip_code}</p>
                  {address.phone && <p>Tel: {address.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de adicionar endereço */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Endereço</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Label */}
            <div className="flex gap-2">
              {['Casa', 'Trabalho', 'Outro'].map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant={formData.label === label ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "rounded-lg flex-1",
                    formData.label === label && "text-white"
                  )}
                  style={formData.label === label ? { backgroundColor: primaryColor } : undefined}
                  onClick={() => setFormData(prev => ({ ...prev, label }))}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="recipient_name">Nome do destinatário *</Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  maxLength={15}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  placeholder="Apto, bloco..."
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  maxLength={2}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_default" className="text-sm text-gray-600">
                Definir como endereço padrão
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={createAddress.isPending}
              >
                {createAddress.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Endereço'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
