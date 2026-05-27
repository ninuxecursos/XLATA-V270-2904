import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { marked } from 'npm:marked@17.0.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

marked.setOptions({ gfm: true })

// ── Template configs (mirror of client-side) ──
const templateConfigs: Record<string, { urlPrefix: string; titlePrefix: string; titleSuffix: string; metaPrefix: string; metaSuffix: string }> = {
  sistema: { urlPrefix: 'sistema-ferro-velho', titlePrefix: 'Sistema para Ferro Velho em', titleSuffix: 'Como Organizar Seu Depósito de Sucata', metaPrefix: 'Sistema completo para ferro velho em', metaSuffix: 'Controle estoque, registre compras e gerencie seu depósito de sucata.' },
  software: { urlPrefix: 'software-ferro-velho', titlePrefix: 'Software para Ferro Velho em', titleSuffix: 'Tecnologia para Depósitos de Sucata', metaPrefix: 'Software especializado para ferro velho em', metaSuffix: 'Automatize operações do seu depósito de sucata com tecnologia.' },
  'app-gestao': { urlPrefix: 'app-gestao-reciclagem', titlePrefix: 'App de Gestão de Reciclagem em', titleSuffix: 'Gerencie Seu Ferro Velho pelo Celular', metaPrefix: 'App de gestão para reciclagem em', metaSuffix: 'Gerencie seu ferro velho de qualquer lugar pelo celular.' },
  gestao: { urlPrefix: 'gestao-deposito-sucata', titlePrefix: 'Gestão de Depósito de Sucata em', titleSuffix: 'Administre Seu Ferro Velho com Eficiência', metaPrefix: 'Gestão profissional para depósito de sucata em', metaSuffix: 'Administre seu ferro velho com controle financeiro e relatórios.' },
  'gestao-reciclagem': { urlPrefix: 'gestao-reciclagem', titlePrefix: 'Gestão de Reciclagem em', titleSuffix: 'Organize Seu Centro de Reciclagem', metaPrefix: 'Sistema de gestão de reciclagem em', metaSuffix: 'Organize e profissionalize seu centro de reciclagem.' },
  'como-gerenciar': { urlPrefix: 'como-gerenciar-ferro-velho', titlePrefix: 'Como Gerenciar um Ferro Velho em', titleSuffix: 'Guia Completo de Gestão', metaPrefix: 'Aprenda como gerenciar ferro velho em', metaSuffix: 'Guia completo para administrar seu depósito de sucata.' },
  estoque: { urlPrefix: 'controle-estoque-sucata', titlePrefix: 'Controle de Estoque de Sucata em', titleSuffix: 'Gerencie Materiais do Seu Ferro Velho', metaPrefix: 'Controle de estoque para ferro velho em', metaSuffix: 'Saiba exatamente quanto de cada material tem no seu depósito.' },
  'controle-materiais': { urlPrefix: 'controle-materiais-reciclagem', titlePrefix: 'Controle de Materiais Recicláveis em', titleSuffix: 'Gestão de Inventário para Reciclagem', metaPrefix: 'Controle de materiais recicláveis em', metaSuffix: 'Gerencie o inventário do seu depósito de reciclagem.' },
  financeiro: { urlPrefix: 'controle-financeiro-ferro-velho', titlePrefix: 'Controle Financeiro de Ferro Velho em', titleSuffix: 'Finanças do Seu Depósito de Sucata', metaPrefix: 'Controle financeiro para ferro velho em', metaSuffix: 'Gerencie receitas, despesas e lucro do seu depósito.' },
  lucro: { urlPrefix: 'lucro-ferro-velho', titlePrefix: 'Como Ter Mais Lucro no Ferro Velho em', titleSuffix: 'Aumente a Rentabilidade do Depósito', metaPrefix: 'Aumente o lucro do seu ferro velho em', metaSuffix: 'Estratégias para maximizar a rentabilidade do seu depósito.' },
  organizar: { urlPrefix: 'como-organizar-ferro-velho', titlePrefix: 'Como Organizar um Ferro Velho em', titleSuffix: 'Dicas de Organização para Depósitos', metaPrefix: 'Como organizar ferro velho em', metaSuffix: 'Dicas práticas para organizar seu depósito de sucata.' },
  'organizar-patio': { urlPrefix: 'organizar-patio-sucata', titlePrefix: 'Como Organizar o Pátio de Sucata em', titleSuffix: 'Layout e Organização do Depósito', metaPrefix: 'Organize o pátio de sucata em', metaSuffix: 'Layout profissional para o pátio do seu ferro velho.' },
}

