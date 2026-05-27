import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types/pdv';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { cleanMaterialName } from '../utils/materialNameCleaner';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface OrderDetailsProps {
  customer: Customer | null;
  activeOrder: Order | null;
  onCompleteOrder: () => void;
  formatPeso: (value: string | number) => string;
  onDeleteItem: (index: number) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  customer,
  activeOrder,
  onCompleteOrder,
  formatPeso,
  onDeleteItem
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Hooks de responsividade
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;

  // Handle Enter key press for deletion confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deleteConfirmOpen && e.key === 'Enter') {
        e.preventDefault();
        handleDeleteConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteConfirmOpen, itemToDelete]);

  const handleDeleteConfirm = () => {
    if (itemToDelete !== null) {
      onDeleteItem(itemToDelete);
      setItemToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDeleteClick = (index: number) => {
    setItemToDelete(index);
    setDeleteConfirmOpen(true);
  };

  // Calculate total weight of all items in the order
  const calculateTotalWeight = (): number => {
    if (!activeOrder || activeOrder.items.length === 0) return 0;
    return activeOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  // Calculate total tara of all items in the order
  const calculateTotalTara = (): number => {
    if (!activeOrder || activeOrder.items.length === 0) return 0;
    return activeOrder.items.reduce((sum, item) => sum + (item.tara || 0), 0);
  };
  
  // Check if any item has tara
  const hasTaraItems = (): boolean => {
    if (!activeOrder || activeOrder.items.length === 0) return false;
    return activeOrder.items.some(item => item.tara && item.tara > 0);
  };

  if (!customer || !activeOrder) {
    return (
      <div className="flex items-center justify-center h-full text-center p-4 bg-slate-900">
        <p className="text-slate-400">Selecione um cliente e adicione itens ao pedido</p>
      </div>
    );
  }

  return (
    <div data-tutorial="order-details" className="flex flex-col h-full bg-slate-900">
      {customer && (
        <div className="bg-slate-800 p-4 flex justify-center items-center border-t-2 border-emerald-500">
          <h2 className="text-emerald-400 font-bold" style={{ fontSize: "calc(1.1em * 1.1)" }}>
            {customer.name} - Pedido
          </h2>
        </div>
      )}
      
      {activeOrder.items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-400">Nenhum item adicionado</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <ScrollArea className={`flex-1 ${isMobileOrTablet ? 'max-h-[170px]' : ''}`}>
            {activeOrder.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableHead className={`w-[35%] text-slate-300 ${isMobileOrTablet ? 'text-[10px] py-1 px-2' : ''}`}>Material</TableHead>
                    <TableHead className={`text-slate-300 ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>Qtd</TableHead>
                    <TableHead className={`text-slate-300 ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>R$/kg</TableHead>
                    <TableHead className={`text-slate-300 ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>Total</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...activeOrder.items].reverse().map((item, reversedIndex) => {
                    // Calculate the original index for delete functionality
                    const originalIndex = activeOrder.items.length - 1 - reversedIndex;
                    return (
                      <TableRow key={originalIndex} className="no-hover border-b border-slate-700">
                        <TableCell className={`text-white ${isMobileOrTablet ? 'text-[10px] py-1 px-2' : ''}`}>
                          {cleanMaterialName(item.materialName)}
                          {!!item.tara && item.tara > 0 && (
                            <div className={`text-amber-400 ${isMobileOrTablet ? 'text-[8px]' : 'text-xs'}`}>
                              Tara: {formatPeso(item.tara).replace('/kg', '')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`text-white ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>{formatPeso(item.quantity).replace('/kg', '')}</TableCell>
                        <TableCell className={`text-slate-300 ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>
                          <div className="flex flex-col">
                            <span>R$ {item.price.toFixed(2)}</span>
                            {item.priceAdjustment !== undefined && item.priceAdjustment !== 0 && (
                              <span className={`${isMobileOrTablet ? 'text-[8px]' : 'text-xs'} ${item.priceAdjustment < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {item.priceAdjustment > 0 ? '+' : ''}R$ {item.priceAdjustment.toFixed(2)}/kg
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`text-emerald-400 font-medium ${isMobileOrTablet ? 'text-[10px] py-1 px-1' : ''}`}>R$ {item.total.toFixed(2)}</TableCell>
                        <TableCell className="py-1 px-1">
                          <Button 
                            variant="ghost" 
                            onClick={() => handleDeleteClick(originalIndex)}
                            className={`p-0 hover:bg-red-600/20 ${isMobileOrTablet ? 'h-6 w-6' : 'h-8 w-8'}`}
                          >
                            <Trash2 className={`text-red-500 ${isMobileOrTablet ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          
          {/* Fixed total at bottom */}
          {activeOrder.items.length > 0 && (
            <div className="bg-slate-800 p-4 border-t border-slate-700 sticky bottom-0">
              {isMobileOrTablet ? (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <p className="text-slate-300 font-bold mr-2" style={{ fontSize: 'calc(0.75rem * 1.15)' }}>Peso Total</p>
                      <p className="text-emerald-400 font-bold" style={{ fontSize: 'calc(0.875rem * 1.15)' }}>
                        {formatPeso(calculateTotalWeight()).replace('/kg', '')} kg
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-slate-300 font-bold mr-2" style={{ fontSize: 'calc(0.75rem * 1.15)' }}>Total</p>
                      <p className="text-emerald-400 font-bold" style={{ fontSize: 'calc(1rem * 1.15)' }}>
                        R$ {activeOrder.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {hasTaraItems() && (
                    <div className="flex justify-center">
                      <div className="flex items-center">
                        <p className="text-amber-400 font-bold mr-2" style={{ fontSize: 'calc(0.75rem * 1.15)' }}>Tara Total</p>
                        <p className="text-amber-400 font-bold" style={{ fontSize: 'calc(0.875rem * 1.15)' }}>
                          {formatPeso(calculateTotalTara()).replace('/kg', '')} kg
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={onCompleteOrder}
                    data-tutorial="complete-button"
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center justify-center w-full transition-colors ${
                      isMobileOrTablet 
                        ? 'fixed bottom-0 left-0 right-0 z-50 shadow-lg' 
                        : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Encerrar Pedido
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex items-center">
                      <p className="text-slate-300 font-bold mr-2">Total</p>
                      <p className="text-emerald-400 text-[32.5px] font-bold">
                        R$ {activeOrder.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center md:ml-6 mt-1 md:mt-0">
                      <p className="text-slate-300 font-bold mr-2">Peso Total</p>
                      <p className="text-emerald-400 text-[24px] font-bold">
                        {formatPeso(calculateTotalWeight()).replace('/kg', '')} kg
                      </p>
                      
                      {hasTaraItems() && (
                        <div className="flex items-center ml-4">
                          <p className="text-amber-400 font-bold mr-2">Tara Total</p>
                          <p className="text-amber-400 text-[18px] font-bold">
                            {formatPeso(calculateTotalTara()).replace('/kg', '')} kg
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={onCompleteOrder}
                    data-tutorial="complete-button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Encerrar Pedido
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogAction
              onClick={() => setDeleteConfirmOpen(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              Cancelar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetails;
