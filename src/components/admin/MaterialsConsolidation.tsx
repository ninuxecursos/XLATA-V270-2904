import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Trash2, Merge } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { performDataAudit, AuditResult, DuplicateGroup } from '@/utils/dataAudit';
import { getMaterialUsageStats } from '@/utils/dataAudit';
import { getDisplayName } from '@/utils/materialNormalization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MaterialUsageStats {
  totalTransactions: number;
  totalQuantity: number;
  totalValue: number;
  purchaseCount: number;
  saleCount: number;
  lastUsed: number | null;
}

export const MaterialsConsolidation = () => {
  const { user } = useAuth();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [materialStats, setMaterialStats] = useState<Record<string, MaterialUsageStats>>({});

  const runAudit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await performDataAudit(user.id);
      setAuditResult(result);
      
      // Load usage stats for duplicate materials
      const statsPromises = result.duplicateGroups.flatMap(group => 
        group.materials.map(async material => {
          const stats = await getMaterialUsageStats(user.id, material.id);
          return { materialId: material.id, stats };
        })
      );
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, MaterialUsageStats> = {};
      statsResults.forEach(({ materialId, stats }) => {
        if (stats) statsMap[materialId] = stats;
      });
      setMaterialStats(statsMap);
      
    } catch (error) {
      console.error('Error running audit:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar auditoria dos materiais",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const consolidateMaterials = async (group: DuplicateGroup, keepMaterialId: string) => {
    if (!user) return;
    
    setIsConsolidating(true);
    try {
      const materialsToRemove = group.materials.filter(m => m.id !== keepMaterialId);
      const materialIdsToRemove = materialsToRemove.map(m => m.id);
      
      // Start transaction-like operations
      // 1. Update all order_items to use the kept material
      const { error: updateOrderItemsError } = await supabase
        .from('order_items')
        .update({ material_id: keepMaterialId })
        .eq('user_id', user.id)
        .in('material_id', materialIdsToRemove);

      if (updateOrderItemsError) throw updateOrderItemsError;

      // 2. Delete the duplicate materials
      const { error: deleteMaterialsError } = await supabase
        .from('materials')
        .delete()
        .eq('user_id', user.id)
        .in('id', materialIdsToRemove);

      if (deleteMaterialsError) throw deleteMaterialsError;

      toast({
        title: "Sucesso",
        description: `Materiais consolidados com sucesso. ${materialsToRemove.length} duplicatas removidas.`,
      });

      // Refresh audit
      await runAudit();
      
    } catch (error) {
      console.error('Error consolidating materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao consolidar materiais",
        variant: "destructive",
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    if (user) {
      runAudit();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consolidação de Materiais</h2>
          <p className="text-muted-foreground">
            Identifique e resolva inconsistências nos nomes dos materiais
          </p>
        </div>
        <Button onClick={runAudit} disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Executar Auditoria
        </Button>
      </div>

      {auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Duplicatas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {auditResult.totalDuplicates}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Grupos de Duplicatas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditResult.duplicateGroups.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inconsistências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {auditResult.totalInconsistencies}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {auditResult && auditResult.duplicateGroups.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Parabéns! Não foram encontradas duplicatas de materiais no seu sistema.
          </AlertDescription>
        </Alert>
      )}

      {auditResult?.duplicateGroups.map((group, index) => (
        <Card key={group.canonicalKey} className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Grupo de Duplicatas #{index + 1}
                </CardTitle>
                <CardDescription>
                  Chave Canônica: <code className="bg-muted px-2 py-1 rounded">{group.canonicalKey}</code>
                  {group.orderItemsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {group.orderItemsCount} transações
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group.materials.map((material) => {
                const stats = materialStats[material.id];
                const isRecommended = stats && stats.totalTransactions === Math.max(
                  ...group.materials.map(m => materialStats[m.id]?.totalTransactions || 0)
                );
                
                return (
                  <div
                    key={material.id}
                    className={`p-4 border rounded-lg ${
                      isRecommended ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{getDisplayName(material.name)}</h4>
                          {isRecommended && (
                            <Badge variant="default" className="bg-green-600">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {material.id}</p>
                        
                        {stats && (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Transações:</span> {stats.totalTransactions}
                            </div>
                            <div>
                              <span className="font-medium">Quantidade:</span> {stats.totalQuantity.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Valor:</span> R$ {stats.totalValue.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Último uso:</span>{' '}
                              {stats.lastUsed ? formatDate(stats.lastUsed) : 'Nunca'}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Merge className="w-4 h-4 mr-1" />
                            Manter Este
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Consolidar Materiais</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja manter "{getDisplayName(material.name)}" e remover as outras {group.materials.length - 1} variações?
                              <br /><br />
                              <strong>Esta ação:</strong>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Atualizará todas as transações para usar este material</li>
                                <li>Removerá os materiais duplicados</li>
                                <li>Não pode ser desfeita</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => consolidateMaterials(group, material.id)}
                              disabled={isConsolidating}
                            >
                              {isConsolidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Consolidar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {auditResult && auditResult.inconsistentOrderItems.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Inconsistências em Transações ({auditResult.inconsistentOrderItems.length})
            </CardTitle>
            <CardDescription>
              Itens de pedidos com nomes de materiais que não correspondem exatamente aos materiais cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Essas inconsistências serão automaticamente resolvidas após a consolidação dos materiais duplicados.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};