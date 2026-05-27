import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { Order } from '@/types/pdv';

export interface CancellationData {
  reason: string;
  customReason?: string;
  hasRefund: boolean;
  refundAmount: number;
}

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CancellationData) => void;
  order: Order | null;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'devolucao_produto', label: 'Devolução de produto' },
  { value: 'devolucao_dinheiro', label: 'Devolução de dinheiro' },
  { value: 'erro_digitacao', label: 'Erro de digitação' },
  { value: 'cliente_desistiu', label: 'Cliente desistiu' },
  { value: 'produto_defeito', label: 'Produto com defeito' },
  { value: 'outro', label: 'Outro (especificar)' }
];

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  isLoading = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [hasRefund, setHasRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrencyInput = (value: string): number => {
    const cleanValue = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const handleRefundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setRefundAmount(formatted);
  };

  const handleConfirm = () => {
    const reasonLabel = CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    const finalReason = selectedReason === 'outro' && customReason ? customReason : reasonLabel;

    onConfirm({
      reason: finalReason,
      customReason: selectedReason === 'outro' ? customReason : undefined,
      hasRefund,
      refundAmount: hasRefund ? parseCurrencyInput(refundAmount) : 0
    });

    // Reset form
    setSelectedReason('');
    setCustomReason('');
    setHasRefund(false);
    setRefundAmount('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setHasRefund(false);
    setRefundAmount('');
    onClose();
  };

  const isValid = selectedReason && (selectedReason !== 'outro' || customReason.trim()) && (!hasRefund || parseCurrencyInput(refundAmount) > 0);

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancelar {order.type === 'venda' ? 'Venda' : 'Compra'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            O pedido será marcado como cancelado e o histórico será preservado para auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Pedido</span>
              <span className="text-white font-mono text-sm">{order.id.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Tipo</span>
              <span className={`text-sm font-medium ${order.type === 'venda' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {order.type === 'venda' ? 'Venda' : 'Compra'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Valor Total</span>
              <span className="text-white font-bold">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label className="text-slate-300">Motivo do Cancelamento *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem 
                    key={reason.value} 
                    value={reason.value}
                    className="text-white hover:bg-slate-700"
                  >
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'outro' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Especifique o motivo *</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
              />
            </div>
          )}

          {/* Refund Checkbox */}
          <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
            <Checkbox
              id="hasRefund"
              checked={hasRefund}
              onCheckedChange={(checked) => setHasRefund(checked === true)}
              className="border-slate-500"
            />
            <Label htmlFor="hasRefund" className="text-slate-300 cursor-pointer flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Houve devolução de dinheiro
            </Label>
          </div>

          {/* Refund Amount */}
          {hasRefund && (
            <div className="space-y-2">
              <Label className="text-slate-300">Valor Devolvido *</Label>
              <Input
                value={refundAmount}
                onChange={handleRefundAmountChange}
                placeholder="R$ 0,00"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                onClick={() => setRefundAmount(formatCurrency(order.total).replace('R$', 'R$ '))}
              >
                Usar valor total ({formatCurrency(order.total)})
              </Button>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-200 text-sm">
              Esta ação não pode ser desfeita. O pedido será cancelado e os valores serão ajustados no fechamento de caixa.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationModal;
