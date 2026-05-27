import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Link2, Plus, Trash2, Package, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OrphanMaterial, getOrphanMaterials } from '@/utils/orphanMaterials';
import LinkOrphanMaterialModal from './LinkOrphanMaterialModal';
import CreateMaterialFromOrphanModal from './CreateMaterialFromOrphanModal';
import ClearOrphanStockModal from './ClearOrphanStockModal';

interface OrphanMaterialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged: () => void;
  registeredMaterials: Array<{ id: string; name: string; category_id?: string }>;
}

const OrphanMaterialsModal: React.FC<OrphanMaterialsModalProps> = ({
  open,
  onOpenChange,
  onDataChanged,
  registeredMaterials
}) => {
  const [orphans, setOrphans] = useState<OrphanMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanMaterial | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const loadOrphans = async () => {
    setLoading(true);
    try {
      const data = await getOrphanMaterials();
      setOrphans(data);
    } catch (error) {
      console.error('Error loading orphan materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar materiais órfãos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadOrphans();
    }
  }, [open]);

  const handleLinkClick = (orphan: OrphanMaterial) => {
    setSelectedOrphan(orphan);
    setShowLinkModal(true);
  };

  const handleCreateClick = (orphan: OrphanMaterial) => {
    setSelectedOrphan(orphan);
    setShowCreateModal(true);
  };

  const handleClearClick = (orphan: OrphanMaterial) => {
    setSelectedOrphan(orphan);
    setShowClearModal(true);
  };

  const handleSuccess = () => {
    loadOrphans();
    onDataChanged();
  };

  const formatWeight = (value: number) => `${value.toFixed(2)} kg`;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Dialog open={open && !showLinkModal && !showCreateModal && !showClearModal} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <DialogTitle className="text-lg text-yellow-400">
                  Materiais Órfãos no Estoque
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  {orphans.length > 0 
                    ? `Encontramos ${orphans.length} material(is) com estoque que não possui(em) cadastro.`
                    : 'Verificando materiais...'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
              </div>
            ) : orphans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-emerald-400 font-medium">Nenhum material órfão encontrado!</p>
                <p className="text-slate-400 text-sm mt-1">
                  Todos os materiais em estoque possuem cadastro correspondente.
                </p>
              </div>
            ) : (
              orphans.map((orphan) => (
                <Card key={orphan.materialName} className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          <Package className="h-4 w-4 text-yellow-500" />
                          {orphan.materialName}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          Saldo: <span className="text-white font-medium">{formatWeight(orphan.currentStock)}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div>{orphan.transactionCount} transações</div>
                        <div>Custo: {formatCurrency(orphan.totalPurchaseCost)}</div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkClick(orphan)}
                        className="bg-blue-900/30 border-blue-600 text-blue-400 hover:bg-blue-900/50 text-xs h-7 px-2"
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Vincular
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateClick(orphan)}
                        className="bg-emerald-900/30 border-emerald-600 text-emerald-400 hover:bg-emerald-900/50 text-xs h-7 px-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar Cadastro
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearClick(orphan)}
                        className="bg-red-900/30 border-red-600 text-red-400 hover:bg-red-900/50 text-xs h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Zerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-700">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      {selectedOrphan && (
        <>
          <LinkOrphanMaterialModal
            open={showLinkModal}
            onClose={() => {
              setShowLinkModal(false);
              setSelectedOrphan(null);
            }}
            orphanName={selectedOrphan.materialName}
            registeredMaterials={registeredMaterials}
            onSuccess={handleSuccess}
          />

          <CreateMaterialFromOrphanModal
            open={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedOrphan(null);
            }}
            orphanName={selectedOrphan.materialName}
            onSuccess={handleSuccess}
          />

          <ClearOrphanStockModal
            open={showClearModal}
            onClose={() => {
              setShowClearModal(false);
              setSelectedOrphan(null);
            }}
            orphanName={selectedOrphan.materialName}
            currentStock={selectedOrphan.currentStock}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  );
};

export default OrphanMaterialsModal;
