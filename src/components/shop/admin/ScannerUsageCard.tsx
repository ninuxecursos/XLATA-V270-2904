import { ScanLine, Coins, Image as ImageIcon, FileText, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ScannerUsageData, ScannerUsageEntry } from '@/hooks/useAIUsage';

interface Props {
  scanner: ScannerUsageData;
  isLoading: boolean;
}

const USD_TO_BRL = 5.5; // estimativa de exibição

const TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  product_scanner_content: { label: 'Análise de produto', icon: FileText },
  product_scanner_image_edit: { label: 'Edição de imagem', icon: ImageIcon },
  product_scanner_marketplace: { label: 'Otimização marketplace', icon: Sparkles },
};

function fmtUsd(v: number) {
  return `US$ ${v.toFixed(4)}`;
}
function fmtBrl(v: number) {
  return `R$ ${(v * USD_TO_BRL).toFixed(3)}`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function ScannerUsageCard({ scanner, isLoading }: Props) {
  const todayPct = Math.min((scanner.today.scans / scanner.dailyLimit) * 100, 100);
  const avgCost = scanner.month.scans > 0 ? scanner.month.costUsd / scanner.month.scans : 0;

  return (
    <div className="mt-6 bg-[hsl(var(--shop-bg-card))] rounded-xl border border-[hsl(var(--shop-border-default))] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ScanLine className="w-5 h-5 text-[hsl(var(--shop-primary))]" />
        <h2 className="text-lg font-semibold text-[hsl(var(--shop-text-primary))]">
          Scanner de Produto — Uso & Custos
        </h2>
      </div>

      {isLoading ? (
        <div className="text-sm text-[hsl(var(--shop-text-muted))]">Carregando...</div>
      ) : (
        <>
          {/* Resumo: hoje vs mês */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="Scans hoje" value={String(scanner.today.scans)} sub={`limite ${scanner.dailyLimit}/dia`} />
            <Stat
              label="Custo hoje"
              value={fmtUsd(scanner.today.costUsd)}
              sub={fmtBrl(scanner.today.costUsd)}
            />
            <Stat label="Scans no mês" value={String(scanner.month.scans)} />
            <Stat
              label="Custo no mês"
              value={fmtUsd(scanner.month.costUsd)}
              sub={fmtBrl(scanner.month.costUsd)}
            />
          </div>

          {/* Barra de uso diário */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-[hsl(var(--shop-text-secondary))]">Uso diário (Gemini Free Tier)</span>
              <span className="font-mono text-[hsl(var(--shop-text-primary))]">
                {scanner.today.scans} / {scanner.dailyLimit} RPD
              </span>
            </div>
            <Progress
              value={todayPct}
              className={`h-2 ${todayPct >= 100 ? '[&>div]:bg-red-500' : todayPct >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[hsl(var(--shop-primary))]'}`}
            />
          </div>

          {/* Tokens detalhe */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 text-xs">
            <Mini label="Tokens entrada (hoje)" value={scanner.today.inputTokens.toLocaleString('pt-BR')} />
            <Mini label="Tokens saída (hoje)" value={scanner.today.outputTokens.toLocaleString('pt-BR')} />
            <Mini label="Custo médio por scan" value={fmtUsd(avgCost)} />
          </div>

          {/* Lista das últimas chamadas */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[hsl(var(--shop-text-primary))]">
              <Coins className="w-4 h-4" />
              Últimas chamadas (mês)
            </div>
            {scanner.recent.length === 0 ? (
              <div className="text-sm text-[hsl(var(--shop-text-muted))] py-3">
                Nenhum scan registrado ainda este mês.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[hsl(var(--shop-border-default))]">
                <div className="grid grid-cols-12 px-3 py-2 bg-[hsl(var(--shop-bg-subtle))] text-[11px] uppercase tracking-wide text-[hsl(var(--shop-text-muted))] font-medium">
                  <div className="col-span-4">Operação</div>
                  <div className="col-span-3">Modelo</div>
                  <div className="col-span-2 text-right">Tokens</div>
                  <div className="col-span-2 text-right">Custo</div>
                  <div className="col-span-1 text-right">Quando</div>
                </div>
                <div className="divide-y divide-[hsl(var(--shop-border-default))] max-h-72 overflow-y-auto">
                  {scanner.recent.map((entry) => (
                    <Row key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-[hsl(var(--shop-text-muted))] leading-relaxed">
            * Custos calculados com base no preço público do modelo Google Gemini (entrada/saída por 1M tokens).
            Conversão para BRL apenas referencial (R$ {USD_TO_BRL.toFixed(2)}/USD). O Free Tier do Gemini permite até 500 chamadas/dia
            sem custo — acima disso o valor estimado se aplica.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--shop-border-default))] bg-[hsl(var(--shop-bg-subtle))] p-3">
      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--shop-text-muted))]">{label}</div>
      <div className="text-lg font-semibold text-[hsl(var(--shop-text-primary))] mt-1 font-mono">{value}</div>
      {sub && <div className="text-[11px] text-[hsl(var(--shop-text-muted))] mt-0.5">{sub}</div>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[hsl(var(--shop-border-default))] px-3 py-2">
      <span className="text-[hsl(var(--shop-text-muted))]">{label}</span>
      <span className="font-mono text-[hsl(var(--shop-text-primary))]">{value}</span>
    </div>
  );
}

function Row({ entry }: { entry: ScannerUsageEntry }) {
  const meta = TYPE_LABELS[entry.usage_type] || { label: entry.feature_label || entry.usage_type, icon: ScanLine };
  const Icon = meta.icon;
  const totalTokens = (entry.input_tokens || 0) + (entry.output_tokens || 0);
  return (
    <div className="grid grid-cols-12 items-center px-3 py-2 text-xs">
      <div className="col-span-4 flex items-center gap-2 text-[hsl(var(--shop-text-primary))]">
        <Icon className="w-3.5 h-3.5 text-[hsl(var(--shop-primary))]" />
        <span className="truncate">{entry.feature_label || meta.label}</span>
      </div>
      <div className="col-span-3 text-[hsl(var(--shop-text-secondary))] truncate">{entry.ai_model || '-'}</div>
      <div className="col-span-2 text-right font-mono text-[hsl(var(--shop-text-secondary))]">
        {totalTokens.toLocaleString('pt-BR')}
      </div>
      <div className="col-span-2 text-right font-mono text-[hsl(var(--shop-text-primary))]">
        {fmtUsd(Number(entry.estimated_cost_usd) || 0)}
      </div>
      <div className="col-span-1 text-right text-[hsl(var(--shop-text-muted))]">
        {fmtTime(entry.created_at)}
      </div>
    </div>
  );
}
