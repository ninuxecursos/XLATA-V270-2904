import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Trash2, ShoppingCart, DollarSign, Plus, BarChart3, Package, Users, Loader2, Ban, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SectorKey = 'compras' | 'vendas' | 'transacoes' | 'despesas' | 'adicoes_caixa' | 'fluxo_caixa' | 'materiais' | 'clientes' | 'tudo';

interface SectorConfig {
  label: string;
  icon: React.ReactNode;
  confirmText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  warnings: string[];
}

const SECTORS: Record<SectorKey, SectorConfig> = {
  compras: {
    label: 'Compras',
    icon: <ShoppingCart className="h-5 w-5" />,
    confirmText: 'EXCLUIR COMPRAS',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/30',
    borderColor: 'border-amber-900/50',
    warnings: ['Deletar TODOS os pedidos de COMPRA', 'Remover itens e pagamentos relacionados', 'Esta ação NÃO pode ser desfeita']
  },
  vendas: {
    label: 'Vendas',
    icon: <DollarSign className="h-5 w-5" />,
    confirmText: 'EXCLUIR VENDAS',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/30',
    borderColor: 'border-emerald-900/50',
    warnings: ['Deletar TODOS os pedidos de VENDA', 'Remover itens e pagamentos relacionados', 'Esta ação NÃO pode ser desfeita']
  },
  transacoes: {
    label: 'Transações',
    icon: <BarChart3 className="h-5 w-5" />,
    confirmText: 'EXCLUIR TRANSACOES',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/30',
    borderColor: 'border-blue-900/50',
    warnings: ['Deletar TODAS as transações de caixa', 'Afeta o histórico de movimentações', 'Esta ação NÃO pode ser desfeita']
  },
  despesas: {
    label: 'Despesas',
    icon: <Ban className="h-5 w-5" />,
    confirmText: 'EXCLUIR DESPESAS',
    color: 'text-red-400',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-900/50',
    warnings: ['Deletar TODAS as despesas registradas', 'Afeta relatórios financeiros', 'Esta ação NÃO pode ser desfeita']
  },
  adicoes_caixa: {
    label: 'Adições de Caixa',
    icon: <Plus className="h-5 w-5" />,
    confirmText: 'EXCLUIR ADICOES',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/30',
    borderColor: 'border-cyan-900/50',
    warnings: ['Deletar TODAS as adições de caixa', 'Afeta o saldo histórico do caixa', 'Esta ação NÃO pode ser desfeita']
  },
  fluxo_caixa: {
    label: 'Fluxo de Caixa',
    icon: <BarChart3 className="h-5 w-5" />,
    confirmText: 'EXCLUIR FLUXO',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/30',
    borderColor: 'border-purple-900/50',
    warnings: ['Deletar TODOS os fechamentos de caixa', 'Remover todas as transações associadas', 'Esta ação NÃO pode ser desfeita']
  },
  materiais: {
    label: 'Materiais',
    icon: <Package className="h-5 w-5" />,
    confirmText: 'EXCLUIR MATERIAIS',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/30',
    borderColor: 'border-orange-900/50',
    warnings: ['Deletar TODOS os materiais cadastrados', 'Esta ação NÃO pode ser desfeita']
  },
  clientes: {
    label: 'Clientes',
    icon: <Users className="h-5 w-5" />,
    confirmText: 'EXCLUIR CLIENTES',
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/30',
    borderColor: 'border-pink-900/50',
    warnings: ['Deletar TODOS os clientes cadastrados', 'Esta ação NÃO pode ser desfeita']
  },
  tudo: {
    label: 'TUDO',
    icon: <Trash2 className="h-5 w-5" />,
    confirmText: 'EXCLUIR TUDO',
    color: 'text-red-500',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-800/60',
    warnings: ['Deletar ABSOLUTAMENTE TODOS os dados do usuário', 'Compras, Vendas, Transações, Despesas, Adições, Fluxo, Materiais e Clientes', 'Esta ação NÃO pode ser desfeita']
  }
};

const BATCH_SIZE = 500;
const BATCH_DELAY = 100;

interface AdminUserDataCleanupProps {
  userId: string;
  userName: string;
}

