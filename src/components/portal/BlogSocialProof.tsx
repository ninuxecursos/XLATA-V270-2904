import { Users, Star, Smartphone, Shield } from 'lucide-react';

export const BlogSocialProof = () => {
  return (
    <div className="my-10 rounded-xl bg-slate-900 text-white p-6 md:p-8 not-prose">
      <h3 className="text-xl font-bold mb-6 text-center">Por que 130+ depósitos já usam o XLata?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3">
          <Users className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-400">130+</div>
          <div className="text-xs text-slate-400 mt-1">Depósitos ativos</div>
        </div>
        <div className="text-center p-3">
          <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-amber-400">4.9/5</div>
          <div className="text-xs text-slate-400 mt-1">Avaliação média</div>
        </div>
        <div className="text-center p-3">
          <Smartphone className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-400">100%</div>
          <div className="text-xs text-slate-400 mt-1">Funciona no celular</div>
        </div>
        <div className="text-center p-3">
          <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-400">7 dias</div>
          <div className="text-xs text-slate-400 mt-1">Teste grátis</div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-700 pt-5">
        <blockquote className="text-center italic text-slate-300 text-sm">
          "Antes eu perdia quase R$2.000 por mês com erro de preço. Depois do XLata, meu lucro aumentou 35%."
          <span className="block text-emerald-400 mt-2 font-medium not-italic">— Carlos, dono de ferro velho em SP</span>
        </blockquote>
      </div>
    </div>
  );
};
