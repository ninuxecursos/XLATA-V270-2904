
import React from 'react';
import { RealtimeMessageModal } from './RealtimeMessageModal';

interface DirectMessage {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
}

interface DirectMessageModalProps {
  message: DirectMessage | null;
  open: boolean;
  onClose: () => void;
}

export const DirectMessageModal = ({ message, open, onClose }: DirectMessageModalProps) => {
  if (!message) return null;

  return (
    <RealtimeMessageModal
      open={open}
      title={message.title}
      message={message.message}
      senderName={message.sender_name}
      onClose={onClose}
    />
  );
};
