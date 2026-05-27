import React, { useEffect, useMemo } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  Scale,
  Receipt,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Headphones
} from 'lucide-react';
import { useLocalSeoPage, useRelatedCities, incrementPageView } from '@/hooks/useLocalSeo';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

// Links to pillar pages for internal linking
const pillarLinks = [
  { to: '/sistema-para-ferro-velho', label: 'Sistema para Ferro Velho' },
  { to: '/solucoes/sistema-para-reciclagem', label: 'Sistema para Reciclagem' },
  { to: '/blog', label: 'Blog sobre Reciclagem' },
  { to: '/glossario', label: 'Glossário do Setor' },
];

const strategicArticles = [
  { slug: 'preco-sucata-hoje-tabela-atualizada', title: 'Preço da Sucata Hoje' },
  { slug: 'quanto-vale-kg-cobre-hoje', title: 'Quanto Vale o Kg do Cobre' },
  { slug: 'como-abrir-ferro-velho-lucrativo', title: 'Como Abrir Ferro Velho' },
  { slug: 'como-calcular-preco-sucata-corretamente', title: 'Como Calcular Preço da Sucata' },
  { slug: 'sistema-ferro-velho-guia-definitivo', title: 'Melhor Sistema para Ferro Velho' },
];

// Default features if page doesn't have custom ones
const defaultFeatures = [
  {
    icon: 'Scale',
    title: 'Pesagem Precisa',
    description: 'Calcule o valor exato de cada compra com precisão, evitando erros e discussões.'
  },
  {
    icon: 'Receipt',
    title: 'Comprovantes Profissionais',
    description: 'Imprima recibos completos que geram confiança nos seus fornecedores.'
  },
  {
    icon: 'BarChart3',
    title: 'Relatórios Completos',
    description: 'Acompanhe vendas, compras e lucro diário de forma simples e visual.'
  },
  {
    icon: 'Smartphone',
    title: '100% Online',
    description: 'Acesse de qualquer lugar, celular ou computador. Sem instalação.'
  },
  {
    icon: 'ShieldCheck',
    title: 'Dados Seguros',
    description: 'Suas informações protegidas com criptografia de nível bancário.'
  },
  {
    icon: 'Headphones',
    title: 'Suporte WhatsApp',
    description: 'Atendimento rápido e humanizado quando você precisar.'
  }
];

const iconMap: Record<string, React.ElementType> = {
  Scale,
  Receipt,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Headphones,
  CheckCircle2
};

