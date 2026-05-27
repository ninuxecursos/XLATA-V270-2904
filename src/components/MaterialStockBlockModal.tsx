import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Trash2 } from "lucide-react";

interface MaterialStockBlockModalProps {
  open: boolean;
  onClose: () => void;
  materialName: string;
  stockQuantity: number;
  onViewStock: () => void;
  onClearMaterialStock: () => void;
}

const MaterialStockBlockModal: React.FC<MaterialStockBlockModalProps> = ({
  open,
  onClose,
  materialName,
  stockQuantity,
  onViewStock,
  onClearMaterialStock
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl text-amber-400 font-bold">
            Exclusão Bloqueada
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-base mt-2">
            O material <span className="font-semibold text-white">"{materialName}"</span> possui{' '}
            <span className="font-bold text-emerald-400">{stockQuantity.toFixed(2)} kg</span> em estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-700/50 rounded-lg p-4 my-4">
          <p className="text-sm text-slate-400 text-center">
            Para excluir este material, primeiro zere o estoque dele ou aguarde as vendas.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            onClick={onViewStock}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver no Estoque
          </Button>
          <Button
            onClick={onClearMaterialStock}
            variant="outline"
            className="w-full bg-slate-700 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Zerar Estoque deste Material
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialStockBlockModal;
