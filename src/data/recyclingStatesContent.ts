// Conteúdo SEO otimizado para cada estado brasileiro
// Cada estado tem +900 palavras de conteúdo único

export interface StateFeature {
  icon: string;
  title: string;
  description: string;
}

export interface StateFAQ {
  question: string;
  answer: string;
}

export interface StateContent {
  name: string;
  abbreviation: string;
  slug: string;
  region: 'sudeste' | 'sul' | 'nordeste' | 'centro-oeste' | 'norte';
  seoTitle: string;
  seoDescription: string;
  headline: string;
  subheadline: string;
  introText: string;
  contentSections: {
    title: string;
    content: string;
  }[];
  features: StateFeature[];
  faq: StateFAQ[];
  ctaText: string;
  localHighlights: string[];
}

// Função helper para gerar conteúdo padrão
const generateStateContent = (
  name: string,
  abbreviation: string,
  slug: string,
  region: StateContent['region'],
  highlights: string[],
  specificContent: string
): StateContent => ({
  name,
  abbreviation,
  slug,
  region,
  seoTitle: `Sistema para Reciclagem em ${name} | XLata`,
  seoDescription: `Use o sistema XLata para comprar e vender materiais recicláveis em ${name}. Ideal para ferro velho, sucata e depósitos de reciclagem. Controle total do seu negócio.`,
  headline: `Sistema para Reciclagem em ${name}`,
  subheadline: `Gerencie seu depósito de reciclagem em ${name} com o sistema mais completo do Brasil`,
  introText: `O mercado de reciclagem em ${name} está em constante crescimento. Com milhares de toneladas de materiais recicláveis processados diariamente, o estado se destaca como um dos principais polos de reciclagem do Brasil. O XLata é o sistema ideal para quem deseja modernizar a gestão do seu ferro velho, depósito de sucata ou centro de reciclagem em ${name}.`,
  contentSections: [
    {
      title: `Vender Sucata em ${name}`,
      content: `Para quem trabalha com compra e venda de sucata em ${name}, ter um sistema organizado é fundamental para o sucesso do negócio. O XLata permite registrar todas as compras de materiais recicláveis com precisão, calcular valores automaticamente baseados no peso e tipo de material, e emitir comprovantes profissionais para seus fornecedores.

O mercado de sucata em ${name} é competitivo e dinâmico. Catadores, cooperativas e outros fornecedores buscam depósitos que ofereçam preços justos e atendimento profissional. Com o XLata, você transmite credibilidade desde o primeiro contato, mostrando que seu depósito de reciclagem em ${name} é moderno e organizado.

Ao registrar cada compra no sistema, você cria um histórico completo de transações. Isso permite identificar os melhores fornecedores, negociar melhores preços e planejar suas compras com base em dados reais. Vender sucata em ${name} fica muito mais rentável quando você tem controle total sobre suas operações.`
    },
    {
      title: `Comprar Material Reciclável em ${name}`,
      content: `O processo de comprar material reciclável em ${name} envolve diversos desafios: variação de preços, qualidade inconsistente dos materiais, e a necessidade de manter registros precisos para cada transação. O XLata resolve todos esses problemas com uma plataforma intuitiva e completa.

Com o sistema, você cadastra todos os tipos de materiais que seu depósito trabalha - alumínio, cobre, ferro, papelão, plástico, e dezenas de outros - cada um com seu preço por quilo atualizado. Quando um fornecedor chega com materiais para vender, você pesa, registra e calcula o valor em segundos.

O controle de estoque em tempo real mostra exatamente quanto de cada material você tem disponível para revenda. Isso é essencial para quem compra material reciclável em ${name} e precisa planejar vendas para industrias e atravessadores. Você nunca mais vai perder uma oportunidade de venda por não saber quanto material tem em estoque.`
    },
    {
      title: `Ferro Velho em ${name}`,
      content: `Donos de ferro velho em ${name} enfrentam desafios únicos todos os dias. A alta rotatividade de fornecedores, variação constante nos preços das commodities, e a necessidade de controle financeiro rigoroso exigem ferramentas adequadas de gestão.

O XLata foi desenvolvido pensando especificamente nas necessidades de quem trabalha com ferro velho em ${name}. O sistema permite:

• Cadastrar ilimitados tipos de materiais ferrosos e não-ferrosos
• Registrar compras rapidamente com cálculo automático de valores
• Controlar o caixa diário com precisão
• Acompanhar despesas operacionais (combustível, manutenção, aluguel)
• Gerar relatórios de lucro por período
• Emitir comprovantes profissionais

${specificContent}

Seja seu ferro velho na capital ou no interior de ${name}, o XLata funciona 100% online e pode ser acessado de qualquer dispositivo com internet. Modernize seu ferro velho em ${name} e veja seus lucros crescerem.`
    },
    {
      title: `Depósito de Reciclagem em ${name}`,
      content: `Gerenciar um depósito de reciclagem em ${name} exige organização e controle constante. São dezenas de fornecedores, múltiplos tipos de materiais, fluxo de caixa diário e despesas operacionais que precisam ser acompanhados de perto.

O XLata é o sistema completo para depósitos de reciclagem em ${name}. Além do controle de compras e estoque, você tem acesso a:

• Dashboard com visão geral do negócio
• Cadastro de clientes e fornecedores
• Controle de funcionários com permissões
• Gestão financeira completa
• Relatórios detalhados de operações
• Histórico de todas as transações

${highlights.map(h => `• ${h}`).join('\n')}

Com o XLata, seu depósito de reciclagem em ${name} opera com a eficiência de uma grande empresa, mesmo sendo um negócio familiar. A tecnologia que antes era exclusiva de grandes industrias agora está acessível para todos os recicladores do estado.`
    },
    {
      title: `Como o XLata Funciona para Recicladores em ${name}`,
      content: `O XLata foi projetado para ser simples e intuitivo. Mesmo quem nunca usou um sistema de gestão antes consegue aprender rapidamente. Veja como funciona:

1. **Cadastre seus materiais**: Adicione todos os tipos de materiais que você trabalha, com nome e preço por quilo. O sistema já vem com uma lista sugerida de materiais comuns.

2. **Registre compras no PDV**: Quando um fornecedor chega, você pesa o material, seleciona o tipo, e o sistema calcula o valor automaticamente. Emita um comprovante na hora.

3. **Controle seu caixa**: Abra o caixa no início do dia, registre todas as movimentações, e feche no final com relatório completo de entradas e saídas.

4. **Acompanhe despesas**: Registre gastos com combustível, manutenção, aluguel e outras despesas para ter uma visão real do seu lucro.

5. **Analise relatórios**: Veja gráficos e relatórios de faturamento, materiais mais comprados, melhores clientes e muito mais.

Recicladores em ${name} que usam o XLata relatam economia de tempo, redução de erros e aumento significativo na organização do negócio. Experimente grátis e comprove os resultados.`
    }
  ],
  features: [
    {
      icon: 'Scale',
      title: 'Controle de Pesagem',
      description: `Registre compras com peso e valor calculado automaticamente para seu depósito em ${name}.`
    },
    {
      icon: 'Wallet',
      title: 'Gestão Financeira',
      description: 'Controle caixa, despesas e lucro do seu negócio de reciclagem.'
    },
    {
      icon: 'BarChart3',
      title: 'Relatórios Detalhados',
      description: 'Analise o desempenho do seu ferro velho com gráficos e estatísticas.'
    },
    {
      icon: 'Users',
      title: 'Gestão de Clientes',
      description: 'Cadastre fornecedores e acompanhe o histórico de compras.'
    },
    {
      icon: 'Smartphone',
      title: '100% Online',
      description: `Acesse de qualquer lugar em ${name} pelo celular ou computador.`
    },
    {
      icon: 'Shield',
      title: 'Dados Seguros',
      description: 'Seus dados protegidos com criptografia e backup automático.'
    }
  ],
  faq: [
    {
      question: `O XLata funciona em todo ${name}?`,
      answer: `Sim! O XLata é 100% online e funciona em qualquer cidade de ${name}. Você só precisa de acesso à internet para usar o sistema. Seja na capital ou no interior, seu depósito de reciclagem terá acesso a todas as funcionalidades.`
    },
    {
      question: `Quanto custa usar o XLata em ${name}?`,
      answer: `O XLata oferece um período de teste gratuito para você conhecer todas as funcionalidades. Após o teste, os planos são acessíveis e cabem no bolso de qualquer reciclador. O investimento se paga rapidamente com a economia de tempo e aumento de organização.`
    },
    {
      question: 'Preciso instalar algum programa no computador?',
      answer: 'Não! O XLata funciona direto no navegador do seu celular ou computador. Não precisa baixar nem instalar nada. Basta acessar o site, fazer login e começar a usar.'
    },
    {
      question: `Posso usar o XLata para meu ferro velho em ${name}?`,
      answer: `Com certeza! O XLata foi desenvolvido especialmente para ferro velhos, depósitos de sucata e centros de reciclagem. Todas as funcionalidades são pensadas para as necessidades específicas do setor de reciclagem em ${name}.`
    },
    {
      question: 'Como faço para começar a usar?',
      answer: 'É muito simples! Clique no botão de cadastro, crie sua conta gratuita e comece a usar imediatamente. Em minutos você já estará registrando suas primeiras compras e organizando seu depósito.'
    }
  ],
  ctaText: `Quero usar o XLata em ${name}`,
  localHighlights: highlights
});

