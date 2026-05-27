import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import { Order } from '@/types/pdv';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Order | null;
  onReprint?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  orderPayment?: any;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onReprint,
  onDelete,
  orderPayment
}) => {
  if (!transaction) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix':
        return 'PIX';
      case 'dinheiro':
        return 'Dinheiro';
      case 'debito':
        return 'Débito';
      case 'credito':
        return 'Crédito';
      default:
        return 'Dinheiro';
    }
  };

  const getTypeText = (type: string) => {
    return type === 'compra' ? 'Compra' : 'Venda';
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === 'compra' ? 'secondary' : 'default';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Transação
            {transaction.cancelled && (
              <Badge variant="destructive" className="ml-2">CANCELADO</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cancellation Info */}
          {transaction.cancelled && (
            <Card className="bg-red-900/30 border-red-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="font-medium text-red-400">Transação Cancelada</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Motivo: </span>
                    {transaction.cancellation_reason || 'Não informado'}
                  </div>
                  {transaction.cancelled_at && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">Data do cancelamento: </span>
                      {formatDateTime(transaction.cancelled_at)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Header */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm text-gray-400">ID da Transação</div>
                  <div className="font-mono text-sm text-white">{transaction.id.substring(0, 8)}</div>
                </div>
                <Badge 
                  variant={transaction.cancelled ? 'destructive' : getTypeBadgeVariant(transaction.type)}
                  className="text-xs"
                >
                  {transaction.cancelled ? 'Cancelado' : getTypeText(transaction.type)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-400">Data</div>
                  <div className="text-white">{formatDate(transaction.timestamp)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Hora</div>
                  <div className="text-white">{formatTime(transaction.timestamp)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Materiais</h3>
              <div className="space-y-2">
                {transaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <div className={transaction.cancelled ? 'text-gray-400' : 'text-white'}>{item.materialName}</div>
                      <div className="text-gray-400">{item.quantity.toFixed(2)} kg × {formatCurrency(item.price)}</div>
                    </div>
                    <div className={`font-medium ${transaction.cancelled ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3 bg-gray-600" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total de itens:</span>
                <span className="text-white font-medium">{transaction.items.length} item(s)</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Pagamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Método:</span>
                  <span className="text-white">
                    {orderPayment ? getPaymentMethodText(orderPayment.payment_method) : 'Dinheiro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor Total:</span>
                  <span className={`font-medium text-lg ${transaction.cancelled ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {formatCurrency(transaction.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => transaction && onReprint?.(transaction)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Reimprimir
            </Button>
            
            {!transaction.cancelled && (
              <Button
                onClick={() => transaction && onDelete?.(transaction)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar Transação
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
