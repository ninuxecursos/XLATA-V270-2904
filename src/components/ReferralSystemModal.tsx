import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReferralSystem from './ReferralSystem';

interface ReferralSystemModalProps {
  open: boolean;
  onClose: () => void;
}

const ReferralSystemModal: React.FC<ReferralSystemModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Sistema de Indicações</DialogTitle>
        </DialogHeader>
        <ReferralSystem />
      </DialogContent>
    </Dialog>
  );
};

export default ReferralSystemModal;