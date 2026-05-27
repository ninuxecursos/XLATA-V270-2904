import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, ArrowLeft, Lock, AlertTriangle, Check, Scale, DollarSign, User, Search, Phone, Printer, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { usePasswordAuth } from '@/hooks/usePasswordAuth';
import { toast } from '@/hooks/use-toast';
import { DepotClient } from '@/hooks/useDepotClients';
import { Customer, Order } from '@/types/pdv';

interface MaterialStock {
  materialName: string;
  currentStock: number;
  salePrice: number;
}

export interface SaleResult {
  order: Order;
  customer: Customer;
}

interface SellAllStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialStock | null;
  clients: DepotClient[];
  onConfirm: (clientName: string, clientId?: string) => Promise<SaleResult>;
  onPrintReceipt: (data: SaleResult) => void;
  onDeleteMaterial?: (materialName: string) => Promise<void>;
}

const SellAllStockModal = ({ open, onOpenChange, material, clients, onConfirm, onPrintReceipt, onDeleteMaterial }: SellAllStockModalProps) => {
  const [step, setStep] = useState<'confirm' | 'auth' | 'success'>('confirm');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const { authenticateUser, isAuthenticating } = usePasswordAuth();

  // Client selection state
  const [clientType, setClientType] = useState<'manual' | 'registered'>('manual');
  const [clientName, setClientName] = useState('');
  const [selectedClient, setSelectedClient] = useState<DepotClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // Sale result for printing
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  
  // Delete material option
  const [deleteMaterialAfterSale, setDeleteMaterialAfterSale] = useState(false);

  // Filter active clients based on search
  const filteredClients = useMemo(() => {
    const activeClients = clients.filter(c => c.is_active);
    if (!clientSearch.trim()) return activeClients;
    const query = clientSearch.toLowerCase();
    return activeClients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.whatsapp.includes(clientSearch)
    );
  }, [clients, clientSearch]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setPassword('');
      setError('');
      setIsProcessing(false);
      setClientType('manual');
      setClientName('');
      setSelectedClient(null);
      setClientSearch('');
      setSaleResult(null);
      setDeleteMaterialAfterSale(false);
    }
  }, [open]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const totalValue = material ? material.currentStock * material.salePrice : 0;

  const handleContinueToAuth = () => {
    setStep('auth');
  };

  const handleBackToConfirm = () => {
    setStep('confirm');
    setPassword('');
    setError('');
  };

  const handleConfirmSale = async () => {
    if (!password.trim()) {
      setError('Digite sua senha para confirmar');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const authenticated = await authenticateUser(password);
      
      if (!authenticated) {
        setError('Senha incorreta');
        setIsProcessing(false);
        return;
      }

      // Determine final client name and ID
      const finalClientName = clientType === 'registered' && selectedClient
        ? selectedClient.name
        : clientName.trim();
      const finalClientId = clientType === 'registered' && selectedClient
        ? selectedClient.id
        : undefined;

      // Execute the sale with client info and get result
      const result = await onConfirm(finalClientName, finalClientId);
      setSaleResult(result);
      
      toast({
        title: "Venda realizada com sucesso!",
        description: `${formatWeight(material?.currentStock || 0)} de ${material?.materialName} vendido por ${formatCurrency(totalValue)}`,
        duration: 4000,
      });

      // Show success step with print option
      setStep('success');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Erro ao processar venda",
        description: "Ocorreu um erro ao processar a venda. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'auth' && password.trim()) {
      handleConfirmSale();
    }
  };

  const handleSelectClient = (client: DepotClient) => {
    setSelectedClient(client);
    setClientSearch('');
  };

  const handlePrintAndClose = async () => {
    if (saleResult) {
      onPrintReceipt(saleResult);
    }
    // Delete material if option selected
    if (deleteMaterialAfterSale && material && onDeleteMaterial) {
      await onDeleteMaterial(material.materialName);
    }
    onOpenChange(false);
  };

  const handleCloseWithoutPrint = async () => {
    // Delete material if option selected
    if (deleteMaterialAfterSale && material && onDeleteMaterial) {
      await onDeleteMaterial(material.materialName);
    }
    onOpenChange(false);
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md overflow-hidden">
        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                Vender Estoque
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Confirme a venda de todo o estoque de <span className="text-white font-medium">{material.materialName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 overflow-hidden">
              {/* Summary Card */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Scale className="h-4 w-4" />
                    <span>Quantidade</span>
                  </div>
                  <span className="text-white font-bold">{formatWeight(material.currentStock)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span>Preço/kg</span>
                  </div>
                  <span className="text-white font-medium">{formatCurrency(material.salePrice)}</span>
                </div>

                <div className="border-t border-slate-600 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-emerald-400">Valor Total</span>
                    <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">
                  Esta ação irá registrar uma venda e zerar o estoque deste material. O valor será adicionado ao caixa.
                </p>
              </div>

              {/* Client Identification Section */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 overflow-hidden">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Identificação do Cliente (opcional)</span>
                </div>

                <RadioGroup
                  value={clientType}
                  onValueChange={(v) => setClientType(v as 'manual' | 'registered')}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" className="border-slate-500" />
                      <Label htmlFor="manual" className="text-slate-300 cursor-pointer">
                        Cliente avulso
                      </Label>
                    </div>
                    
                    {clientType === 'manual' && (
                      <div className="ml-6 w-full pr-2">
                        <Input
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Nome do cliente (ex: João da Esquina)"
                          className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400 w-full"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="registered" id="registered" className="border-slate-500" />
                      <Label htmlFor="registered" className="text-slate-300 cursor-pointer">
                        Cliente cadastrado
                      </Label>
                    </div>

                    {clientType === 'registered' && (
                      <div className="ml-6 space-y-2 w-full pr-2">
                        {selectedClient ? (
                          <div className="flex items-center justify-between bg-slate-600 rounded-lg p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{selectedClient.name}</p>
                              <p className="text-sm text-slate-400 flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{selectedClient.whatsapp}</span>
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedClient(null)}
                              className="text-slate-400 hover:text-white flex-shrink-0"
                            >
                              Trocar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="relative w-full">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                placeholder="Buscar cliente..."
                                className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400 pl-9 w-full"
                              />
                            </div>
                            <ScrollArea className="h-32 rounded-md border border-slate-600">
                              {filteredClients.length > 0 ? (
                                <div className="p-1">
                                  {filteredClients.map(client => (
                                    <button
                                      key={client.id}
                                      onClick={() => handleSelectClient(client)}
                                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-600 transition-colors"
                                    >
                                      <p className="text-white text-sm truncate">{client.name}</p>
                                      <p className="text-xs text-slate-400">{client.whatsapp}</p>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                  {clients.filter(c => c.is_active).length === 0
                                    ? 'Nenhum cliente cadastrado'
                                    : 'Nenhum cliente encontrado'}
                                </div>
                              )}
                            </ScrollArea>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </RadioGroup>

                <p className="text-xs text-slate-500">
                  Se não informar, será registrado como "Venda Direta (Estoque)"
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleContinueToAuth}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : step === 'auth' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-amber-500" />
                Autenticação
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Digite sua senha para confirmar a venda de {formatCurrency(totalValue)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua senha"
                  className="bg-slate-700 border-slate-600 text-white"
                  autoFocus
                  disabled={isProcessing || isAuthenticating}
                />
                {error && (
                  <p className="text-sm text-rose-400">{error}</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBackToConfirm}
                disabled={isProcessing || isAuthenticating}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={handleConfirmSale}
                disabled={isProcessing || isAuthenticating || !password.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing || isAuthenticating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Confirmar Venda
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Success step with print option
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Check className="h-5 w-5 text-emerald-500" />
                Venda Concluída!
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Deseja imprimir o comprovante desta venda?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 text-center">
                <p className="text-emerald-400 font-bold text-lg">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-sm text-slate-400">
                  {formatWeight(material.currentStock)} de {material.materialName}
                </p>
              </div>
              
              {/* Option to delete material after selling all stock */}
              {onDeleteMaterial && (
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Checkbox
                    id="deleteMaterial"
                    checked={deleteMaterialAfterSale}
                    onCheckedChange={(checked) => setDeleteMaterialAfterSale(checked === true)}
                    className="border-slate-500 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor="deleteMaterial" className="text-slate-300 cursor-pointer flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-rose-400" />
                      Excluir material do cadastro
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Remove o material da lista de materiais
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseWithoutPrint}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                Não, fechar
              </Button>
              <Button
                onClick={handlePrintAndClose}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="h-4 w-4 mr-1" />
                Imprimir Comprovante
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SellAllStockModal;
