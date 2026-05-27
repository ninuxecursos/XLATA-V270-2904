
import React, { useState, useEffect } from 'react';
import { getOrders } from '../utils/supabaseStorage';

interface TransactionCounterProps {
  className?: string;
}

const TransactionCounter: React.FC<TransactionCounterProps> = ({ className }) => {
  const [transactionCount, setTransactionCount] = useState(0);
  
  useEffect(() => {
    const loadTransactionCount = async () => {
      try {
        // Buscar todas as ordens completed (vendas e compras)
        const orders = await getOrders();
        
        if (orders) {
          // Filtrar apenas as ordens completadas e contar vendas e compras
          const completedOrders = orders.filter(order => 
            order.status === 'completed' && 
            (order.type === 'venda' || order.type === 'compra')
          );
          
          setTransactionCount(completedOrders.length);
        } else {
          setTransactionCount(0);
        }
      } catch (error) {
        console.error('Error loading transaction count:', error);
        setTransactionCount(0);
      }
    };

    loadTransactionCount();
  }, []);

  return (
    <span className={className}>
      {transactionCount}
    </span>
  );
};

export default TransactionCounter;
