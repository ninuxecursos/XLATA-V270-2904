
import { CashRegister, Order } from '../types/pdv';
import { supabase } from '../integrations/supabase/client';

export interface PaymentBreakdown {
  cashAmount: number;
  pixAmount: number;
  debitAmount: number;
  creditAmount: number;
}

// Função para calcular apenas breakdown de compras
export const calculatePurchasePaymentBreakdown = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<PaymentBreakdown> => {
  const orders = await getOrders();
  
  // Filtrar apenas pedidos de compra completados neste caixa (excluindo cancelados)
  const purchaseOrders = orders.filter(order => 
    order.type === 'compra' && 
    order.status === 'completed' &&
    !order.cancelled &&
    order.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || order.timestamp <= cashRegister.closingTimestamp)
  );

  console.log('Purchase orders for cash register:', purchaseOrders);

  let cashAmount = 0;
  let pixAmount = 0;
  let debitAmount = 0;
  let creditAmount = 0;

  // Buscar as formas de pagamento dos pedidos no Supabase
  try {
    const orderIds = purchaseOrders.map(order => order.id);
    
    if (orderIds.length > 0) {
      const { data: payments, error } = await supabase
        .from('order_payments')
        .select('order_id, payment_method')
        .in('order_id', orderIds);

      if (error) {
        console.error('Error fetching payment methods:', error);
        // Em caso de erro, assumir todos como dinheiro (comportamento padrão)
        for (const order of purchaseOrders) {
          cashAmount += order.total;
        }
      } else {
        // Criar um mapa de order_id -> payment_method
        const paymentMap = new Map();
        payments?.forEach(payment => {
          paymentMap.set(payment.order_id, payment.payment_method);
        });

        // Calcular os valores por forma de pagamento
        for (const order of purchaseOrders) {
          const paymentMethod = paymentMap.get(order.id) || 'dinheiro'; // Default para dinheiro
          
          switch (paymentMethod) {
            case 'pix':
              pixAmount += order.total;
              break;
            case 'debito':
              debitAmount += order.total;
              break;
            case 'credito':
              creditAmount += order.total;
              break;
            case 'dinheiro':
            default:
              cashAmount += order.total;
              break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error calculating purchase payment breakdown:', error);
    // Em caso de erro, assumir todos como dinheiro
    for (const order of purchaseOrders) {
      cashAmount += order.total;
    }
  }

  return {
    cashAmount,
    pixAmount,
    debitAmount,
    creditAmount
  };
};

// Função para calcular breakdown de vendas
export const calculateSalesPaymentBreakdown = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<PaymentBreakdown> => {
  const orders = await getOrders();
  
  // Filtrar apenas pedidos de venda completados neste caixa (excluindo cancelados)
  const salesOrders = orders.filter(order => 
    order.type === 'venda' && 
    order.status === 'completed' &&
    !order.cancelled &&
    order.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || order.timestamp <= cashRegister.closingTimestamp)
  );

  console.log('Sales orders for cash register:', salesOrders);

  let cashAmount = 0;
  let pixAmount = 0;
  let debitAmount = 0;
  let creditAmount = 0;

  // Buscar as formas de pagamento dos pedidos no Supabase
  try {
    const orderIds = salesOrders.map(order => order.id);
    
    if (orderIds.length > 0) {
      const { data: payments, error } = await supabase
        .from('order_payments')
        .select('order_id, payment_method')
        .in('order_id', orderIds);

      if (error) {
        console.error('Error fetching payment methods:', error);
        // Em caso de erro, assumir todos como dinheiro (comportamento padrão)
        for (const order of salesOrders) {
          cashAmount += order.total;
        }
      } else {
        // Criar um mapa de order_id -> payment_method
        const paymentMap = new Map();
        payments?.forEach(payment => {
          paymentMap.set(payment.order_id, payment.payment_method);
        });

        // Calcular os valores por forma de pagamento
        for (const order of salesOrders) {
          const paymentMethod = paymentMap.get(order.id) || 'dinheiro'; // Default para dinheiro
          
          switch (paymentMethod) {
            case 'pix':
              pixAmount += order.total;
              break;
            case 'debito':
              debitAmount += order.total;
              break;
            case 'credito':
              creditAmount += order.total;
              break;
            case 'dinheiro':
            default:
              cashAmount += order.total;
              break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error calculating sales payment breakdown:', error);
    // Em caso de erro, assumir todos como dinheiro
    for (const order of salesOrders) {
      cashAmount += order.total;
    }
  }

  return {
    cashAmount,
    pixAmount,
    debitAmount,
    creditAmount
  };
};

// Função para calcular breakdown combinado (compatibilidade com código existente)
export const calculatePaymentBreakdown = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<PaymentBreakdown> => {
  const purchaseBreakdown = await calculatePurchasePaymentBreakdown(cashRegister, getOrders);
  return purchaseBreakdown; // Mantém comportamento atual para compatibilidade
};

// Função para calcular o peso de compras
export const calculatePurchaseWeight = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<number> => {
  const orders = await getOrders();
  
  // Filtrar apenas pedidos de compra completados neste caixa (excluindo cancelados)
  const purchaseOrders = orders.filter(order => 
    order.type === 'compra' && 
    order.status === 'completed' &&
    !order.cancelled &&
    order.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || order.timestamp <= cashRegister.closingTimestamp)
  );

  console.log('Purchase orders for weight calculation:', purchaseOrders);

  let totalWeight = 0;

  // Calcular o peso total apenas dos pedidos de compra
  for (const order of purchaseOrders) {
    for (const item of order.items) {
      totalWeight += item.quantity;
    }
  }

  console.log('Total purchase weight calculated:', totalWeight);

  return totalWeight;
};

// Função para calcular o peso de vendas
export const calculateSalesWeight = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<number> => {
  const orders = await getOrders();
  
  // Filtrar apenas pedidos de venda completados neste caixa (excluindo cancelados)
  const salesOrders = orders.filter(order => 
    order.type === 'venda' && 
    order.status === 'completed' &&
    !order.cancelled &&
    order.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || order.timestamp <= cashRegister.closingTimestamp)
  );

  console.log('Sales orders for weight calculation:', salesOrders);

  let totalWeight = 0;

  // Calcular o peso total apenas dos pedidos de venda
  for (const order of salesOrders) {
    for (const item of order.items) {
      totalWeight += item.quantity;
    }
  }

  console.log('Total sales weight calculated:', totalWeight);

  return totalWeight;
};

// Função para calcular contagem de transações de vendas
export const calculateSalesTransactionsCount = async (
  cashRegister: CashRegister,
  getOrders: () => Promise<Order[]>
): Promise<number> => {
  const orders = await getOrders();
  
  // Filtrar apenas pedidos de venda completados neste caixa (excluindo cancelados)
  const salesOrders = orders.filter(order => 
    order.type === 'venda' && 
    order.status === 'completed' &&
    !order.cancelled &&
    order.timestamp >= cashRegister.openingTimestamp &&
    (!cashRegister.closingTimestamp || order.timestamp <= cashRegister.closingTimestamp)
  );

  console.log('Sales transactions count:', salesOrders.length);
  
  return salesOrders.length;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatCurrencyInput = (value: string): string => {
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

export const parseCurrencyInput = (value: string): number => {
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};
