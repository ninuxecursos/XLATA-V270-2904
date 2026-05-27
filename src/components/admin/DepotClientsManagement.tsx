import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Users, Search, Loader2, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DepotClientDetailsInline } from './DepotClientDetailsInline';

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
  total_vendas: number;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
}

export function DepotClientsManagement() {
  const [clients, setClients] = useState<DepotClientAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<DepotClientAdmin | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('depot_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const userIds = [...new Set(clientsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, company')
        .in('id', userIds);

      const { data: totalsData } = await supabase.rpc('get_depot_clients_totals');
      const totalsMap = new Map(
        (totalsData || []).map((t: any) => [t.depot_client_id, t])
      );

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedClients = clientsData?.map(client => {
        const totals = totalsMap.get(client.id);
        return {
          ...client,
          total_orders: totals ? Number(totals.real_orders) : 0,
          total_spent: totals ? Number(totals.total_compras) : 0,
          total_vendas: totals ? Number(totals.total_vendas) : 0,
          owner_email: profileMap.get(client.user_id)?.email,
          owner_name: profileMap.get(client.user_id)?.company,
        };
      }) || [];

      setClients(enrichedClients);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.whatsapp.includes(searchQuery) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.owner_email && client.owner_email.toLowerCase().includes(query)) ||
      (client.owner_name && client.owner_name.toLowerCase().includes(query))
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.is_active).length;

  // Show details inline view
  if (selectedClient) {
    return (
      <DepotClientDetailsInline
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes de Todos os Depósitos
          </CardTitle>
          <CardDescription>
            Visualize todos os clientes cadastrados por usuários do sistema
          </CardDescription>
          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, contato ou depósito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Depósito (Dono)</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                    <TableHead className="text-right">Total em Compras</TableHead>
                    <TableHead className="text-right">Total em Vendas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.cpf && (
                            <div className="text-xs text-muted-foreground">{client.cpf}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.whatsapp}
                          </span>
                          {client.email && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{client.owner_name || 'Sem nome'}</div>
                          <div className="text-xs text-muted-foreground">{client.owner_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{client.total_orders}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(client.total_spent)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(client.total_vendas)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={client.is_active ? 'default' : 'secondary'}>
                          {client.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
