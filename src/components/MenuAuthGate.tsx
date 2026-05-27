import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PasswordPromptModal from './PasswordPromptModal';

const FLAG_KEY = 'menu_session_authenticated';

export function setMenuAuthenticated() {
  try {
    sessionStorage.setItem(FLAG_KEY, '1');
  } catch {}
}

export function clearMenuAuthenticated() {
  try {
    sessionStorage.removeItem(FLAG_KEY);
  } catch {}
}

export function isMenuAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

const MenuAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean>(() => isMenuAuthenticated());
  const [showPrompt, setShowPrompt] = useState<boolean>(() => !isMenuAuthenticated());

  // If user navigates back to PDV, clear flag so they re-auth next time they enter menu
  useEffect(() => {
    if (location.pathname === '/pdv' || location.pathname === '/') {
      clearMenuAuthenticated();
    }
  }, [location.pathname]);

  // Clear flag on logout (auth state change to no user handled elsewhere via storage)
  useEffect(() => {
    const handler = () => {
      clearMenuAuthenticated();
      setAuthenticated(false);
      setShowPrompt(true);
    };
    window.addEventListener('logout', handler);
    return () => window.removeEventListener('logout', handler);
  }, []);

  const handleAuthenticated = () => {
    setMenuAuthenticated();
    setAuthenticated(true);
    setShowPrompt(false);
  };

  const handleCancel = (open: boolean) => {
    if (!open && !authenticated && !isMenuAuthenticated()) {
      // User cancelled — send back to PDV
      navigate('/pdv', { replace: true });
    }
    setShowPrompt(open);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <PasswordPromptModal
          open={showPrompt}
          onOpenChange={handleCancel}
          onAuthenticated={handleAuthenticated}
          title="Acesso ao Menu"
          description="Digite sua senha para acessar esta área do sistema"
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default MenuAuthGate;
