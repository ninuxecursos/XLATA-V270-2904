
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Bluetooth, FileText } from 'lucide-react';
import { useMobilePrint } from '@/hooks/useMobilePrint';

interface MobilePrintOptionsProps {
  open: boolean;
  onClose: () => void;
  content: string;
  filename?: string;
  title?: string;
}

const MobilePrintOptions: React.FC<MobilePrintOptionsProps> = ({
  open,
  onClose,
  content,
  filename = 'comprovante.pdf',
  title = 'Comprovante'
}) => {
  const { 
    isProcessing, 
    printWithIframe, 
    saveAsPdf, 
    showBluetoothInstructions 
  } = useMobilePrint();

  const handlePrintClick = async () => {
    await printWithIframe(content, { title });
    onClose();
  };

  const handleSavePdfClick = async () => {
    await saveAsPdf(content, filename);
    onClose();
  };

  const handleBluetoothClick = () => {
    showBluetoothInstructions();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Opções de Impressão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-300 mb-4">
            Escolha como deseja imprimir ou salvar o comprovante:
          </p>
          
          <Button
            onClick={handlePrintClick}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isProcessing ? 'Preparando...' : 'Imprimir Comprovante'}
          </Button>
          
          <Button
            onClick={handleSavePdfClick}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isProcessing ? 'Gerando PDF...' : 'Salvar como PDF'}
          </Button>
          
          <Button
            onClick={handleBluetoothClick}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-700 flex items-center gap-2"
          >
            <Bluetooth className="h-4 w-4" />
            Impressora Bluetooth
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-700"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobilePrintOptions;
