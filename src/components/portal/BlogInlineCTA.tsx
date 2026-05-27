import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogInlineCTAProps {
  variant?: 'primary' | 'secondary' | 'minimal' | 'urgency' | 'pain';
}

const ctaVariants = {
  primary: {
    wrapper: 'my-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 text-center shadow-lg relative overflow-hidden not-prose',
    title: 'text-2xl font-bold text-white mb-3',
    desc: 'text-emerald-100 mb-6 max-w-lg mx-auto',
    btn: 'bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md px-8 py-3 text-base',
  },
  secondary: {
    wrapper: 'my-10 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center not-prose',
    title: 'text-xl font-bold text-emerald-900 mb-2',
    desc: 'text-emerald-700 mb-5 text-sm max-w-md mx-auto',
    btn: 'bg-emerald-600 text-white hover:bg-emerald-700 font-semibold px-6 py-2.5',
  },
  minimal: {
    wrapper: 'my-8 rounded-lg bg-slate-100 border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 not-prose',
    title: 'text-lg font-semibold text-slate-800',
    desc: 'hidden',
    btn: 'bg-emerald-600 text-white hover:bg-emerald-700 font-medium px-5 py-2 text-sm whitespace-nowrap',
  },
  urgency: {
    wrapper: 'my-10 rounded-xl border-2 border-amber-300 bg-amber-50 p-6 text-center not-prose',
    title: 'text-xl font-bold text-amber-900 mb-2',
    desc: 'text-amber-700 mb-5 text-sm max-w-md mx-auto',
    btn: 'bg-amber-600 text-white hover:bg-amber-700 font-semibold px-6 py-2.5',
  },
  pain: {
    wrapper: 'my-10 rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center not-prose',
    title: 'text-xl font-bold text-red-900 mb-2',
    desc: 'text-red-700 mb-5 text-sm max-w-md mx-auto',
    btn: 'bg-red-600 text-white hover:bg-red-700 font-semibold px-6 py-2.5',
  },
};

const ctaMessages = [
  {
    title: 'Pare de perder dinheiro no seu ferro velho',
    desc: 'Todo dia sem controle é prejuízo. O XLata automatiza caixa, compras, vendas por kg e relatórios. 130+ depósitos já usam.',
    button: 'Teste Grátis e Pare de Perder Dinheiro',
  },
  {
    title: 'Quanto você perde por mês sem um sistema?',
    desc: 'Erros de preço, anotações perdidas, vendas sem registro. Donos de ferro velho perdem em média R$1.500/mês com falta de controle.',
    button: 'Começar Agora — É Grátis por 7 Dias',
  },
  {
    title: 'Chega de caderninho e planilha',
    desc: 'O XLata foi feito para donos de ferro velho como você. Simples, rápido e funciona 100% no celular. Sem instalar nada.',
    button: 'Criar Conta Gratuita',
  },
  {
    title: 'Seu depósito merece um sistema profissional',
    desc: 'Cálculo automático de preço por kg, controle de estoque, caixa organizado e relatórios de lucro. Tudo em um único lugar.',
    button: 'Experimente o XLata Grátis',
  },
  {
    title: 'Todo dia sem o XLata é dinheiro jogado fora',
    desc: 'Enquanto você anota no caderno, seus concorrentes já automatizaram. Não fique para trás.',
    button: 'Testar Grátis Agora Mesmo',
  },
  {
    title: 'Veja como o XLata transforma seu ferro velho',
    desc: 'Controle total do seu negócio. Compras, vendas, estoque e financeiro — tudo automatizado e no seu celular.',
    button: 'Quero Testar Grátis',
  },
];

export const BlogInlineCTA = ({ variant = 'primary' }: BlogInlineCTAProps) => {
  const style = ctaVariants[variant];
  const msg = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];

  return (
    <div className={style.wrapper}>
      {variant === 'primary' && (
        <>
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-white/5 rounded-full" />
        </>
      )}
      <div className="relative z-10">
        <h3 className={style.title}>{msg.title}</h3>
        <p className={style.desc}>{msg.desc}</p>
        <Link to="/register">
          <Button className={style.btn}>
            {msg.button}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
