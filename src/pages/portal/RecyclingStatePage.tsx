import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Scale, 
  Wallet, 
  BarChart3, 
  Users, 
  Smartphone, 
  Shield,
  ChevronRight,
  Home,
  Recycle,
  CheckCircle2,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { recyclingStatesContent, statesByRegion, regionNames } from '@/data/recyclingStatesContent';
import { citiesByState } from '@/data/recyclingCitiesContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { sanitizeJsonLd } from '@/utils/sanitization';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Scale,
  Wallet,
  BarChart3,
  Users,
  Smartphone,
  Shield
};

const RecyclingStatePage = () => {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  
  // Get state content
  const stateContent = stateSlug ? recyclingStatesContent[stateSlug] : null;
  
  // If state not found, redirect to landing
  if (!stateContent) {
    return <Navigate to="/landing" replace />;
  }

  // Schema.org data for SEO
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `XLata - Sistema para Reciclagem em ${stateContent.name}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: stateContent.seoDescription,
    url: `https://xlata.site/reciclagem/${stateContent.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'XLata',
      url: 'https://xlata.site'
    },
    areaServed: {
      '@type': 'State',
      name: stateContent.name,
      containedInPlace: {
        '@type': 'Country',
        name: 'Brasil'
      }
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Teste grátis disponível'
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://xlata.site'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Reciclagem',
        item: 'https://xlata.site/landing'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateContent.name,
        item: `https://xlata.site/reciclagem/${stateContent.slug}`
      }
    ]
  };

  // FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: stateContent.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>{stateContent.seoTitle}</title>
        <meta name="description" content={stateContent.seoDescription} />
        <link rel="canonical" href={`https://xlata.site/reciclagem/${stateContent.slug}`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        
        {/* Open Graph */}
        <meta property="og:title" content={stateContent.seoTitle} />
        <meta property="og:description" content={stateContent.seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://xlata.site/reciclagem/${stateContent.slug}`} />
        <meta property="og:image" content="https://xlata.site/lovable-uploads/XLATALOGO.png" />
        <meta property="og:site_name" content="XLata - Sistema para Reciclagem" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={stateContent.seoTitle} />
        <meta name="twitter:description" content={stateContent.seoDescription} />
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {sanitizeJsonLd(schemaData)}
        </script>
        <script type="application/ld+json">
          {sanitizeJsonLd(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {sanitizeJsonLd(faqSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-400">
            <li className="flex items-center">
              <Link to="/landing" className="hover:text-emerald-400 transition-colors flex items-center">
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              <Link to="/landing" className="hover:text-emerald-400 transition-colors">
                Reciclagem
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-white font-medium">{stateContent.name}</span>
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full mb-6">
              <Recycle className="w-5 h-5" />
              <span className="text-sm font-medium">Sistema para {stateContent.name}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {stateContent.headline}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              {stateContent.subheadline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg"
              >
                <Link to="/register">
                  {stateContent.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg"
              >
                <Link to="/planos">
                  Ver Planos
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Intro Section with Contextual Links */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-lg text-slate-300 leading-relaxed">
              {stateContent.introText}
            </p>
            <p className="text-slate-300">
              O{' '}
              <Link to="/landing" className="text-emerald-400 hover:text-emerald-300 underline font-semibold">
                XLata
              </Link>{' '}
              é o sistema completo para gerenciar seu depósito de reciclagem, ferro velho ou centro de sucata em{' '}
              <span className="text-white font-medium">{stateContent.name}</span>.{' '}
              Teste grátis por 7 dias e veja a diferença na organização do seu negócio.
            </p>
          </div>
        </section>

        {/* Local Highlights */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Por que usar o XLata em {stateContent.name}?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {stateContent.localHighlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <article className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {stateContent.contentSections.map((section, index) => (
              <section key={index} className="prose prose-invert prose-lg max-w-none">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {section.title}
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </article>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16 bg-slate-800/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
              Funcionalidades do XLata
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu depósito de reciclagem em {stateContent.name}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stateContent.features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || Scale;
                return (
                  <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400 text-center mb-12">
              Tire suas dúvidas sobre o XLata em {stateContent.name}
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {stateContent.faq.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-6"
                >
                  <AccordionTrigger className="text-white hover:text-emerald-400 text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Main Cities Section */}
        {citiesByState[stateSlug] && citiesByState[stateSlug].length > 0 && (
          <section className="container mx-auto px-4 py-16 bg-slate-800/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                <MapPin className="inline-block w-6 h-6 mr-2 text-emerald-400" />
                Principais Cidades de {stateContent.name}
              </h2>
              <p className="text-slate-400 text-center mb-8">
                Conheça o XLata para reciclagem em cada cidade
              </p>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {citiesByState[stateSlug].slice(0, 20).map(city => (
                  <Link
                    key={city.slug}
                    to={`/reciclagem/${stateSlug}/${city.slug}`}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <h3 className="text-white font-medium">{city.name}</h3>
                    <span className="text-slate-400 text-sm">
                      Reciclagem em {city.name}
                    </span>
                  </Link>
                ))}
              </div>
              
              {citiesByState[stateSlug].length > 20 && (
                <p className="text-center text-slate-400 mt-6">
                  E mais {citiesByState[stateSlug].length - 20} cidades...
                </p>
              )}
            </div>
          </section>
        )}

        {/* Other States Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              O XLata atende todo o Brasil
            </h2>
            <p className="text-slate-400 text-center mb-8">
              Escolha outro estado para saber mais
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {Object.entries(statesByRegion).map(([region, states]) => (
                <div key={region}>
                  <h3 className="text-emerald-400 font-semibold mb-3 text-sm">
                    {regionNames[region]}
                  </h3>
                  <ul className="space-y-1">
                    {states.map(state => (
                      <li key={state.slug}>
                        <Link
                          to={`/reciclagem/${state.slug}`}
                          className={`text-sm transition-colors ${
                            state.slug === stateSlug 
                              ? 'text-white font-medium' 
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          {state.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Comece a usar o XLata em {stateContent.name}
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Teste grátis por 7 dias. Sem compromisso, sem cartão de crédito.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-6 text-lg"
            >
              <Link to="/register">
                {stateContent.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer link back to landing */}
        <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
          <div className="text-center">
            <Link 
              to="/landing" 
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              ← Voltar para a página principal
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RecyclingStatePage;
