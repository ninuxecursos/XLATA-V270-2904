import { Clock, Calculator, UserX, FileX, XCircle, AlertTriangle } from 'lucide-react';
import { LandingProblem } from '@/hooks/useLandingData';

interface LandingProblemsProps { items: LandingProblem[]; }
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Clock, Calculator, UserX, FileX, XCircle, AlertTriangle };

export function LandingProblems({ items }: LandingProblemsProps) {
  if (!items.length) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-red-950/20 min-h-[500px]" aria-labelledby="problems-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">Atenção: Isso está custando dinheiro</span>
          </div>
          <h2 id="problems-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Onde Você Perde Dinheiro Hoje</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">Problemas comuns que parecem pequenos, mas somam no final do mês</p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || XCircle;
            return (
              <div key={item.id} className="bg-slate-800/50 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all duration-300">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