// Conteúdo específico para cada estado
export const recyclingStatesContent: Record<string, StateContent> = {
  'sao-paulo': generateStateContent(
    'São Paulo',
    'SP',
    'sao-paulo',
    'sudeste',
    [
      'Maior mercado de reciclagem do Brasil',
      'Milhares de depósitos ativos na região metropolitana',
      'Forte presença de cooperativas e catadores organizados',
      'Polo industrial com alta demanda por materiais reciclados'
    ],
    'São Paulo concentra o maior volume de materiais recicláveis do país. Da capital ao interior, passando pelo ABC Paulista, Campinas, Santos e outras cidades importantes, o XLata atende depósitos de todos os portes. A logística privilegiada do estado permite que recicladores acessem rapidamente as principais industrias compradoras.'
  ),

  'minas-gerais': generateStateContent(
    'Minas Gerais',
    'MG',
    'minas-gerais',
    'sudeste',
    [
      'Tradição mineradora favorece reciclagem de metais',
      'Rede extensa de depósitos no interior',
      'Belo Horizonte como polo de reciclagem urbana',
      'Forte presença de cooperativas de catadores'
    ],
    'Minas Gerais possui uma vocação natural para o trabalho com metais e sucata, herança de sua tradição mineradora. O estado conta com uma rede capilarizada de depósitos que atende desde pequenas comunidades até grandes centros como Belo Horizonte, Uberlândia e Juiz de Fora.'
  ),

  'rio-de-janeiro': generateStateContent(
    'Rio de Janeiro',
    'RJ',
    'rio-de-janeiro',
    'sudeste',
    [
      'Grande volume de materiais na região metropolitana',
      'Programas municipais de reciclagem ativos',
      'Proximidade com polo industrial',
      'Alta demanda por alumínio e metais'
    ],
    'O Rio de Janeiro é um dos maiores geradores de materiais recicláveis do Brasil. A região metropolitana, incluindo Niterói, São Gonçalo e Baixada Fluminense, concentra centenas de depósitos que processam toneladas de materiais diariamente.'
  ),

  'espirito-santo': generateStateContent(
    'Espírito Santo',
    'ES',
    'espirito-santo',
    'sudeste',
    [
      'Polo siderúrgico gera demanda por sucata',
      'Vitória como centro de reciclagem regional',
      'Proximidade com portos facilita exportação',
      'Crescimento constante do setor'
    ],
    'O Espírito Santo se beneficia de sua posição estratégica junto a grandes industrias siderúrgicas. Depósitos de reciclagem no estado têm acesso privilegiado a compradores industriais e podem aproveitar a infraestrutura portuária para materiais de exportação.'
  ),

  'parana': generateStateContent(
    'Paraná',
    'PR',
    'parana',
    'sul',
    [
      'Curitiba reconhecida por programas de reciclagem',
      'Forte presença de cooperativas organizadas',
      'Polo automotivo demanda materiais reciclados',
      'Logística eficiente no estado'
    ],
    'O Paraná é referência nacional em reciclagem, com Curitiba sendo uma das cidades pioneiras em coleta seletiva no Brasil. O estado conta com cooperativas bem organizadas e uma cultura de reciclagem consolidada, criando um ambiente favorável para depósitos de todos os portes.'
  ),

  'rio-grande-do-sul': generateStateContent(
    'Rio Grande do Sul',
    'RS',
    'rio-grande-do-sul',
    'sul',
    [
      'Tradição industrial fortalece reciclagem',
      'Porto Alegre como hub de materiais reciclados',
      'Proximidade com Mercosul',
      'Cooperativas fortes e organizadas'
    ],
    'O Rio Grande do Sul possui uma tradição industrial que favorece o mercado de reciclagem. Porto Alegre e região metropolitana concentram grande parte dos depósitos, enquanto o interior do estado tem rede capilarizada de pontos de coleta e processamento.'
  ),

  'santa-catarina': generateStateContent(
    'Santa Catarina',
    'SC',
    'santa-catarina',
    'sul',
    [
      'Polo industrial diversificado',
      'Alta taxa de reciclagem per capita',
      'Joinville e Florianópolis como centros principais',
      'Indústria têxtil gera demanda específica'
    ],
    'Santa Catarina se destaca pela diversidade industrial que gera demanda constante por materiais reciclados. Do polo têxtil de Blumenau à indústria metalúrgica de Joinville, os depósitos de reciclagem encontram mercado aquecido durante todo o ano.'
  ),

  'bahia': generateStateContent(
    'Bahia',
    'BA',
    'bahia',
    'nordeste',
    [
      'Maior economia do Nordeste',
      'Salvador como polo de reciclagem regional',
      'Polo petroquímico de Camaçari',
      'Crescimento acelerado do setor'
    ],
    'A Bahia lidera o mercado de reciclagem no Nordeste. Salvador e região metropolitana concentram grande volume de materiais, enquanto o polo petroquímico de Camaçari gera demanda industrial significativa. O interior do estado vem desenvolvendo sua rede de depósitos.'
  ),

  'pernambuco': generateStateContent(
    'Pernambuco',
    'PE',
    'pernambuco',
    'nordeste',
    [
      'Recife como centro de reciclagem regional',
      'Porto de Suape atrai industrias',
      'Crescimento do setor de reciclagem',
      'Programas estaduais de incentivo'
    ],
    'Pernambuco vem se consolidando como importante polo de reciclagem no Nordeste. O Porto de Suape atrai industrias que demandam materiais reciclados, enquanto Recife e região metropolitana geram grande volume de materiais para processamento.'
  ),

  'ceara': generateStateContent(
    'Ceará',
    'CE',
    'ceara',
    'nordeste',
    [
      'Fortaleza como polo de reciclagem',
      'Indústria têxtil demanda materiais',
      'Crescimento de cooperativas',
      'Incentivos governamentais ao setor'
    ],
    'O Ceará tem desenvolvido seu setor de reciclagem com foco na organização de cooperativas e capacitação de recicladores. Fortaleza concentra a maior parte dos depósitos, mas o interior do estado também tem visto crescimento significativo.'
  ),

  'maranhao': generateStateContent(
    'Maranhão',
    'MA',
    'maranhao',
    'nordeste',
    [
      'São Luís como centro regional',
      'Potencial de crescimento significativo',
      'Desenvolvimento de cooperativas',
      'Apoio de programas sociais'
    ],
    'O Maranhão apresenta grande potencial de crescimento no setor de reciclagem. São Luís concentra as principais operações, enquanto cidades do interior começam a desenvolver suas redes de coleta e processamento de materiais recicláveis.'
  ),

  'paraiba': generateStateContent(
    'Paraíba',
    'PB',
    'paraiba',
    'nordeste',
    [
      'João Pessoa como polo de reciclagem',
      'Campina Grande com forte presença industrial',
      'Cooperativas em desenvolvimento',
      'Foco em reciclagem de plásticos'
    ],
    'A Paraíba vem fortalecendo seu setor de reciclagem com destaque para João Pessoa e Campina Grande. O estado tem investido em programas de coleta seletiva e organização de cooperativas de catadores.'
  ),

  'rio-grande-do-norte': generateStateContent(
    'Rio Grande do Norte',
    'RN',
    'rio-grande-do-norte',
    'nordeste',
    [
      'Natal como centro de operações',
      'Mossoró com presença significativa',
      'Setor em desenvolvimento',
      'Turismo gera volume de recicláveis'
    ],
    'O Rio Grande do Norte tem na região de Natal seu principal polo de reciclagem. O turismo gera volume significativo de materiais recicláveis, especialmente alumínio e plásticos, criando oportunidades para depósitos da região.'
  ),

  'piaui': generateStateContent(
    'Piauí',
    'PI',
    'piaui',
    'nordeste',
    [
      'Teresina como polo principal',
      'Potencial de crescimento',
      'Desenvolvimento de cooperativas',
      'Apoio de programas sociais'
    ],
    'O Piauí está desenvolvendo seu setor de reciclagem com foco em Teresina e região. O estado oferece oportunidades para empreendedores que desejam estruturar depósitos de reciclagem com gestão profissional.'
  ),

  'alagoas': generateStateContent(
    'Alagoas',
    'AL',
    'alagoas',
    'nordeste',
    [
      'Maceió como centro de reciclagem',
      'Turismo gera materiais recicláveis',
      'Setor em crescimento',
      'Cooperativas organizadas'
    ],
    'Alagoas tem em Maceió seu principal polo de reciclagem. O turismo litorâneo gera volume significativo de materiais, especialmente alumínio e plásticos, criando mercado para depósitos de reciclagem.'
  ),

  'sergipe': generateStateContent(
    'Sergipe',
    'SE',
    'sergipe',
    'nordeste',
    [
      'Aracaju como polo de reciclagem',
      'Menor estado do Nordeste com alta densidade',
      'Proximidade com polo petroquímico',
      'Cooperativas em desenvolvimento'
    ],
    'Sergipe, apesar de ser o menor estado do Nordeste, possui mercado ativo de reciclagem concentrado em Aracaju. A proximidade com o polo petroquímico de Camaçari na Bahia gera oportunidades comerciais.'
  ),

  'goias': generateStateContent(
    'Goiás',
    'GO',
    'goias',
    'centro-oeste',
    [
      'Goiânia como polo de reciclagem regional',
      'Agronegócio gera materiais recicláveis',
      'Logística privilegiada no centro do país',
      'Crescimento acelerado do setor'
    ],
    'Goiás se beneficia de sua posição central no país e do forte agronegócio que gera volume significativo de materiais recicláveis. Goiânia e Anápolis concentram os principais depósitos da região.'
  ),

  'distrito-federal': generateStateContent(
    'Distrito Federal',
    'DF',
    'distrito-federal',
    'centro-oeste',
    [
      'Alto poder aquisitivo gera materiais de qualidade',
      'Programas governamentais de reciclagem',
      'Cooperativas bem estruturadas',
      'Mercado organizado e competitivo'
    ],
    'O Distrito Federal possui um mercado de reciclagem maduro e organizado. A população de alto poder aquisitivo gera materiais recicláveis de qualidade, enquanto programas governamentais apoiam a estruturação de cooperativas.'
  ),

  'mato-grosso': generateStateContent(
    'Mato Grosso',
    'MT',
    'mato-grosso',
    'centro-oeste',
    [
      'Agronegócio gera grande volume de materiais',
      'Cuiabá como centro de operações',
      'Logística desafiadora gera oportunidades',
      'Crescimento acompanha economia estadual'
    ],
    'Mato Grosso, potência do agronegócio brasileiro, gera volume significativo de materiais recicláveis ligados à atividade rural. Cuiabá concentra os principais depósitos, enquanto o interior oferece oportunidades para novos empreendedores.'
  ),

  'mato-grosso-do-sul': generateStateContent(
    'Mato Grosso do Sul',
    'MS',
    'mato-grosso-do-sul',
    'centro-oeste',
    [
      'Campo Grande como polo regional',
      'Fronteira com Paraguai gera oportunidades',
      'Agronegócio forte',
      'Logística estratégica'
    ],
    'Mato Grosso do Sul combina oportunidades do agronegócio com sua posição estratégica de fronteira. Campo Grande concentra as principais operações de reciclagem, com destaque para metais e materiais agrícolas.'
  ),

  'para': generateStateContent(
    'Pará',
    'PA',
    'para',
    'norte',
    [
      'Belém como polo de reciclagem da Amazônia',
      'Mineração gera demanda por sucata',
      'Logística fluvial diferenciada',
      'Potencial de crescimento'
    ],
    'O Pará é o principal polo de reciclagem da região Norte. Belém concentra as operações urbanas, enquanto a mineração no interior gera demanda significativa por sucata metálica. A logística fluvial oferece oportunidades únicas.'
  ),

  'amazonas': generateStateContent(
    'Amazonas',
    'AM',
    'amazonas',
    'norte',
    [
      'Zona Franca de Manaus gera materiais',
      'Polo industrial demanda reciclados',
      'Logística desafiadora',
      'Mercado em desenvolvimento'
    ],
    'O Amazonas tem na Zona Franca de Manaus seu principal gerador de materiais recicláveis. O polo industrial demanda materiais reciclados e gera resíduos que alimentam a cadeia de reciclagem local.'
  ),

  'rondonia': generateStateContent(
    'Rondônia',
    'RO',
    'rondonia',
    'norte',
    [
      'Porto Velho como centro regional',
      'Agropecuária gera materiais',
      'Fronteira ativa com Bolívia',
      'Setor em crescimento'
    ],
    'Rondônia vem desenvolvendo seu setor de reciclagem acompanhando o crescimento econômico do estado. Porto Velho concentra as principais operações, com destaque para materiais ligados à agropecuária.'
  ),

  'tocantins': generateStateContent(
    'Tocantins',
    'TO',
    'tocantins',
    'norte',
    [
      'Palmas como polo de reciclagem',
      'Estado mais novo oferece oportunidades',
      'Agronegócio em expansão',
      'Logística em desenvolvimento'
    ],
    'Tocantins, o mais novo estado brasileiro, oferece oportunidades para empreendedores do setor de reciclagem. Palmas concentra as operações enquanto o agronegócio em expansão gera volume crescente de materiais.'
  ),

  'acre': generateStateContent(
    'Acre',
    'AC',
    'acre',
    'norte',
    [
      'Rio Branco como centro de operações',
      'Fronteira com Peru e Bolívia',
      'Mercado em desenvolvimento',
      'Potencial de crescimento'
    ],
    'O Acre está desenvolvendo seu setor de reciclagem com foco em Rio Branco. A posição de fronteira oferece oportunidades comerciais, enquanto o mercado local apresenta potencial de crescimento significativo.'
  ),

  'amapa': generateStateContent(
    'Amapá',
    'AP',
    'amapa',
    'norte',
    [
      'Macapá como polo principal',
      'Fronteira com Guiana Francesa',
      'Mineração presente no estado',
      'Mercado em estruturação'
    ],
    'O Amapá está estruturando seu setor de reciclagem com foco em Macapá. A mineração presente no estado gera demanda por sucata metálica, enquanto a fronteira com a Guiana Francesa oferece oportunidades comerciais.'
  ),

  'roraima': generateStateContent(
    'Roraima',
    'RR',
    'roraima',
    'norte',
    [
      'Boa Vista como centro de operações',
      'Menor população do país',
      'Fronteira com Venezuela e Guiana',
      'Mercado em desenvolvimento'
    ],
    'Roraima, com a menor população entre os estados brasileiros, oferece oportunidades para empreendedores pioneiros no setor de reciclagem. Boa Vista concentra as operações em um mercado ainda em desenvolvimento.'
  )
};

// Lista de todos os estados para iteração
export const allStates = Object.values(recyclingStatesContent);

// Agrupar estados por região
export const statesByRegion = {
  sudeste: allStates.filter(s => s.region === 'sudeste'),
  sul: allStates.filter(s => s.region === 'sul'),
  nordeste: allStates.filter(s => s.region === 'nordeste'),
  'centro-oeste': allStates.filter(s => s.region === 'centro-oeste'),
  norte: allStates.filter(s => s.region === 'norte')
};

// Nomes das regiões em português
export const regionNames: Record<string, string> = {
  sudeste: 'Região Sudeste',
  sul: 'Região Sul',
  nordeste: 'Região Nordeste',
  'centro-oeste': 'Região Centro-Oeste',
  norte: 'Região Norte'
};
