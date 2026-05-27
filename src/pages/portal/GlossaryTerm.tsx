import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useGlossaryTerm, useGlossaryTerms } from '@/hooks/useContentPortal';
import { sanitizeJsonLd } from '@/utils/sanitization';

const GlossaryTerm = () => {
  const { slug } = useParams<{ slug: string }>();
  const { term, loading } = useGlossaryTerm(slug || '');
  const { terms: allTerms } = useGlossaryTerms();

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-full mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!term) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Termo não encontrado</h1>
          <p className="text-gray-400 mb-6">
            O termo que você procura não existe ou foi removido.
          </p>
          <Link to="/glossario">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Glossário
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  // Get related terms
  const relatedTerms = term.related_terms?.length
    ? allTerms.filter((t) => term.related_terms.includes(t.slug))
    : allTerms.filter((t) => t.id !== term.id).slice(0, 4);

  return (
    <PortalLayout>
      <SEOHead
        title={term?.seo_title || (term?.term ? `${term.term} - Glossário XLata` : 'Carregando termo...')}
        description={term?.seo_description || term?.short_definition || ''}
        customCanonical={term?.canonical_url || undefined}
        allowIndexing={term?.allow_indexing !== false}
      />
      <Helmet>
        <script type="application/ld+json">{sanitizeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          name: term.term,
          description: term.short_definition,
          url: term.canonical_url || `https://xlata.site/glossario/${term.slug}`,
          inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: 'Glossário de Reciclagem e Ferro Velho',
            url: 'https://xlata.site/glossario',
          },
        })}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Glossário', href: '/glossario' },
            { label: term.term },
          ]}
        />

        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {term.term}
            </h1>
            <p className="text-xl text-gray-400">
              {term.short_definition}
            </p>
          </header>

          {/* Long Definition */}
          {term.long_definition && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Definição Completa</h2>
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-gray-300">{term.long_definition}</p>
              </div>
            </section>
          )}

          {/* Examples */}
          {term.examples && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Exemplos Práticos</h2>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <p className="whitespace-pre-line text-gray-300">{term.examples}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Related Links */}
          {term.related_links && term.related_links.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Links Relacionados</h2>
              <div className="flex flex-wrap gap-2">
                {term.related_links.map((link: any, index: number) => (
                  <Link key={index} to={link.url}>
                    <Badge variant="outline" className="px-3 py-1 border-gray-700 text-gray-300 hover:bg-gray-800 cursor-pointer">
                      {link.label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Termos Relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedTerms.slice(0, 4).map((relatedTerm) => (
                  <Link key={relatedTerm.id} to={`/glossario/${relatedTerm.slug}`}>
                    <Card className="h-full bg-gray-800 border-gray-700 hover:shadow-md transition-shadow hover:border-emerald-500/50">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1 text-white">{relatedTerm.term}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {relatedTerm.short_definition}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <Card className="bg-emerald-500/10 border-emerald-500/30 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2 text-white">
                Aplique esse conhecimento no seu depósito
              </h3>
              <p className="text-gray-400 mb-4">
                O XLata ajuda você a organizar compras, vendas e controle de caixa usando os termos corretos do setor.
              </p>
              <Link to="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Começar Teste Grátis de 7 Dias
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-gray-700">
            <Link to="/glossario">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Glossário
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </PortalLayout>
  );
};

export default GlossaryTerm;
