import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  ArrowLeft, Phone, Mail, MapPin, ShoppingCart, TrendingUp, TrendingDown,
  Loader2, Package, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DepotClientAdmin {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  cpf: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  is_active: boolean;
  total_orders: number;
  total_spent: number;
  total_vendas?: number;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
}

interface OrderDetail {
  id: string;
  type: string;
  total: number;
  status: string;
  cancelled: boolean;
  created_at: string;
  customer_name: string;
  items_count: number;
}

interface Props {
  client: DepotClientAdmin;
  onBack: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function DepotClientDetailsInline({ client, onBack }: Props) {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientOrders();
  }, [client.id]);

  const fetchClientOrders = async () => {
    setLoading(true);
    try {
      // Find customer records matching this depot_client by name + user_id
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name')
        .eq('user_id', client.user_id)
        .eq('name', client.name);

      if (!customers || customers.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const customerIds = customers.map(c => c.id);

      // Fetch orders for these customers
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, type, total, status, cancelled, created_at, customer_id')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!ordersData) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Count items per order
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .in('order_id', orderIds);

      const itemsCountMap = new Map<string, number>();
      (itemsData || []).forEach(item => {
        itemsCountMap.set(item.order_id, (itemsCountMap.get(item.order_id) || 0) + 1);
      });

      const customerNameMap = new Map(customers.map(c => [c.id, c.name]));

      const enrichedOrders: OrderDetail[] = ordersData.map(o => ({
        id: o.id,
        type: o.type,
        total: Number(o.total) || 0,
        status: o.status || 'completed',
        cancelled: o.cancelled || false,
        created_at: o.created_at,
        customer_name: customerNameMap.get(o.customer_id) || client.name,
        items_count: itemsCountMap.get(o.id) || 0,
      }));

      setOrders(enrichedOrders);
    } catch (err) {
      console.error('Erro ao buscar pedidos do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => !o.cancelled);
  const totalCompras = activeOrders
    .filter(o => o.type === 'compra')
    .reduce((sum, o) => sum + o.total, 0);
  const totalVendas = activeOrders
    .filter(o => o.type === 'venda')
    .reduce((sum, o) => sum + o.total, 0);
  const comprasCount = activeOrders.filter(o => o.type === 'compra').length;
  const vendasCount = activeOrders.filter(o => o.type === 'venda').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{client.name}</h2>
          <p className="text-sm text-muted-foreground">
            Depósito: {client.owner_name || 'Sem nome'} • {client.owner_email}
          </p>
        </div>
        <Badge variant={client.is_active ? 'default' : 'secondary'}>
          {client.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Contact & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.whatsapp}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {(client.address_neighborhood || client.address_city) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[client.address_neighborhood, client.address_city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {client.cpf && (
              <div className="text-muted-foreground">CPF: {client.cpf}</div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Cadastrado em {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Compras ({comprasCount})</span>
              </div>
              <span className="font-semibold text-red-500">{formatCurrency(totalCompras)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Vendas ({vendasCount})</span>
              </div>
              <span className="font-semibold text-emerald-500">{formatCurrency(totalVendas)}</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Total de Pedidos</span>
              <span className="font-bold">{activeOrders.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5" />
            Histórico de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido encontrado para este cliente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className={order.cancelled ? 'opacity-50' : ''}>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.type === 'compra' ? 'destructive' : 'default'}>
                          {order.type === 'compra' ? 'Compra' : 'Venda'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.items_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.cancelled ? (
                          <Badge variant="secondary">Cancelado</Badge>
                        ) : (
                          <Badge variant="outline">Concluído</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
