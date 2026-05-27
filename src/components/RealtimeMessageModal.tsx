import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface RealtimeMessageModalProps {
  open: boolean;
  title: string;
  message: string;
  senderName: string;
  onClose: () => void;
}

export const RealtimeMessageModal = ({
  open,
  title,
  message,
  senderName,
  onClose
}: RealtimeMessageModalProps) => {
  
  // Prevenir múltiplas instâncias do modal
  useEffect(() => {
    if (open) {
      // Garantir que apenas um modal esteja aberto por vez
      const existingModals = document.querySelectorAll('[data-realtime-modal]');
      if (existingModals.length > 1) {
        console.log('Múltiplos modais detectados, fechando extras');
        return;
      }
    }
  }, [open]);

  const handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Modal sendo fechado pelo usuário...');
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        console.log('Dialog onOpenChange:', isOpen);
        if (!isOpen) {
          console.log('Modal fechado via onOpenChange');
          onClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md bg-gray-900 border-gray-700 text-white"
        hideCloseButton={true}
        data-realtime-modal="true"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          handleClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center flex-1">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 absolute right-4 top-4 z-50"
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div 
              className="text-gray-300 text-center leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(message, {
                  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
                  ALLOWED_ATTR: ['class']
                })
              }}
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Enviado por: <span className="text-blue-400 font-medium">{senderName}</span>
            </p>
          </div>
          
          <div className="flex justify-center pt-2">
            <Button 
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
              type="button"
            >
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
