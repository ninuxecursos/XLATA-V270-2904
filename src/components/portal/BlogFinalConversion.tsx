import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BlogFinalConversion = () => {
  return (
    <div className="my-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 md:p-10 text-center relative overflow-hidden shadow-xl shadow-emerald-200 not-prose">
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full" />
      <div className="absolute right-20 bottom-10 w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-6">
          <Zap className="h-4 w-4 text-yellow-300" />
          <span className="text-white text-sm font-medium">Todo dia sem controle é dinheiro perdido</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Pare de perder dinheiro. Comece a lucrar de verdade.
        </h3>
        <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
          O XLata é o sistema que faltava no seu ferro velho. Caixa, estoque, compras, vendas — tudo automatizado.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8 text-left max-w-xl mx-auto">
          {[
            'Cálculo automático por kg',
            'Controle de caixa completo',
            'Relatórios de lucro real',
            'Funciona 100% no celular',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
              <CheckCircle className="h-4 w-4 text-yellow-300 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <Link to="/register">
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold shadow-lg px-10 py-4 text-lg">
            Teste Grátis por 7 Dias
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
        <p className="text-emerald-200 text-xs mt-4">Sem cartão de crédito. Cancele quando quiser.</p>
      </div>
    </div>
  );
};
