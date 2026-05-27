import { Check, Smartphone, Wifi, Scale, Printer, BookOpen, Users, CreditCard } from 'lucide-react';
import { LandingRequirement } from '@/hooks/useLandingData';

interface LandingRequirementsProps {
  items: LandingRequirement[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Check, Smartphone, Wifi, Scale, Printer, BookOpen, Users, CreditCard,
};

export function LandingRequirements({ items }: LandingRequirementsProps) {
  if (!items.length) return null;

  return (
    <section id="recursos" className="py-24 bg-slate-800/50 min-h-[400px]" aria-labelledby="requirements-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 id="requirements-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Tudo que você precisa</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Ferramentas simples para gerenciar seu comércio sem complicação.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || Check;
            return (
              <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{item.text}</h3>
                <p className="text-slate-400 text-sm">Recurso incluso em todos os planos.</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
