import { useLocation, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, ChevronRight, Home, Recycle, ArrowLeft, Star, Users, ShieldCheck, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { parseArticleUrl, generateArticle, templateConfigs, ArticleTemplate } from '@/data/programmaticSeoContent';
import { citiesByState } from '@/data/recyclingCitiesContent';
import { sanitizeJsonLd } from '@/utils/sanitization';

// ── Inline CTA Bar ──
const CTABar = ({ variant = 'inline' }: { variant?: 'inline' | 'sticky' }) => (
  <div className={`rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 mb-8 ${variant === 'sticky' ? 'bg-emerald-600' : 'bg-emerald-50 border border-emerald-200'}`}>
    <p className={`text-sm font-medium ${variant === 'sticky' ? 'text-white' : 'text-emerald-800'}`}>
      Comece a controlar seus fiados gratuitamente
    </p>
    <div className="flex gap-2">
      <Button asChild size="sm" className={variant === 'sticky' ? 'bg-white text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
        <Link to="/register">Criar conta grátis</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className={variant === 'sticky' ? 'border-white text-white hover:bg-emerald-700' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'}>
        <a href="https://xlata.site/register" target="_blank" rel="noopener noreferrer">Começar gratuitamente</a>
      </Button>
    </div>
  </div>
);

// ── Full CTA Block ──
const CTABlock = ({ cityName }: { cityName: string }) => (
  <div className="rounded-2xl bg-emerald-600 p-8 md:p-10 mb-10 text-center text-white">
    <h3 className="text-2xl md:text-3xl font-bold mb-3">
      Pronto para organizar seus fiados?
    </h3>
    <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
      Milhares de comerciantes já encontraram a solução. Abra agora seu perfil no{' '}
      <a href="https://xlata.site" className="underline font-semibold text-white" target="_blank" rel="noopener noreferrer">XLata.site</a>.
      {' '}Comece gratuitamente e veja a diferença no seu dia a dia em {cityName}.
    </p>
    <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg">
      <Link to="/register">
        Criar conta grátis no XLata.site
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  </div>
);

// ── XLata Features Box ──
const FeaturesBox = () => (
  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
    <h3 className="font-bold text-emerald-800 text-lg mb-4">
      Por que usar o <a href="https://xlata.site" className="underline text-emerald-600" target="_blank" rel="noopener noreferrer">XLata.site</a>?
    </h3>
    <ul className="space-y-2.5">
      {[
        'Registre seus fiados em segundos',
        'Saiba exatamente quem deve e quanto',
        'Envie cobranças via WhatsApp',
        'Veja relatórios digitais com vendas',
        'Acesse tudo pelo celular ou computador'
      ].map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

// ── Stats Section ──
const StatsSection = () => (
  <div className="border-t border-gray-200 py-8 mb-8">
    <p className="text-center text-sm text-gray-500 mb-6">
      Milhares de comerciantes em todo o Brasil já utilizam o{' '}
      <a href="https://xlata.site" className="text-emerald-600 font-semibold underline" target="_blank" rel="noopener noreferrer">XLata.site</a>
      {' '}para controlar vendas fiadas.
    </p>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">2.500+</p>
        <p className="text-xs text-gray-500 mt-1">Usuários Ativos</p>
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">4.9<span className="text-lg">/5</span></p>
        <p className="text-xs text-gray-500 mt-1">Avaliação Média</p>
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">100%</p>
        <p className="text-xs text-gray-500 mt-1">Dados criptografados</p>
      </div>
    </div>
  </div>
);

// ── Comparison Table ──
const ComparisonTable = () => (
  <div className="mb-10">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Comparativo de métodos</h3>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Método</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Resultado</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-4 flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              <span className="text-gray-600">Caderno de fiado</span>
            </td>
            <td className="py-3 px-4 text-gray-500">Erros de anotação, perda de dados, difícil consulta</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-4 flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              <span className="text-gray-600">Planilha</span>
            </td>
            <td className="py-3 px-4 text-gray-500">Difícil de atualizar, não funciona bem no celular</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-4 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-emerald-700">XLata.site</span>
            </td>
            <td className="py-3 px-4 text-gray-700 font-medium">Simples, rápido, seguro e acessível de qualquer lugar</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ── Sidebar ──
const Sidebar = ({ cityData, parsed, otherTemplates }: { cityData: any; parsed: any; otherTemplates: ArticleTemplate[] }) => {
  const stateAbbr = cityData.stateAbbreviation.toLowerCase();
  const templateLabel = (t: ArticleTemplate) => `${templateConfigs[t].titlePrefix} ${cityData.name}`;

  return (
    <aside className="space-y-6">
      {/* CTA Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
        <p className="text-emerald-800 font-medium text-sm mb-1">Organize clientes, fiados e o caixa</p>
        <p className="text-gray-500 text-xs mb-4">com o sistema mais simples do país, direto do seu dia a dia</p>
        <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
          <a href="https://xlata.site/register" target="_blank" rel="noopener noreferrer">
            Criar conta grátis →
          </a>
        </Button>
      </div>

      {/* Em Alta */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Em Alta</h4>
        <ul className="space-y-2.5">
          {otherTemplates.slice(0, 5).map(t => (
            <li key={t}>
              <Link
                to={`/blog/${templateConfigs[t].urlPrefix}-${cityData.slug}-${stateAbbr}`}
                className="text-emerald-600 hover:text-emerald-700 text-sm hover:underline transition-colors"
              >
                {templateLabel(t)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Outros temas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Outros temas em {cityData.name}</h4>
        <ul className="space-y-2">
          <li>
            <Link to={`/reciclagem/${cityData.stateSlug}/${cityData.slug}`} className="text-emerald-600 hover:underline text-sm">
              Reciclagem em {cityData.name}
            </Link>
          </li>
          <li>
            <a href="https://xlata.site/blog" className="text-emerald-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">
              Caderneta Digital para Comércio em {cityData.name}
            </a>
          </li>
          <li>
            <a href="https://xlata.site/solucoes" className="text-emerald-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">
              Gestão de Fiado para Pequenos Comércios em {cityData.name}
            </a>
          </li>
          <li>
            <Link to={`/blog/${templateConfigs['como-gerenciar'].urlPrefix}-${cityData.slug}-${stateAbbr}`} className="text-emerald-600 hover:underline text-sm">
              Como Controlar Fiado em {cityData.name}
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

// ── Main Page ──
const ProgrammaticSeoPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace('/blog/', '');
  const parsed = parseArticleUrl(slug);

  if (!parsed) return <Navigate to="/blog" replace />;

  let cityData = null;
  for (const cities of Object.values(citiesByState)) {
    const found = cities.find(
      c => c.slug === parsed.citySlug && c.stateAbbreviation.toLowerCase() === parsed.stateAbbr
    );
    if (found) { cityData = found; break; }
  }

  if (!cityData) return <Navigate to="/blog" replace />;

  const article = generateArticle(cityData, parsed.template);
  const stateCities = citiesByState[cityData.stateSlug] || [];
  const relatedCities = stateCities.filter(c => c.slug !== cityData!.slug).slice(0, 6);
  const stateAbbr = cityData.stateAbbreviation.toLowerCase();

  const allTemplates = Object.keys(templateConfigs) as ArticleTemplate[];
  const otherTemplates = allTemplates.filter(t => t !== parsed.template);

  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: article.title, description: article.metaDescription,
    url: article.canonical,
    publisher: { '@type': 'Organization', name: 'XLata', url: 'https://xlata.site' },
    datePublished: '2025-01-15',
    dateModified: new Date().toISOString().split('T')[0],
  };

  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: article.faq.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{article.metaTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={article.canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta property="og:title" content={article.metaTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={article.canonical} />
        <meta property="og:site_name" content="XLata" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.metaTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        <script type="application/ld+json">{sanitizeJsonLd(articleSchema)}</script>
        <script type="application/ld+json">{sanitizeJsonLd(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Top nav bar */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2">
            <Link to="/blog" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Blog
            </Link>
            <span className="text-gray-300">|</span>
            <a href="https://xlata.site" className="text-sm font-semibold text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
              <Recycle className="h-4 w-4 inline mr-1" />
              xlata.site
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h1 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-gray-900 leading-tight mb-4">
              {article.sections[0].title}
            </h1>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-3xl">
              Se você tem um ferro-velho, mercadinho ou quitanda em {cityData.name} – {cityData.stateAbbreviation}, sabe como é difícil controlar as vendas fiadas. O{' '}
              <a href="https://xlata.site" className="text-emerald-600 font-semibold underline" target="_blank" rel="noopener noreferrer">XLata.site</a>
              {' '}é o app ideal para organizar o fiado do seu negócio.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <Recycle className="h-3.5 w-3.5" />
              <span>{cityData.name}, {cityData.stateAbbreviation}</span>
            </div>
          </div>
        </div>

        {/* CTA Bar after hero */}
        <div className="container mx-auto px-4 max-w-5xl pt-6">
          <CTABar />
        </div>

        {/* Main content + sidebar */}
        <div className="container mx-auto px-4 max-w-5xl pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Article */}
            <article className="lg:col-span-8">
              {/* Intro */}
              <div className="prose prose-gray max-w-none mb-8">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {article.sections[0].content}
                </p>
              </div>

              {/* Sections 1-9 with CTAs */}
              {article.sections.slice(1).map((section, index) => (
                <div key={index}>
                  <section className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                      {section.title}
                    </h2>
                    <div className="text-gray-600 leading-relaxed">
                      {section.content.split('\n').map((line, i) => {
                        if (line.startsWith('• **')) {
                          const parts = line.replace('• **', '').split('**');
                          return (
                            <div key={i} className="flex items-start gap-2 mb-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                              <span><strong className="text-gray-900">{parts[0]}</strong>{parts[1]}</span>
                            </div>
                          );
                        }
                        if (line.startsWith('• ')) {
                          return (
                            <div key={i} className="flex items-start gap-2 mb-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                              <span>{line.replace('• ', '')}</span>
                            </div>
                          );
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="mb-3">{line}</p>;
                      })}
                    </div>
                  </section>

                  {/* CTA after problems (index 1), after features box (index 3), after XLATA section (index 6) */}
                  {index === 1 && <CTABar />}
                  {index === 3 && <FeaturesBox />}
                  {index === 5 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-emerald-800 text-sm font-medium">
                        Comece a controlar e usar o{' '}
                        <a href="https://xlata.site" className="underline font-bold" target="_blank" rel="noopener noreferrer">XLata.site</a>, é muito rápido.
                      </p>
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                        <a href="https://xlata.site/register" target="_blank" rel="noopener noreferrer">
                          Criar conta grátis <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {index === 7 && <CTABar />}
                </div>
              ))}

              {/* How to start steps */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Como começar a usar o XLata em {cityData.name}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Materialize a gestão do fiado do seu comércio em {cityData.name} é simples e gratuito. Veja como começar:
                </p>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Crie sua conta gratuita', desc: `Acesse ${' '}<a href="https://xlata.site" class="text-emerald-600 underline font-semibold">XLata.site</a>, adicione o cadastro e em menos de 1 minuto. Não precisa instalar nada.` },
                    { step: 2, title: 'Cadastre seus clientes', desc: 'Adicione o nome e telefone dos clientes que compram fiado. Você pode definir limite de crédito para cada um.' },
                    { step: 3, title: 'Registre as vendas fiadas', desc: 'A cada venda fiada, registre o valor, a descrição e a previsão de pagamento.' },
                    { step: 4, title: 'Acompanhe e cobre', desc: 'O painel mostra tudo que você tem a receber. Use o botão de cobrança por WhatsApp para lembrar clientes de forma educada.' },
                    { step: 5, title: 'Receba e registre pagamentos', desc: 'Quando o cliente pagar, registre o pagamento e gere um recibo digital com validade comprovada.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {step}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">→Passo {step} — {title}</p>
                        <p className="text-gray-500 text-sm" dangerouslySetInnerHTML={{ __html: desc }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  Milhares de comerciantes em todo o Brasil — incluindo em {cityData.name} e na região Nordeste — já usaram o{' '}
                  <a href="https://xlata.site" className="text-emerald-600 font-semibold underline" target="_blank" rel="noopener noreferrer">XLata.site</a>
                  {' '}para organizar suas vendas fiadas.
                </p>
              </div>

              {/* Benefits checklist */}
              <div className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Benefícios do controle digital de fiado
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Trocar o caderno de fiado por um poderoso app de gestão de fiado traz benefícios imediatos:
                </p>
                <div className="space-y-2.5">
                  {[
                    '📊 Registro automático — Todas as vendas ficam salvas com data, valor e cliente.',
                    '🔄 Pagamentos parciais — O sistema calcula automaticamente o saldo devedor.',
                    '📱 Cobrança via WhatsApp — Envie lembretes de cobrança para clientes com dívidas próximas do vencimento.',
                    '🔒 Histórico financeiro — Saiba exatamente quanto cada cliente deve.',
                    '📋 Impressão fácil — Comprovantes com código de verificação.',
                    '⏱️ Minutos de qualquer lugar — Funciona no celular e no computador.',
                    '✅ Organização — Saldo, comprovantes, sem risco de perder a caderneta.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Para comerciantes em {cityData.name} – {cityData.stateAbbreviation}, isso significa mais controle, menos perdas e um negócio mais profissional.
                </p>
              </div>

              {/* Comparison Table */}
              <ComparisonTable />

              {/* Stats */}
              <StatsSection />

              {/* FAQ */}
              <section className="mb-10">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                  Perguntas frequentes
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {article.faq.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border border-gray-200 rounded-lg px-4 bg-white">
                      <AccordionTrigger className="text-gray-900 hover:text-emerald-600 text-left text-sm font-medium">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 text-sm">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              {/* Final CTA */}
              <CTABlock cityName={cityData.name} />

              {/* Related cities */}
              {relatedCities.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Veja também em outras cidades de {cityData.stateName}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {relatedCities.map(rc => (
                      <Link
                        key={rc.slug}
                        to={`/blog/${templateConfigs[parsed.template].urlPrefix}-${rc.slug}-${rc.stateAbbreviation.toLowerCase()}`}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-600 transition-colors text-sm"
                      >
                        {rc.name}, {rc.stateAbbreviation}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-6">
                <Sidebar cityData={cityData} parsed={parsed} otherTemplates={otherTemplates} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-center text-sm">
              <Link to={`/reciclagem/${cityData.stateSlug}`} className="text-gray-500 hover:text-emerald-600 transition-colors">
                ← {cityData.stateName}
              </Link>
              <Link to="/blog" className="text-gray-500 hover:text-emerald-600 transition-colors">Blog</Link>
              <a href="https://xlata.site" className="text-emerald-600 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
                xlata.site
              </a>
              <Link to="/landing" className="text-gray-500 hover:text-emerald-600 transition-colors">Página Principal</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProgrammaticSeoPage;