const AdminUserDataCleanup: React.FC<AdminUserDataCleanupProps> = ({ userId, userName }) => {
  const [counts, setCounts] = useState<Record<SectorKey, number>>({
    compras: 0, vendas: 0, transacoes: 0, despesas: 0,
    adicoes_caixa: 0, fluxo_caixa: 0, materiais: 0, clientes: 0, tudo: 0
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [confirmSector, setConfirmSector] = useState<SectorKey | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState({ current: 0, total: 0, phase: '' });

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const [compras, vendas, transacoes, despesas, adicoes, fluxo, materiais, clientes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'compra'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'venda'),
        supabase.from('cash_transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('cash_transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'expense'),
        supabase.from('cash_transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'addition'),
        supabase.from('cash_registers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('materials').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      const c = {
        compras: compras.count || 0,
        vendas: vendas.count || 0,
        transacoes: transacoes.count || 0,
        despesas: despesas.count || 0,
        adicoes_caixa: adicoes.count || 0,
        fluxo_caixa: fluxo.count || 0,
        materiais: materiais.count || 0,
        clientes: clientes.count || 0,
        tudo: 0
      };
      c.tudo = c.compras + c.vendas + c.transacoes + c.fluxo_caixa + c.materiais + c.clientes;
      setCounts(c);

      // Count duplicates
      await fetchDuplicateCount();
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  }, [userId]);

  const fetchDuplicateCount = async () => {
    try {
      // Fetch all customers for this user to count duplicates client-side
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('user_id', userId);
      
      if (error || !data) {
        setDuplicateCount(0);
        return;
      }

      // Count duplicates: group by name, count those with >1 entry
      const nameGroups = new Map<string, number>();
      for (const c of data) {
        nameGroups.set(c.name, (nameGroups.get(c.name) || 0) + 1);
      }
      let dupes = 0;
      for (const count of nameGroups.values()) {
        if (count > 1) dupes += count - 1; // extras beyond the first
      }
      // Also count placeholder names
      const placeholders = ['# Nome Cliente', '# Nome do Cliente', 'Cliente sem nome'];
      for (const c of data) {
        if (placeholders.includes(c.name.trim())) {
          dupes++; // all placeholders are "duplicates" to clean
        }
      }
      // Avoid double-counting: placeholders already counted above, remove from name group count
      // Actually, let's recalculate properly
      let totalDuplicates = 0;
      for (const [name, count] of nameGroups.entries()) {
        if (placeholders.includes(name.trim())) {
          totalDuplicates += count; // all placeholder records should be removed
        } else if (count > 1) {
          totalDuplicates += count - 1; // keep oldest, remove rest
        }
      }
      setDuplicateCount(totalDuplicates);
    } catch {
      setDuplicateCount(0);
    }
  };

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const deleteBatchGeneric = async (
    deleteFn: (ids: string[]) => Promise<any>,
    selectFn: () => Promise<{ data: any[] | null; error: any }>
  ) => {
    let totalDeleted = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: batch, error: fetchError } = await selectFn();
      if (fetchError) throw fetchError;
      if (!batch || batch.length === 0) { hasMore = false; continue; }
      const ids = batch.map((r: any) => r.id);
      await deleteFn(ids);
      totalDeleted += ids.length;
      setProgress(p => ({ ...p, current: p.current + ids.length }));
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      hasMore = batch.length === BATCH_SIZE;
    }
    return totalDeleted;
  };

  const deleteCashTransactions = async (typeFilter?: string) => {
    return deleteBatchGeneric(
      async (ids) => { const { error } = await supabase.from('cash_transactions').delete().in('id', ids); if (error) throw error; },
      async () => {
        let q = supabase.from('cash_transactions').select('id').eq('user_id', userId).limit(BATCH_SIZE);
        if (typeFilter) q = q.eq('type', typeFilter);
        return await q;
      }
    );
  };

  const deleteCashRegisters = async () => {
    return deleteBatchGeneric(
      async (ids) => { const { error } = await supabase.from('cash_registers').delete().in('id', ids); if (error) throw error; },
      async () => await supabase.from('cash_registers').select('id').eq('user_id', userId).limit(BATCH_SIZE)
    );
  };

  const deleteMaterials = async () => {
    return deleteBatchGeneric(
      async (ids) => { const { error } = await supabase.from('materials').delete().in('id', ids); if (error) throw error; },
      async () => await supabase.from('materials').select('id').eq('user_id', userId).limit(BATCH_SIZE)
    );
  };

  const deleteCustomers = async () => {
    return deleteBatchGeneric(
      async (ids) => { const { error } = await supabase.from('customers').delete().in('id', ids); if (error) throw error; },
      async () => await supabase.from('customers').select('id').eq('user_id', userId).limit(BATCH_SIZE)
    );
  };

  const deleteOrdersByType = async (orderType: 'compra' | 'venda') => {
    let hasMore = true;
    let totalDeleted = 0;
    while (hasMore) {
      const { data: batch, error } = await supabase
        .from('orders').select('id').eq('user_id', userId).eq('type', orderType).limit(BATCH_SIZE);
      if (error) throw error;
      if (!batch || batch.length === 0) { hasMore = false; continue; }
      const ids = batch.map(r => r.id);
      await supabase.from('order_payments').delete().in('order_id', ids);
      await supabase.from('order_items').delete().in('order_id', ids);
      const { error: delError } = await supabase.from('orders').delete().in('id', ids);
      if (delError) throw delError;
      totalDeleted += ids.length;
      setProgress(p => ({ ...p, current: p.current + ids.length }));
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      hasMore = batch.length === BATCH_SIZE;
    }
    return totalDeleted;
  };

  const deleteFluxoCaixa = async () => {
    await deleteCashTransactions();
    await deleteCashRegisters();
  };

  // === LIMPEZA DE DUPLICADOS ===
  const handleCleanDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setCleanupProgress({ current: 0, total: duplicateCount, phase: 'Buscando clientes...' });

    try {
      // 1. Fetch all customers for this user
      let allCustomers: { id: string; name: string; created_at: string | null }[] = [];
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .range(offset, offset + 999);
        if (error) throw error;
        if (!data || data.length === 0) { hasMore = false; continue; }
        allCustomers = [...allCustomers, ...data];
        offset += data.length;
        hasMore = data.length === 1000;
      }

      const placeholders = ['# Nome Cliente', '# Nome do Cliente', 'Cliente sem nome'];

      // 2. Group by name
      const nameGroups = new Map<string, typeof allCustomers>();
      for (const c of allCustomers) {
        const group = nameGroups.get(c.name) || [];
        group.push(c);
        nameGroups.set(c.name, group);
      }

      let processed = 0;

      // 3. For each group with duplicates, keep the oldest and update orders
      for (const [name, group] of nameGroups.entries()) {
        const isPlaceholder = placeholders.includes(name.trim());

        if (isPlaceholder) {
          // Delete ALL placeholder customers, but first check if they have orders
          setCleanupProgress(p => ({ ...p, phase: `Removendo placeholders "${name}"...` }));
          const idsToDelete = group.map(c => c.id);
          
          // Process in batches
          for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
            const batch = idsToDelete.slice(i, i + BATCH_SIZE);
            // Update orders pointing to these customers to null customer_id
            await supabase.from('orders').update({ customer_id: null as any }).in('customer_id', batch).eq('user_id', userId);
            // Delete customers
            await supabase.from('customers').delete().in('id', batch);
            processed += batch.length;
            setCleanupProgress(p => ({ ...p, current: processed }));
            await new Promise(r => setTimeout(r, BATCH_DELAY));
          }
        } else if (group.length > 1) {
          // Keep the oldest (first in sorted list), merge the rest
          const keepId = group[0].id;
          const duplicateIds = group.slice(1).map(c => c.id);

          setCleanupProgress(p => ({ ...p, phase: `Mesclando "${name}" (${duplicateIds.length} duplicatas)...` }));

          // Process in batches
          for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
            const batch = duplicateIds.slice(i, i + BATCH_SIZE);
            // Update orders to point to the kept customer
            await supabase.from('orders').update({ customer_id: keepId }).in('customer_id', batch).eq('user_id', userId);
            // Delete duplicate customers
            await supabase.from('customers').delete().in('id', batch);
            processed += batch.length;
            setCleanupProgress(p => ({ ...p, current: processed }));
            await new Promise(r => setTimeout(r, BATCH_DELAY));
          }
        }
      }

      toast({
        title: 'Duplicados removidos',
        description: `${processed} registros duplicados foram limpos com sucesso.`,
        duration: 5000,
      });

      fetchCounts();
    } catch (error) {
      console.error('Erro ao limpar duplicados:', error);
      toast({
        title: 'Erro na limpeza',
        description: 'Ocorreu um erro ao limpar duplicados. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsCleaningDuplicates(false);
      setCleanupProgress({ current: 0, total: 0, phase: '' });
    }
  };

  const handleDelete = async () => {
    if (!confirmSector) return;
    const config = SECTORS[confirmSector];
    if (confirmationText !== config.confirmText) return;

    setIsDeleting(true);
    setProgress({ current: 0, total: 0, phase: 'Iniciando exclusão...' });

    try {
      if (confirmSector === 'tudo') {
        setProgress({ current: 0, total: counts.tudo, phase: 'Excluindo compras...' });
        await deleteOrdersByType('compra');
        setProgress(p => ({ ...p, phase: 'Excluindo vendas...' }));
        await deleteOrdersByType('venda');
        setProgress(p => ({ ...p, phase: 'Excluindo fluxo de caixa...' }));
        await deleteFluxoCaixa();
        setProgress(p => ({ ...p, phase: 'Excluindo materiais...' }));
        await deleteMaterials();
        setProgress(p => ({ ...p, phase: 'Excluindo clientes...' }));
        await deleteCustomers();
      } else {
        const total = counts[confirmSector];
        setProgress({ current: 0, total, phase: `Excluindo ${config.label.toLowerCase()}...` });

        switch (confirmSector) {
          case 'compras': await deleteOrdersByType('compra'); break;
          case 'vendas': await deleteOrdersByType('venda'); break;
          case 'transacoes': await deleteCashTransactions(); break;
          case 'despesas': await deleteCashTransactions('expense'); break;
          case 'adicoes_caixa': await deleteCashTransactions('addition'); break;
          case 'fluxo_caixa': await deleteFluxoCaixa(); break;
          case 'materiais': await deleteMaterials(); break;
          case 'clientes': await deleteCustomers(); break;
        }
      }

      toast({
        title: `${config.label} excluído(s)`,
        description: `Dados de "${userName}" removidos com sucesso.`,
        duration: 4000,
      });

      setConfirmSector(null);
      setConfirmationText('');
      fetchCounts();
    } catch (error) {
      console.error('Erro ao excluir dados:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro durante a exclusão. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
      setProgress({ current: 0, total: 0, phase: '' });
    }
  };

  const progressPercent = progress.total > 0 ? Math.min((progress.current / progress.total) * 100, 100) : 0;
  const cleanupProgressPercent = cleanupProgress.total > 0 ? Math.min((cleanupProgress.current / cleanupProgress.total) * 100, 100) : 0;

  const sectorKeys: SectorKey[] = ['compras', 'vendas', 'transacoes', 'despesas', 'adicoes_caixa', 'fluxo_caixa', 'materiais', 'clientes'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Trash2 className="h-5 w-5 text-red-400" />
        <h3 className="text-lg font-semibold text-foreground">Limpeza de Dados</h3>
        <span className="text-sm text-muted-foreground">— {userName}</span>
      </div>

      <Alert className="border-red-600/50 bg-red-900/10">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200 text-sm">
          As exclusões abaixo são <strong>irreversíveis</strong> e afetam apenas os dados deste usuário.
        </AlertDescription>
      </Alert>

      {/* Limpar Duplicados */}
      {duplicateCount > 0 && (
        <Card className="bg-yellow-950/30 border-yellow-900/50">
          <CardContent className="p-4">
            {isCleaningDuplicates ? (
              <div className="space-y-3">
                <p className="text-sm text-yellow-300 font-medium">{cleanupProgress.phase}</p>
                <Progress value={cleanupProgressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {cleanupProgress.current.toLocaleString()} / {cleanupProgress.total.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Limpar Clientes Duplicados</p>
                    <p className="text-xs text-muted-foreground">
                      {duplicateCount.toLocaleString()} registros duplicados/placeholder encontrados
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={handleCleanDuplicates}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Limpar Duplicados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sectorKeys.map(key => {
          const s = SECTORS[key];
          return (
            <Card key={key} className={`${s.bgColor} ${s.borderColor}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${s.color}`}>{s.icon}</div>
                  <div>
                    <p className={`text-sm font-medium ${s.color}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {loadingCounts ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${counts[key].toLocaleString()} registros`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600/50 text-red-400 hover:bg-red-600/20 hover:text-red-300"
                  onClick={() => { setConfirmSector(key); setConfirmationText(''); }}
                  disabled={loadingCounts || counts[key] === 0}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Excluir TUDO */}
      <Card className={`${SECTORS.tudo.bgColor} ${SECTORS.tudo.borderColor}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={SECTORS.tudo.color}>{SECTORS.tudo.icon}</div>
            <div>
              <p className={`text-sm font-bold ${SECTORS.tudo.color}`}>Excluir TUDO</p>
              <p className="text-xs text-muted-foreground">
                {loadingCounts ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${counts.tudo.toLocaleString()} registros totais`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => { setConfirmSector('tudo'); setConfirmationText(''); }}
            disabled={loadingCounts || counts.tudo === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Excluir Tudo
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmSector} onOpenChange={(open) => { if (!open && !isDeleting) { setConfirmSector(null); setConfirmationText(''); } }}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 text-xl text-red-400">
              <Trash2 className="h-6 w-6" />
              Excluir {confirmSector && SECTORS[confirmSector].label}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Excluir dados de <strong className="text-white">{userName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isDeleting && progress.total > 0 ? (
              <div className="space-y-3 py-4">
                <p className="text-sm text-gray-300 text-center font-medium">{progress.phase}</p>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-gray-500 text-center">
                  {progress.current.toLocaleString()} / {progress.total.toLocaleString()} registros
                </p>
                <p className="text-xs text-yellow-500 text-center">Não feche esta janela</p>
              </div>
            ) : confirmSector && (
              <>
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <AlertDescription className="text-red-200 text-sm">
                    <strong>ATENÇÃO:</strong>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      {SECTORS[confirmSector].warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Digite: <span className="text-red-400 font-bold">{SECTORS[confirmSector].confirmText}</span>
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                    placeholder="Digite para confirmar"
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-red-400"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setConfirmSector(null); setConfirmationText(''); }}
                    className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!confirmSector || confirmationText !== SECTORS[confirmSector].confirmText}
                  >
                    Excluir
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserDataCleanup;
