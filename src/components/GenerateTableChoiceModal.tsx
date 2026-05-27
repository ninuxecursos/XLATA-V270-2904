import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Printer, FileText } from 'lucide-react';

interface GenerateTableChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseThermal: () => void;
  onChoosePdf: () => void;
}

export function GenerateTableChoiceModal({ isOpen, onClose, onChooseThermal, onChoosePdf }: GenerateTableChoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Gerar Tabela de Preços</DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-sm">
            Escolha o formato desejado
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onChooseThermal}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10">
              <Printer className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">Imprimir</div>
              <div className="text-xs text-slate-400 mt-1">Para impressoras 50mm / 80mm</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onChoosePdf}
            className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10">
              <FileText className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">Gerar Tabela</div>
              <div className="text-xs text-slate-400 mt-1">Gerar tabela de preços e enviar via WhatsApp</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GenerateTableChoiceModal;
