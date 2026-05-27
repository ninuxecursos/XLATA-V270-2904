import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { statesByRegion, regionNames } from '@/data/recyclingStatesContent';
import { cn } from '@/lib/utils';

interface RecyclingStatesGridProps {
  compact?: boolean;
  className?: string;
}

export const RecyclingStatesGrid: React.FC<RecyclingStatesGridProps> = ({
  compact = false,
  className
}) => {
  // Order of regions for display
  const regionOrder = ['sudeste', 'sul', 'nordeste', 'centro-oeste', 'norte'];

  return (
    <section 
      className={cn(
        "py-12 md:py-16 bg-gradient-to-b from-slate-800/50 to-slate-900/50",
        className
      )}
      aria-labelledby="recycling-states-title"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 text-emerald-400 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Cobertura Nacional
            </span>
          </div>
          <h2 
            id="recycling-states-title"
            className="text-2xl md:text-3xl font-bold text-white mb-3"
          >
            📍 Sistema de Reciclagem em Todo o Brasil
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Clique no seu estado para conhecer o XLata e ver como podemos ajudar seu depósito de reciclagem, ferro velho ou sucateiro.
          </p>
        </div>

        {/* States Grid by Region */}
        <div className="space-y-8">
          {regionOrder.map(region => {
            const states = statesByRegion[region as keyof typeof statesByRegion];
            if (!states?.length) return null;

            return (
              <div key={region}>
                <h3 className="text-lg font-semibold text-emerald-400 border-b border-slate-700 pb-2 mb-4">
                  {regionNames[region]}
                </h3>
                
                <div className={cn(
                  "grid gap-3",
                  compact 
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                )}>
                  {states.map(state => (
                    <Link
                      key={state.slug}
                      to={`/reciclagem/${state.slug}`}
                      className="group flex items-center justify-between bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-emerald-500/50 rounded-lg px-4 py-3 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs font-mono">
                          {state.abbreviation}
                        </span>
                        <span className="text-white group-hover:text-emerald-400 transition-colors font-medium">
                          {state.name}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-slate-400 text-sm mb-4">
            O XLata funciona 100% online em qualquer cidade do Brasil
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            Começar Teste Grátis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecyclingStatesGrid;
