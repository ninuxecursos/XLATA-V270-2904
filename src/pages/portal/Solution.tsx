import { useParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { usePillarPage } from '@/hooks/useContentPortal';
import { Helmet } from 'react-helmet-async';
import { NationalCoverageSection } from '@/components/landing/NationalCoverageSection';

const Solution = () => {
  const { slug } = useParams<{ slug: string }>();
  const { page, loading } = usePillarPage(slug || '');

  // Default content for when page doesn't exist yet
  const defaultPages: Record<string, any> = {
    'sistema-para-deposito-de-reciclagem': {
      headline: 'Sistema Completo para Depósito de Reciclagem',
      subheadline: 'Gerencie todo o seu depósito em um só lugar: caixa, compras, vendas, estoque e relatórios.',
      intro_text: 'O XLata é o sistema mais completo para gestão de depósitos de reciclagem. Desenvolvido por quem entende a rotina do ferro velho, ele organiza todas as operações do dia a dia: controle de caixa, compra de materiais, venda por kg, projeção de lucro e relatórios detalhados.',
      features: [
        'Controle de caixa completo com entradas e saídas',
        'PDV de compra para registrar materiais',
        'Venda por kg com cálculo automático',
        'Projeção de lucro baseada no estoque',
        'Relatórios de compra e venda',
        'Histórico completo de transações',
        'Registro de despesas por categoria',
        'Controle de origem do dinheiro',
      ],
      how_it_works: [
        { title: 'Cadastre-se', description: 'Crie sua conta em menos de 2 minutos' },
        { title: 'Configure os materiais', description: 'Adicione os materiais que você compra e vende' },
        { title: 'Registre as operações', description: 'Use o PDV para comprar e vender' },
        { title: 'Acompanhe os resultados', description: 'Veja relatórios e projeções em tempo real' },
      ],
      benefits: [
        { title: 'Organização Total', description: 'Chega de papel e planilha. Tudo em um só lugar.' },
        { title: 'Controle Financeiro', description: 'Saiba exatamente quanto entrou e saiu do caixa.' },
        { title: 'Decisões Baseadas em Dados', description: 'Relatórios claros para tomar decisões melhores.' },
        { title: 'Economia de Tempo', description: 'Operações rápidas, sem retrabalho.' },
      ],
      faq: [
        { question: 'O XLata funciona em qualquer dispositivo?', answer: 'Sim, o XLata funciona em computador, tablet e celular, desde que tenha acesso à internet.' },
        { question: 'Preciso instalar algum programa?', answer: 'Não, o XLata funciona direto no navegador. Basta acessar o site e fazer login.' },
        { question: 'Como funciona o teste grátis?', answer: 'Você tem 7 dias para testar todas as funções. Não precisa de cartão de crédito.' },
        { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, você pode cancelar sua assinatura quando quiser, sem multa.' },
        { question: 'O sistema é seguro?', answer: 'Sim, seus dados ficam protegidos com criptografia e backups automáticos.' },
        { question: 'Tem suporte?', answer: 'Sim, oferecemos suporte por WhatsApp para tirar dúvidas e ajudar na configuração.' },
      ],
    },
    'controle-de-caixa-para-deposito': {
      headline: 'Controle de Caixa para Depósito de Reciclagem',
      subheadline: 'Tenha controle total sobre entradas, saídas e saldo do seu caixa em tempo real.',
      intro_text: 'O controle de caixa do XLata foi feito para a realidade do depósito de reciclagem. Registre entradas de compras e vendas, saídas com despesas, e acompanhe seu saldo sempre atualizado.',
      features: [
        'Saldo do caixa em tempo real',
        'Registro de entradas e saídas',
        'Histórico completo de movimentações',
        'Categorização de despesas',
        'Controle de origem do dinheiro',
        'Fechamento de caixa diário',
      ],
      how_it_works: [
        { title: 'Abra o caixa', description: 'Informe o saldo inicial do dia' },
        { title: 'Registre operações', description: 'Cada compra ou venda atualiza o caixa automaticamente' },
        { title: 'Lance despesas', description: 'Registre saídas extras com categoria' },
        { title: 'Feche o dia', description: 'Confira o saldo e feche o caixa' },
      ],
      benefits: [
        { title: 'Saldo Sempre Correto', description: 'Sem mais "sumir dinheiro" ou diferença no caixa.' },
        { title: 'Histórico Completo', description: 'Consulte qualquer movimentação quando precisar.' },
        { title: 'Controle de Despesas', description: 'Saiba para onde está indo o dinheiro.' },
        { title: 'Fechamento Tranquilo', description: 'Feche o dia com tudo batendo.' },
      ],
      faq: [
        { question: 'Posso ter mais de um caixa?', answer: 'Sim, você pode controlar múltiplos caixas se tiver mais de um ponto de operação.' },
        { question: 'Como registrar despesas?', answer: 'Use a seção de despesas para lançar gastos como combustível, manutenção, etc.' },
        { question: 'O sistema calcula automaticamente?', answer: 'Sim, cada operação de compra ou venda já atualiza o saldo do caixa.' },
      ],
    },
  };

  const currentPage = page || defaultPages[slug || ''];

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-8"></div>
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

  if (!currentPage) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Solução não encontrada</h1>
          <p className="text-gray-400 mb-6">
            A solução que você procura não existe ou foi removida.
          </p>
          <Link to="/solucoes">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver Todas as Soluções
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const features = currentPage.features || [];
  const howItWorks = currentPage.how_it_works || [];
  const benefits = currentPage.benefits || [];
  const faq = currentPage.faq || [];

  // Generate Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `XLata - ${currentPage?.headline || 'Sistema para Ferro Velho'}`,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": currentPage?.seo_description || currentPage?.subheadline || '',
    "url": `https://xlata.site/solucoes/${slug}`,
    "offers": {
      "@type": "Offer",
      "price": "49.90",
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "130",
      "bestRating": "5"
    },
    "provider": {
      "@type": "Organization",
      "name": "XLata",
      "url": "https://xlata.site"
    }
  };

  // Generate FAQ Schema if FAQ exists
  const faqSchema = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map((item: any) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  return (
    <PortalLayout>
      <SEOHead
        title={currentPage?.seo_title || (currentPage?.headline ? `${currentPage.headline} - XLata` : 'Carregando solução...')}
        description={currentPage?.seo_description || currentPage?.subheadline || ''}
        ogImage={currentPage?.og_image || currentPage?.hero_image || undefined}
        customCanonical={currentPage?.canonical_url || `https://xlata.site/solucoes/${slug}`}
      />
      
      {/* Schema.org Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Soluções', href: '/solucoes' },
            { label: currentPage.headline },
          ]}
        />

        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {currentPage.headline}
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            {currentPage.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                Começar Teste Grátis de 7 Dias
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/planos">
              <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                Ver Planos
              </Button>
            </Link>
          </div>
        </section>

        {/* Intro */}
        {currentPage.intro_text && (
          <section className="max-w-3xl mx-auto mb-16">
            <p className="text-lg text-gray-400 leading-relaxed">
              {currentPage.intro_text}
            </p>
          </section>
        )}

        {/* Features */}
        {features.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              O que você pode fazer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {features.map((feature: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    {typeof feature === 'string' ? feature : feature.title || feature.description || ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it Works */}
        {howItWorks.length > 0 && (
          <section className="mb-16 bg-gray-800/50 -mx-4 px-4 py-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Como Funciona
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {howItWorks.map((step: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold mb-2 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Benefícios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit: any, index: number) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-white">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-white">
              <HelpCircle className="h-6 w-6" />
              Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item: any, index: number) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-gray-700">
                  <AccordionTrigger className="text-left text-white hover:text-emerald-400">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* National Coverage Section */}
        <NationalCoverageSection compact className="mb-16 -mx-4 px-4 rounded-lg" />

        {/* Final CTA */}
        <section className="text-center">
          <Card className="bg-emerald-600 border-0 max-w-3xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Pronto para Começar?
              </h2>
              <p className="text-lg text-emerald-100 mb-6">
                Teste o XLata grátis por 7 dias. Sem cartão de crédito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="gap-2 bg-white text-emerald-600 hover:bg-emerald-50">
                    Começar Teste Grátis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="https://wa.me/5511963512105" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Falar no WhatsApp
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link to="/solucoes" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Ver todas as soluções
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Solution;
