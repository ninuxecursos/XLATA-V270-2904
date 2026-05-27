import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BalanceProtection from './BalanceProtection';
import { getActiveCashRegister } from '../utils/supabaseStorage';
import { validateSupabaseConnection } from '../utils/connectionValidator';
import { CashRegister } from '../types/pdv';
import { DollarSign, Receipt, X, Calendar, Clock, Calculator, Menu, ChevronUp, ChevronDown, Wifi, Server } from 'lucide-react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { useTime } from '@/contexts/TimeContext';

// Lazy load modals para consistência com Index.tsx e melhor code splitting
const CashRegisterClosingModal = lazy(() => import('./CashRegisterClosingModal'));
const CashRegisterAddFundsModal = lazy(() => import('./CashRegisterAddFundsModal'));
const ExpenseModal = lazy(() => import('./ExpenseModal'));
const PasswordPromptModal = lazy(() => import('./PasswordPromptModal'));
import { setMenuAuthenticated } from './MenuAuthGate';
const CalculatorModal = lazy(() => import('./CalculatorModal'));
interface FooterProps {
  onMenuClick?: () => void;
  currentBalance?: number;
  onBalanceUpdate?: () => Promise<void>;
}
const Footer: React.FC<FooterProps> = ({
  onMenuClick,
  currentBalance = 0,
  onBalanceUpdate
}) => {
  const navigate = useNavigate();
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isInternetOnline, setIsInternetOnline] = useState(navigator.onLine);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isButtonsExpanded, setIsButtonsExpanded] = useState(true);

  // OTIMIZAÇÃO: Usar TimeContext ao invés de setInterval local
  const { currentTime, formatTime, formatDate } = useTime();

  // Hooks de responsividade
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;

  // Monitor internet connection status with faster updates for mobile/tablet
  useEffect(() => {
    const handleOnline = () => setIsInternetOnline(true);
    const handleOffline = () => setIsInternetOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Otimizado: verificar a cada 5s ao invés de 1s
    let intervalId: NodeJS.Timeout | null = null;
    if (isMobileOrTablet) {
      intervalId = setInterval(() => {
        setIsInternetOnline(navigator.onLine);
      }, 5000);
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMobileOrTablet]);

  // Monitor server connection status with faster updates for mobile/tablet
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const connectionStatus = await validateSupabaseConnection(3000);
        setIsServerOnline(connectionStatus.isConnected);
      } catch (error) {
        console.error('Erro ao verificar conexão do servidor:', error);
        setIsServerOnline(false);
      }
    };

    // Check server connection on mount
    checkServerConnection();

    // Otimizado: 30s para mobile/tablet, 60s para desktop (era 5s e 30s)
    const serverCheckInterval = setInterval(checkServerConnection, isMobileOrTablet ? 30000 : 60000);
    return () => clearInterval(serverCheckInterval);
  }, [isMobileOrTablet]);
  const handleExpenseClick = () => {
    setShowExpenseModal(true);
  };
  const handleCloseDayClick = () => {
    setPendingAction('closeDay');
    setShowPasswordModal(true);
  };
  const handleAddFundsClick = () => {
    setPendingAction('addFunds');
    setShowPasswordModal(true);
  };
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };
  const handleMenuClick = () => {
    setPendingAction('menu');
    setShowPasswordModal(true);
  };
  const handleCalculatorClick = () => {
    setShowCalculatorModal(true);
  };
  const handlePasswordAuthenticated = () => {
    if (pendingAction === 'expense') {
      setShowExpenseModal(true);
    } else if (pendingAction === 'closeDay') {
      setShowClosingModal(true);
    } else if (pendingAction === 'addFunds') {
      setShowAddFundsModal(true);
    } else if (pendingAction === 'dashboard') {
      setMenuAuthenticated();
      navigate('/dashboard');
    } else if (pendingAction === 'menu') {
      setMenuAuthenticated();
      navigate('/dashboard');
    }
    setPendingAction(null);
  };
  const handleClosingComplete = () => {
    window.location.reload();
  };
  const handleAddFundsModalClose = async () => {
    setShowAddFundsModal(false);
    if (onBalanceUpdate) {
      await onBalanceUpdate();
    }
  };
  const handleExpenseModalClose = async () => {
    setShowExpenseModal(false);
    if (onBalanceUpdate) {
      await onBalanceUpdate();
    }
  };
  // OTIMIZAÇÃO: formatTime e formatDate agora vêm do TimeContext

  // Layout específico para mobile e tablet
  if (isMobileOrTablet) {
    return <>
        <footer className="bg-slate-800 text-white border-t border-slate-700">
          {/* Primeira linha - Status e informações */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <div title={isServerOnline ? 'Servidor Online' : 'Servidor Offline'}>
                  <Server className={`h-4 w-4 ${isServerOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div title={isInternetOnline ? 'Internet Online' : 'Internet Offline'}>
                  <Wifi className={`h-4 w-4 ${isInternetOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300 text-xs">{formatTime(currentTime)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BalanceProtection balance={currentBalance} />
              <button onClick={() => setIsButtonsExpanded(!isButtonsExpanded)} className="p-1 rounded transition-colors bg-emerald-600 hover:bg-emerald-700">
                {isButtonsExpanded ? <ChevronDown className="h-4 w-4 text-white" /> : <ChevronUp className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Segunda linha - Botões principais (expansível) */}
          {isButtonsExpanded && <div className="flex justify-between items-center px-2 py-3 bg-slate-800">
              <button onClick={handleCloseDayClick} className="flex flex-col items-center justify-center p-2 text-red-400 hover:bg-slate-700 rounded transition-colors min-w-[60px]">
                <X className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Fechar</span>
              </button>
              
              <button onClick={handleAddFundsClick} className="flex flex-col items-center justify-center p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors min-w-[60px]">
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-xs text-center">Saldo</span>
              </button>
              
              <button onClick={handleExpenseClick} className="flex flex-col items-center justify-center p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors min-w-[60px]">
                <Receipt className="h-5 w-5 mb-1" />
                <span className="text-xs text-center">Despesa</span>
              </button>
              
              <button onClick={handleCalculatorClick} className="flex flex-col items-center justify-center p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors min-w-[60px]">
                <Calculator className="h-5 w-5 mb-1" />
                <span className="text-xs text-center">Calc</span>
              </button>
              
              <button onClick={handleMenuClick} className="flex flex-col items-center justify-center p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors min-w-[60px]">
                <Menu className="h-5 w-5 mb-1" />
                <span className="text-xs text-center">Menu</span>
              </button>
            </div>}
        </footer>

        {/* Modals - wrapped in Suspense for lazy loading */}
        <Suspense fallback={null}>
          <CashRegisterClosingModal open={showClosingModal} onOpenChange={setShowClosingModal} onComplete={handleClosingComplete} />
          
          <CashRegisterAddFundsModal open={showAddFundsModal} onOpenChange={handleAddFundsModalClose} onComplete={handleAddFundsModalClose} />
          
          <ExpenseModal open={showExpenseModal} onOpenChange={handleExpenseModalClose} />

          <CalculatorModal open={showCalculatorModal} onOpenChange={setShowCalculatorModal} />

          <PasswordPromptModal open={showPasswordModal} onOpenChange={setShowPasswordModal} onAuthenticated={handlePasswordAuthenticated} title={pendingAction === 'expense' ? "Adicionar Despesa" : pendingAction === 'closeDay' ? "Fechar Dia" : pendingAction === 'addFunds' ? "Adicionar Saldo" : pendingAction === 'dashboard' ? "Acessar Dashboard" : pendingAction === 'menu' ? "Acessar Menu" : "Autenticação"} description={`Digite sua senha para ${pendingAction === 'expense' ? 'adicionar uma despesa' : pendingAction === 'closeDay' ? 'fechar o dia' : pendingAction === 'addFunds' ? 'adicionar saldo ao caixa' : pendingAction === 'dashboard' ? 'acessar o dashboard' : pendingAction === 'menu' ? 'acessar o menu' : 'continuar'}`} />
        </Suspense>
      </>;
  }

  // Layout original para desktop
  return <>
      <footer className="bg-slate-800 text-white p-3 border-t border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
          <button onClick={handleCloseDayClick} className="border border-red-500 hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white px-3 py-2 rounded text-sm transition-colors duration-100 active:scale-95 flex items-center gap-2">
              <X className="h-4 w-4" />
              Fechar Dia
            </button>
            
            <button onClick={handleAddFundsClick} className="text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded text-sm transition-colors duration-100 active:scale-95 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Adicionar Saldo
            </button>
            
            <button onClick={handleExpenseClick} className="text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded text-sm transition-colors duration-100 active:scale-95 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Adicionar Despesa
            </button>
            
            <button onClick={handleCalculatorClick} className="text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded text-sm transition-colors duration-100 active:scale-95 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora
            </button>
            
            <button onClick={handleMenuClick} className="text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded text-sm transition-colors duration-100 active:scale-95 flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Menu
            </button>
            
            <div className="flex items-center space-x-3 text-sm border-l border-slate-600 pl-4">
              <div className="flex items-center gap-2">
                <div title={isServerOnline ? 'Servidor Online' : 'Servidor Offline'}>
                  <Server className={`h-4 w-4 ${isServerOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div title={isInternetOnline ? 'Internet Online' : 'Internet Offline'}>
                  <Wifi className={`h-4 w-4 ${isInternetOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">{formatDate(currentTime)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">{formatTime(currentTime)}</span>
              </div>
            </div>

            <BalanceProtection balance={currentBalance} />
          </div>
        </div>
      </footer>

      {/* Modals - wrapped in Suspense for lazy loading */}
      <Suspense fallback={null}>
        <CashRegisterClosingModal open={showClosingModal} onOpenChange={setShowClosingModal} onComplete={handleClosingComplete} />
        
        <CashRegisterAddFundsModal open={showAddFundsModal} onOpenChange={handleAddFundsModalClose} onComplete={handleAddFundsModalClose} />
        
        <ExpenseModal open={showExpenseModal} onOpenChange={handleExpenseModalClose} />

        <CalculatorModal open={showCalculatorModal} onOpenChange={setShowCalculatorModal} />

        <PasswordPromptModal open={showPasswordModal} onOpenChange={setShowPasswordModal} onAuthenticated={handlePasswordAuthenticated} title={pendingAction === 'expense' ? "Adicionar Despesa" : pendingAction === 'closeDay' ? "Fechar Dia" : pendingAction === 'addFunds' ? "Adicionar Saldo" : pendingAction === 'dashboard' ? "Acessar Dashboard" : pendingAction === 'menu' ? "Acessar Menu" : "Autenticação"} description={`Digite sua senha para ${pendingAction === 'expense' ? 'adicionar uma despesa' : pendingAction === 'closeDay' ? 'fechar o dia' : pendingAction === 'addFunds' ? 'adicionar saldo ao caixa' : pendingAction === 'dashboard' ? 'acessar o dashboard' : pendingAction === 'menu' ? 'acessar o menu' : 'continuar'}`} />
      </Suspense>
    </>;
};
export default Footer;