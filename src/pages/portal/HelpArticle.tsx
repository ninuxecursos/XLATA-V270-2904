import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useHelpArticle, useHelpArticles } from '@/hooks/useContentPortal';

const HelpArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { article, loading } = useHelpArticle(slug || '');
  const { articles: relatedArticles } = useHelpArticles({ 
    module: article?.module,
    enabled: !!article?.module 
  });
  const [htmlContent, setHtmlContent] = useState('');
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  // Scroll to top when navigating between articles
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (article?.content_md) {
      const html = marked(article.content_md) as string;
      setHtmlContent(DOMPurify.sanitize(html));
    } else if (article?.content_html) {
      setHtmlContent(DOMPurify.sanitize(article.content_html));
    }
  }, [article]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!article) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Artigo não encontrado</h1>
          <p className="text-gray-400 mb-6">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link to="/ajuda">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Central de Ajuda
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const moduleNames: Record<string, string> = {
    caixa: 'Controle de Caixa',
    despesas: 'Despesas',
    compra: 'PDV de Compra',
    venda: 'Venda por KG',
    estoque: 'Estoque e Projeção',
    relatorios: 'Relatórios',
    transacoes: 'Transações',
    assinatura: 'Conta e Assinatura',
    geral: 'Geral',
  };

  return (
    <PortalLayout>
      <SEOHead
        title={article?.seo_title || (article?.title ? `${article.title} - Ajuda XLata` : 'Carregando artigo...')}
        description={article?.seo_description || article?.excerpt || ''}
        ogImage={article?.og_image || undefined}
      />

      <article className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Ajuda', href: '/ajuda' },
            ...(article.category ? [{ label: article.category.name, href: `/ajuda/categoria/${article.category.slug}` }] : []),
            { label: article.title },
          ]}
        />

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.module && (
                <Badge variant="outline" className="border-gray-700 text-gray-300">
                  {moduleNames[article.module] || article.module}
                </Badge>
              )}
              {article.category && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                  {article.category.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.reading_time_minutes} min de leitura
              </span>
              <span>
                Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </header>

          {/* Content */}
          <div
            className="prose-help-article mb-12"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Feedback */}
          <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <p className="font-medium mb-4 text-white">Este artigo foi útil?</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant={feedback === 'yes' ? 'default' : 'outline'}
                  onClick={() => setFeedback('yes')}
                  className={feedback === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-700 text-gray-300 hover:bg-gray-700'}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Sim
                </Button>
                <Button
                  variant={feedback === 'no' ? 'default' : 'outline'}
                  onClick={() => setFeedback('no')}
                  className={feedback === 'no' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-700 text-gray-300 hover:bg-gray-700'}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Não
                </Button>
              </div>
              {feedback && (
                <p className="text-sm text-gray-400 mt-4">
                  Obrigado pelo feedback!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles.length > 1 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">Artigos Relacionados</h2>
              <div className="grid gap-4">
                {relatedArticles
                  .filter((a) => a.id !== article.id)
                  .slice(0, 3)
                  .map((relatedArticle) => (
                    <Link key={relatedArticle.id} to={`/ajuda/artigo/${relatedArticle.slug}`}>
                      <Card className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow hover:border-emerald-500/50">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-white">{relatedArticle.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                            {relatedArticle.excerpt}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <Card className="mt-8 bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2 text-white">
                Precisa de ajuda personalizada?
              </h3>
              <p className="text-gray-400 mb-4">
                Entre em contato conosco pelo WhatsApp para suporte direto.
              </p>
              <a
                href="https://wa.me/5511963512105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Falar no WhatsApp
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-700">
            <Link to="/ajuda">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Central de Ajuda
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </PortalLayout>
  );
};

export default HelpArticle;
