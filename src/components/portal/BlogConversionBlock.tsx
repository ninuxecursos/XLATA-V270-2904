import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, TrendingDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogConversionBlockProps {
  variant?: 'warning' | 'comparison' | 'benefit';
}

const blocks = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    title: '⚠️ Você está perdendo dinheiro no seu ferro velho sem perceber.',
    desc: 'Cada erro no preço, cada anotação perdida no caderno, cada venda sem controle — é dinheiro que escapa do seu bolso todo dia.',
    solution: 'O XLata calcula automaticamente o valor da sucata, controla estoque e evita erros que custam caro.',
    btn: 'Parar de Perder Dinheiro Agora',
  },
  comparison: {
    icon: TrendingDown,
    iconClass: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    title: 'Caderno vs. Planilha vs. XLata',
    desc: 'Quem usa caderno erra 3x mais no preço. Quem usa planilha perde tempo e ainda erra. 130+ depósitos já migraram para o XLata e reduziram perdas em até 40%.',
    solution: 'Você pode continuar fazendo isso manualmente… ou automatizar tudo com um sistema feito para ferro velho.',
    btn: 'Migrar para o XLata — É Grátis para Testar',
  },
  benefit: {
    icon: Shield,
    iconClass: 'text-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
    title: 'Como o XLata resolve isso para você',
    desc: 'Cálculo automático de preço por kg • Controle de estoque em tempo real • Caixa organizado • Relatórios de lucro • Funciona no celular',
    solution: 'Tudo isso sem precisar instalar nada. É só abrir no navegador e começar.',
    btn: 'Criar Conta Gratuita',
  },
};

export const BlogConversionBlock = ({ variant = 'warning' }: BlogConversionBlockProps) => {
  const block = blocks[variant];
  const Icon = block.icon;

  return (
    <div className={`my-10 rounded-xl border-2 ${block.bg} p-6 md:p-8`}>
      <div className="flex items-start gap-3 mb-4">
        <Icon className={`h-6 w-6 ${block.iconClass} flex-shrink-0 mt-0.5`} />
        <h3 className="text-xl font-bold text-slate-900">{block.title}</h3>
      </div>
      <p className="text-slate-700 mb-4 leading-relaxed">{block.desc}</p>
      <p className="text-slate-800 font-medium mb-6 italic">{block.solution}</p>
      <Link to="/register">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-base shadow-md">
          {block.btn}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
};
