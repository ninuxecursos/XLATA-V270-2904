
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order, Customer } from "../types/pdv";

interface OrderCompletionModalEnhancedProps {
  open: boolean;
  order: Order | null;
  customer: Customer | null;
  onPrint: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaleMode?: boolean;
}

const OrderCompletionModalEnhanced: React.FC<OrderCompletionModalEnhancedProps> = ({
  open,
  order,
  customer,
  onPrint,
  onSave,
  onCancel,
  isSaleMode = false
}) => {
  // Handle Enter key press to trigger ONLY print - no other buttons should have shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Enter') {
        e.preventDefault();
        onPrint(); // Only trigger print button, not save
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onPrint]);

  if (!order || !customer) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(3)} kg`;
  };

  const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
  const netWeight = totalWeight - totalTara;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-pdv-dark text-white rounded-lg shadow-lg px-8 py-6 max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center border-b border-pdv-green pb-2">
            Resumo do Pedido - {customer.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center mt-2">
            Confirme os detalhes do pedido antes de finalizar
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-white">Material</TableHead>
                <TableHead className="text-white">Quantidade</TableHead>
                <TableHead className="text-white">Preço/kg</TableHead>
                <TableHead className="text-white">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index} className="border-gray-600">
                  <TableCell className="text-white">{item.materialName}</TableCell>
                  <TableCell className="text-white">{formatWeight(item.quantity)}</TableCell>
                  <TableCell className="text-white">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-white">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-lg font-medium text-white mb-2">Peso Bruto:</div>
            <div className="text-2xl font-bold text-white">{formatWeight(totalWeight)}</div>
          </div>
          
          <div className="bg-pdv-green bg-opacity-80 p-4 rounded-lg">
            <div className="text-lg font-medium text-white mb-2">
              {isSaleMode ? "Total:" : "Total:"}
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(order.total)}</div>
          </div>
          
          <div className="bg-yellow-600 bg-opacity-80 p-4 rounded-lg">
            <div className="text-lg font-medium text-white mb-2">Total Tara:</div>
            <div className="text-2xl font-bold text-white">{formatWeight(totalTara)}</div>
          </div>
          
          <div className="bg-blue-600 bg-opacity-80 p-4 rounded-lg">
            <div className="text-lg font-medium text-white mb-2">Peso Líquido:</div>
            <div className="text-2xl font-bold text-white">{formatWeight(netWeight)}</div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button 
            onClick={onSave}
            className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
          >
            Só Salvar
          </Button>
          <Button 
            onClick={onPrint}
            className="bg-pdv-green hover:bg-pdv-green/90 text-white flex-1"
          >
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCompletionModalEnhanced;
