import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Eye, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminViewBannerProps {
  adminViewingUserName?: string | null;
  onExit?: () => void;
  showBackToAdmin?: boolean;
  className?: string;
}

export function AdminViewBanner({ 
  adminViewingUserName, 
  onExit,
  showBackToAdmin = false,
  className 
}: AdminViewBannerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get admin view from location state if not provided via props
  const viewingUser = adminViewingUserName || location.state?.adminViewingUserName;
  const isAdminView = !!viewingUser;

  if (!isAdminView) return null;

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Default: navigate to current page without admin state
      navigate(location.pathname + location.search, {
        replace: true,
        state: {}
      });
    }
  };

  const handleBackToAdmin = () => {
    navigate('/covildomal');
  };

  return (
    <div className={cn(
      "bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-2 flex items-center justify-between",
      className
    )}>
      <div className="flex items-center gap-3">
        {showBackToAdmin && (
          <Button 
            onClick={handleBackToAdmin} 
            variant="ghost" 
            size="sm" 
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 p-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Admin
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-purple-400" />
          <span className="text-purple-300 text-sm">
            Visualizando: <span className="font-semibold text-purple-200">{viewingUser}</span>
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
      >
        Sair
      </Button>
    </div>
  );
}

// Compact version for headers
export function AdminViewIndicator({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const viewingUser = location.state?.adminViewingUserName;
  const isAdminView = !!viewingUser;

  if (!isAdminView) return null;

  const handleExit = () => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {}
    });
  };

  return (
    <div className={cn(
      "flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1.5",
      className
    )}>
      <Eye className="h-3.5 w-3.5 text-purple-400" />
      <span className="text-purple-300 text-xs truncate max-w-[150px]">
        {viewingUser}
      </span>
      <button
        onClick={handleExit}
        className="text-purple-400 hover:text-purple-200 transition-colors"
        title="Sair do modo de visualização"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
