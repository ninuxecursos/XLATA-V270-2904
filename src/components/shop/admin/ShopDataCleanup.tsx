import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Users, Package, Zap, ShoppingCart, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const BATCH_SIZE = 500;

interface CleanupSection {
  id: string;
  label: string;
  icon: React.ElementType;
  phrase: string;
  description: string;
  color: string;
}

const SECTIONS: CleanupSection[] = [
  { id: 'users', label: 'Usuários da Loja', icon: Users, phrase: 'EXCLUIR USUARIOS', description: 'Remove todos os usuários cadastrados na loja e dados dependentes.', color: 'text-blue-600' },
  { id: 'normalProducts', label: 'Produtos Normais', icon: Package, phrase: 'EXCLUIR PRODUTOS', description: 'Remove todos os produtos com venda normal (não interativos).', color: 'text-green-600' },
  { id: 'interactiveProducts', label: 'Produtos Interativos', icon: Zap, phrase: 'EXCLUIR INTERATIVOS', description: 'Remove produtos interativos, eventos e ofertas associadas.', color: 'text-purple-600' },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart, phrase: 'EXCLUIR PEDIDOS', description: 'Remove todos os pedidos e itens de pedidos.', color: 'text-orange-600' },
];

export function ShopDataCleanup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({ users: 0, normalProducts: 0, interactiveProducts: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<CleanupSection | null>(null);
  const [typedPhrase, setTypedPhrase] = useState('');

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, normalRes, interactiveRes, ordersRes] = await Promise.all([
        supabase.from('shop_users').select('*', { count: 'exact', head: true }),
        supabase.from('shop_products').select('*', { count: 'exact', head: true }).neq('sale_type', 'interactive'),
        supabase.from('shop_products').select('*', { count: 'exact', head: true }).eq('sale_type', 'interactive'),
        supabase.from('shop_orders').select('*', { count: 'exact', head: true }),
      ]);
      setCounts({
        users: usersRes.count ?? 0,
        normalProducts: normalRes.count ?? 0,
        interactiveProducts: interactiveRes.count ?? 0,
        orders: ordersRes.count ?? 0,
      });
    } catch (err) {
      console.error('Error fetching counts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  async function deleteInBatches(table: string, totalEstimate: number, filters?: { column: string; op: 'eq' | 'neq'; value: string }) {
    let totalDeleted = 0;
    while (true) {
      let query = supabase.from(table as any).delete();
      if (filters) {
        if (filters.op === 'eq') query = query.eq(filters.column, filters.value);
        else query = query.neq(filters.column, filters.value);
      } else {
        query = query.gte('id', '00000000-0000-0000-0000-000000000000');
      }
      const { data, error } = await (query as any).select('id').order('id').limit(BATCH_SIZE);
      if (error) throw error;
      if (!data || data.length === 0) break;
      totalDeleted += data.length;
      const pct = totalEstimate > 0 ? Math.min(100, Math.round((totalDeleted / totalEstimate) * 100)) : 100;
      setProgress(pct);
    }
    return totalDeleted;
  }

  async function deleteOrders() {
    setProgressLabel('Excluindo itens de pedidos...');
    const { count: itemCount } = await supabase.from('shop_order_items').select('*', { count: 'exact', head: true });
    await deleteInBatches('shop_order_items', itemCount ?? 0);

    setProgressLabel('Excluindo pedidos...');
    await deleteInBatches('shop_orders', counts.orders);
  }

  async function deleteInteractiveProducts() {
    setProgressLabel('Excluindo ofertas interativas...');
    const { count: offersCount } = await supabase.from('shop_interactive_offers').select('*', { count: 'exact', head: true });
    await deleteInBatches('shop_interactive_offers', offersCount ?? 0);

    setProgressLabel('Excluindo eventos interativos...');
    const { count: eventsCount } = await supabase.from('shop_interactive_events').select('*', { count: 'exact', head: true });
    await deleteInBatches('shop_interactive_events', eventsCount ?? 0);

    setProgressLabel('Excluindo produtos interativos...');
    await deleteInBatches('shop_products', counts.interactiveProducts, { column: 'sale_type', op: 'eq', value: 'interactive' });
  }

  async function deleteNormalProducts() {
    setProgressLabel('Excluindo avaliações de produtos...');
    const { count: reviewsCount } = await supabase.from('shop_product_reviews').select('*', { count: 'exact', head: true });
    await deleteInBatches('shop_product_reviews', reviewsCount ?? 0);

    setProgressLabel('Excluindo produtos normais...');
    await deleteInBatches('shop_products', counts.normalProducts, { column: 'sale_type', op: 'neq', value: 'interactive' });
  }

  async function deleteUsers() {
    setProgressLabel('Excluindo usuários da loja...');
    await deleteInBatches('shop_users', counts.users);
  }

  async function handleDelete(sectionId: string) {
    setDeletingSection(sectionId);
    setProgress(0);
    setProgressLabel('Iniciando...');
    try {
      switch (sectionId) {
        case 'orders':
          await deleteOrders();
          break;
        case 'interactiveProducts':
          await deleteInteractiveProducts();
          break;
        case 'normalProducts':
          await deleteNormalProducts();
          break;
        case 'users':
          await deleteUsers();
          break;
        case 'all':
          setProgressLabel('Excluindo pedidos...');
          await deleteOrders();
          setProgressLabel('Excluindo produtos interativos...');
          await deleteInteractiveProducts();
          setProgressLabel('Excluindo produtos normais...');
          await deleteNormalProducts();
          setProgressLabel('Excluindo usuários...');
          await deleteUsers();
          break;
      }
      setProgress(100);
      setProgressLabel('Concluído!');
      toast({ title: 'Exclusão concluída', description: `Dados excluídos com sucesso.` });
      // Invalidate all related caches so other pages reflect the deletion
      await queryClient.invalidateQueries();
      await fetchCounts();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({ title: 'Erro na exclusão', description: err.message || 'Ocorreu um erro.', variant: 'destructive' });
    } finally {
      setTimeout(() => {
        setDeletingSection(null);
        setProgress(0);
        setProgressLabel('');
      }, 1500);
    }
  }

  const openConfirm = (section: CleanupSection) => {
    setConfirmDialog(section);
    setTypedPhrase('');
  };

  const confirmAndDelete = () => {
    if (!confirmDialog) return;
    const sectionId = confirmDialog.id;
    setConfirmDialog(null);
    setTypedPhrase('');
    handleDelete(sectionId);
  };

  const totalRecords = counts.users + counts.normalProducts + counts.interactiveProducts + counts.orders;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--shop-text-primary))]">Exclusão e Backup</h2>
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">Gerencie a exclusão de dados da loja com segurança.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCounts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar contagens
        </Button>
      </div>

      {/* Progress bar (shown during deletion) */}
      {deletingSection && (
        <Card className="border-[hsl(var(--shop-border-default))] bg-[hsl(var(--shop-bg-card))]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--shop-primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--shop-text-primary))]">{progressLabel}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-[hsl(var(--shop-text-muted))]">{progress}% concluído</p>
          </CardContent>
        </Card>
      )}

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const count = counts[section.id] ?? 0;
          const isDeleting = deletingSection === section.id || deletingSection === 'all';
          return (
            <Card key={section.id} className="border-[hsl(var(--shop-border-default))] bg-[hsl(var(--shop-bg-card))]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--shop-bg-elevated))]`}>
                      <Icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-[hsl(var(--shop-text-primary))]">{section.label}</CardTitle>
                      <p className="text-xs text-[hsl(var(--shop-text-muted))]">{loading ? '...' : `${count} registros`}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-[hsl(var(--shop-text-secondary))] mb-4">{section.description}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={isDeleting || count === 0}
                  onClick={() => openConfirm(section)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Excluindo...' : `Excluir ${section.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete All */}
      <Card className="border-red-300 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Excluir Todos os Dados</h3>
                <p className="text-xs text-red-600">{loading ? '...' : `${totalRecords} registros no total`}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              disabled={!!deletingSection || totalRecords === 0}
              onClick={() => openConfirm({ id: 'all', label: 'Todos os Dados', icon: AlertTriangle, phrase: 'EXCLUIR TUDO', description: '', color: '' })}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deletingSection === 'all' ? 'Excluindo...' : 'Excluir Tudo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-gray-600">
              Você está prestes a excluir <strong>{confirmDialog?.label}</strong>. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Digite <strong className="text-red-600">{confirmDialog?.phrase}</strong> para confirmar:
            </p>
            <Input
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={confirmDialog?.phrase}
              className="font-mono bg-white border-gray-300 text-gray-900"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={typedPhrase !== confirmDialog?.phrase}
              onClick={confirmAndDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
