
import React from 'react';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { DirectMessageModal } from './DirectMessageModal';

interface DirectMessageProviderProps {
  children: React.ReactNode;
}

export const DirectMessageProvider = ({ children }: DirectMessageProviderProps) => {
  const { currentMessage, isModalOpen, handleCloseMessage } = useDirectMessages();

  return (
    <>
      {children}
      <DirectMessageModal
        message={currentMessage}
        open={isModalOpen}
        onClose={handleCloseMessage}
      />
    </>
  );
};
