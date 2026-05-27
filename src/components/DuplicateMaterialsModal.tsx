import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Merge } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { findDuplicateMaterialGroups } from '@/utils/materialMatching';
import { getDisplayName } from '@/utils/materialNormalization';

interface DuplicateGroup {
  canonicalKey: string;
  materials: Array<{ id: string; name: string }>;
}

interface DuplicateMaterialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsolidated: () => void;
}

export const DuplicateMaterialsModal = ({
  open,
  onOpenChange,
  onConsolidated,
}: DuplicateMaterialsModalProps) => {
  const { user } = useAuth();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({});

  // Load duplicates when modal opens
  useEffect(() => {
    if (open && user) {
      loadDuplicates();
    }
  }, [open, user]);

  const loadDuplicates = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: materials, error } = await supabase
        .from('materials')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!materials) {
        setDuplicateGroups([]);
        return;
      }

      const groups = findDuplicateMaterialGroups(materials);
      setDuplicateGroups(groups);

      // Pre-select the first material in each group as default
      const defaultSelections: Record<string, string> = {};
      groups.forEach(group => {
        if (group.materials.length > 0) {
          defaultSelections[group.canonicalKey] = group.materials[0].id;
        }
      });
      setSelectedMaterials(defaultSelections);

    } catch (error) {
      console.error('Error loading duplicates:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar duplicatas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMaterial = (groupKey: string, materialId: string) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [groupKey]: materialId,
    }));
  };

  const consolidateAllGroups = async () => {
    if (!user || duplicateGroups.length === 0) return;

    setIsConsolidating(true);
    let totalConsolidated = 0;

    try {
      for (const group of duplicateGroups) {
        const keepMaterialId = selectedMaterials[group.canonicalKey];
        if (!keepMaterialId) continue;

        const keepMaterial = group.materials.find(m => m.id === keepMaterialId);
        if (!keepMaterial) continue;

        const materialsToRemove = group.materials.filter(m => m.id !== keepMaterialId);
        const materialIdsToRemove = materialsToRemove.map(m => m.id);

        if (materialIdsToRemove.length === 0) continue;

        // 1. Update all order_items to use the kept material (ID and name)
        const { error: updateOrderItemsError } = await supabase
          .from('order_items')
          .update({ 
            material_id: keepMaterialId,
            material_name: keepMaterial.name 
          })
          .eq('user_id', user.id)
          .in('material_id', materialIdsToRemove);

        if (updateOrderItemsError) {
          console.error('Error updating order_items:', updateOrderItemsError);
          throw updateOrderItemsError;
        }

        // 2. Delete the duplicate materials
        const { error: deleteMaterialsError } = await supabase
          .from('materials')
          .delete()
          .eq('user_id', user.id)
          .in('id', materialIdsToRemove);

        if (deleteMaterialsError) {
          console.error('Error deleting materials:', deleteMaterialsError);
          throw deleteMaterialsError;
        }

        totalConsolidated += materialsToRemove.length;
      }

      toast({
        title: "Sucesso!",
        description: `${totalConsolidated} materiais duplicados foram consolidados.`,
      });

      onConsolidated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error consolidating materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao consolidar materiais. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  const noDuplicates = !isLoading && duplicateGroups.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-amber-400" />
            Verificar Duplicatas
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Materiais com nomes similares podem ser unificados para evitar inconsistências no estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-400">Verificando duplicatas...</span>
            </div>
          ) : noDuplicates ? (
            <Alert className="bg-emerald-500/10 border-emerald-500/30">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-300">
                Parabéns! Não foram encontrados materiais duplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300">
                  Encontramos {duplicateGroups.length} grupo(s) de duplicatas. 
                  Selecione qual material manter em cada grupo.
                </AlertDescription>
              </Alert>

              {duplicateGroups.map((group) => (
                <div key={group.canonicalKey} className="border border-slate-600 rounded-lg p-4 space-y-3">
                  <div className="text-sm text-slate-400">
                    Grupo: <code className="bg-slate-700 px-2 py-0.5 rounded">{group.canonicalKey}</code>
                  </div>
                  
                  <div className="space-y-2">
                    {group.materials.map((material) => {
                      const isSelected = selectedMaterials[group.canonicalKey] === material.id;
                      
                      return (
                        <button
                          key={material.id}
                          onClick={() => handleSelectMaterial(group.canonicalKey, material.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{getDisplayName(material.name)}</span>
                            {isSelected && (
                              <Badge className="bg-emerald-600 text-white">
                                Manter
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 truncate">
                            ID: {material.id.slice(0, 8)}...
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-slate-700 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            Cancelar
          </Button>
          
          {!noDuplicates && !isLoading && (
            <Button
              onClick={consolidateAllGroups}
              disabled={isConsolidating}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isConsolidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unificar {duplicateGroups.reduce((sum, g) => sum + g.materials.length - 1, 0)} Duplicatas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
