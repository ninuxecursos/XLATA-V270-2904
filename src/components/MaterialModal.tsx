import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Material } from "../types/pdv";
import NumberPad from "./NumberPad";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PasswordPromptModal from "./PasswordPromptModal";
import { useStockCalculation } from "@/hooks/useStockCalculation";
import { Package, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getCanonicalKey } from '@/utils/materialNormalization';
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";

interface MaterialModalProps {
  open: boolean;
  material: Material | null;
  peso: string | number;      // Peso já vem preenchido (não editável)
  total: number;
  onAdd: (taraValue?: number, adjustedPrice?: number, netWeight?: number) => void; // Add netWeight parameter
  onCancel: () => void;
  isSaleMode?: boolean;       // Add isSaleMode prop
  onRequestWeight?: () => void; // Handler to redirect to weight input (mobile)
  onNavigateToOrders?: () => void; // Handler to navigate to orders tab (mobile)
}

const MaterialModal: React.FC<MaterialModalProps> = ({
  open,
  material,
  peso,
  total,
  onAdd,
  onCancel,
  isSaleMode = false,
  onRequestWeight,
  onNavigateToOrders
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  const [showTaraPopover, setShowTaraPopover] = useState(false);
  const [showDiferencaPopover, setShowDiferencaPopover] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'tara' | 'diferenca' | 'addMoreConfirm'>('main');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [diferencaTipo, setDiferencaTipo] = useState<'acrescimo' | 'desconto'>('acrescimo');
  const [taraValue, setTaraValue] = useState<number>(0);
  const [tempTaraValue, setTempTaraValue] = useState<number>(0); // Temporary tara value
  const [tempDiferencaValue, setTempDiferencaValue] = useState<number>(0); // Temporary difference value
  const [appliedDiferencaValue, setAppliedDiferencaValue] = useState<number>(0); // Applied difference value
  const [appliedDiferencaTipo, setAppliedDiferencaTipo] = useState<'acrescimo' | 'desconto'>('acrescimo');
  const [diferencaInputValue, setDiferencaInputValue] = useState<string>('R$ 0,00'); // For currency input with mask
  const [pesoLiquido, setPesoLiquido] = useState<number>(0);
  const [valorFinal, setValorFinal] = useState<number>(0);
  const [stockWeight, setStockWeight] = useState<number>(0);
  const [hasStockApplied, setHasStockApplied] = useState<boolean>(false);
  const [currentPeso, setCurrentPeso] = useState<string | number>(peso);
  const [pendingAddData, setPendingAddData] = useState<{taraValue: number, valorFinal: number, pesoLiquido: number} | null>(null);
  // CORREÇÃO DE DUPLICAÇÃO: trava para impedir múltiplos disparos de onAdd
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { calculateMaterialStock, isLoadingStock, clearCache } = useStockCalculation();
  
  // Define isPesoValido early, before using it in useEffect
  const isPesoValido = pesoLiquido > 0;

  // Check if there's any applied difference (discount or increase)
  const hasAppliedDiferenca = appliedDiferencaValue > 0;

  // Format currency mask - fixed to handle proper Brazilian currency formatting
  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (!numericValue) return 'R$ 0,00';
    
    // Convert to number and format properly
    const number = parseInt(numericValue) / 100;
    return `R$ ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Parse currency value to number - fixed parsing logic
  const parseCurrencyToNumber = (currencyString: string): number => {
    // Remove R$, spaces, and convert comma to dot for parsing
    const numericValue = currencyString.replace(/[R$\s]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };

  // Reset states when modal opens or material changes
  useEffect(() => {
    if (open && material) {
      setTaraValue(0);
      setTempTaraValue(0);
      setTempDiferencaValue(0);
      setAppliedDiferencaValue(0);
      setDiferencaInputValue('R$ 0,00');
      setStockWeight(0);
      setHasStockApplied(false);
      setCurrentPeso(peso);
      setActiveSection('main');
      setPendingAddData(null);
      setIsSubmitting(false);
      const pesoNum = typeof peso === 'string' ? parseFloat(peso) : peso;
      setPesoLiquido(pesoNum);
      setValorFinal(material.price);
    }
  }, [open, material, peso]);

  // Handle add button click - for mobile/tablet, show confirmation first
  const handleAddClick = useCallback(() => {
    // CORREÇÃO DE DUPLICAÇÃO: bloqueia múltiplos disparos
    if (isSubmitting) return;
    if (isMobileOrTablet) {
      // Store the data for later and show confirmation
      setPendingAddData({ taraValue, valorFinal, pesoLiquido });
      setActiveSection('addMoreConfirm');
    } else {
      // Desktop: add directly
      setIsSubmitting(true);
      onAdd(taraValue, valorFinal, pesoLiquido);
    }
  }, [isMobileOrTablet, taraValue, valorFinal, pesoLiquido, onAdd, isSubmitting]);

  // Handle "Yes" - add more materials
  const handleAddMoreYes = useCallback(() => {
    if (isSubmitting) return;
    if (pendingAddData) {
      setIsSubmitting(true);
      onAdd(pendingAddData.taraValue, pendingAddData.valorFinal, pendingAddData.pesoLiquido);
    }
    setPendingAddData(null);
    setActiveSection('main');
    // Navigate to scale (handled by onCancel which closes modal and returns to scale view)
    onCancel();
    if (onRequestWeight) {
      onRequestWeight();
    }
  }, [pendingAddData, onAdd, onCancel, onRequestWeight, isSubmitting]);

  // Handle "No" - go to orders
  const handleAddMoreNo = useCallback(() => {
    if (isSubmitting) return;
    if (pendingAddData) {
      setIsSubmitting(true);
      onAdd(pendingAddData.taraValue, pendingAddData.valorFinal, pendingAddData.pesoLiquido);
    }
    setPendingAddData(null);
    setActiveSection('main');
    onCancel();
    if (onNavigateToOrders) {
      onNavigateToOrders();
    }
  }, [pendingAddData, onAdd, onCancel, onNavigateToOrders, isSubmitting]);

  // Handle Enter key press for the main modal's "Adicionar" button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter if main modal is open, sub-modals are closed,
      // and button is enabled (peso is valid)
      if (open && !showTaraPopover && !showDiferencaPopover && !showPasswordModal &&
          e.key === 'Enter' && isPesoValido && !isSubmitting) {
        e.preventDefault();
        setIsSubmitting(true);
        onAdd(taraValue, valorFinal, pesoLiquido);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, showTaraPopover, showDiferencaPopover, showPasswordModal, taraValue, valorFinal, onAdd, isPesoValido, pesoLiquido, isSubmitting]);

  // Handle Enter key press specifically for the Diferença popover
  useEffect(() => {
    const handleDiferencaKeyDown = (e: KeyboardEvent) => {
      if (showDiferencaPopover && e.key === 'Enter') {
        e.preventDefault();
        applyDiferencaValue();
      }
    };
    
    if (showDiferencaPopover) {
      window.addEventListener('keydown', handleDiferencaKeyDown);
      return () => {
        window.removeEventListener('keydown', handleDiferencaKeyDown);
      };
    }
  }, [showDiferencaPopover, tempDiferencaValue, diferencaTipo]);

  // Handle keyboard input for Tara (NumLock keyboard support)
  useEffect(() => {
    const handleTaraKeyDown = (e: KeyboardEvent) => {
      // Only handle when tara section/popover is active
      if (!showTaraPopover && activeSection !== 'tara') return;
      
      // Handle numeric keys (both main keyboard and NumLock)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setTempTaraValue(prevValue => {
          const currentStr = prevValue.toFixed(3).replace('.', '');
          const newStr = (currentStr + e.key).slice(-9);
          return parseInt(newStr) / 1000;
        });
      }
      // Handle backspace/delete
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setTempTaraValue(prevValue => {
          const currentStr = prevValue.toFixed(3).replace('.', '');
          const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
          return parseInt(newStr) / 1000;
        });
      }
      // Handle Enter to apply
      else if (e.key === 'Enter') {
        e.preventDefault();
        applyTaraValue();
      }
      // Handle Escape to cancel
      else if (e.key === 'Escape') {
        e.preventDefault();
        setTempTaraValue(0);
        if (isMobileOrTablet) {
          setActiveSection('main');
        } else {
          setShowTaraPopover(false);
        }
      }
    };
    
    if (showTaraPopover || activeSection === 'tara') {
      window.addEventListener('keydown', handleTaraKeyDown);
      return () => {
        window.removeEventListener('keydown', handleTaraKeyDown);
      };
    }
  }, [showTaraPopover, activeSection, tempTaraValue, isMobileOrTablet]);

  // Calculate adjusted price with applied difference
  const calculateAdjustedPrice = useCallback((basePrice: number, diff: number, type: 'acrescimo' | 'desconto') => {
    if (type === 'acrescimo') {
      return basePrice + diff;
    } else {
      return Math.max(0, basePrice - diff);
    }
  }, []);

  // Update peso liquido when tara changes
  useEffect(() => {
    if (open && material) {
      const pesoNum = typeof currentPeso === 'string' ? parseFloat(currentPeso) : currentPeso;
      const newPesoLiquido = Math.max(0, pesoNum - taraValue);
      setPesoLiquido(newPesoLiquido);
    }
  }, [taraValue, currentPeso, open, material]);

  // Update final price when applied difference changes
  useEffect(() => {
    if (open && material) {
      // Use sale price or regular price based on mode
      const currentPrice = isSaleMode ? material.salePrice : material.price;
      const adjustedPrice = calculateAdjustedPrice(currentPrice, appliedDiferencaValue, appliedDiferencaTipo);
      setValorFinal(adjustedPrice);
    }
  }, [appliedDiferencaValue, appliedDiferencaTipo, material, open, calculateAdjustedPrice, isSaleMode]);

  // Handle stock button click
  const handleStockClick = () => {
    setShowPasswordModal(true);
  };

  // Handle password authentication for stock
  const handlePasswordAuthenticated = async () => {
    if (!material) return;

    try {
      // Force fresh data from database by skipping cache
      const stock = await calculateMaterialStock(material.name, true);
      
      if (stock <= 0) {
        toast({
          title: "Sem estoque",
          description: `Não há estoque disponível para ${material.name}`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      setStockWeight(stock);
      setCurrentPeso(stock);
      setHasStockApplied(true);
      
      toast({
        title: "Estoque carregado",
        description: `Estoque atual: ${formatPeso(stock)}`,
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Error applying stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estoque",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Cancel stock application
  const cancelStock = () => {
    setStockWeight(0);
    setHasStockApplied(false);
    setCurrentPeso(peso);
  };

  // Use sale price or regular price based on mode
  const currentPrice = material ? (isSaleMode ? material.salePrice : material.price) : 0;
  
  // Calculate total based on peso liquido and adjusted price
  const calculatedTotal = valorFinal * pesoLiquido;

  if (!material) return null;
  
  // Formatar o peso para exibição no formato brasileiro com X,XXX/kg
  const formatPeso = (value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace('.', ',') + "/kg";
  };

  // Handle NumberPad input for tara without applying immediately
  const handleTaraInput = (value: number) => {
    setTempTaraValue(value);
  };

  // Apply tara value when confirmed
  const applyTaraValue = () => {
    setTaraValue(tempTaraValue);
    setShowTaraPopover(false);
    setActiveSection('main');
  };

  // Handle currency input for difference value with mask - fixed to properly handle input
  const handleDiferencaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow numbers to be typed
    const numericInput = inputValue.replace(/\D/g, '');
    
    // Format with currency mask
    const formattedValue = formatCurrency(numericInput);
    setDiferencaInputValue(formattedValue);
    
    // Update temporary difference value
    const numericValue = parseInt(numericInput) / 100 || 0;
    setTempDiferencaValue(numericValue);
  };

  // Apply difference value when confirmed
  const applyDiferencaValue = () => {
    setAppliedDiferencaValue(tempDiferencaValue);
    setAppliedDiferencaTipo(diferencaTipo);
    setShowDiferencaPopover(false);
    setActiveSection('main');
    setDiferencaInputValue('R$ 0,00'); // Reset input after applying
  };

  // Cancel/Remove applied difference
  const cancelDiferenca = () => {
    setAppliedDiferencaValue(0);
    setAppliedDiferencaTipo('acrescimo');
    setDiferencaInputValue('R$ 0,00');
    setTempDiferencaValue(0);
  };

  // Handle popover close and reset input
  const handleDiferencaPopoverClose = (open: boolean) => {
    setShowDiferencaPopover(open);
    if (!open) {
      setDiferencaInputValue('R$ 0,00');
      setTempDiferencaValue(0);
    }
  };

  // Handle tara popover close
  const handleTaraPopoverClose = (open: boolean) => {
    setShowTaraPopover(open);
    if (!open) {
      setTempTaraValue(0);
    }
  };

  // Inline Tara Content for Mobile/Tablet
  const TaraInlineContent = () => (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <h3 className="text-lg font-bold">Peso da Tara</h3>
        <p className="text-xs text-gray-300 mt-0.5">
          Informe o peso da tara para descontar do peso total
        </p>
      </div>
      
      <div className="w-full border border-gray-700 rounded-lg overflow-hidden h-[420px]">
        <NumberPad 
          onSubmit={(value) => handleTaraInput(value)} 
          onClear={() => setTempTaraValue(0)}
          value={tempTaraValue}
        />
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="secondary" 
          onClick={() => {
            setActiveSection('main');
            setTempTaraValue(0);
          }} 
          className="flex-1 h-11 text-base"
        >
          Cancelar
        </Button>
        <Button 
          onClick={applyTaraValue}
          className="flex-1 h-11 text-base bg-pdv-green hover:bg-pdv-green/90"
        >
          Aplicar Tara
        </Button>
      </div>
    </div>
  );

  // Inline Diferença Content for Mobile/Tablet
  const DiferencaInlineContent = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Diferença no Valor</h3>
      </div>
      
      <div className="flex gap-3">
        <Button 
          className={`flex-1 h-12 text-base ${diferencaTipo === 'acrescimo' ? 'bg-pdv-green hover:bg-pdv-green/90' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setDiferencaTipo('acrescimo')}
        >
          Acréscimo
        </Button>
        <Button 
          className={`flex-1 h-12 text-base ${diferencaTipo === 'desconto' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setDiferencaTipo('desconto')}
        >
          Desconto
        </Button>
      </div>
      
      <div>
        <Input
          type="text"
          value={diferencaInputValue}
          onChange={handleDiferencaInputChange}
          placeholder="R$ 0,00"
          className="w-full h-16 bg-gray-900 border border-gray-700 rounded-lg text-center font-bold text-3xl"
          style={{ color: diferencaTipo === 'acrescimo' ? '#10B981' : '#EF4444' }}
          autoFocus
        />
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="secondary" 
          onClick={() => {
            setActiveSection('main');
            setDiferencaInputValue('R$ 0,00');
            setTempDiferencaValue(0);
          }} 
          className="flex-1 h-12 text-base"
        >
          Cancelar
        </Button>
        <Button 
          onClick={applyDiferencaValue}
          className="flex-1 h-12 text-base bg-pdv-green hover:bg-pdv-green/90"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  // Add More Confirmation Content - Mobile/Tablet only
  const AddMoreConfirmContent = () => (
    <div className="flex flex-col gap-6 py-4">
      <div className="text-center">
        <span className="inline-block text-5xl animate-scale-in mb-2">✅</span>
        <h3 className="text-2xl font-bold text-white mb-2">Material Adicionado!</h3>
        <p className="text-lg text-gray-300">
          Deseja adicionar mais materiais?
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button 
          className="w-full h-16 text-xl bg-pdv-green hover:bg-pdv-green/90 font-semibold"
          onClick={handleAddMoreYes}
        >
          Sim, adicionar mais
        </Button>
        <Button 
          className="w-full h-16 text-xl bg-yellow-600 hover:bg-yellow-700 font-semibold"
          onClick={handleAddMoreNo}
        >
          Não, ir para Pedidos
        </Button>
      </div>
    </div>
  );

  // Tara Popover Component - Desktop only
  const TaraPopoverContent = () => (
    <div className="bg-pdv-dark text-white rounded-lg shadow-lg px-6 py-4 w-[400px]">
      <h3 className="font-bold text-center text-xl mb-1">Peso da Tara</h3>
      <p className="text-white text-center text-sm mb-4">
        Informe o peso da tara para descontar do peso total
      </p>
      
      <div className="w-full border border-gray-800 rounded-md overflow-hidden h-[350px]">
        <NumberPad 
          onSubmit={(value) => handleTaraInput(value)} 
          onClear={() => setTempTaraValue(0)}
          value={tempTaraValue}
        />
      </div>
      
      <div className="flex justify-center gap-2 mt-4">
        <Button 
          variant="secondary" 
          onClick={() => setShowTaraPopover(false)} 
          className="px-6 py-3"
        >
          Cancelar
        </Button>
        <Button 
          onClick={applyTaraValue}
          className="bg-pdv-green hover:bg-pdv-green/90 px-6 py-3"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  // Diferença Popover Component - Desktop only
  const DiferencaPopoverContent = () => (
    <div className="bg-pdv-dark text-white rounded-lg shadow-lg px-6 py-4 w-[400px]">
      <h3 className="font-bold text-center text-xl mb-4">Diferença no Valor</h3>
      
      <div className="flex justify-center gap-2 border-t border-b border-gray-700 py-4 my-4">
        <Button 
          className={`${diferencaTipo === 'acrescimo' ? 'bg-pdv-green' : 'bg-gray-700'} px-6 py-3`}
          onClick={() => setDiferencaTipo('acrescimo')}
        >
          Acréscimo
        </Button>
        <Button 
          className={`${diferencaTipo === 'desconto' ? 'bg-red-600' : 'bg-gray-700'} px-6 py-3`}
          onClick={() => setDiferencaTipo('desconto')}
        >
          Desconto
        </Button>
      </div>
      
      <div className="mb-4">
        <Input
          type="text"
          value={diferencaInputValue}
          onChange={handleDiferencaInputChange}
          placeholder="R$ 0,00"
          className="bg-gray-900 border border-gray-700 rounded text-center font-bold text-2xl"
          style={{ color: diferencaTipo === 'acrescimo' ? '#10B981' : '#EF4444', fontSize: '1.69em' }}
          autoFocus
        />
      </div>
      
      <div className="flex justify-center gap-2 mt-4">
        <Button 
          variant="secondary" 
          onClick={() => setShowDiferencaPopover(false)} 
          className="px-6 py-3"
        >
          Cancelar
        </Button>
        <Button 
          onClick={applyDiferencaValue}
          className="bg-pdv-green hover:bg-pdv-green/90 px-6 py-3"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onCancel}>
        <DialogContent className="bg-pdv-dark text-white rounded-lg shadow-lg px-8 py-6 animate-scale-in">
          {/* Mobile/Tablet: Show inline sections based on activeSection */}
          {isMobileOrTablet && activeSection === 'tara' ? (
            <TaraInlineContent />
          ) : isMobileOrTablet && activeSection === 'diferenca' ? (
            <DiferencaInlineContent />
          ) : isMobileOrTablet && activeSection === 'addMoreConfirm' ? (
            <AddMoreConfirmContent />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">{material.name}</DialogTitle>
                <DialogDescription className="text-white text-base flex justify-between items-center">
                  <span className="font-semibold">Valor por kg:</span>
                  <span className="text-pdv-green font-semibold text-xl ml-2">R$ {currentPrice.toFixed(2)}</span>
                </DialogDescription>
              </DialogHeader>
              
              {/* Show weight info and totals only when peso is valid */}
              {isPesoValido ? (
                <>
                  <div className="flex flex-col gap-2 my-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">
                        {hasStockApplied ? "Peso do estoque:" : "Peso bruto:"}
                      </span>
                      <span className={`font-bold text-xl ${hasStockApplied ? 'text-orange-400' : 'text-white'}`}>
                        {formatPeso(currentPeso)}
                      </span>
                    </div>
                    {taraValue > 0 && (
                      <div className="flex justify-between items-center text-yellow-400">
                        <span className="text-lg font-medium">Tara:</span>
                        <span className="font-bold text-xl">-{formatPeso(taraValue)}</span>
                      </div>
                    )}
                    {taraValue > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Peso líquido:</span>
                        <span className="font-bold text-xl text-white">{formatPeso(pesoLiquido)}</span>
                      </div>
                    )}
                    {appliedDiferencaValue > 0 && (
                      <div className={`flex justify-between items-center ${appliedDiferencaTipo === 'acrescimo' ? 'text-pdv-green' : 'text-red-400'}`}>
                        <span className="text-lg font-medium">{appliedDiferencaTipo === 'acrescimo' ? 'Acréscimo:' : 'Desconto:'}</span>
                        <span className="font-bold text-xl">
                          {appliedDiferencaTipo === 'acrescimo' ? '+' : '-'}R$ {appliedDiferencaValue.toFixed(2)}/kg
                        </span>
                      </div>
                    )}
                    {appliedDiferencaValue > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Valor ajustado:</span>
                        <span className="font-bold text-xl text-white">R$ {valorFinal.toFixed(2)}/kg</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-pdv-green bg-opacity-80 rounded p-4 my-3">
                    <span className="text-lg font-medium">
                      {isSaleMode ? "TOTAL A RECEBER" : "TOTAL A PAGAR"}
                    </span>
                    <span className="text-3xl font-bold text-white drop-shadow">R$ {calculatedTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                /* Message when no weight is entered */
                <div className="flex flex-col items-center justify-center py-6 my-3 text-center">
                  <Calculator className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-300 text-lg font-medium mb-1">
                    Nenhum peso inserido
                  </p>
                  <p className="text-gray-400 text-sm">
                    Para adicionar este material, insira o peso na balança
                  </p>
                </div>
              )}
              
              {/* Botões de ação para Tara, Diferença e Estoque - only show when peso is valid */}
              {isPesoValido && (
                <div className={`${isSaleMode ? 'grid grid-cols-3' : 'grid grid-cols-2'} gap-2 my-3`}>
                  {/* Tara Button - Mobile uses inline, Desktop uses Popover */}
                  {isMobileOrTablet ? (
                    <Button 
                      data-tutorial="tara-button"
                      className="bg-transparent border border-[#ffda21] text-white hover:bg-[#ffda21]/10"
                      onClick={() => setActiveSection('tara')}
                    >
                      Add Tara
                    </Button>
                  ) : (
                    <Popover open={showTaraPopover} onOpenChange={handleTaraPopoverClose}>
                      <PopoverTrigger asChild>
                        <Button 
                          data-tutorial="tara-button"
                          className="bg-transparent border border-[#ffda21] text-white hover:bg-[#ffda21]/10"
                        >
                          Add Tara
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto border-gray-700 bg-transparent shadow-xl" align="center">
                        <TaraPopoverContent />
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  {/* Diferença Button - Mobile uses inline, Desktop uses Popover */}
                  {hasAppliedDiferenca ? (
                    <Button 
                      className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={cancelDiferenca}
                    >
                      Cancelar Diferença
                    </Button>
                  ) : isMobileOrTablet ? (
                    <Button 
                      data-tutorial="discount-button"
                      className="bg-transparent border border-[#ffffff] text-white hover:bg-white/10"
                      onClick={() => setActiveSection('diferenca')}
                    >
                      Add Diferença
                    </Button>
                  ) : (
                    <Popover open={showDiferencaPopover} onOpenChange={handleDiferencaPopoverClose}>
                      <PopoverTrigger asChild>
                        <Button 
                          data-tutorial="discount-button"
                          className="bg-transparent border border-[#ffffff] text-white hover:bg-white/10"
                        >
                          Add Diferença
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto border-gray-700 bg-transparent shadow-xl" align="center">
                        <DiferencaPopoverContent />
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Botão Add Estoque só aparece em modo venda */}
                  {isSaleMode && (
                    <>
                      {hasStockApplied ? (
                        <Button 
                          className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10"
                          onClick={cancelStock}
                        >
                          Cancelar Estoque
                        </Button>
                      ) : (
                        <Button 
                          className="bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-500/10 flex items-center gap-2"
                          onClick={handleStockClick}
                          disabled={isLoadingStock}
                        >
                          <Package className="h-4 w-4" />
                          {isLoadingStock ? "Carregando..." : "Add Estoque"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <DialogFooter className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:gap-2">
                <Button variant="secondary" onClick={onCancel} type="button" className="w-full sm:w-auto h-12 rounded-xl">
                  Cancelar
                </Button>
                {/* Show "Inserir Peso" button on mobile/tablet when peso is zero */}
                {isMobileOrTablet && !isPesoValido ? (
                  <Button 
                    onClick={() => {
                      onCancel();
                      if (onRequestWeight) {
                        onRequestWeight();
                      }
                    }}
                    className="w-full sm:w-auto h-12 rounded-xl bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Inserir Peso
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddClick} 
                    disabled={!isPesoValido || isSubmitting}
                    className={`w-full sm:w-auto rounded-xl ${isPesoValido && !isSubmitting ? 'bg-pdv-green hover:bg-pdv-green/90' : 'bg-gray-500'} ${isMobileOrTablet ? 'h-14' : 'h-12'}`}
                  >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Verificar Estoque"
        description="Digite sua senha para acessar o estoque do material"
      />
    </>
  );
};

export default MaterialModal;