const LocalPage: React.FC = () => {
  const { localSlug } = useParams<{ localSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the actual slug from the URL path
  const actualSlug = useMemo(() => {
    const path = location.pathname;
    // The full URL is like /sistema-para-ferro-velho-em-sao-paulo
    // We need the full path as the slug (without leading /)
    const slug = path.startsWith('/') ? path.substring(1) : path;
    console.log('[LocalPage] Extracted slug:', slug, 'from path:', path);
    return slug;
  }, [location.pathname]);
  
  const { data: page, isLoading, error } = useLocalSeoPage(actualSlug);
  const { data: relatedCities } = useRelatedCities(
    page?.state_id || '', 
    page?.city_id || undefined
  );

  // Increment view count on mount
  useEffect(() => {
    if (page?.id) {
      incrementPageView(page.id);
    }
  }, [page?.id]);

  // Redirect to 404 if page not found
  useEffect(() => {
    if (!isLoading && !page && !error) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, page, error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const features = page.features?.length ? page.features : defaultFeatures;
  const locationName = page.city?.name || page.state?.name || '';
  const stateName = page.state?.name || '';
  const isCity = page.page_type === 'city';

  // Generate Schema.org JSON-LD
  const schemaData = page.schema_data || {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `XLata - Sistema para Ferro Velho em ${locationName}`,
    description: page.seo_description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Teste grátis por 7 dias'
    },
    areaServed: {
      '@type': isCity ? 'City' : 'State',
      name: locationName,
      ...(isCity && page.state && {
        containedInPlace: {
          '@type': 'State',
          name: stateName
        }
      })
    },
    provider: {
      '@type': 'Organization',
      name: 'XLata',
      url: 'https://xlata.site',
      serviceArea: {
        '@type': 'Country',
        name: 'Brasil'
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{page.seo_title}</title>
        <meta name="description" content={page.seo_description} />
        <link rel="canonical" href={page.canonical_url} />
        
        {!page.allow_indexing && <meta name="robots" content="noindex, nofollow" />}
        {page.allow_indexing && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />}

        <meta property="og:title" content={page.seo_title} />
        <meta property="og:description" content={page.seo_description} />
        <meta property="og:url" content={page.canonical_url} />
        <meta property="og:type" content="website" />
        {page.og_image && <meta property="og:image" content={page.og_image} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.seo_title} />
        <meta name="twitter:description" content={page.seo_description} />
        
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-slate-900 text-white">
        {/* Breadcrumbs */}
        <nav className="bg-slate-800/50 border-b border-slate-700/50">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex items-center gap-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Início
                </Link>
              </li>
              <ChevronRight className="w-4 h-4" />
              {isCity && page.state && (
                <>
                  <li>
                    <Link 
                      to={`/sistema-para-ferro-velho-em-${page.state.slug}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {page.state.name}
                    </Link>
                  </li>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              <li className="text-white">{locationName}</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isCity ? `${locationName} - ${page.state?.abbreviation}` : `Estado de ${locationName}`}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                {page.headline}
              </h1>

              {page.subheadline && (
                <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  {page.subheadline}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8"
                  asChild
                >
                  <Link to="/register">
                    Começar Teste Grátis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800"
                  asChild
                >
                  <a 
                    href="https://wa.me/5511963512105" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div 
                className="prose prose-lg prose-invert prose-emerald max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content_html || '') }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-slate-800/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Por que usar o XLata em {locationName}?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon || 'CheckCircle2'] || CheckCircle2;
                return (
                  <div 
                    key={index}
                    className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {page.faq?.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                Perguntas Frequentes sobre {locationName}
              </h2>

              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-3">
                  {page.faq.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="bg-slate-800/60 rounded-lg border border-slate-700/50 px-4"
                    >
                      <AccordionTrigger className="text-left py-4 hover:no-underline">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-400 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}

        {/* Related Cities */}
        {relatedCities && relatedCities.length > 0 && (
          <section className="py-12 md:py-16 bg-slate-800/30">
            <div className="container mx-auto px-4">
              <h2 className="text-xl font-bold text-center mb-6">
                O XLata também atende em:
              </h2>

              <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                {relatedCities.map(city => (
                  <Link
                    key={city.id}
                    to={`/sistema-para-reciclagem-em-${city.slug}`}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-colors",
                      "bg-slate-800 border border-slate-700 hover:border-emerald-500/50",
                      "text-slate-300 hover:text-emerald-400"
                    )}
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Internal Links to Pillar Pages */}
        <section className="py-12 md:py-16 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-center mb-6">
              Saiba mais sobre nosso sistema
            </h2>

            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {pillarLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "bg-emerald-500/10 border border-emerald-500/30",
                    "text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Strategic Articles */}
            <div className="mt-10 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-center mb-4 text-slate-300">Artigos Recomendados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {strategicArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition-colors text-sm text-slate-300 hover:text-emerald-400"
                  >
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    {article.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-800 to-emerald-900/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Pronto para modernizar seu depósito em {locationName}?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Comece agora mesmo com 7 dias grátis. Sem cartão de crédito.
            </p>
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-10 py-6 text-lg"
              asChild
            >
              <Link to="/register">
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="py-8 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
              <p>© 2025 XLata. Todos os direitos reservados.</p>
              <div className="flex gap-6">
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Início
                </Link>
                <Link to="/planos" className="hover:text-emerald-400 transition-colors">
                  Planos
                </Link>
                <Link to="/termos-de-uso" className="hover:text-emerald-400 transition-colors">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LocalPage;
