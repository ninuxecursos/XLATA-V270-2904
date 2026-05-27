import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Customer, Order } from '@/types/pdv';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface VirtualizedOrderListProps {
  customers: Customer[];
  activeCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onDeleteOrder: (e: React.MouseEvent, customer: Customer) => void;
}

export const VirtualizedOrderList: React.FC<VirtualizedOrderListProps> = ({
  customers,
  activeCustomer,
  onSelectCustomer,
  onDeleteOrder,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto flex-1"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const customer = customers[virtualRow.index];
          const isSelected = activeCustomer?.id === customer.id;
          const openOrder = customer.orders.find((o) => o.status === 'open');

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onSelectCustomer(customer)}
              className={`flex justify-between items-center p-3 border-b border-gray-700 cursor-pointer ${
                isSelected ? 'bg-[#194530]' : 'hover:bg-pdv-dark'
              }`}
            >
              <div className="text-left flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium">{customer.name}</p>
                  {openOrder && (
                    <Badge
                      variant={openOrder.type === 'venda' ? 'default' : 'secondary'}
                      className={`text-xs px-2 py-0.5 ${
                        openOrder.type === 'venda'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {openOrder.type === 'venda' ? 'Venda' : 'Compra'}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {openOrder ? `${openOrder.items.length} itens` : '0 itens'}
                </p>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-4">
                  <p className="text-green-500 font-bold">
                    {openOrder ? `R$ ${openOrder.total.toFixed(2)}` : 'R$ 0.00'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {openOrder
                      ? new Date(openOrder.timestamp).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        }) +
                        ' ' +
                        new Date(openOrder.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--/-- --:--'}
                  </p>
                </div>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded"
                  onClick={(e) => onDeleteOrder(e, customer)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
