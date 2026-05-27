
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveMaterial, getMaterials } from '@/utils/supabaseStorage';
import { Material } from '@/types/pdv';
import { toast } from "@/hooks/use-toast";
import VirtualKeyboard from './VirtualKeyboard';
import { useAuth } from "@/hooks/useAuth";
import { wouldCreateDuplicate } from '@/utils/materialMatching';

interface ManualMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, price: number, manualPrice: boolean) => void;
  peso: string;
}

const ManualMaterialModal: React.FC<ManualMaterialModalProps> = ({
  open,
  onClose,
  onConfirm,
  peso
}) => {
  const [materialName, setMaterialName] = useState('');
  const [manualPrice, setManualPrice] = useState(false);
  const [price, setPrice] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleConfirm = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    if (!materialName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do material é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar materiais.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      const finalPrice = manualPrice ? parseFloat(price.replace(',', '.')) || 0 : 0;

      // Check for case-insensitive duplicates before saving
      const existingMaterials = await getMaterials();
      if (wouldCreateDuplicate(materialName.trim(), existingMaterials)) {
        toast({
          title: "Material Duplicado",
          description: "Já existe um material com nome similar. Verifique os materiais existentes.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      // Salvar material manual se preço manual estiver ativado
      if (manualPrice && finalPrice > 0) {
        const newMaterial: Material = {
          id: crypto.randomUUID(),
          name: materialName.trim(),
          price: finalPrice,
          salePrice: finalPrice,
          unit: 'kg',
          user_id: user.id
        };
        
        console.log('Salvando material manual:', newMaterial);
        await saveMaterial(newMaterial);
        
        toast({
          title: "Material salvo",
          description: `Material "${materialName}" foi salvo no banco de dados`,
        });
      }
      
      onConfirm(materialName.trim(), finalPrice, manualPrice);
      
      // Resetar formulário
      setMaterialName('');
      setManualPrice(false);
      setPrice('');
      setShowKeyboard(false);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar material no banco de dados";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMaterialName('');
    setManualPrice(false);
    setPrice('');
    setShowKeyboard(false);
    onClose();
  };

  const handleInputFocus = () => {
    setShowKeyboard(true);
  };

  const handleKeyboardInput = (value: string) => {
    setMaterialName(prev => prev + value);
  };

  const handleKeyboardDelete = () => {
    setMaterialName(prev => prev.slice(0, -1));
  };

  const handleKeyboardClear = () => {
    setMaterialName('');
  };

  const handleKeyboardClose = () => {
    setShowKeyboard(false);
  };

  const formatPeso = (value: string | number) => {
    if (!value) return "0,000";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace('.', ',');
  };

  const formatPrice = (value: string) => {
    // Remove everything except numbers and comma
    let cleaned = value.replace(/[^\d,]/g, '');
    
    // Ensure only one comma
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setPrice(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-pdv-dark border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Inserir Material Manualmente</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Adicione um material que não está na lista
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4" onKeyDown={handleKeyDown}>
          {/* Nome do Material */}
          <div className="space-y-2">
            <Label htmlFor="material-name" className="text-white">Nome do Material/Produto</Label>
            <Input
              ref={inputRef}
              id="material-name"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Digite o nome do material"
              className="bg-pdv-dark border-gray-600 text-white placeholder-gray-400"
              disabled={loading || isSubmitting}
            />
          </div>

          {/* Teclado Virtual */}
          {showKeyboard && (
            <VirtualKeyboard
              onInput={handleKeyboardInput}
              onDelete={handleKeyboardDelete}
              onClear={handleKeyboardClear}
              onClose={handleKeyboardClose}
            />
          )}

          {/* Peso da Balança */}
          <div className="space-y-2">
            <Label className="text-white">Peso na Balança</Label>
            <div className="text-2xl font-bold text-green-500 text-center py-2 bg-black rounded">
              {formatPeso(peso)} kg
            </div>
          </div>

          {/* Switch para Valor Manual */}
          <div className="flex items-center space-x-2">
            <Switch
              id="manual-price"
              checked={manualPrice}
              onCheckedChange={setManualPrice}
              disabled={loading || isSubmitting}
            />
            <Label htmlFor="manual-price" className="text-white">Valor Manual</Label>
          </div>

          {/* Campo de Valor Manual */}
          {manualPrice && (
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">Valor por Kg</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="0,00"
                  className="bg-pdv-dark border-gray-600 text-[#48DD82] placeholder-gray-400 text-center text-2xl font-bold pl-8"
                  disabled={loading || isSubmitting}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#48DD82] text-2xl font-bold">
                  R$
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 bg-transparent border-white text-white hover:bg-gray-700"
            disabled={loading || isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!materialName.trim() || loading || isSubmitting}
            className="flex-1 bg-pdv-green text-white hover:bg-pdv-green/90 disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Confirmar Material"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualMaterialModal;
