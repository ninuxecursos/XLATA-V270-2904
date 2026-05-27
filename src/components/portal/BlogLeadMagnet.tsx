import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BlogLeadMagnet = () => {
  return (
    <div className="my-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 md:p-8 relative overflow-hidden not-prose">
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Material Gratuito</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
          Guia Completo: Como Abrir e Lucrar com um Ferro Velho
        </h3>
        <p className="text-slate-300 mb-6 text-sm leading-relaxed max-w-lg">
          Tudo que você precisa saber para abrir, organizar e lucrar com seu depósito de reciclagem.
          Documentação, fornecedores, precificação, erros comuns e mais.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/register">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 shadow-lg">
              <Download className="h-4 w-4 mr-2" />
              Cadastre-se e Acesse Grátis
            </Button>
          </Link>
          <Link to="/blog/como-abrir-ferro-velho">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              Ler o Guia Online
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
