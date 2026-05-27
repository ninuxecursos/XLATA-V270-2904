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
import { getCityBySlug, generateCitySEO, citiesByState } from '@/data/recyclingCitiesContent';
import { recyclingStatesContent } from '@/data/recyclingStatesContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { sanitizeJsonLd } from '@/utils/sanitization';

// Icon mapping for features
const iconMap: Record<string, React.ElementType> = {
  Scale,
  Wallet,
  BarChart3,
  Users,
  Smartphone,
  Shield
};

const RecyclingCityPage = () => {
  const { stateSlug, citySlug } = useParams<{ stateSlug: string; citySlug: string }>();
  
  // Get city and state content
  const cityData = stateSlug && citySlug ? getCityBySlug(stateSlug, citySlug) : null;
  const stateContent = stateSlug ? recyclingStatesContent[stateSlug] : null;
  
  // If city not found, redirect to state page or landing
  if (!cityData || !stateContent) {
    return <Navigate to={stateSlug ? `/reciclagem/${stateSlug}` : '/landing'} replace />;
  }

  // Generate SEO content for this city
  const citySEO = generateCitySEO(cityData);

  // Schema.org SoftwareApplication data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `XLata - Sistema para Reciclagem em ${cityData.name}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: citySEO.seoDescription,
    url: `https://xlata.site/reciclagem/${stateSlug}/${citySlug}`,
    provider: {
      '@type': 'Organization',
      name: 'XLata',
      url: 'https://xlata.site'
    },
    areaServed: {
      '@type': 'City',
      name: cityData.name,
      containedInPlace: {
        '@type': 'State',
        name: cityData.stateName,
        containedInPlace: {
          '@type': 'Country',
          name: 'Brasil'
        }
      }
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Teste grátis por 7 dias'
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
        name: cityData.stateName,
        item: `https://xlata.site/reciclagem/${stateSlug}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: cityData.name,
        item: `https://xlata.site/reciclagem/${stateSlug}/${citySlug}`
      }
    ]
  };

  // FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: citySEO.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  // Features (reuse from state but localize)
  const features = [
    {
      icon: 'Scale',
      title: 'Controle de Pesagem',
      description: `Registre compras com peso e valor calculado automaticamente para seu depósito em ${cityData.name}.`
    },
    {
      icon: 'Wallet',
      title: 'Gestão Financeira',
      description: `Controle caixa, despesas e lucro do seu negócio de reciclagem em ${cityData.name}.`
    },
    {
      icon: 'BarChart3',
      title: 'Relatórios Detalhados',
      description: 'Analise o desempenho do seu ferro velho com gráficos e estatísticas.'
    },
    {
      icon: 'Users',
      title: 'Gestão de Clientes',
      description: `Cadastre fornecedores de ${cityData.name} e acompanhe o histórico de compras.`
    },
    {
      icon: 'Smartphone',
      title: '100% Online',
      description: `Acesse de qualquer lugar de ${cityData.name} pelo celular ou computador.`
    },
    {
      icon: 'Shield',
      title: 'Dados Seguros',
      description: 'Seus dados protegidos com criptografia e backup automático.'
    }
  ];

  // Get other cities in the same state for internal linking
  const otherCities = citiesByState[stateSlug]?.filter(c => c.slug !== citySlug).slice(0, 8) || [];

  return (
    <>
      <Helmet>
        <title>{citySEO.seoTitle}</title>
        <meta name="description" content={citySEO.seoDescription} />
        <link rel="canonical" href={`https://xlata.site/reciclagem/${stateSlug}/${citySlug}`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        
        {/* Open Graph */}
        <meta property="og:title" content={citySEO.seoTitle} />
        <meta property="og:description" content={citySEO.seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://xlata.site/reciclagem/${stateSlug}/${citySlug}`} />
        <meta property="og:image" content="https://xlata.site/lovable-uploads/XLATALOGO.png" />
        <meta property="og:site_name" content="XLata - Sistema para Reciclagem" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={citySEO.seoTitle} />
        <meta name="twitter:description" content={citySEO.seoDescription} />
        
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
              <Link to={`/reciclagem/${stateSlug}`} className="hover:text-emerald-400 transition-colors">
                {cityData.stateName}
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-white font-medium">{cityData.name}</span>
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full mb-6">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">{cityData.name}, {cityData.stateAbbreviation}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {citySEO.headline}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              {citySEO.subheadline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg"
              >
                <Link to="/register">
                  {citySEO.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-lg"
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
              O mercado de reciclagem em{' '}
              <span className="font-semibold text-white">{cityData.name}</span>{' '}
              representa uma excelente oportunidade para empreendedores do setor. Recicladores de{' '}
              <Link 
                to={`/reciclagem/${stateSlug}`} 
                className="text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                {cityData.stateName}
              </Link>{' '}
              podem utilizar o sistema{' '}
              <Link 
                to="/landing" 
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
              >
                XLata
              </Link>{' '}
              para organizar a compra e venda de materiais recicláveis de forma profissional.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              {citySEO.introText}
            </p>
          </div>
        </section>

        {/* Local Highlights */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Por que usar o XLata em {cityData.name}?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {citySEO.localHighlights.map((highlight, index) => (
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
            {citySEO.contentSections.map((section, index) => (
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
              Tudo que você precisa para gerenciar seu depósito de reciclagem em {cityData.name}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
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
              Tire suas dúvidas sobre o XLata em {cityData.name}
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {citySEO.faq.map((item, index) => (
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

        {/* Internal Navigation - Saiba Mais */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Saiba mais sobre reciclagem
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="/landing" 
                className="px-4 py-2 bg-slate-800 rounded-lg text-emerald-400 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Conheça o XLata
              </Link>
              <Link 
                to={`/reciclagem/${stateSlug}`}
                className="px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Reciclagem em {cityData.stateName}
              </Link>
              <Link 
                to="/planos"
                className="px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Ver Planos e Preços
              </Link>
              <Link 
                to="/blog"
                className="px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Blog de Reciclagem
              </Link>
            </div>
          </div>
        </section>

        {/* Other Cities Section */}
        {otherCities.length > 0 && (
          <section className="container mx-auto px-4 py-16 bg-slate-800/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                Outras Cidades de {cityData.stateName}
              </h2>
              <p className="text-slate-400 text-center mb-8">
                O XLata também atende recicladores em outras cidades
              </p>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherCities.map(city => (
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
              
              <div className="text-center mt-8">
                <Link 
                  to={`/reciclagem/${stateSlug}`}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Ver todas as cidades de {cityData.stateName} →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Comece a usar o XLata em {cityData.name}
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
                {citySEO.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Links para artigos do blog programático */}
        <section className="container mx-auto px-4 py-8">
          <h3 className="text-lg font-semibold text-white mb-4">Artigos sobre ferro-velho em {cityData.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to={`/blog/sistema-ferro-velho-${citySlug}-${cityData.stateAbbreviation.toLowerCase()}`}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-sm"
            >
              Sistema para ferro velho em {cityData.name}
            </Link>
            <Link
              to={`/blog/gestao-deposito-sucata-${citySlug}-${cityData.stateAbbreviation.toLowerCase()}`}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-sm"
            >
              Gestão de depósito de sucata em {cityData.name}
            </Link>
            <Link
              to={`/blog/controle-estoque-sucata-${citySlug}-${cityData.stateAbbreviation.toLowerCase()}`}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-sm"
            >
              Controle de estoque de sucata em {cityData.name}
            </Link>
          </div>
        </section>

        {/* Footer link back */}
        <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-center">
            <Link 
              to={`/reciclagem/${stateSlug}`}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              ← {cityData.stateName}
            </Link>
            <Link 
              to="/landing" 
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Página Principal
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RecyclingCityPage;

