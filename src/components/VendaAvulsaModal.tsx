import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackagePlus, Link, Unlink, Delete, AlertTriangle } from 'lucide-react';

import { formatters } from '@/utils/formatters';
import { Material } from '@/types/pdv';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VendaAvulsaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, quantity: number, price: number, costPrice: number, linkedMaterialId?: string, linkedStockQuantity?: number, linkedMaterialName?: string) => void;
  materials?: Material[];
  stockMap?: Record<string, number>;
}

type UnidadeTipo = 'kg' | 'un';

const formatWeightInput = (value: string): string => {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) {
    const padded = digits.padStart(3, '0');
    return '0,' + padded;
  }
  const intPart = digits.substring(0, digits.length - 3).replace(/^0+/, '') || '0';
  const decPart = digits.substring(digits.length - 3);
  return intPart + ',' + decPart;
};

const formatCurrencyInput = (value: string): string => {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return '0,' + digits.padStart(2, '0');
  }
  const intPart = digits.substring(0, digits.length - 2).replace(/^0+/, '') || '0';
  const decPart = digits.substring(digits.length - 2);
  return intPart + ',' + decPart;
};

// Numpad component for quantity input
function QuantityNumpad({ 
  value, 
  onChange, 
  isKg 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  isKg: boolean;
}) {
  const displayValue = value || (isKg ? '0,000' : '0');

  const handleDigit = useCallback((digit: string) => {
    if (isKg) {
      const currentDigits = value.replace(/[^0-9]/g, '');
      const newDigits = currentDigits + digit;
      onChange(formatWeightInput(newDigits));
    } else {
      const currentDigits = value.replace(/[^0-9]/g, '');
      onChange(currentDigits + digit);
    }
  }, [value, onChange, isKg]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleBackspace = useCallback(() => {
    if (isKg) {
      const currentDigits = value.replace(/[^0-9]/g, '');
      if (currentDigits.length <= 1) {
        onChange('');
        return;
      }
      const newDigits = currentDigits.slice(0, -1);
      onChange(formatWeightInput(newDigits));
    } else {
      const currentDigits = value.replace(/[^0-9]/g, '');
      onChange(currentDigits.slice(0, -1));
    }
  }, [value, onChange, isKg]);

  const keys = ['1','2','3','4','5','6','7','8','9'];

  return (
    <div className="space-y-2">
      {/* Display */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-center">
        <span className="text-2xl font-bold font-mono text-emerald-400 tracking-wider">
          {displayValue}
        </span>
      </div>
      {/* Keys grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {keys.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => handleDigit(k)}
            className="h-12 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-lg transition-colors border border-slate-700"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-12 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-lg transition-colors border border-slate-700"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-12 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-lg transition-colors border border-slate-700 col-span-1 flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="h-12 rounded-lg bg-red-900/60 hover:bg-red-800/70 active:bg-red-700/80 text-red-300 font-bold text-sm transition-colors border border-red-800/50"
        >
          C
        </button>
      </div>
      {/* Zerar */}
      <button
        type="button"
        onClick={handleClear}
        className="w-full h-10 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 font-semibold text-xs transition-colors border border-amber-600/30"
      >
        ZERAR {isKg ? 'BALANÇA' : 'QUANTIDADE'}
      </button>
    </div>
  );
}

const VendaAvulsaModal: React.FC<VendaAvulsaModalProps> = ({ open, onOpenChange, onConfirm, materials = [], stockMap = {} }) => {
  const [nome, setNome] = useState('');
  const [quantidadeStr, setQuantidadeStr] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [custoStr, setCustoStr] = useState('');
  const [unidade, setUnidade] = useState<UnidadeTipo>('kg');
  const [linkedMaterialId, setLinkedMaterialId] = useState<string | null>(null);
  const [linkedMaterialName, setLinkedMaterialName] = useState<string>('');
  const [stockWeightStr, setStockWeightStr] = useState('');

  const quantidade = useMemo(() => {
    const parsed = parseFloat(quantidadeStr.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [quantidadeStr]);

  const stockWeight = useMemo(() => {
    const parsed = parseFloat(stockWeightStr.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [stockWeightStr]);

  const valor = useMemo(() => {
    const cleaned = valorStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, [valorStr]);

  const custo = useMemo(() => {
    const cleaned = custoStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, [custoStr]);

  const total = useMemo(() => quantidade * valor, [quantidade, valor]);

  const materialsWithStock = useMemo(() => {
    return materials.filter(mat => (stockMap[mat.id] || 0) > 0);
  }, [materials, stockMap]);

  const estoqueDisponivel = useMemo(() => {
    if (!linkedMaterialId) return null;
    return stockMap[linkedMaterialId] || 0;
  }, [linkedMaterialId, stockMap]);

  // Reset numpad/stock weight when unit changes (display must reflect new unit format)
  useEffect(() => {
    setQuantidadeStr('');
    setStockWeightStr('');
  }, [unidade]);

  // Stock subtraction rules:
  // - linked + kg  -> subtract = quantidade (kg vendido)
  // - linked + un  -> subtract = stockWeight (kg manual, informado pelo usuário)
  // - sem vínculo -> 0 (apenas alerta visual)
  const effectiveStockWeight = useMemo(() => {
    if (!linkedMaterialId) return 0;
    if (unidade === 'kg') return quantidade;
    return stockWeight;
  }, [linkedMaterialId, unidade, quantidade, stockWeight]);

  const exceedsStock = linkedMaterialId !== null && estoqueDisponivel !== null && effectiveStockWeight > estoqueDisponivel;

  const needsStockWeightInput = linkedMaterialId !== null && unidade === 'un';

  const isValid =
    nome.trim().length > 0 &&
    quantidade > 0 &&
    valor > 0 &&
    !exceedsStock &&
    (!needsStockWeightInput || stockWeight > 0);


  const handleSelectMaterial = (materialId: string) => {
    if (materialId === '__none__') {
      setLinkedMaterialId(null);
      setLinkedMaterialName('');
      setStockWeightStr('');
      return;
    }
    const mat = materials.find(m => m.id === materialId);
    if (mat) {
      setLinkedMaterialId(mat.id);
      setLinkedMaterialName(mat.name);
      setStockWeightStr('');
    }
  };

  const handleUnlink = () => {
    setLinkedMaterialId(null);
    setLinkedMaterialName('');
    setStockWeightStr('');
  };

  const resetForm = () => {
    setNome('');
    setQuantidadeStr('');
    setValorStr('');
    setCustoStr('');
    setUnidade('kg');
    setLinkedMaterialId(null);
    setLinkedMaterialName('');
    setStockWeightStr('');
  };

  const handleConfirm = () => {
    if (!isValid) return;
    const costPrice = custo > 0 ? custo : valor;
    onConfirm(
      nome.trim(),
      quantidade,
      valor,
      costPrice,
      linkedMaterialId || undefined,
      linkedMaterialId ? effectiveStockWeight : undefined,
      linkedMaterialId ? linkedMaterialName : undefined
    );
    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="default" className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <PackagePlus className="w-5 h-5 text-amber-500" />
            Venda Avulsa
          </DialogTitle>
          <DialogDescription>
            Insira manualmente um produto para adicionar ao pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-3">
          {/* Col 1: Produto */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avulso-nome" className="text-sm font-medium">
                Nome do Produto
              </Label>
              <Input
                id="avulso-nome"
                variant="native"
                placeholder="Ex: Cobre, Alumínio..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
                className="h-12 text-base"
              />
            </div>

            {/* Unidade selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Valor</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUnidade('kg')}
                  className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    unidade === 'kg'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Por kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnidade('un')}
                  className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    unidade === 'un'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Unitário
                </button>
              </div>
            </div>

            {/* Vincular ao estoque */}
            {materials.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-amber-500" />
                  Vincular estoque
                  <span className="text-muted-foreground/60 text-xs">(opcional)</span>
                </Label>
                {linkedMaterialId ? (
                  <div className="space-y-2">
                    <div className="h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-sm text-amber-400 font-medium truncate">{linkedMaterialName}</span>
                      {estoqueDisponivel !== null && (
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {formatters.weight(estoqueDisponivel)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlink}
                      className="w-full h-9 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Desvincular
                    </button>
                  </div>
                ) : (
                  <Select onValueChange={handleSelectMaterial}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Nenhum (avulso)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum (avulso)</SelectItem>
                      {materialsWithStock.map(mat => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.name} ({formatters.weight(stockMap[mat.id] || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Col 2: Numpad Quantidade */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {unidade === 'kg' ? 'Quantidade (kg)' : 'Quantidade (un)'}
            </Label>
            <QuantityNumpad 
              value={quantidadeStr} 
              onChange={setQuantidadeStr} 
              isKg={unidade === 'kg'} 
            />

            {/* Subtração de estoque */}
            {linkedMaterialId ? (
              <div className="pt-2">
                {unidade === 'kg' ? (
                  // Por kg: automático = quantidade vendida
                  <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-emerald-300/80 font-medium">
                        Subtrair do estoque ({linkedMaterialName})
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-300">
                        {formatters.weight(effectiveStockWeight)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400/60 mt-1">
                      Calculado automaticamente pela quantidade vendida.
                    </p>
                    {exceedsStock && estoqueDisponivel !== null && (
                      <p className="text-xs text-destructive mt-1.5">
                        Excede estoque disponível ({formatters.weight(estoqueDisponivel)})
                      </p>
                    )}
                  </div>
                ) : (
                  // Unitário: usuário informa o peso em kg que cada unidade representa no estoque
                  <div className="rounded-lg border border-amber-600/40 bg-amber-900/15 px-3 py-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="avulso-stock-kg" className="text-xs text-amber-300 font-medium">
                        Peso a subtrair do estoque (kg)
                      </Label>
                      {estoqueDisponivel !== null && (
                        <span className="text-[11px] text-muted-foreground">
                          Disp.: {formatters.weight(estoqueDisponivel)}
                        </span>
                      )}
                    </div>
                    <Input
                      id="avulso-stock-kg"
                      variant="native"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,000"
                      value={stockWeightStr}
                      onChange={(e) => setStockWeightStr(formatWeightInput(e.target.value))}
                      className="h-11 text-lg font-bold font-mono text-center text-amber-300"
                    />
                    <p className="text-[11px] text-amber-400/70 leading-snug">
                      Ex.: 1 barra de alumínio pesa 0,5 kg → digite 0,500 para subtrair de {linkedMaterialName}.
                    </p>
                    {exceedsStock && estoqueDisponivel !== null && (
                      <p className="text-xs text-destructive">
                        Excede estoque disponível ({formatters.weight(estoqueDisponivel)})
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              quantidade > 0 && (
                <div className="pt-2">
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/90 leading-snug">
                      Nenhum material vinculado. Esta venda <strong>não subtrairá nada do estoque</strong> — o material vendido continuará constando como disponível. Vincule um material acima se quiser que o estoque seja atualizado.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>


          {/* Col 3: Valores */}
          <div className="space-y-4 flex flex-col items-center">
            {/* Venda */}
            <div className="space-y-2 w-full">
              <Label htmlFor="avulso-valor" className="text-sm font-medium text-center block">
                {unidade === 'kg' ? 'Venda / kg (R$)' : 'Venda / un (R$)'}
              </Label>
              <Input
                id="avulso-valor"
                variant="native"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valorStr}
                onChange={(e) => {
                  setValorStr(formatCurrencyInput(e.target.value));
                }}
                className="h-14 text-xl font-bold font-mono text-center text-emerald-400"
              />
            </div>

            {/* Custo */}
            <div className="space-y-2 w-full">
              <Label htmlFor="avulso-custo" className="text-sm font-medium text-center block">
                {unidade === 'kg' ? 'Custo / kg (R$)' : 'Custo / un (R$)'}
                <span className="text-muted-foreground/60 text-xs ml-1">(opcional)</span>
              </Label>
              <Input
                id="avulso-custo"
                variant="native"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={custoStr}
                onChange={(e) => {
                  setCustoStr(formatCurrencyInput(e.target.value));
                }}
                className="h-14 text-xl font-bold font-mono text-center text-amber-400"
              />
            </div>

            {/* Total calculado */}
            {total > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 w-full flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatters.currency(total)}
                </span>
              </div>
            )}
          </div>

          {/* Botões - full width */}
          <div className="flex gap-3 pt-2 sm:col-span-3">
            <Button
              variant="native-outline"
              size="native-md"
              className="flex-1 h-12"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="native"
              size="native-md"
              className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base"
              onClick={handleConfirm}
              disabled={!isValid}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendaAvulsaModal;
