import { getCustomers, saveCustomer, removeCustomer } from './supabaseStorage';
import { Customer } from '../types/pdv';
import { supabase } from '@/integrations/supabase/client';

/**
 * Remove pedidos vazios (sem itens) diretamente do banco de dados
 * Esta função limpa pedidos que foram criados mas nunca receberam itens
 */
export const cleanupEmptyOrdersFromDatabase = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar pedidos em aberto do usuário
    const { data: openOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (ordersError || !openOrders) {
      console.error('Erro ao buscar pedidos para limpeza:', ordersError);
      return;
    }

    const now = new Date();
    const fiveMinutesAgo = now.getTime() - (5 * 60 * 1000);
    let deletedCount = 0;

    for (const order of openOrders) {
      // Verificar se o pedido foi criado há mais de 5 minutos
      const orderCreatedAt = new Date(order.created_at).getTime();
      if (orderCreatedAt > fiveMinutesAgo) {
        continue; // Pular pedidos recentes
      }

      // Verificar se o pedido tem itens
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id);

      if (countError) {
        console.error('Erro ao contar itens do pedido:', countError);
        continue;
      }

      // Se não tem itens, deletar o pedido
      if (count === 0) {
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);

        if (deleteError) {
          console.error('Erro ao deletar pedido vazio:', deleteError);
        } else {
          deletedCount++;
          console.log(`Pedido vazio ${order.id} removido do banco`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`Limpeza do banco: ${deletedCount} pedidos vazios removidos`);
    }
  } catch (error) {
    console.error('Erro durante limpeza de pedidos vazios do banco:', error);
  }
};

/**
 * Remove pedidos em aberto vazios (sem itens) que foram criados há mais de 5 minutos
 */
export const cleanupEmptyOrders = async (): Promise<void> => {
  try {
    // Verificar se usuário está autenticado antes de executar
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Usuário não autenticado - não executar limpeza silenciosamente
      return;
    }
    
    const customers = await getCustomers();
    const now = new Date();
    const fiveMinutesAgo = now.getTime() - (5 * 60 * 1000); // 5 minutos em milliseconds
    
    let cleanedCount = 0;
    
    for (const customer of customers) {
      // Filtrar pedidos em aberto que têm itens OU foram criados nos últimos 5 minutos
      const validOrders = customer.orders.filter(order => {
        if (order.status !== 'open') return true; // Manter todos os pedidos não-abertos
        
        const orderTime = new Date(order.timestamp).getTime();
        const hasItems = order.items && order.items.length > 0;
        const isRecent = orderTime > fiveMinutesAgo;
        
        // Manter o pedido se tem itens OU foi criado recentemente
        return hasItems || isRecent;
      });
      
      // Se removeu algum pedido, atualizar o cliente
      if (validOrders.length < customer.orders.length) {
        const removedOrdersCount = customer.orders.length - validOrders.length;
        cleanedCount += removedOrdersCount;
        
        if (validOrders.length === 0) {
          // Se o cliente não tem mais nenhum pedido, remove o cliente completamente
          console.log(`Removendo cliente ${customer.name} sem pedidos válidos`);
          await removeCustomer(customer.id);
        } else {
          // Atualizar cliente com pedidos válidos
          const updatedCustomer: Customer = {
            ...customer,
            orders: validOrders
          };
          
          console.log(`Atualizando cliente ${customer.name}, removidos ${removedOrdersCount} pedidos vazios`);
          await saveCustomer(updatedCustomer);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Limpeza concluída: ${cleanedCount} pedidos vazios removidos`);
    } else {
      console.log('Nenhum pedido vazio encontrado para remoção');
    }
    
  } catch (error) {
    console.error('Erro durante limpeza de pedidos vazios:', error);
  }
};

/**
 * Configura limpeza automática de pedidos vazios a cada 10 minutos
 */
export const setupAutoCleanup = (): (() => void) => {
  console.log('Configurando limpeza automática de pedidos vazios (a cada 10 minutos)');
  
  // Executar uma vez imediatamente
  cleanupEmptyOrders();
  
  // Configurar execução periódica a cada 10 minutos
  const intervalId = setInterval(() => {
    cleanupEmptyOrders();
  }, 10 * 60 * 1000); // 10 minutos
  
  // Retornar função para cancelar o interval
  return () => {
    console.log('Cancelando limpeza automática de pedidos vazios');
    clearInterval(intervalId);
  };
};