import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DeleteAllMaterialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMaterialsDeleted: () => void;
  materialsCount: number;
}

const DeleteAllMaterialsModal: React.FC<DeleteAllMaterialsModalProps> = ({ 
  open, 
  onOpenChange,
  onMaterialsDeleted,
  materialsCount
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { user } = useAuth();
  
  const CONFIRMATION_TEXT = 'EXCLUIR TODOS';

  const handleDeleteAllMaterials = async () => {
    if (!user || confirmationText !== CONFIRMATION_TEXT) return;

    setIsDeleting(true);

    try {
      // First, check if any materials have transactions
      const { data: materialsWithTransactions, error: checkError } = await supabase
        .from('materials')
        .select('id, name')
        .eq('user_id', user.id);

      if (checkError) {
        throw checkError;
      }

      // Check for order_items linked to these materials
      const materialIds = materialsWithTransactions?.map(m => m.id) || [];
      
      if (materialIds.length > 0) {
        const { count: transactionsCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .in('material_id', materialIds);

        if (transactionsCount && transactionsCount > 0) {
          toast({
            title: "Ação bloqueada",
            description: `Existem ${transactionsCount} transações registradas. Zere o estoque de todos os materiais antes de excluí-los.`,
            variant: "destructive",
            duration: 6000,
          });
          setIsDeleting(false);
          return;
        }
      }

      // No transactions - safe to delete
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar materiais:', error);
        toast({
          title: "Erro ao excluir materiais",
          description: "Ocorreu um erro ao deletar os materiais.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      toast({
        title: "Materiais excluídos com sucesso",
        description: `${materialsCount} materiais foram removidos do sistema.`,
        duration: 4000,
      });

      onMaterialsDeleted();
      onOpenChange(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Erro ao excluir materiais:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao excluir os materiais. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl text-red-400">
            <Trash2 className="h-7 w-7" /> 
            Excluir Todos os Materiais
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-lg">
            Esta ação é irreversível e removerá TODOS os materiais cadastrados
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert className="border-red-600 bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <AlertDescription className="text-red-200 text-base">
              <strong>ATENÇÃO:</strong> Esta ação irá:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Excluir TODOS os <strong>{materialsCount}</strong> materiais cadastrados</li>
                <li>Esta ação NÃO pode ser desfeita</li>
                <li>Os materiais precisarão ser recadastrados manualmente</li>
                <li className="text-amber-300"><strong>Materiais com transações serão bloqueados</strong> - zere o estoque primeiro</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <label className="text-white font-medium">
              Para confirmar, digite exatamente: <span className="text-red-400 font-bold">{CONFIRMATION_TEXT}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite aqui para confirmar"
              className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-red-400"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteAllMaterials}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting || confirmationText !== CONFIRMATION_TEXT}
            >
              {isDeleting ? "Excluindo..." : "Excluir Todos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAllMaterialsModal;
