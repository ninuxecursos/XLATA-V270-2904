import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Loader2 } from 'lucide-react';

interface MaterialPriceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  currentPurchasePrice: number;
  currentSalePrice: number;
  onSave: (purchasePrice: number, salePrice: number) => Promise<void>;
}

// Máscara para valores em BRL
const maskBRL = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const numValue = parseInt(numbers, 10) || 0;
  return (numValue / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const unmaskBRL = (maskedValue: string): number => {
  const numbers = maskedValue.replace(/\D/g, '');
  return (parseInt(numbers, 10) || 0) / 100;
};

const numberToMask = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const MaterialPriceEditModal: React.FC<MaterialPriceEditModalProps> = ({
  open,
  onOpenChange,
  materialName,
  currentPurchasePrice,
  currentSalePrice,
  onSave,
}) => {
  const { toast } = useToast();
  const [purchasePriceMask, setPurchasePriceMask] = useState('');
  const [salePriceMask, setSalePriceMask] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar valores quando o modal abre
  useEffect(() => {
    if (open) {
      setPurchasePriceMask(numberToMask(currentPurchasePrice));
      setSalePriceMask(numberToMask(currentSalePrice));
    }
  }, [open, currentPurchasePrice, currentSalePrice]);

  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBRL(e.target.value);
    setPurchasePriceMask(masked);
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBRL(e.target.value);
    setSalePriceMask(masked);
  };

  const handleSave = async () => {
    const purchasePrice = unmaskBRL(purchasePriceMask);
    const salePrice = unmaskBRL(salePriceMask);

    if (purchasePrice <= 0 && salePrice <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe pelo menos um preço válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(purchasePrice, salePrice);
      toast({
        title: 'Sucesso',
        description: 'Preços atualizados com sucesso!',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prices:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os preços.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Editar Preços
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <p className="text-sm text-slate-400">Material</p>
            <p className="text-lg font-medium text-white">{materialName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice" className="text-slate-300">
              Preço de Compra (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                R$
              </span>
              <Input
                id="purchasePrice"
                type="text"
                inputMode="numeric"
                value={purchasePriceMask}
                onChange={handlePurchasePriceChange}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePrice" className="text-slate-300">
              Preço de Venda (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                R$
              </span>
              <Input
                id="salePrice"
                type="text"
                inputMode="numeric"
                value={salePriceMask}
                onChange={handleSalePriceChange}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPriceEditModal;
