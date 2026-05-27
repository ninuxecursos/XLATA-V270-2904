import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { linkOrphanToMaterial } from '@/utils/orphanMaterials';
import PasswordPromptModal from './PasswordPromptModal';

interface LinkOrphanMaterialModalProps {
  open: boolean;
  onClose: () => void;
  orphanName: string;
  registeredMaterials: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const LinkOrphanMaterialModal: React.FC<LinkOrphanMaterialModalProps> = ({
  open,
  onClose,
  orphanName,
  registeredMaterials,
  onSuccess
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMaterial('');
      setSearchTerm('');
      setShowPasswordModal(false);
    }
  }, [open]);

  const filteredMaterials = registeredMaterials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkRequest = () => {
    if (!selectedMaterial) {
      toast({
        title: "Selecione um material",
        description: "Escolha um material cadastrado para vincular.",
        variant: "destructive",
      });
      return;
    }
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = async () => {
    setShowPasswordModal(false);
    await executeLink();
  };

  const executeLink = async () => {
    setIsLinking(true);
    try {
      const result = await linkOrphanToMaterial(orphanName, selectedMaterial);
      
      toast({
        title: "Vinculação concluída!",
        description: `${result.updatedCount} registro(s) de "${orphanName}" foram atualizados para "${selectedMaterial}".`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error linking orphan:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular material. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showPasswordModal} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-blue-400 flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vincular Material Órfão
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Vincular <span className="text-white font-medium">"{orphanName}"</span> a um material cadastrado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-600 rounded-lg p-2">
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">
                  Nenhum material encontrado.
                </div>
              ) : (
                <RadioGroup value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <div className="space-y-1">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors
                          ${selectedMaterial === material.name 
                            ? 'bg-blue-900/30 border border-blue-600' 
                            : 'hover:bg-slate-700 border border-transparent'
                          }`}
                        onClick={() => setSelectedMaterial(material.name)}
                      >
                        <RadioGroupItem value={material.name} id={material.id} className="border-slate-500" />
                        <Label htmlFor={material.id} className="text-white cursor-pointer flex-1">
                          {material.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>

            {selectedMaterial && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                <p className="text-blue-300">
                  ⚠️ Todos os registros de <span className="font-bold">"{orphanName}"</span> serão atualizados para{' '}
                  <span className="font-bold">"{selectedMaterial}"</span>.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row mt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              disabled={isLinking}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLinkRequest}
              disabled={!selectedMaterial || isLinking}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              <Link2 className="mr-2 h-4 w-4" />
              {isLinking ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={(open) => !open && setShowPasswordModal(false)}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Vinculação"
        description={`Digite sua senha para confirmar a vinculação de "${orphanName}" para "${selectedMaterial}".`}
      />
    </>
  );
};

export default LinkOrphanMaterialModal;
