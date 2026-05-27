/**
 * Conteúdo central do Guia do CMS Blog.
 * Fonte única de verdade — usado pelo componente interativo (BlogGuidePanel)
 * e pelo gerador de PDF (download manual completo).
 *
 * Mantenha aqui qualquer texto explicativo de funcionalidade.
 */

export type GuideStep = {
  title: string;
  detail: string;
};

export type GuideSection = {
  /** id usado para anchors e busca (ex.: 'criar-manual') */
  id: string;
  /** rótulo curto para a sidebar e índice do PDF */
  label: string;
  /** título completo da seção */
  title: string;
  /** grupo (mesma chave usada na sidebar do CMS) */
  group: 'visao-geral' | 'conteudo' | 'ia' | 'seo' | 'monitoramento' | 'sistema';
  /** frase curta de apoio para cards */
  tagline: string;
  /** parágrafo explicando para que serve */
  whatItDoes: string;
  /** quando faz sentido usar */
  whenToUse: string;
  /** passo a passo numerado */
  steps: GuideStep[];
  /** dicas práticas */
  tips?: string[];
  /** alertas/limitações */
  warnings?: string[];
};

export type GuideGroup = {
  id: GuideSection['group'];
  title: string;
  description: string;
};

export const GUIDE_GROUPS: GuideGroup[] = [
  {
    id: 'visao-geral',
    title: 'Visão Geral',
    description:
      'Painéis de leitura: receita, tráfego estimado e oportunidades de escala. Comece o dia por aqui.',
  },
  {
    id: 'conteudo',
    title: 'Conteúdo',
    description:
      'Onde você cria e gerencia tudo que é publicado no site: posts do blog, artigos de ajuda, glossário e páginas-pilar.',
  },
  {
    id: 'ia',
    title: 'Inteligência IA',
    description:
      'Ferramentas que usam IA para criar, auditar, otimizar e operar o blog em escala. O cérebro do sistema.',
  },
  {
    id: 'seo',
    title: 'SEO',
    description:
      'Configurações de SEO técnico, descoberta de palavras-chave e ajustes que afetam como o Google entende o site.',
  },
  {
    id: 'monitoramento',
    title: 'Monitoramento',
    description:
      'Acompanhamento diário: posições no Google, status de indexação e alertas de queda.',
  },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  // ============== VISÃO GERAL ==============
  {
    id: 'receita',
    label: 'Receita',
    title: 'Receita por Artigo',
    group: 'visao-geral',
    tagline: 'Quanto cada artigo trouxe de retorno real.',
    whatItDoes:
      'Painel de atribuição financeira: cruza visitas com conversões e mostra quanto cada artigo gerou de receita estimada. Usa atribuição de primeiro toque — o artigo que trouxe o usuário leva o crédito.',
    whenToUse:
      'No início do mês, para decidir quais artigos merecem mais investimento (atualizações, links internos, escalada por IA) e quais podem ser arquivados.',
    steps: [
      {
        title: 'Selecione o período',
        detail: 'Escolha o intervalo (últimos 30 dias é o padrão recomendado).',
      },
      {
        title: 'Ordene por receita',
        detail: 'Clique no cabeçalho da coluna Receita para ver os top performers.',
      },
      {
        title: 'Identifique os artigos âncora',
        detail:
          'Os 3-5 artigos do topo são suas "money pages". Eles devem receber atualizações trimestrais.',
      },
      {
        title: 'Use o estimador para os baixos',
        detail:
          'Artigos com receita zero mas alto tráfego: leve para o Otimizador. Sem tráfego e sem receita: candidatos a desativação.',
      },
    ],
    tips: [
      'A atribuição é de primeiro toque: o primeiro artigo que o visitante leu leva o crédito mesmo se converter dias depois.',
      'Combine com o painel Estimador para projetar quanto um artigo PODE gerar.',
    ],
  },
  {
    id: 'estimador',
    label: 'Estimador',
    title: 'Estimador de Tráfego e Receita',
    group: 'visao-geral',
    tagline: 'Projeção baseada em IA do potencial de cada artigo.',
    whatItDoes:
      'A IA analisa o título, intenção de busca e volume estimado da palavra-chave principal de cada artigo e projeta tráfego mensal e receita potencial caso ele ranqueie no top 3 do Google.',
    whenToUse:
      'Antes de decidir se vale a pena investir energia em otimizar um artigo. Ou para priorizar a fila de criação: foque primeiro nos temas com maior potencial.',
    steps: [
      {
        title: 'Abra o Estimador',
        detail: 'Lista todos os artigos publicados com colunas de potencial estimado.',
      },
      {
        title: 'Filtre por "Money Pages"',
        detail:
          'Use o filtro para mostrar apenas artigos com alta intenção comercial (compra/contratação).',
      },
      {
        title: 'Compare Real vs Potencial',
        detail:
          'Artigos com grande gap entre receita real e potencial são os melhores candidatos para o Otimizador.',
      },
    ],
    tips: ['As estimativas são projeções, não garantias. Use como bússola, não como mapa.'],
  },
  {
    id: 'escalador',
    label: 'Escalador',
    title: 'Escalador de Conteúdo',
    group: 'visao-geral',
    tagline: 'Multiplica artigos vencedores em variações.',
    whatItDoes:
      'Identifica artigos que já performam bem e gera automaticamente variações (long-tails, ângulos diferentes, versões para outras cidades) sem canibalizar o original.',
    whenToUse:
      'Quando um artigo está estável no top 5 e você quer expandir a cobertura sem criar conteúdo do zero.',
    steps: [
      {
        title: 'Escolha um artigo âncora',
        detail: 'Pegue um do topo do painel Receita ou Rankings.',
      },
      {
        title: 'Gere variações',
        detail:
          'A IA sugere 3-5 ângulos relacionados. Você aprova quais devem virar artigos.',
      },
      {
        title: 'Adiciona à Fila de Jobs',
        detail: 'Os aprovados entram na fila e são produzidos em sequência.',
      },
    ],
    warnings: [
      'Escalar artigos ruins só multiplica o problema. Só escale quem já está performando.',
    ],
  },

  // ============== CONTEÚDO ==============
  {
    id: 'blog',
    label: 'Blog',
    title: 'Gerenciar Posts do Blog',
    group: 'conteudo',
    tagline: 'A central de todos os posts publicados ou em rascunho.',
    whatItDoes:
      'Lista, busca, filtra, edita, publica, despublica, destaca e remove posts do blog. Mostra status (publicado, rascunho), categoria, data e número de visualizações.',
    whenToUse:
      'Sempre que quiser revisar um post existente, mudar status, alterar destaque ou gerenciar categorias.',
    steps: [
      {
        title: 'Buscar um post',
        detail: 'Use a barra de busca pelo título. Filtros por status e categoria estão acima.',
      },
      {
        title: 'Editar inline',
        detail:
          'Clique no ícone de lápis. O editor abre com o conteúdo, imagens, SEO e categorias do post.',
      },
      {
        title: 'Publicar / Despublicar',
        detail:
          'Use o badge de status. Publicar define published_at e disponibiliza no site público.',
      },
      {
        title: 'Destacar',
        detail: 'A estrela marca o post como "Em Destaque" — aparece com prioridade na home do blog.',
      },
      {
        title: 'Categorias',
        detail:
          'A aba Categorias gerencia as 11 categorias do blog. Posts sem categoria caem em "Geral".',
      },
    ],
    tips: [
      'O ícone de duplicar cria um rascunho copiando todo o conteúdo — útil para versões alternativas.',
      'Posts publicados são reindexados automaticamente; alterações grandes podem levar horas para refletir no Google.',
    ],
  },
  {
    id: 'criar-manual',
    label: 'Criar Manual',
    title: 'Criar Artigo Manual (passo a passo)',
    group: 'conteudo',
    tagline: 'Para quando você quer escrever do zero, com controle total.',
    whatItDoes:
      'Editor completo de artigo. Você escreve título, conteúdo (rich text), define categoria, imagem de capa, SEO (meta título, meta descrição, slug), tags e CTAs.',
    whenToUse:
      'Quando o tema é estratégico, sensível ou exige sua voz pessoal. Casos: posicionamento, anúncios, casos de cliente, opinião do dono.',
    steps: [
      {
        title: 'Defina o título',
        detail: 'Curto, claro, com a palavra-chave principal nos primeiros 60 caracteres.',
      },
      {
        title: 'Escreva o conteúdo',
        detail:
          'Use H2/H3 para estruturar. O sistema avisa se faltarem subtítulos ou se o texto estiver curto demais (< 800 palavras).',
      },
      {
        title: 'Configure SEO',
        detail:
          'Meta descrição com 140-160 caracteres. Slug curto, em minúsculas, com hífen. URL canônica é gerada automaticamente.',
      },
      {
        title: 'Adicione imagem de capa',
        detail:
          'Recomendado 1200×630 px (Open Graph). Sem imagem, o sistema usa fallback do tema.',
      },
      {
        title: 'Salvar como rascunho ou publicar',
        detail: 'Rascunho fica visível só pra você. Publicar sobe imediatamente para o site.',
      },
    ],
    tips: [
      'Sempre que possível, deixe o conteúdo passar pelo Otimizador depois — ele sugere CTAs e links internos.',
      'Você pode agendar a publicação (campo "Publicar em") para distribuir lançamentos.',
    ],
  },
  {
    id: 'fila-jobs',
    label: 'Fila de Jobs',
    title: 'Fila de Geração Automática de Artigos',
    group: 'ia',
    tagline: 'Os próximos artigos que a IA vai criar — em ordem.',
    whatItDoes:
      'Lista temas/keywords aguardando produção pela IA. Cada item tem prioridade (1-10), categoria, palavra-chave alvo e status (na fila, processando, concluído, falhou).',
    whenToUse:
      'Para planejar o calendário editorial: você prepara 15-30 temas e a IA processa um a um respeitando a ordem e os limites de rate.',
    steps: [
      {
        title: 'Adicionar tema',
        detail:
          'Pelo botão "Novo Job" ou pela aba Keywords (descobertas pela IA viram jobs com 1 clique).',
      },
      {
        title: 'Definir prioridade',
        detail:
          'Temas com alta intenção comercial recebem 8-10. Reforço de cluster recebe 4-6. Long-tails experimentais 1-3.',
      },
      {
        title: 'Acompanhar status',
        detail:
          'Em processamento mostra logs em tempo real. Falhou mostra a mensagem do Gemini (geralmente rate limit 429 — basta reprocessar depois).',
      },
      {
        title: 'Aprovar ou rejeitar',
        detail:
          'Quando concluído, o artigo entra como rascunho. Você revisa, edita se quiser, e publica.',
      },
    ],
    warnings: [
      'O processamento respeita os limites do Gemini API. Em momentos de pico, jobs podem ficar em "aguardando" por minutos.',
    ],
  },
  {
    id: 'agendador',
    label: 'Agendador',
    title: 'Agendamento de Publicação',
    group: 'conteudo',
    tagline: 'Distribui publicações ao longo do tempo automaticamente.',
    whatItDoes:
      'Cada artigo (manual ou gerado pela IA) tem um campo "Publicar em". Quando essa data chega, um cron promove o status de "rascunho" para "publicado" e dispara reindexação.',
    whenToUse:
      'Para manter cadência consistente sem precisar publicar manualmente todo dia. Ideal: 1-2 publicações por dia.',
    steps: [
      {
        title: 'Edite um rascunho',
        detail: 'Abra o post no editor.',
      },
      {
        title: 'Defina "Publicar em"',
        detail: 'Selecione data e hora futuras. O status fica "agendado".',
      },
      {
        title: 'Acompanhe na lista',
        detail: 'Posts agendados aparecem com badge azul "Agendado" e a data marcada.',
      },
    ],
    tips: [
      'Agendar para horários de pico (8h, 12h, 19h) tem retorno marginal melhor do que madrugada.',
      'Se o cron falhar, o artigo é promovido na próxima rodada (a cada 15 min).',
    ],
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    title: 'Artigos de Ajuda',
    group: 'conteudo',
    tagline: 'Base de conhecimento para o usuário final.',
    whatItDoes:
      'Diferente do blog (foco SEO/conversão), os artigos de ajuda têm foco em explicar como usar funcionalidades do sistema. Aparecem na rota /ajuda do site.',
    whenToUse:
      'Quando precisar documentar fluxo de uso, FAQ ou tutorial passo a passo de uma funcionalidade do sistema.',
    steps: [
      {
        title: 'Criar novo artigo de ajuda',
        detail: 'Botão "Novo Artigo" — campos: título, categoria, conteúdo, ordem.',
      },
      {
        title: 'Organizar por categoria',
        detail:
          'Ex: "Primeiros passos", "Caixa", "Estoque". A ordem dentro da categoria define o que aparece primeiro.',
      },
      {
        title: 'Publicar',
        detail: 'Após salvar, fica disponível em /ajuda imediatamente.',
      },
    ],
  },
  {
    id: 'glossario',
    label: 'Glossário',
    title: 'Glossário do Setor',
    group: 'conteudo',
    tagline: 'Termos técnicos da indústria explicados.',
    whatItDoes:
      'Verbete de glossário com termo + definição. Ranqueia para buscas como "o que é tara", "o que é CNAE 38.11" etc. Cada verbete vira uma página /glossario/[slug].',
    whenToUse:
      'Para capturar buscas informacionais de cauda longa (alta volume, baixa concorrência) e construir autoridade temática.',
    steps: [
      {
        title: 'Adicionar termo',
        detail: 'Termo curto, definição em 2-4 parágrafos, exemplo prático opcional.',
      },
      {
        title: 'Categorizar',
        detail: 'Ajuda na navegação interna do glossário.',
      },
      {
        title: 'Linkar do blog',
        detail:
          'Sempre que um post mencionar o termo, o sistema sugere link automático para o verbete (interlinking).',
      },
    ],
  },
  {
    id: 'solucoes',
    label: 'Soluções',
    title: 'Páginas-Pilar (Soluções)',
    group: 'conteudo',
    tagline: 'Páginas de autoridade que conectam um cluster de posts.',
    whatItDoes:
      'Páginas longas (3.000+ palavras) que cobrem um tema-mãe inteiro e linkam todos os posts relacionados. Estratégia "topic cluster" para autoridade temática.',
    whenToUse:
      'Quando você tem 8+ posts sobre um tema relacionado e quer um hub que ranqueie para a palavra-chave principal e centralize a navegação.',
    steps: [
      {
        title: 'Identifique o tema-mãe',
        detail: 'Ex: "Sucata de Cobre", "Licença Ambiental", "Gestão de Ferro Velho".',
      },
      {
        title: 'Crie a pilar',
        detail:
          'Editor longo, estruturado por capítulos (H2). Cada H2 deve linkar para um post relacionado.',
      },
      {
        title: 'Atualize trimestralmente',
        detail:
          'Pilares envelhecem rápido. Releia a cada 3 meses e adicione posts novos do cluster.',
      },
    ],
  },

  // ============== INTELIGÊNCIA IA ==============
  {
    id: 'auditoria',
    label: 'Auditoria IA',
    title: 'Auditoria Inteligente do Conteúdo',
    group: 'ia',
    tagline: 'Score 0-100 para cada artigo, com plano de ação.',
    whatItDoes:
      'A IA analisa o blog inteiro em 6 blocos (estrutura, SEO, autoridade, CTAs, links internos, dados estruturados) e gera um Health Score. Categoriza artigos em "Estrelas", "Potenciais", "Em Risco" e "Arquivar".',
    whenToUse:
      'Mensalmente. É a forma mais rápida de saber onde investir energia: corrigir os "Em Risco", escalar os "Estrelas" e descartar os "Arquivar".',
    steps: [
      {
        title: 'Rodar a auditoria',
        detail: 'Botão "Iniciar Auditoria". Dura 2-5 min para um blog de até 100 artigos.',
      },
      {
        title: 'Ler o Health Score geral',
        detail: 'Acima de 75 = saudável. Entre 50-75 = atenção. Abaixo de 50 = ação urgente.',
      },
      {
        title: 'Filtrar por categoria de ação',
        detail:
          'Comece pelos "Em Risco" — geralmente são quick wins (faltando CTA, meta description curta).',
      },
      {
        title: 'Aplicar correções',
        detail:
          'Cada artigo tem botão "Otimizar" que envia para o Otimizador com as recomendações já carregadas.',
      },
    ],
  },
  {
    id: 'motor-ia',
    label: 'Motor IA',
    title: 'Motor de Crescimento Autônomo',
    group: 'ia',
    tagline: 'O blog se otimiza sozinho, dentro de regras.',
    whatItDoes:
      'Com o motor LIGADO, o sistema roda em loop: identifica artigos em "strike zone" (posições 5-20 no Google), aplica otimizações automáticas (CTAs, links internos, meta tags) e mede impacto. Reverte alterações que pioraram a posição.',
    whenToUse:
      'Quando o blog tem volume suficiente (50+ artigos) e você quer ganho marginal contínuo sem trabalho manual diário.',
    steps: [
      {
        title: 'Configure as regras',
        detail:
          'Defina exclusões (artigos top-5 e high-converters NÃO devem ser tocados pela automação).',
      },
      {
        title: 'Ligue o motor',
        detail: 'Toggle no topo. Roda 1x por dia em horário de baixa demanda.',
      },
      {
        title: 'Acompanhe o log',
        detail:
          'Cada otimização tem antes/depois e impacto medido após 7 dias. Você pode reverter com 1 clique.',
      },
    ],
    warnings: [
      'O motor consome créditos do Gemini. Em planos com cota mensal, verifique o uso antes de deixar ligado por longos períodos.',
      'Sempre exclua suas "money pages" das regras automáticas.',
    ],
  },
  {
    id: 'copy-ia',
    label: 'Copy IA',
    title: 'Copy Adaptativa por Comportamento',
    group: 'ia',
    tagline: 'CTAs e títulos que mudam conforme quem está lendo.',
    whatItDoes:
      'A IA ajusta dinamicamente CTAs e chamadas com base no comportamento do visitante (origem do tráfego, página anterior, dispositivo, horário). Variações de melhor desempenho são escaladas automaticamente.',
    whenToUse:
      'Para artigos com tráfego consistente (>500 visitas/mês). Sem volume, não há dados suficientes para a IA escolher a variação vencedora.',
    steps: [
      {
        title: 'Crie variações',
        detail: 'Pelo menos 3 variações de CTA por artigo. A IA testa em rotação.',
      },
      {
        title: 'Defina segmentos',
        detail: 'Ex: tráfego mobile vê CTA curto. Tráfego de "como fazer" vê CTA educativo.',
      },
      {
        title: 'Acompanhe ganhos',
        detail: 'Painel mostra qual variação venceu por segmento e o lift de conversão.',
      },
    ],
  },
  {
    id: 'prompts-ia',
    label: 'Prompts IA',
    title: 'Gerenciador de Prompts',
    group: 'ia',
    tagline: 'A "voz" da IA — ajuste aqui o tom de tudo que ela escreve.',
    whatItDoes:
      'Cada operação da IA (gerar artigo, otimizar, escalar, auditoria) usa um prompt-base. Aqui você edita esses prompts: tom, regras de estrutura, instruções específicas (ex: "sempre incluir 4 CTAs", "evitar primeira pessoa").',
    whenToUse:
      'Quando perceber padrões indesejados nos artigos gerados (tom genérico, abertura repetitiva, falta de exemplos locais).',
    steps: [
      {
        title: 'Escolha o prompt',
        detail: 'Lista mostra os prompts ativos por funcionalidade.',
      },
      {
        title: 'Edite com cuidado',
        detail:
          'Sempre teste com 1 artigo após editar. Mudanças sutis no prompt causam impacto grande.',
      },
      {
        title: 'Versione',
        detail: 'O sistema guarda versões anteriores. Reverter é instantâneo.',
      },
    ],
    warnings: [
      'Prompts mal escritos podem fazer a IA produzir conteúdo de baixa qualidade ou off-topic. Edite incrementalmente.',
    ],
  },
  {
    id: 'otimizador',
    label: 'Otimizador',
    title: 'Otimizador Inteligente de Conteúdo',
    group: 'ia',
    tagline: 'Melhora artigos existentes na "strike zone" do Google.',
    whatItDoes:
      'Identifica artigos em posições 5-20 (ou com alta impressão / baixa CTR) e gera melhorias específicas: novos H2s, CTAs mais fortes, links internos, refresh de exemplos, atualização de dados.',
    whenToUse:
      'Quando você quer ganhar posições rápido sem criar conteúdo do zero. Otimizar é 5x mais barato que criar.',
    steps: [
      {
        title: 'Carregar candidatos',
        detail:
          'O painel já filtra automaticamente artigos elegíveis (strike zone ou high-impression-low-CTR).',
      },
      {
        title: 'Revisar sugestões',
        detail:
          'Para cada artigo, a IA mostra mudanças propostas com diff (antes/depois). Você aprova item por item.',
      },
      {
        title: 'Aplicar e medir',
        detail:
          'Após aplicar, o sistema mede a posição em 7-14 dias e mostra o ganho. Reverte automaticamente se piorar.',
      },
    ],
  },

  // ============== SEO ==============
  {
    id: 'seo',
    label: 'SEO',
    title: 'SEO Técnico Geral',
    group: 'seo',
    tagline: 'Sitemap, robots.txt, JSON-LD, canonicals.',
    whatItDoes:
      'Centraliza toda a configuração SEO da plataforma: validar sitemap, regerar manualmente, ver status de robots.txt, dados estruturados aplicados (FAQ, Article, BreadcrumbList).',
    whenToUse:
      'Após mudanças estruturais (nova categoria, mudança de domínio, alteração de URL).',
    steps: [
      {
        title: 'Validar sitemap',
        detail: 'Botão "Validar" — verifica se todas as URLs retornam 200 e estão no índice.',
      },
      {
        title: 'Inspecionar robots.txt',
        detail:
          'Mostra a versão atual servida. Bloqueia áreas privadas; permite Googlebot na área pública.',
      },
      {
        title: 'Forçar regeneração',
        detail:
          'Em geral o sistema regenera sozinho. Botão de força é para casos de cache problemático.',
      },
    ],
  },
  {
    id: 'keywords',
    label: 'Keywords',
    title: 'Descoberta Automática de Keywords',
    group: 'seo',
    tagline: 'A IA acha gaps de conteúdo e long-tails que vale a pena cobrir.',
    whatItDoes:
      'Analisa: posições atuais, concorrentes, dúvidas frequentes (Google "People Also Ask"), tendências sazonais. Gera lista priorizada de keywords e empurra para a Fila de Jobs.',
    whenToUse:
      'Quinzenalmente. É a fonte principal do calendário editorial automatizado.',
    steps: [
      {
        title: 'Rodar descoberta',
        detail: 'Botão "Descobrir Novas Keywords". Demora 1-3 min.',
      },
      {
        title: 'Revisar a lista',
        detail:
          'Cada keyword vem com volume estimado, dificuldade, intenção (informacional/comercial/transacional).',
      },
      {
        title: 'Aprovar para a fila',
        detail:
          'Aprovar move para Fila de Jobs com prioridade calculada automaticamente.',
      },
    ],
  },

  // ============== MONITORAMENTO ==============
  {
    id: 'rankings',
    label: 'Rankings',
    title: 'Rastreamento de Posições',
    group: 'monitoramento',
    tagline: 'Onde cada artigo está no Google, hoje.',
    whatItDoes:
      'Verifica diariamente (via Google Custom Search) a posição de cada artigo para sua keyword principal. Histórico de até 90 dias. Alerta automaticamente em quedas bruscas.',
    whenToUse:
      'Diariamente para um overview rápido. Em profundidade, semanalmente, para analisar tendências.',
    steps: [
      {
        title: 'Ver dashboard de rankings',
        detail:
          'Distribuição: top-3, top-10, top-20, top-50, fora. Gráfico de evolução por semana.',
      },
      {
        title: 'Filtrar por movimento',
        detail:
          'Subiu / Caiu / Estável. "Caiu" merece análise imediata (penalização? canibalização? concorrente?).',
      },
      {
        title: 'Agir em quedas',
        detail:
          'Artigos que caíram >5 posições viram candidatos automáticos do Otimizador.',
      },
    ],
  },
  {
    id: 'indexacao',
    label: 'Indexação',
    title: 'Status de Indexação',
    group: 'monitoramento',
    tagline: 'O Google realmente indexou seus artigos?',
    whatItDoes:
      'Verifica se cada URL está indexada (busca site:dominio.com/url). Alerta para artigos publicados há >7 dias e ainda não indexados — geralmente indica problema de qualidade ou bloqueio.',
    whenToUse:
      'Semanalmente. Especialmente após publicar lotes grandes.',
    steps: [
      {
        title: 'Rodar verificação',
        detail: 'Botão "Verificar Indexação" — faz a varredura em background.',
      },
      {
        title: 'Filtrar não-indexados',
        detail: 'A lista de "Não indexados há >7 dias" é a mais importante.',
      },
      {
        title: 'Ações de remediação',
        detail:
          'Para cada não-indexado: ver se tem noindex acidental, se há thin content, ou se foi marcado como duplicate.',
      },
    ],
  },
];

/** Helpers */
export function getSectionsByGroup(group: GuideSection['group']) {
  return GUIDE_SECTIONS.filter((s) => s.group === group);
}

export function findSection(id: string) {
  return GUIDE_SECTIONS.find((s) => s.id === id);
}
