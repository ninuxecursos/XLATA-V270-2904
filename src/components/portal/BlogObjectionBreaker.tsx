import { CheckCircle } from 'lucide-react';

const objections = [
  {
    question: '"É difícil de usar?"',
    answer: 'Não. O XLata foi feito para donos de ferro velho, não para programadores. Interface simples, sem complicação. Se você sabe usar WhatsApp, sabe usar o XLata.',
  },
  {
    question: '"Funciona no celular?"',
    answer: 'Sim. 100% pelo navegador do celular. Sem instalar nada. Use de qualquer lugar — no balcão, no pátio ou em casa.',
  },
  {
    question: '"Vale a pena para depósito pequeno?"',
    answer: 'Quanto menor o depósito, mais cada erro pesa. O XLata evita perdas que você nem percebe. Depósitos de todos os tamanhos já economizam com ele.',
  },
  {
    question: '"E se eu não gostar?"',
    answer: 'Teste grátis por 7 dias. Sem cartão de crédito. Se não servir, é só parar de usar. Sem burocracia.',
  },
];

export const BlogObjectionBreaker = () => {
  return (
    <div className="my-10 rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm not-prose">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Dúvidas comuns sobre o XLata</h3>
      <div className="space-y-5">
        {objections.map((obj, i) => (
          <div key={i} className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-slate-800 mb-1">{obj.question}</p>
              <p className="text-slate-600 text-sm leading-relaxed">{obj.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