// ── City name from slug ──
function cityNameFromSlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function stateNameFromAbbr(abbr: string): string {
  const states: Record<string, string> = {
    sp: 'São Paulo', mg: 'Minas Gerais', rj: 'Rio de Janeiro', es: 'Espírito Santo',
    pr: 'Paraná', rs: 'Rio Grande do Sul', sc: 'Santa Catarina', ba: 'Bahia',
    pe: 'Pernambuco', ce: 'Ceará', ma: 'Maranhão', pb: 'Paraíba', rn: 'Rio Grande do Norte',
    pi: 'Piauí', al: 'Alagoas', se: 'Sergipe', go: 'Goiás', df: 'Distrito Federal',
    mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', pa: 'Pará', am: 'Amazonas',
    ro: 'Rondônia', to: 'Tocantins', ac: 'Acre', ap: 'Amapá', rr: 'Roraima',
  }
  return states[abbr.toLowerCase()] || abbr.toUpperCase()
}

// ── Parse programmatic URL ──
function parseProgrammaticUrl(slug: string): { template: string; citySlug: string; stateAbbr: string } | null {
  for (const [key, config] of Object.entries(templateConfigs)) {
    const prefix = config.urlPrefix + '-'
    if (slug.startsWith(prefix)) {
      const rest = slug.slice(prefix.length)
      const parts = rest.split('-')
      if (parts.length >= 2) {
        const stateAbbr = parts[parts.length - 1]
        const citySlug = parts.slice(0, -1).join('-')
        return { template: key, citySlug, stateAbbr }
      }
    }
  }
  return null
}

