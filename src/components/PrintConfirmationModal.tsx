import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
interface PrintConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
export function PrintConfirmationModal({
  isOpen,
  onClose,
  onConfirm
}: PrintConfirmationModalProps) {
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-white border-none" style={{
      backgroundColor: '#303030'
    }}>
        <DialogHeader>
          <DialogTitle className="text-xl" style={{
          color: '#10B981'
        }}>Tabela de Preços</DialogTitle>
          <DialogDescription className="text-gray-400">
            Confirme para imprimir a tabela de preços
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-base text-gray-300">Clique em Confirmar Impressão para imprimir a Tabela de Preços</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-white hover:bg-gray-600 text-base">
              Cancelar
            </Button>
            <Button onClick={onConfirm} className="flex-1 text-white hover:opacity-90 text-base" style={{
            backgroundColor: '#10B981'
          }}>
              Confirmar impressão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}