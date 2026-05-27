import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { statesByRegion, regionNames, allStates } from '@/data/recyclingStatesContent';
import { cn } from '@/lib/utils';

interface NationalCoverageSectionProps {
  compact?: boolean;
  className?: string;
}

// Strategic cities with highest search volume for internal linking
const strategicCities = [
  // São Paulo
  { name: 'Guarulhos', slug: 'guarulhos', stateSlug: 'sao-paulo' },
  { name: 'Campinas', slug: 'campinas', stateSlug: 'sao-paulo' },
  { name: 'São Bernardo do Campo', slug: 'sao-bernardo-do-campo', stateSlug: 'sao-paulo' },
  { name: 'Santo André', slug: 'santo-andre', stateSlug: 'sao-paulo' },
  { name: 'Osasco', slug: 'osasco', stateSlug: 'sao-paulo' },
  { name: 'Ribeirão Preto', slug: 'ribeirao-preto', stateSlug: 'sao-paulo' },
  // Rio de Janeiro
  { name: 'Niterói', slug: 'niteroi', stateSlug: 'rio-de-janeiro' },
  { name: 'São Gonçalo', slug: 'sao-goncalo', stateSlug: 'rio-de-janeiro' },
  { name: 'Duque de Caxias', slug: 'duque-de-caxias', stateSlug: 'rio-de-janeiro' },
  { name: 'Nova Iguaçu', slug: 'nova-iguacu', stateSlug: 'rio-de-janeiro' },
  // Minas Gerais
  { name: 'Belo Horizonte', slug: 'belo-horizonte', stateSlug: 'minas-gerais' },
  { name: 'Uberlândia', slug: 'uberlandia', stateSlug: 'minas-gerais' },
  { name: 'Contagem', slug: 'contagem', stateSlug: 'minas-gerais' },
  // Rio Grande do Sul
  { name: 'Porto Alegre', slug: 'porto-alegre', stateSlug: 'rio-grande-do-sul' },
  { name: 'Caxias do Sul', slug: 'caxias-do-sul', stateSlug: 'rio-grande-do-sul' },
  // Paraná
  { name: 'Curitiba', slug: 'curitiba', stateSlug: 'parana' },
  { name: 'Londrina', slug: 'londrina', stateSlug: 'parana' },
  // Bahia
  { name: 'Salvador', slug: 'salvador', stateSlug: 'bahia' },
  { name: 'Feira de Santana', slug: 'feira-de-santana', stateSlug: 'bahia' },
  // Pernambuco
  { name: 'Recife', slug: 'recife', stateSlug: 'pernambuco' },
  { name: 'Jaboatão dos Guararapes', slug: 'jaboatao-dos-guararapes', stateSlug: 'pernambuco' },
  // Ceará
  { name: 'Fortaleza', slug: 'fortaleza', stateSlug: 'ceara' },
  // Goiás
  { name: 'Goiânia', slug: 'goiania', stateSlug: 'goias' },
  // Amazonas
  { name: 'Manaus', slug: 'manaus', stateSlug: 'amazonas' },
];

export const NationalCoverageSection: React.FC<NationalCoverageSectionProps> = ({
  compact = false,
  className
}) => {
  // Order of regions for display
  const regionOrder = ['sudeste', 'sul', 'nordeste', 'centro-oeste', 'norte'] as const;

  // If no states data, return null
  if (!allStates?.length) {
    return null;
  }

  return (
    <section 
      className={cn(
        "py-12 md:py-16 bg-gradient-to-b from-slate-800/50 to-slate-900/50",
        className
      )}
      aria-labelledby="national-coverage-title"
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
            id="national-coverage-title"
            className="text-2xl md:text-3xl font-bold text-white mb-3"
          >
            📍 O XLATA atende todo o Brasil
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Clique no seu estado para conhecer o sistema ideal para depósitos de reciclagem, ferro velho e sucata.
          </p>
        </div>

        {/* States Grid by Region - Now with real links */}
        <div className="space-y-6">
          {regionOrder.map(region => {
            const states = statesByRegion[region];
            if (!states?.length) return null;

            return (
              <div key={region} className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-400 border-b border-slate-700 pb-2">
                  {regionNames[region]}
                </h3>
                
                <div className={cn(
                  "grid gap-2",
                  compact 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                )}>
                  {states.map(state => (
                    <Link
                      key={state.slug}
                      to={`/reciclagem/${state.slug}`}
                      className="group flex items-center justify-between bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-emerald-500/30 rounded-lg px-4 py-3 transition-all duration-200"
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

        {/* Strategic Cities Grid - Internal Linking */}
        <div className="mt-10 pt-8 border-t border-slate-700">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-emerald-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Principais Cidades
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">
              Cidades com maior demanda de reciclagem
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {strategicCities.map(city => (
              <Link
                key={`${city.stateSlug}-${city.slug}`}
                to={`/reciclagem/${city.stateSlug}/${city.slug}`}
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors py-1 text-center"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-slate-400 text-sm">
            O XLata funciona 100% online em qualquer lugar do Brasil!
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            Começar Teste Grátis
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NationalCoverageSection;
