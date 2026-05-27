import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Zap, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useCreateInteractiveEvent, useInteractiveConfig } from '@/hooks/useInteractiveEvents';
import { format, addHours } from 'date-fns';

interface InteractiveEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InteractiveEventModal({ isOpen, onClose }: InteractiveEventModalProps) {
  const { data: products = [] } = useShopProducts();
  const { data: config } = useInteractiveConfig();
  const createEvent = useCreateInteractiveEvent();

  const [formData, setFormData] = useState({
    product_id: '',
    initial_value: '',
    minimum_increment: '',
    start_at: '',
    end_at: '',
  });

  // Set defaults based on config
  useEffect(() => {
    if (config && isOpen) {
      const now = new Date();
      const endTime = addHours(now, config.default_duration_minutes / 60);
      
      setFormData(prev => ({
        ...prev,
        minimum_increment: config.default_increment.toString(),
        start_at: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_at: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  }, [config, isOpen]);

  // Update initial value when product changes
  useEffect(() => {
    if (formData.product_id) {
      const product = products.find(p => p.id === formData.product_id);
      if (product) {
        setFormData(prev => ({
          ...prev,
          initial_value: product.sale_price?.toString() || product.price.toString(),
        }));
      }
    }
  }, [formData.product_id, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.initial_value || !formData.start_at || !formData.end_at) {
      return;
    }

    await createEvent.mutateAsync({
      product_id: formData.product_id,
      initial_value: parseFloat(formData.initial_value),
      minimum_increment: parseFloat(formData.minimum_increment) || 10,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      product_id: '',
      initial_value: '',
      minimum_increment: '',
      start_at: '',
      end_at: '',
    });
    onClose();
  };

  // Filter products that can be used for interactive events
  const availableProducts = products.filter(p => 
    p.is_active && p.stock_quantity > 0 && p.sale_type === 'interactive'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="w-5 h-5 text-emerald-600" />
            Criar Evento Interativo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label className="text-gray-900">Produto</Label>
            {availableProducts.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  Nenhum produto disponível. Certifique-se de que existem produtos com tipo de venda "Interativo" e estoque disponível.
                </p>
              </div>
            ) : (
              <Select 
                value={formData.product_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        {product.images?.[0] && (
                          <img 
                            src={product.images[0]} 
                            alt="" 
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span>{product.name}</span>
                        <span className="text-gray-400 text-sm">
                          (Estoque: {product.stock_quantity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Values Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-900 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Valor Inicial (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.initial_value}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_value: e.target.value }))}
                placeholder="100.00"
                className="bg-white text-gray-900 border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Incremento Mínimo (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={formData.minimum_increment}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_increment: e.target.value }))}
                placeholder="10.00"
                className="bg-white text-gray-900 border-gray-300"
                required
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Início
              </Label>
              <Input
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData(prev => ({ ...prev, start_at: e.target.value }))}
                className="bg-white text-gray-900 border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Término
              </Label>
              <Input
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) => setFormData(prev => ({ ...prev, end_at: e.target.value }))}
                className="bg-white text-gray-900 border-gray-300"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="bg-white text-gray-700 border-gray-300"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createEvent.isPending || availableProducts.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createEvent.isPending ? 'Criando...' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
