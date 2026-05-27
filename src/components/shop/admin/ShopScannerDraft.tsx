import { useEffect, useState } from 'react';
import { Sparkles, Trash2, ArrowRight, Zap, Package, Clock, TrendingUp, Repeat, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ScanResult } from './ProductImageScanner';

export const DRAFT_KEY = 'shop_scanner_draft_v1';

export interface ScannerDraft extends ScanResult {
  savedAt: number;
}

interface Props {
  draft: ScannerDraft;
  onChange: (next: ScannerDraft) => void;
  onDiscard: () => void;
  onUse: (finalDraft: ScannerDraft) => void;
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export function ShopScannerDraft({ draft, onChange, onDiscard, onUse }: Props) {
  const saleType: 'normal' | 'interactive' = draft.sale_type || 'normal';
  const settings = draft.interactive_settings || {
    durationMinutes: 60,
    minimumIncrement: 5,
    autoRepost: true,
    repostDelayDays: 3,
    maxRepostCount: 5,
    startImmediately: true,
  };

  const setSaleType = (t: 'normal' | 'interactive') => {
    onChange({
      ...draft,
      sale_type: t,
      interactive_settings: t === 'interactive' ? settings : draft.interactive_settings,
    });
  };

  const updateSettings = (patch: Partial<typeof settings>) => {
    onChange({ ...draft, sale_type: 'interactive', interactive_settings: { ...settings, ...patch } });
  };

  const handleUse = () => {
    if (!draft.name?.trim()) {
      toast.error('Rascunho sem nome — escaneie novamente.');
      return;
    }
    if (!(draft.selected_price && draft.selected_price > 0)) {
      toast.error('Defina o preço final antes de cadastrar.');
      return;
    }
    onUse(draft);
  };

  const firstImg = draft.image_urls?.[0];
  const imageCount = draft.image_urls?.length || 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-white px-5 py-3 border-b border-emerald-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">Rascunho do Scanner</h3>
            <p className="text-xs text-gray-500">Escolha o tipo de venda e cadastre o produto.</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
          Salvo automaticamente
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {/* Product summary */}
        <div className="flex gap-4">
          {firstImg ? (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              <img src={firstImg} alt={draft.name} className="w-full h-full object-cover" />
              {imageCount > 1 && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  +{imageCount - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-semibold text-gray-900 text-base truncate">{draft.name || 'Sem nome'}</h4>
            <div className="flex flex-wrap gap-1.5">
              {draft.brand && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]">{draft.brand}</Badge>
              )}
              {draft.category && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]">{draft.category}</Badge>
              )}
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] capitalize">
                {draft.condition}
              </Badge>
            </div>
            <p className="text-lg font-bold text-emerald-700">{fmtBRL(draft.selected_price || 0)}</p>
          </div>
        </div>

        {/* Sale type toggle */}
        <div>
          <Label className="text-gray-700 text-sm mb-2 block">Tipo de venda</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSaleType('normal')}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                saleType === 'normal'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className={`w-4 h-4 ${saleType === 'normal' ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className={`font-medium text-sm ${saleType === 'normal' ? 'text-emerald-900' : 'text-gray-900'}`}>
                  Venda Normal
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Preço fixo na vitrine.</p>
            </button>
            <button
              type="button"
              onClick={() => setSaleType('interactive')}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                saleType === 'interactive'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${saleType === 'interactive' ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className={`font-medium text-sm ${saleType === 'interactive' ? 'text-emerald-900' : 'text-gray-900'}`}>
                  Interativa
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Oferta com lances e tempo.</p>
            </button>
          </div>
        </div>

        {/* Interactive settings */}
        {saleType === 'interactive' && (
          <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <p className="text-xs text-emerald-900 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Configurações da oferta interativa
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />Duração (min)
                </Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={settings.durationMinutes}
                  onChange={(e) => updateSettings({ durationMinutes: Math.max(5, Number(e.target.value) || 60) })}
                  className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />Incremento mínimo (R$)
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={settings.minimumIncrement}
                  onChange={(e) => updateSettings({ minimumIncrement: Math.max(1, Number(e.target.value) || 5) })}
                  className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
              <Label className="text-xs text-gray-700 flex items-center gap-1 cursor-pointer">
                <Play className="w-3 h-3" />Iniciar imediatamente após cadastro
              </Label>
              <Switch
                checked={settings.startImmediately}
                onCheckedChange={(v) => updateSettings({ startImmediately: v })}
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
              <Label className="text-xs text-gray-700 flex items-center gap-1 cursor-pointer">
                <Repeat className="w-3 h-3" />Reagendar automaticamente se não vender
              </Label>
              <Switch
                checked={settings.autoRepost}
                onCheckedChange={(v) => updateSettings({ autoRepost: v })}
              />
            </div>

            {settings.autoRepost && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-700">Intervalo (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.repostDelayDays}
                    onChange={(e) => updateSettings({ repostDelayDays: Math.max(1, Number(e.target.value) || 3) })}
                    className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Máx. de repostagens</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.maxRepostCount}
                    onChange={(e) => updateSettings({ maxRepostCount: Math.max(1, Number(e.target.value) || 5) })}
                    className="mt-1 h-9 bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            className="bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />Descartar rascunho
          </Button>
          <Button
            type="button"
            onClick={handleUse}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Usar para criar produto
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
