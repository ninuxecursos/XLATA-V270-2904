import { Star, Quote, TrendingUp } from 'lucide-react';
import { LandingTestimonial } from '@/hooks/useLandingData';

interface LandingTestimonialsProps {
  items: LandingTestimonial[];
}

export function LandingTestimonials({ items }: LandingTestimonialsProps) {
  if (!items.length) return null;

  return (
    <section className="py-24 bg-slate-900 min-h-[500px]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">O que nossos clientes dizem</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Histórias reais de comerciantes que transformaram seu controle de pesagens.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((testimonial) => (
            <div key={testimonial.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
              {testimonial.revenue && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-medium">{testimonial.revenue}</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  {testimonial.photo_url ? (
                    <img src={testimonial.photo_url} alt={`Foto de ${testimonial.name}`} width={40} height={40} loading="lazy" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-emerald-400 font-bold text-sm">{testimonial.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                  <p className="text-slate-400 text-xs">{testimonial.company && `${testimonial.company} • `}{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
