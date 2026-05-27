import React, { useState, useEffect } from 'react';
import { HelpCircle, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export type HelpModule = 
  | 'caixa' 
  | 'compra' 
  | 'venda' 
  | 'estoque' 
  | 'transacoes' 
  | 'despesas' 
  | 'assinatura' 
  | 'relatorios' 
  | 'geral';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
}

interface ContextualHelpButtonProps {
  module: HelpModule;
  className?: string;
}

const MODULE_LABELS: Record<HelpModule, string> = {
  caixa: 'Caixa',
  compra: 'Compras',
  venda: 'Vendas',
  estoque: 'Estoque',
  transacoes: 'Transações',
  despesas: 'Despesas',
  assinatura: 'Assinatura',
  relatorios: 'Relatórios',
  geral: 'Configurações',
};

const ContextualHelpButton: React.FC<ContextualHelpButtonProps> = ({ 
  module, 
  className = '' 
}) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && articles.length === 0) {
      loadArticles();
    }
  }, [isOpen]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select('id, title, slug, excerpt')
        .eq('module', module)
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading help articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 p-1.5 h-auto ${className}`}
          title="Ajuda sobre esta página"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 bg-slate-800 border-slate-600"
        align="end"
      >
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              Ajuda: {MODULE_LABELS[module]}
            </span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-400 text-xs mt-2">Carregando...</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/ajuda/${article.slug}`}
                  className="block p-3 hover:bg-slate-700/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-sm text-white font-medium line-clamp-1">
                    {article.title}
                  </p>
                  {article.excerpt && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {article.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-slate-400 text-sm">
                Nenhum artigo disponível para este módulo.
              </p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-700">
          <Link
            to={`/ajuda?module=${module}`}
            className="flex items-center justify-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 p-2 rounded hover:bg-slate-700/50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span>Ver todos os artigos</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContextualHelpButton;
