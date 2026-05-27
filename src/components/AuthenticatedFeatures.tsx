import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useUserPresence } from '@/hooks/useUserPresence';
import { RealtimeMessageModal } from './RealtimeMessageModal';

/**
 * Component that wraps features requiring authentication and realtime connections.
 * This isolates WebSocket/Realtime from public pages to prevent console errors.
 * Should ONLY be rendered inside authenticated routes.
 */
export const AuthenticatedFeatures = () => {
  const { currentMessage, dismissCurrentMessage } = useRealtimeMessages();
  useUserPresence();

  return (
    <>
      {currentMessage && (
        <RealtimeMessageModal
          open={true}
          title={currentMessage.title}
          message={currentMessage.message}
          senderName={currentMessage.sender_name}
          onClose={dismissCurrentMessage}
        />
      )}
    </>
  );
};

export default AuthenticatedFeatures;
