import { Scale, Calculator, Printer, Play } from 'lucide-react';
import { LandingHowItWorks as HowItWorksType } from '@/hooks/useLandingData';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ScaleKeypadMockup } from './mockups/ScaleKeypadMockup';
import { CalculationMockup } from './mockups/CalculationMockup';
import { ReceiptMockup } from './mockups/ReceiptMockup';

interface LandingHowItWorksProps {
  items: HowItWorksType[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale, Calculator, Printer,
};

const stepMockups = [ScaleKeypadMockup, CalculationMockup, ReceiptMockup];

export function LandingHowItWorks({ items }: LandingHowItWorksProps) {
  if (!items.length) return null;

  return (
    <section id="como-funciona" className="py-20 md:py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-[500px]" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-4 border border-emerald-500/20">
              Simples e Rápido
            </span>
            <h2 id="how-it-works-heading" className="text-3xl md:text-5xl font-bold text-white mb-4">
              Como funciona
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-6 md:mb-10">
              Em {items.length} passos simples, organize todo o seu depósito.
            </p>
          </motion.div>
        </header>

        <div className="max-w-5xl mx-auto space-y-10 md:space-y-14">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Scale;
            const MockupComponent = stepMockups[index];
            const isReversed = index % 2 === 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
              >
                {/* Green card container behind everything */}
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 md:p-8">
                  <div className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-3 md:gap-6`}>
                    {/* Text side */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <span className="text-emerald-400 font-bold text-xs">{index + 1}</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1.5">{item.title}</h3>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto md:mx-0">
                        {item.description}
                      </p>
                      {item.video_url && (
                        <Button variant="ghost" size="sm" className="mt-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs">
                          <Play className="w-3 h-3 mr-1.5" /> Ver vídeo
                        </Button>
                      )}
                    </div>

                    {/* Mockup side */}
                    {MockupComponent && (
                      <div className="flex-1 flex justify-center">
                        <MockupComponent />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
