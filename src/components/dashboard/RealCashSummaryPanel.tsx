import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Package, TrendingUp, Info } from "lucide-react";

interface RealCashSummaryPanelProps {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  stockWeightKg: number;
  stockCostValue: number;
  stockProfitForecast: number;
  /** Despesas totais do período (mesma base usada na conta do caixa) */
  periodExpenses?: number;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtKg = (v: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v)} kg`;

export function RealCashSummaryPanel({
  totalSales,
  totalPurchases,
  totalExpenses,
  stockWeightKg,
  stockCostValue,
  stockProfitForecast,
  periodExpenses,
}: RealCashSummaryPanelProps) {
  const expectedCash = totalSales - totalPurchases - totalExpenses;
  const isCashPositive = expectedCash >= 0;
  const expensesForNet = periodExpenses ?? totalExpenses;
  const netProfitForecast = stockProfitForecast - expensesForNet;
  const isNetPositive = netProfitForecast >= 0;
  const stockGrowing = stockWeightKg > 0;

  const explanation = stockGrowing
    ? "O caixa pode estar negativo mesmo com margem positiva — você comprou mais do que vendeu, e a diferença está parada no estoque esperando ser vendida. Quando esse material sair, vira lucro no bolso."
    : "Você está vendendo mais rápido do que está comprando. Ótimo para o caixa de agora, mas atenção: o estoque está reduzindo.";

  return (
    <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-700/40 mb-6">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-emerald-400" />
          <h2 className="text-white font-bold text-lg">Resumo Real do Seu Negócio</h2>
          <span className="text-xs text-slate-400 ml-auto">No período selecionado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Caixa Real */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className={`h-4 w-4 ${isCashPositive ? "text-emerald-400" : "text-rose-400"}`} />
              <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
                Dinheiro que deveria estar em caixa
              </span>
            </div>
            <div className={`text-2xl font-bold ${isCashPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {fmtBRL(expectedCash)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-snug">
              Vendas ({fmtBRL(totalSales)}) − Compras ({fmtBRL(totalPurchases)}) − Despesas ({fmtBRL(totalExpenses)})
            </div>
          </div>

          {/* 2. Estoque Parado */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-amber-400" />
              <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
                Material parado no estoque
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-300">{fmtKg(stockWeightKg)}</div>
            <div className="text-sm text-slate-300 mt-1">
              ≈ <span className="font-semibold text-amber-200">{fmtBRL(stockCostValue)}</span> investidos
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-snug">
              Esse dinheiro saiu do caixa, mas virou estoque. Ainda não foi vendido.
            </div>
          </div>

          {/* 3. Lucro a realizar (bruto + líquido) */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
                Lucro que ainda vai realizar
              </span>
            </div>

            {/* Lucro bruto previsto */}
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wide">Bruto previsto</span>
              <span className={`text-lg font-semibold ${stockProfitForecast >= 0 ? "text-sky-300" : "text-rose-400"}`}>
                ≈ {fmtBRL(stockProfitForecast)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
              Estoque × preço de venda − custo médio de compra.
            </div>

            <div className="border-t border-slate-700/60 my-2.5" />

            {/* Despesas do período */}
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wide">(−) Despesas do período</span>
              <span className="text-sm font-medium text-rose-300">− {fmtBRL(expensesForNet)}</span>
            </div>

            <div className="border-t border-emerald-700/40 my-2.5" />

            {/* Líquido final no bolso */}
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-emerald-300 uppercase tracking-wide font-semibold">
                Líquido no bolso
              </span>
              <span className={`text-xl font-bold ${isNetPositive ? "text-emerald-400" : "text-rose-400"}`}>
                ≈ {fmtBRL(netProfitForecast)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 leading-snug mt-1">
              Estimativa do que sobra após pagar todas as despesas do período. Só vira caixa real quando vender o estoque.
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-slate-900/50 border border-slate-700/40 rounded-lg p-3">
          <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