// ── Generate programmatic page content ──
function generateProgrammaticContent(citySlug: string, stateAbbr: string, template: string): string {
  const config = templateConfigs[template]
  if (!config) return ''
  
  const cityName = cityNameFromSlug(citySlug)
  const stateName = stateNameFromAbbr(stateAbbr)
  const title = `${config.titlePrefix} ${cityName} – ${stateAbbr.toUpperCase()} | ${config.titleSuffix}`
  const metaDesc = `${config.metaPrefix} ${cityName}, ${stateAbbr.toUpperCase()}. ${config.metaSuffix}`
  const canonical = `https://xlata.site/blog/${config.urlPrefix}-${citySlug}-${stateAbbr}`
  const now = new Date().toISOString().split('T')[0]

  const faqs = [
    { q: `Qual o melhor sistema para ferro velho em ${cityName}?`, a: `O XLata.site é o sistema mais utilizado por ferro-velhos em ${cityName}. Com ele você controla estoque, registra compras de sucata, gerencia finanças e gera relatórios automaticamente.` },
    { q: `Como controlar o estoque de sucata em ${cityName}?`, a: `Com o XLata.site, cada entrada e saída de material é registrada automaticamente. O sistema calcula o peso total, preço médio e valor do estoque em tempo real.` },
    { q: `O sistema funciona pelo celular?`, a: `Sim, o XLata.site funciona em qualquer dispositivo com acesso à internet — celular, tablet ou computador. Basta acessar xlata.site e fazer login.` },
    { q: `Quanto custa o sistema para ferro velho?`, a: `O XLata.site oferece planos a partir de R$ 97,90/mês, com teste grátis de 7 dias sem necessidade de cartão de crédito.` },
    { q: `O XLata funciona para depósitos de reciclagem?`, a: `Sim, o XLata.site atende ferro-velhos, depósitos de sucata, centros de reciclagem e compradores de materiais recicláveis em ${cityName} e em todo o Brasil.` },
  ]

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: metaDesc, url: canonical,
    publisher: { '@type': 'Organization', name: 'XLata', url: 'https://xlata.site' },
    datePublished: '2025-01-15', dateModified: now,
  })

  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  })

  const softwareSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'XLata.site', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
    description: 'Sistema de gestão para ferro velho e depósito de reciclagem.',
    url: 'https://xlata.site/',
    offers: { '@type': 'Offer', price: '97.90', priceCurrency: 'BRL' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '130' },
  })

  // Generate rich article body
  const articleBody = `
    <p>O setor de reciclagem e compra de sucata em ${cityName}, ${stateName}, tem crescido de forma consistente nos últimos anos. Com o aumento da demanda por materiais reciclados e a valorização de metais como cobre, alumínio e ferro, os depósitos de sucata da região se tornaram peças fundamentais na cadeia produtiva local.</p>
    
    <p>No entanto, muitos donos de ferro-velho em ${cityName} ainda enfrentam dificuldades para organizar suas operações. Controlar o estoque, registrar compras, calcular lucros e manter o histórico de transações são tarefas que, sem um sistema adequado, consomem tempo e geram prejuízos.</p>

    <h2>Como funciona um ferro-velho profissional em ${cityName}</h2>
    <p>Um ferro-velho moderno em ${cityName} funciona como uma verdadeira empresa de logística reversa. O processo começa com a recepção de materiais — catadores, empresas e pessoas físicas trazem sucata para o depósito. O material é separado por tipo, pesado em balança calibrada e precificado conforme a tabela do dia.</p>
    <p>Em seguida, o material é armazenado no pátio até atingir volume suficiente para revenda a indústrias recicladoras. Esse ciclo exige controle rigoroso de entradas, saídas e valores para que o negócio seja lucrativo.</p>

    <h2>Principais desafios dos ferro-velhos em ${cityName}</h2>
    <ul>
      <li><strong>Falta de controle de estoque</strong>: sem saber quanto material há disponível, o proprietário perde oportunidades de venda</li>
      <li><strong>Materiais perdidos ou desviados</strong>: sem registro formal, é impossível detectar perdas no pátio</li>
      <li><strong>Dificuldade em calcular o lucro real</strong>: misturar despesas pessoais com as do negócio torna impossível saber se há lucro</li>
      <li><strong>Vendas não registradas</strong>: transações verbais geram disputas com fornecedores</li>
      <li><strong>Desorganização do pátio</strong>: sem categorização adequada, a operação fica lenta e ineficiente</li>
    </ul>

    <h2>Como o XLata.site resolve esses problemas em ${cityName}</h2>
    <p>O <a href="https://xlata.site">XLata.site</a> é o sistema mais completo para ferro-velhos e depósitos de reciclagem no Brasil. Com ele, os depósitos em ${cityName} conseguem:</p>
    <ul>
      <li>Registrar compras e vendas de sucata instantaneamente</li>
      <li>Controlar o estoque por tipo de material com atualização automática</li>
      <li>Gerenciar o fluxo de caixa e ver o lucro real do negócio</li>
      <li>Cadastrar fornecedores e clientes com histórico completo</li>
      <li>Gerar relatórios profissionais de operação</li>
    </ul>

    <h2>Benefícios de usar tecnologia no ferro-velho</h2>
    <p>A adoção de um sistema digital traz benefícios mensuráveis para os ferro-velhos de ${cityName}:</p>
    <ul>
      <li>Redução de até 80% nos erros de pesagem e cálculo</li>
      <li>Economia de 2-3 horas diárias em tarefas administrativas</li>
      <li>Aumento médio de 25% na margem de lucro</li>
      <li>Controle total sobre cada quilo comprado e vendido</li>
      <li>Histórico completo de todas as transações</li>
    </ul>

    <h2>Comece agora em ${cityName}</h2>
    <p>O <a href="https://xlata.site/register">XLata.site</a> oferece teste grátis de 7 dias, sem necessidade de cartão de crédito. Milhares de depósitos em todo o Brasil já utilizam o sistema para organizar suas operações e aumentar seus lucros.</p>
  `

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(metaDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="XLata.site">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:image" content="https://xlata.site/lovable-uploads/CAPAXLATA.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
  <meta name="twitter:image" content="https://xlata.site/lovable-uploads/CAPAXLATA.png">
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json">${faqSchema}</script>
  <script type="application/ld+json">${softwareSchema}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem;color:#0f172a}h2{font-size:1.4rem;color:#1e293b;margin-top:2rem}a{color:#059669}ul{padding-left:1.5rem}li{margin-bottom:0.5rem}.faq{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-top:2rem}.faq h3{margin-top:0;color:#065f46}.cta{background:#059669;color:white;text-align:center;padding:2rem;border-radius:12px;margin:2rem 0}.cta a{color:white;text-decoration:underline;font-weight:bold}nav{border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:24px}nav a{color:#059669;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <nav>
    <a href="https://xlata.site">← XLata.site</a> |
    <a href="https://xlata.site/blog">Blog</a> |
    <a href="https://xlata.site/planos">Planos</a>
  </nav>
  
  <article>
    <h1>${escapeHtml(title)}</h1>
    ${articleBody}
    
    <div class="cta">
      <h3>Pronto para organizar seu ferro-velho em ${escapeHtml(cityName)}?</h3>
      <p>Milhares de depósitos já usam o XLata.site. <a href="https://xlata.site/register">Criar conta grátis →</a></p>
    </div>

    <div class="faq">
      <h3>Perguntas Frequentes</h3>
      ${faqs.map(f => `<details><summary><strong>${escapeHtml(f.q)}</strong></summary><p>${escapeHtml(f.a)}</p></details>`).join('\n')}
    </div>
  </article>

  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site" style="color:#059669">XLata.site</a> — Sistema para Ferro Velho e Depósito de Reciclagem</p>
    <p><a href="https://xlata.site/blog">Blog</a> · <a href="https://xlata.site/glossario">Glossário</a> · <a href="https://xlata.site/ajuda">Ajuda</a> · <a href="https://xlata.site/planos">Planos</a></p>
  </footer>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderRichContent(contentHtml?: string | null, contentMd?: string | null, fallbackText?: string): string {
  if (contentHtml?.trim()) return contentHtml

  if (contentMd?.trim()) {
    try {
      return marked.parse(contentMd) as string
    } catch (error) {
      console.error('[prerender] Markdown parse error:', error)
    }
  }

  return fallbackText ? `<p>${escapeHtml(fallbackText)}</p>` : '<p>Conteúdo indisponível no momento.</p>'
}

// ── Generate static page HTML ──
function generateStaticPageHtml(path: string): string {
  const pages: Record<string, { title: string; desc: string; h1: string; content: string }> = {
    '/': {
      title: 'Melhor Sistema para Ferro Velho e Depósito de Reciclagem | XLata.site',
      desc: 'O XLata.site é o sistema que para de perder dinheiro no seu depósito. Pesagem rápida, cálculo certo, fornecedor confiando. Teste grátis 7 dias, sem cartão.',
      h1: 'Sistema para Ferro Velho e Depósito de Reciclagem',
      content: '<p>O XLata.site é o sistema mais completo para ferro-velhos e depósitos de reciclagem no Brasil. Controle estoque, registre compras de sucata, gerencie finanças e gere relatórios automaticamente.</p><p>Mais de 130 depósitos já utilizam o XLata para organizar suas operações e aumentar seus lucros. Teste grátis por 7 dias, sem necessidade de cartão de crédito.</p><ul><li>Controle de estoque por tipo de material</li><li>Registro de compras e vendas de sucata</li><li>Fluxo de caixa e relatórios financeiros</li><li>Cadastro de fornecedores e clientes</li><li>Funciona no celular e computador</li></ul>',
    },
    '/landing': {
      title: 'Sistema para Ferro Velho | XLata.site',
      desc: 'Sistema completo para gerenciar seu ferro velho. Controle estoque, compras e finanças. Teste grátis.',
      h1: 'Sistema Completo para Ferro Velho',
      content: '<p>Gerencie seu ferro velho de forma profissional com o XLata.site.</p>',
    },
    '/planos': {
      title: 'Planos e Preços | XLata.site',
      desc: 'Conheça os planos do XLata.site. A partir de R$ 97,90/mês. Teste grátis 7 dias.',
      h1: 'Planos e Preços do XLata',
      content: '<p>Escolha o plano ideal para o seu depósito de reciclagem.</p>',
    },
    '/solucoes': {
      title: 'Soluções para Ferro Velho | XLata.site',
      desc: 'Soluções completas para gestão de ferro velho e depósito de reciclagem.',
      h1: 'Soluções para Gestão de Ferro Velho',
      content: '<p>O XLata.site oferece soluções completas para todas as necessidades do seu depósito.</p>',
    },
    '/blog': {
      title: 'Blog sobre Ferro Velho e Reciclagem | XLata.site',
      desc: 'Artigos, guias e dicas sobre gestão de ferro velho, reciclagem e depósitos de sucata.',
      h1: 'Blog XLata — Ferro Velho e Reciclagem',
      content: '<p>Confira nossos artigos com dicas práticas para donos de ferro velho e depósitos de reciclagem.</p>',
    },
    '/glossario': {
      title: 'Glossário de Reciclagem e Ferro Velho | XLata.site',
      desc: 'Glossário completo com termos do setor de reciclagem, sucata e ferro velho.',
      h1: 'Glossário de Reciclagem',
      content: '<p>Conheça os termos mais usados no mercado de reciclagem e ferro velho.</p>',
    },
    '/ajuda': {
      title: 'Central de Ajuda | XLata.site',
      desc: 'Artigos de ajuda e suporte para usar o sistema XLata.',
      h1: 'Central de Ajuda XLata',
      content: '<p>Encontre respostas para suas dúvidas sobre o sistema XLata.</p>',
    },
  }

  const page = pages[path] || pages['/']
  const canonical = `https://xlata.site${path === '/' ? '' : path}`

  const softwareSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'XLata.site', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
    description: page.desc, url: 'https://xlata.site/',
    offers: { '@type': 'Offer', price: '97.90', priceCurrency: 'BRL' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '130' },
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="XLata.site">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:image" content="https://xlata.site/lovable-uploads/CAPAXLATA.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.desc)}">
  <script type="application/ld+json">${softwareSchema}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem;color:#0f172a}a{color:#059669}nav{border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:24px}nav a{color:#059669;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <nav>
    <a href="https://xlata.site">XLata.site</a> |
    <a href="https://xlata.site/blog">Blog</a> |
    <a href="https://xlata.site/planos">Planos</a> |
    <a href="https://xlata.site/glossario">Glossário</a>
  </nav>
  <main>
    <h1>${escapeHtml(page.h1)}</h1>
    ${page.content}
  </main>
  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site">XLata.site</a> — Sistema para Ferro Velho e Depósito de Reciclagem</p>
  </footer>
</body>
</html>`
}

// ── Blog post from DB ──
async function generateBlogPostHtml(slug: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, seo_title, seo_description, content_html, content_md, slug, published_at, updated_at, canonical_url, og_image, tags')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) return null

  const title = post.seo_title || post.title
  const desc = post.seo_description || ''
  const canonical = post.canonical_url || `https://xlata.site/blog/${post.slug}`
  const ogImage = post.og_image || 'https://xlata.site/lovable-uploads/CAPAXLATA.png'
  const articleContent = renderRichContent(post.content_html, post.content_md, desc)

  console.log(`[prerender] Blog post found: slug=${slug} html=${post.content_html?.length ?? 0} md=${post.content_md?.length ?? 0}`)

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: desc, url: canonical,
    image: ogImage,
    publisher: { '@type': 'Organization', name: 'XLata', url: 'https://xlata.site' },
    datePublished: post.published_at || post.updated_at,
    dateModified: post.updated_at,
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="XLata.site">
  <meta property="og:locale" content="pt_BR">
  <meta property="article:published_time" content="${post.published_at || post.updated_at || ''}">
  <meta property="article:modified_time" content="${post.updated_at || ''}">
  <script type="application/ld+json">${articleSchema}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem;color:#0f172a}h2{font-size:1.4rem;color:#1e293b}a{color:#059669}nav{border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:24px}nav a{color:#059669;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <nav>
    <a href="https://xlata.site">← XLata.site</a> | <a href="https://xlata.site/blog">Blog</a>
  </nav>
  <article>
    <h1>${escapeHtml(title)}</h1>
    ${articleContent}
    <section style="margin-top:2rem;padding:1.5rem;border:1px solid #d1fae5;border-radius:16px;background:#ecfdf5">
      <h2 style="margin-top:0">Quer profissionalizar seu ferro-velho?</h2>
      <p>Use o <a href="https://xlata.site/register">XLata.site</a> para controlar compras, estoque, fluxo de caixa e vendas com mais precisão.</p>
      <p><a href="https://xlata.site/planos">Ver planos do XLata</a> · <a href="https://xlata.site/blog">Ler mais conteúdos</a></p>
    </section>
  </article>
  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site">XLata.site</a></p>
  </footer>
</body>
</html>`
}

// ── Glossary term from DB ──
async function generateGlossaryHtml(slug: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { data: term } = await supabase
    .from('glossary_terms')
    .select('term, slug, seo_title, seo_description, short_definition, long_definition, examples, canonical_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!term) return null

  const title = term.seo_title || `${term.term} — Glossário de Reciclagem | XLata`
  const desc = term.seo_description || term.short_definition
  const canonical = term.canonical_url || `https://xlata.site/glossario/${term.slug}`

  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'DefinedTerm',
    name: term.term, description: term.short_definition,
    url: canonical,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossário de Reciclagem XLata', url: 'https://xlata.site/glossario' },
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="XLata.site">
  <script type="application/ld+json">${schema}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem;color:#0f172a}a{color:#059669}nav a{color:#059669;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <nav><a href="https://xlata.site">← XLata.site</a> | <a href="https://xlata.site/glossario">Glossário</a></nav>
  <article>
    <h1>${escapeHtml(term.term)}</h1>
    <p><strong>${escapeHtml(term.short_definition)}</strong></p>
    ${term.long_definition ? `<div>${term.long_definition}</div>` : ''}
    ${term.examples ? `<h2>Exemplos</h2><p>${escapeHtml(term.examples)}</p>` : ''}
  </article>
  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site">XLata.site</a></p>
  </footer>
</body>
</html>`
}

// ── Help article from DB ──
async function generateHelpArticleHtml(slug: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { data: article } = await supabase
    .from('help_articles')
    .select('title, slug, seo_title, seo_description, content_html, content_md, canonical_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!article) return null

  const title = article.seo_title || `${article.title} | Ajuda XLata`
  const desc = article.seo_description || ''
  const canonical = article.canonical_url || `https://xlata.site/ajuda/artigo/${article.slug}`
  const articleContent = renderRichContent(article.content_html, article.content_md, desc)

  console.log(`[prerender] Help article found: slug=${slug} html=${article.content_html?.length ?? 0} md=${article.content_md?.length ?? 0}`)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:site_name" content="XLata.site">
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem;color:#0f172a}a{color:#059669}</style>
</head>
<body>
  <nav><a href="https://xlata.site">← XLata.site</a> | <a href="https://xlata.site/ajuda">Ajuda</a></nav>
  <article>
    <h1>${escapeHtml(article.title)}</h1>
    ${articleContent}
  </article>
  <footer style="margin-top:3rem;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site">XLata.site</a></p>
  </footer>
</body>
</html>`
}

// ── Recycling page ──
function generateRecyclingHtml(stateName: string, cityName?: string): string {
  const location = cityName ? `${cityName}, ${stateName}` : stateName
  const title = cityName
    ? `Reciclagem em ${cityName}, ${stateName} | XLata.site`
    : `Reciclagem em ${stateName} | XLata.site`
  const desc = `Encontre depósitos de reciclagem e ferro-velhos em ${location}. Sistema completo para gestão de ferro velho.`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="https://xlata.site${cityName ? `/reciclagem/${stateName.toLowerCase().replace(/ /g, '-')}/${cityName.toLowerCase().replace(/ /g, '-')}` : `/reciclagem/${stateName.toLowerCase().replace(/ /g, '-')}`}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:site_name" content="XLata.site">
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e;line-height:1.7}h1{font-size:2rem}a{color:#059669}</style>
</head>
<body>
  <nav><a href="https://xlata.site">← XLata.site</a> | <a href="https://xlata.site/reciclagem">Reciclagem</a></nav>
  <h1>Reciclagem em ${escapeHtml(location)}</h1>
  <p>${escapeHtml(desc)}</p>
  <p>Use o <a href="https://xlata.site">XLata.site</a> para gerenciar seu depósito de reciclagem em ${escapeHtml(location)}.</p>
  <footer style="margin-top:3rem;text-align:center;color:#94a3b8;font-size:0.85rem">
    <p>© ${new Date().getFullYear()} <a href="https://xlata.site">XLata.site</a></p>
  </footer>
</body>
</html>`
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.searchParams.get('path') || '/'
    const userAgent = req.headers.get('user-agent') || req.headers.get('x-original-user-agent') || 'unknown'
    const forwardedHost = req.headers.get('x-forwarded-host') || 'unknown'
    
    console.log(`[prerender] Rendering path=${path} ua=${userAgent} host=${forwardedHost}`)

    let html: string | null = null

    // 1. Programmatic SEO pages: /blog/[template]-[city]-[state]
    if (path.startsWith('/blog/')) {
      const blogSlug = path.replace('/blog/', '')
      const parsed = parseProgrammaticUrl(blogSlug)
      
      if (parsed) {
        console.log(`[prerender] Programmatic page: template=${parsed.template} city=${parsed.citySlug} state=${parsed.stateAbbr}`)
        html = generateProgrammaticContent(parsed.citySlug, parsed.stateAbbr, parsed.template)
      } else {
        // Try DB blog post
        html = await generateBlogPostHtml(blogSlug)
      }
      
      // Fallback to blog listing
      if (!html) {
        html = generateStaticPageHtml('/blog')
      }
    }
    // 2. Glossary pages
    else if (path.startsWith('/glossario/')) {
      const slug = path.replace('/glossario/', '')
      html = await generateGlossaryHtml(slug)
      if (!html) html = generateStaticPageHtml('/glossario')
    }
    // 3. Help articles
    else if (path.startsWith('/ajuda/artigo/')) {
      const slug = path.replace('/ajuda/artigo/', '')
      html = await generateHelpArticleHtml(slug)
      if (!html) html = generateStaticPageHtml('/ajuda')
    }
    // 4. Recycling pages
    else if (path.startsWith('/reciclagem/')) {
      const parts = path.replace('/reciclagem/', '').split('/')
      const stateName = cityNameFromSlug(parts[0])
      const cityName = parts[1] ? cityNameFromSlug(parts[1]) : undefined
      html = generateRecyclingHtml(stateName, cityName)
    }
    // 5. Static pages
    else {
      html = generateStaticPageHtml(path)
    }

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'content-type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        'Vary': 'User-Agent, Accept-Encoding',
        'X-Prerendered': 'true',
      },
    })
  } catch (error) {
    console.error('[prerender] Error:', error)
    return new Response(generateStaticPageHtml('/'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
})
