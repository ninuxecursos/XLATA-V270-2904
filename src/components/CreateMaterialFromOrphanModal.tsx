import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createMaterialFromOrphan } from '@/utils/orphanMaterials';
import { getMaterials } from '@/utils/supabaseStorage';
import { wouldCreateDuplicate } from '@/utils/materialMatching';

interface CreateMaterialFromOrphanModalProps {
  open: boolean;
  onClose: () => void;
  orphanName: string;
  onSuccess: () => void;
}

// BRL mask helpers
const maskBRL = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const cents = parseInt(numbers || '0', 10);
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const unmaskBRL = (maskedValue: string): number => {
  const numbers = maskedValue.replace(/\D/g, '');
  return parseInt(numbers || '0', 10) / 100;
};

const CreateMaterialFromOrphanModal: React.FC<CreateMaterialFromOrphanModalProps> = ({
  open,
  onClose,
  orphanName,
  onSuccess
}) => {
  const [purchasePrice, setPurchasePrice] = useState('0,00');
  const [salePrice, setSalePrice] = useState('0,00');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setPurchasePrice('0,00');
      setSalePrice('0,00');
    }
  }, [open]);

  const handlePriceChange = (value: string, setter: (v: string) => void) => {
    setter(maskBRL(value));
  };

  const handleCreate = async () => {
    const price = unmaskBRL(purchasePrice);
    const sale = unmaskBRL(salePrice);

    if (price <= 0) {
      toast({
        title: "Preço inválido",
        description: "O preço de compra deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (sale <= 0) {
      toast({
        title: "Preço inválido",
        description: "O preço de venda deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Check for case-insensitive duplicates before creating
      const existingMaterials = await getMaterials();
      if (wouldCreateDuplicate(orphanName, existingMaterials)) {
        const similarMaterial = existingMaterials.find(
          m => m.name.toLowerCase().trim() === orphanName.toLowerCase().trim()
        );
        toast({
          title: "Material Duplicado",
          description: `Já existe um material com nome similar: "${similarMaterial?.name || orphanName}". Use o material existente.`,
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      await createMaterialFromOrphan(orphanName, price, sale);
      
      toast({
        title: "Material cadastrado!",
        description: `"${orphanName}" foi adicionado ao cadastro de materiais.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar material. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Cadastro de Material
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicionar <span className="text-white font-medium">"{orphanName}"</span> ao cadastro de materiais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Nome do Material</Label>
            <Input
              value={orphanName}
              disabled
              className="bg-slate-700 border-slate-600 text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Preço Compra (R$)</Label>
              <Input
                value={purchasePrice}
                onChange={(e) => handlePriceChange(e.target.value, setPurchasePrice)}
                placeholder="0,00"
                className="bg-slate-700 border-slate-600 text-white text-center"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Preço Venda (R$)</Label>
              <Input
                value={salePrice}
                onChange={(e) => handlePriceChange(e.target.value, setSalePrice)}
                placeholder="0,00"
                className="bg-slate-700 border-slate-600 text-white text-center"
              />
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm">
            <p className="text-emerald-300">
              ✓ O material será criado e todo o estoque existente ficará automaticamente vinculado.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isCreating ? "Criando..." : "Criar Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMaterialFromOrphanModal;
