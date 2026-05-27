import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DepotClient {
  id: string;
  user_id: string;
  unidade_id: string | null;
  name: string;
  whatsapp: string;
  email: string | null;
  cpf: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  notes: string | null;
  is_active: boolean;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface DepotClientFormData {
  name: string;
  whatsapp: string;
  email?: string;
  cpf?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  notes?: string;
}

export function useDepotClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<DepotClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('depot_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (formData: DepotClientFormData): Promise<DepotClient | null> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('depot_clients')
        .insert({
          user_id: user.id,
          name: formData.name,
          whatsapp: formData.whatsapp,
          email: formData.email || null,
          cpf: formData.cpf || null,
          address_number: formData.address_number || null,
          address_neighborhood: formData.address_neighborhood || null,
          address_city: formData.address_city || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Cliente cadastrado com sucesso!');
      await fetchClients();
      return data;
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      toast.error('Erro ao cadastrar cliente: ' + err.message);
      return null;
    }
  };

  const updateClient = async (id: string, formData: Partial<DepotClientFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_clients')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cliente atualizado com sucesso!');
      await fetchClients();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err);
      toast.error('Erro ao atualizar cliente: ' + err.message);
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cliente removido com sucesso!');
      await fetchClients();
      return true;
    } catch (err: any) {
      console.error('Erro ao remover cliente:', err);
      toast.error('Erro ao remover cliente: ' + err.message);
      return false;
    }
  };

  const toggleClientStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_clients')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isActive ? 'Cliente ativado!' : 'Cliente desativado!');
      await fetchClients();
      return true;
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status: ' + err.message);
      return false;
    }
  };

  const searchClients = useCallback((query: string): DepotClient[] => {
    if (!query.trim()) return clients;
    
    const lowerQuery = query.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      client.whatsapp.includes(query) ||
      (client.cpf && client.cpf.includes(query)) ||
      (client.email && client.email.toLowerCase().includes(lowerQuery))
    );
  }, [clients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
    searchClients,
  };
}
