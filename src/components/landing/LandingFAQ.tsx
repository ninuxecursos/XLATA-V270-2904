import { LandingFAQ as FAQType } from '@/hooks/useLandingData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LandingFAQProps { items: FAQType[]; }

export function LandingFAQ({ items }: LandingFAQProps) {
  if (!items.length) return null;

  return (
    <section className="py-24 bg-slate-800/50 min-h-[400px]" aria-labelledby="faq-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Perguntas Frequentes</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">As dúvidas mais comuns de quem está conhecendo o XLata</p>
        </header>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="bg-slate-800 border border-slate-700 rounded-xl px-6 data-[state=open]:border-emerald-500/50">
                <AccordionTrigger className="text-left text-white hover:text-emerald-400 hover:no-underline py-5 font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-slate-400 pb-5">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500">
            Ainda tem dúvidas?{' '}
            <a href="https://wa.me/5511963512105" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-medium">Fale com a gente no WhatsApp</a>
          </p>
        </div>
      </div>
    </section>
  );
}
