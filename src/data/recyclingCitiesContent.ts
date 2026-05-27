// Conteúdo SEO otimizado para cidades brasileiras (20+ por estado)
// Estrutura escalável para ~580+ páginas indexáveis

export interface CityContent {
  name: string;
  slug: string;
  stateSlug: string;
  stateName: string;
  stateAbbreviation: string;
  population: number;
  isCapital: boolean;
}

// Função helper para gerar conteúdo SEO dinâmico para cada cidade
export const generateCitySEO = (city: CityContent) => ({
  seoTitle: `Sistema para Reciclagem em ${city.name} - ${city.stateAbbreviation} | XLata`,
  seoDescription: `Use o XLata para comprar e vender materiais recicláveis em ${city.name}, ${city.stateAbbreviation}. Ideal para ferro velho, sucata e depósitos de reciclagem.`,
  headline: `Sistema para Reciclagem em ${city.name} - ${city.stateAbbreviation}`,
  subheadline: `Gerencie seu depósito de reciclagem em ${city.name} com o sistema mais completo do Brasil`,
  ctaText: `Quero usar o XLata em ${city.name}`,
  introText: `O mercado de reciclagem em ${city.name}, ${city.stateName}, é uma excelente oportunidade para empreendedores do setor. ${city.isCapital ? `Como capital do estado, ${city.name} concentra grande volume de materiais recicláveis e demanda constante por serviços de reciclagem.` : `${city.name} possui uma rede ativa de catadores, cooperativas e depósitos de reciclagem que movimentam a economia local.`} O XLata é a ferramenta ideal para quem deseja profissionalizar seu ferro velho, depósito de sucata ou centro de reciclagem em ${city.name}.`,
  contentSections: [
    {
      title: `Vender Sucata em ${city.name}`,
      content: `Para quem trabalha com compra e venda de sucata em ${city.name}, ter um sistema organizado é essencial para maximizar lucros. O XLata permite registrar todas as compras de materiais recicláveis com precisão, calcular valores automaticamente baseados no peso e tipo de material, e emitir comprovantes profissionais para seus fornecedores.

O mercado de sucata em ${city.name} é dinâmico e competitivo. Catadores, cooperativas e outros fornecedores da região buscam depósitos que ofereçam preços justos e atendimento profissional. Com o XLata, você transmite credibilidade desde o primeiro contato, mostrando que seu depósito de reciclagem em ${city.name} é moderno e bem administrado.

Ao registrar cada compra no sistema, você cria um histórico completo de transações. Isso permite identificar os melhores fornecedores da cidade, negociar melhores preços e planejar suas compras com base em dados reais. Vender sucata em ${city.name} fica muito mais rentável quando você tem controle total sobre suas operações.

Os recicladores de ${city.name} que adotaram o XLata relatam aumento significativo na organização e redução de erros no dia a dia. A facilidade de uso permite que qualquer pessoa aprenda rapidamente, mesmo sem experiência com sistemas de gestão.`
    },
    {
      title: `Comprar Material Reciclável em ${city.name}`,
      content: `O processo de comprar material reciclável em ${city.name} envolve diversos desafios: variação de preços conforme o mercado, qualidade inconsistente dos materiais, e a necessidade de manter registros precisos para cada transação. O XLata resolve todos esses problemas com uma plataforma intuitiva e completa.

Com o sistema, você cadastra todos os tipos de materiais que seu depósito em ${city.name} trabalha - alumínio, cobre, ferro, papelão, plástico, e dezenas de outros - cada um com seu preço por quilo atualizado. Quando um fornecedor chega com materiais para vender, você pesa, registra e calcula o valor em segundos.

O controle de estoque em tempo real mostra exatamente quanto de cada material você tem disponível em seu depósito de ${city.name}. Isso é essencial para quem compra material reciclável e precisa planejar vendas para industrias e atravessadores. Você nunca mais vai perder uma oportunidade de venda por não saber quanto material tem em estoque.

Recicladores de ${city.name} e região têm no XLata uma ferramenta poderosa para crescer de forma organizada. O sistema permite escalar as operações sem perder o controle, mesmo com aumento significativo de volume.`
    },
    {
      title: `Ferro Velho em ${city.name}`,
      content: `Donos de ferro velho em ${city.name} enfrentam desafios únicos todos os dias. A alta rotatividade de fornecedores, variação constante nos preços das commodities, e a necessidade de controle financeiro rigoroso exigem ferramentas adequadas de gestão.

O XLata foi desenvolvido pensando especificamente nas necessidades de quem trabalha com ferro velho em ${city.name}. O sistema permite:

• Cadastrar ilimitados tipos de materiais ferrosos e não-ferrosos
• Registrar compras rapidamente com cálculo automático de valores
• Controlar o caixa diário com precisão total
• Acompanhar despesas operacionais (combustível, manutenção, aluguel)
• Gerar relatórios de lucro por período
• Emitir comprovantes profissionais para fornecedores

O mercado de ferro velho em ${city.name} oferece excelentes oportunidades para quem se organiza. Com o XLata, você transforma seu negócio em uma operação profissional, aumentando a confiança de fornecedores e compradores. Seja seu ferro velho no centro ou em bairros de ${city.name}, o sistema funciona 100% online e pode ser acessado de qualquer dispositivo.

Modernize seu ferro velho em ${city.name} e veja seus lucros crescerem. A tecnologia que antes era exclusiva de grandes empresas agora está acessível para todos os recicladores da cidade.`
    },
    {
      title: `Depósito de Reciclagem em ${city.name}`,
      content: `Gerenciar um depósito de reciclagem em ${city.name} exige organização e controle constante. São dezenas de fornecedores, múltiplos tipos de materiais, fluxo de caixa diário e despesas operacionais que precisam ser acompanhados de perto para garantir a saúde financeira do negócio.

O XLata é o sistema completo para depósitos de reciclagem em ${city.name}. Além do controle de compras e estoque, você tem acesso a:

• Dashboard com visão geral do negócio em tempo real
• Cadastro de clientes e fornecedores com histórico completo
• Controle de funcionários com níveis de permissão
• Gestão financeira integrada com todas as operações
• Relatórios detalhados de operações e resultados
• Histórico permanente de todas as transações

Com o XLata, seu depósito de reciclagem em ${city.name} opera com a eficiência de uma grande empresa, mesmo sendo um negócio familiar ou de pequeno porte. A tecnologia democratiza a gestão profissional e coloca os recicladores da cidade em igualdade de condições com grandes operadores do mercado.

O suporte do XLata está disponível para ajudar os recicladores de ${city.name} em qualquer dúvida sobre o sistema. Nossa equipe entende as particularidades do setor e oferece atendimento especializado.`
    },
    {
      title: `Por que Recicladores de ${city.name} Escolhem o XLata`,
      content: `O XLata se tornou referência entre os sistemas de gestão para reciclagem no Brasil. Em ${city.name}, diversos depósitos já adotaram a plataforma e colhem os benefícios da organização digital. Veja por que o XLata é a escolha certa:

**Facilidade de Uso**: O sistema foi projetado para ser intuitivo. Mesmo quem nunca usou tecnologia antes consegue aprender em minutos. A interface é clara e objetiva, focada nas necessidades reais do dia a dia de um depósito de reciclagem.

**100% Online**: Não precisa instalar nada. Acesse de qualquer lugar de ${city.name} pelo celular, tablet ou computador. Seus dados estão sempre disponíveis e sincronizados.

**Preço Acessível**: O investimento no XLata cabe no orçamento de qualquer reciclador. O retorno vem rapidamente com a economia de tempo e aumento de organização.

**Suporte Especializado**: Nossa equipe conhece o setor de reciclagem e oferece atendimento humanizado. Dúvidas são resolvidas rapidamente.

**Teste Gratuito**: Experimente todas as funcionalidades por 7 dias sem compromisso. Sem cartão de crédito, sem pegadinhas.

Junte-se aos recicladores de ${city.name} que já transformaram seus negócios com o XLata. Comece hoje mesmo e veja a diferença que a organização faz no seu faturamento.`
    }
  ],
  faq: [
    {
      question: `O XLata funciona em ${city.name}?`,
      answer: `Sim! O XLata é 100% online e funciona perfeitamente em ${city.name} e em toda região de ${city.stateName}. Você só precisa de acesso à internet para usar o sistema. Seja no centro ou nos bairros de ${city.name}, seu depósito terá acesso a todas as funcionalidades.`
    },
    {
      question: `Quanto custa usar o XLata em ${city.name}?`,
      answer: `O XLata oferece um período de teste gratuito de 7 dias para você conhecer todas as funcionalidades. Após o teste, os planos são muito acessíveis e cabem no bolso de qualquer reciclador de ${city.name}. O investimento se paga rapidamente com a economia de tempo e aumento de organização.`
    },
    {
      question: `Posso usar o XLata no meu ferro velho em ${city.name}?`,
      answer: `Com certeza! O XLata foi desenvolvido especialmente para ferro velhos, depósitos de sucata e centros de reciclagem. Todas as funcionalidades são pensadas para as necessidades específicas do setor de reciclagem em ${city.name} e região.`
    },
    {
      question: `O sistema emite comprovantes para meus fornecedores em ${city.name}?`,
      answer: `Sim! O XLata gera comprovantes profissionais de compra que você pode imprimir ou enviar por WhatsApp para seus fornecedores em ${city.name}. Isso aumenta a credibilidade do seu depósito e fideliza catadores e cooperativas.`
    },
    {
      question: `Como faço para começar a usar o XLata em ${city.name}?`,
      answer: `É muito simples! Clique no botão de cadastro, crie sua conta gratuita e comece a usar imediatamente. Em minutos você já estará registrando suas primeiras compras e organizando seu depósito em ${city.name}.`
    }
  ],
  localHighlights: [
    `Controle total de compras e vendas em ${city.name}`,
    `Gestão de caixa adaptada ao mercado local`,
    `Relatórios de desempenho do seu depósito`,
    `Cadastro de fornecedores da região de ${city.name}`,
    city.isCapital 
      ? `Ideal para o volume de materiais de uma capital` 
      : `Perfeito para depósitos de ${city.name} e região`,
    `Acesse de qualquer lugar de ${city.stateName}`
  ]
});

// Lista de cidades por estado (20+ por estado, priorizando as mais populosas)
export const citiesByState: Record<string, CityContent[]> = {
  'sao-paulo': [
    { name: 'Guarulhos', slug: 'guarulhos', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 1392000, isCapital: false },
    { name: 'Campinas', slug: 'campinas', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 1213000, isCapital: false },
    { name: 'São Bernardo do Campo', slug: 'sao-bernardo-do-campo', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 844000, isCapital: false },
    { name: 'Santo André', slug: 'santo-andre', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 721000, isCapital: false },
    { name: 'Osasco', slug: 'osasco', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 699000, isCapital: false },
    { name: 'São José dos Campos', slug: 'sao-jose-dos-campos', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 729000, isCapital: false },
    { name: 'Ribeirão Preto', slug: 'ribeirao-preto', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 711000, isCapital: false },
    { name: 'Sorocaba', slug: 'sorocaba', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 687000, isCapital: false },
    { name: 'Santos', slug: 'santos', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 433000, isCapital: false },
    { name: 'Mauá', slug: 'maua', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 477000, isCapital: false },
    { name: 'São José do Rio Preto', slug: 'sao-jose-do-rio-preto', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 464000, isCapital: false },
    { name: 'Mogi das Cruzes', slug: 'mogi-das-cruzes', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 450000, isCapital: false },
    { name: 'Diadema', slug: 'diadema', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 426000, isCapital: false },
    { name: 'Jundiaí', slug: 'jundiai', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 423000, isCapital: false },
    { name: 'Piracicaba', slug: 'piracicaba', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 407000, isCapital: false },
    { name: 'Carapicuíba', slug: 'carapicuiba', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 403000, isCapital: false },
    { name: 'Bauru', slug: 'bauru', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 379000, isCapital: false },
    { name: 'Itaquaquecetuba', slug: 'itaquaquecetuba', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 377000, isCapital: false },
    { name: 'São Vicente', slug: 'sao-vicente', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 368000, isCapital: false },
    { name: 'Franca', slug: 'franca', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 355000, isCapital: false },
    { name: 'Praia Grande', slug: 'praia-grande', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 330000, isCapital: false },
    { name: 'Guarujá', slug: 'guaruja', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 322000, isCapital: false },
    { name: 'Limeira', slug: 'limeira', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 306000, isCapital: false },
    { name: 'Taubaté', slug: 'taubate', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 317000, isCapital: false },
    { name: 'Suzano', slug: 'suzano', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 300000, isCapital: false },
    { name: 'Taboão da Serra', slug: 'taboao-da-serra', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 289000, isCapital: false },
    { name: 'Sumaré', slug: 'sumare', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 284000, isCapital: false },
    { name: 'Embu das Artes', slug: 'embu-das-artes', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 278000, isCapital: false },
    { name: 'Barueri', slug: 'barueri', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 276000, isCapital: false },
    { name: 'Marília', slug: 'marilia', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 242000, isCapital: false },
    { name: 'Cotia', slug: 'cotia', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 256000, isCapital: false },
    { name: 'Jacareí', slug: 'jacarei', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 235000, isCapital: false },
    { name: 'Americana', slug: 'americana', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 242000, isCapital: false },
    { name: 'Indaiatuba', slug: 'indaiatuba', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 254000, isCapital: false },
    { name: 'Araraquara', slug: 'araraquara', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 238000, isCapital: false },
    { name: 'Presidente Prudente', slug: 'presidente-prudente', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 230000, isCapital: false },
    { name: 'Hortolândia', slug: 'hortolandia', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 234000, isCapital: false },
    { name: 'Rio Claro', slug: 'rio-claro', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 209000, isCapital: false },
    { name: 'Santa Bárbara d\'Oeste', slug: 'santa-barbara-doeste', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 197000, isCapital: false },
    { name: 'Itapevi', slug: 'itapevi', stateSlug: 'sao-paulo', stateName: 'São Paulo', stateAbbreviation: 'SP', population: 237000, isCapital: false },
  ],

  'minas-gerais': [
    { name: 'Belo Horizonte', slug: 'belo-horizonte', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 2530000, isCapital: true },
    { name: 'Uberlândia', slug: 'uberlandia', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 699000, isCapital: false },
    { name: 'Contagem', slug: 'contagem', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 668000, isCapital: false },
    { name: 'Juiz de Fora', slug: 'juiz-de-fora', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 577000, isCapital: false },
    { name: 'Betim', slug: 'betim', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 444000, isCapital: false },
    { name: 'Montes Claros', slug: 'montes-claros', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 417000, isCapital: false },
    { name: 'Ribeirão das Neves', slug: 'ribeirao-das-neves', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 334000, isCapital: false },
    { name: 'Uberaba', slug: 'uberaba', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 340000, isCapital: false },
    { name: 'Governador Valadares', slug: 'governador-valadares', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 281000, isCapital: false },
    { name: 'Ipatinga', slug: 'ipatinga', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 265000, isCapital: false },
    { name: 'Sete Lagoas', slug: 'sete-lagoas', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 243000, isCapital: false },
    { name: 'Divinópolis', slug: 'divinopolis', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 240000, isCapital: false },
    { name: 'Santa Luzia', slug: 'santa-luzia', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 222000, isCapital: false },
    { name: 'Ibirité', slug: 'ibirite', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 182000, isCapital: false },
    { name: 'Poços de Caldas', slug: 'pocos-de-caldas', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 168000, isCapital: false },
    { name: 'Patos de Minas', slug: 'patos-de-minas', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 156000, isCapital: false },
    { name: 'Pouso Alegre', slug: 'pouso-alegre', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 154000, isCapital: false },
    { name: 'Teófilo Otoni', slug: 'teofilo-otoni', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 141000, isCapital: false },
    { name: 'Barbacena', slug: 'barbacena', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 138000, isCapital: false },
    { name: 'Sabará', slug: 'sabara', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 136000, isCapital: false },
    { name: 'Varginha', slug: 'varginha', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 136000, isCapital: false },
    { name: 'Conselheiro Lafaiete', slug: 'conselheiro-lafaiete', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 129000, isCapital: false },
    { name: 'Nova Lima', slug: 'nova-lima', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 97000, isCapital: false },
    { name: 'Araguari', slug: 'araguari', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 118000, isCapital: false },
    { name: 'Passos', slug: 'passos', stateSlug: 'minas-gerais', stateName: 'Minas Gerais', stateAbbreviation: 'MG', population: 115000, isCapital: false },
  ],

  'rio-de-janeiro': [
    { name: 'Niterói', slug: 'niteroi', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 515000, isCapital: false },
    { name: 'São Gonçalo', slug: 'sao-goncalo', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 1091000, isCapital: false },
    { name: 'Duque de Caxias', slug: 'duque-de-caxias', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 924000, isCapital: false },
    { name: 'Nova Iguaçu', slug: 'nova-iguacu', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 823000, isCapital: false },
    { name: 'São João de Meriti', slug: 'sao-joao-de-meriti', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 472000, isCapital: false },
    { name: 'Belford Roxo', slug: 'belford-roxo', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 513000, isCapital: false },
    { name: 'Campos dos Goytacazes', slug: 'campos-dos-goytacazes', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 511000, isCapital: false },
    { name: 'Petrópolis', slug: 'petropolis', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 306000, isCapital: false },
    { name: 'Volta Redonda', slug: 'volta-redonda', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 273000, isCapital: false },
    { name: 'Magé', slug: 'mage', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 245000, isCapital: false },
    { name: 'Itaboraí', slug: 'itaborai', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 242000, isCapital: false },
    { name: 'Macaé', slug: 'macae', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 261000, isCapital: false },
    { name: 'Cabo Frio', slug: 'cabo-frio', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 230000, isCapital: false },
    { name: 'Nova Friburgo', slug: 'nova-friburgo', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 190000, isCapital: false },
    { name: 'Barra Mansa', slug: 'barra-mansa', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 180000, isCapital: false },
    { name: 'Angra dos Reis', slug: 'angra-dos-reis', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 207000, isCapital: false },
    { name: 'Teresópolis', slug: 'teresopolis', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 181000, isCapital: false },
    { name: 'Mesquita', slug: 'mesquita', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 175000, isCapital: false },
    { name: 'Nilópolis', slug: 'nilopolis', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 162000, isCapital: false },
    { name: 'Queimados', slug: 'queimados', stateSlug: 'rio-de-janeiro', stateName: 'Rio de Janeiro', stateAbbreviation: 'RJ', population: 150000, isCapital: false },
  ],

  'espirito-santo': [
    { name: 'Vitória', slug: 'vitoria', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 365000, isCapital: true },
    { name: 'Vila Velha', slug: 'vila-velha', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 501000, isCapital: false },
    { name: 'Serra', slug: 'serra', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 527000, isCapital: false },
    { name: 'Cariacica', slug: 'cariacica', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 387000, isCapital: false },
    { name: 'Cachoeiro de Itapemirim', slug: 'cachoeiro-de-itapemirim', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 210000, isCapital: false },
    { name: 'Linhares', slug: 'linhares', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 176000, isCapital: false },
    { name: 'São Mateus', slug: 'sao-mateus', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 132000, isCapital: false },
    { name: 'Colatina', slug: 'colatina', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 123000, isCapital: false },
    { name: 'Guarapari', slug: 'guarapari', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 127000, isCapital: false },
    { name: 'Aracruz', slug: 'aracruz', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 102000, isCapital: false },
    { name: 'Viana', slug: 'viana', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 79000, isCapital: false },
    { name: 'Nova Venécia', slug: 'nova-venecia', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 52000, isCapital: false },
    { name: 'Barra de São Francisco', slug: 'barra-de-sao-francisco', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 46000, isCapital: false },
    { name: 'Marataízes', slug: 'marataizes', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 40000, isCapital: false },
    { name: 'Afonso Cláudio', slug: 'afonso-claudio', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 32000, isCapital: false },
    { name: 'Castelo', slug: 'castelo', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 38000, isCapital: false },
    { name: 'Alegre', slug: 'alegre', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 32000, isCapital: false },
    { name: 'Fundão', slug: 'fundao', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 22000, isCapital: false },
    { name: 'Itapemirim', slug: 'itapemirim', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 35000, isCapital: false },
    { name: 'Pedro Canário', slug: 'pedro-canario', stateSlug: 'espirito-santo', stateName: 'Espírito Santo', stateAbbreviation: 'ES', population: 27000, isCapital: false },
  ],

  'parana': [
    { name: 'Curitiba', slug: 'curitiba', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 1963000, isCapital: true },
    { name: 'Londrina', slug: 'londrina', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 575000, isCapital: false },
    { name: 'Maringá', slug: 'maringa', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 430000, isCapital: false },
    { name: 'Ponta Grossa', slug: 'ponta-grossa', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 355000, isCapital: false },
    { name: 'Cascavel', slug: 'cascavel', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 332000, isCapital: false },
    { name: 'São José dos Pinhais', slug: 'sao-jose-dos-pinhais', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 329000, isCapital: false },
    { name: 'Foz do Iguaçu', slug: 'foz-do-iguacu', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 258000, isCapital: false },
    { name: 'Colombo', slug: 'colombo', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 246000, isCapital: false },
    { name: 'Guarapuava', slug: 'guarapuava', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 182000, isCapital: false },
    { name: 'Paranaguá', slug: 'paranagua', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 156000, isCapital: false },
    { name: 'Araucária', slug: 'araucaria', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 143000, isCapital: false },
    { name: 'Toledo', slug: 'toledo', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 142000, isCapital: false },
    { name: 'Apucarana', slug: 'apucarana', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 136000, isCapital: false },
    { name: 'Campo Largo', slug: 'campo-largo', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 132000, isCapital: false },
    { name: 'Arapongas', slug: 'arapongas', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 122000, isCapital: false },
    { name: 'Almirante Tamandaré', slug: 'almirante-tamandare', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 119000, isCapital: false },
    { name: 'Umuarama', slug: 'umuarama', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 112000, isCapital: false },
    { name: 'Piraquara', slug: 'piraquara', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 117000, isCapital: false },
    { name: 'Cambé', slug: 'cambe', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 107000, isCapital: false },
    { name: 'Campo Mourão', slug: 'campo-mourao', stateSlug: 'parana', stateName: 'Paraná', stateAbbreviation: 'PR', population: 96000, isCapital: false },
  ],

  'rio-grande-do-sul': [
    { name: 'Porto Alegre', slug: 'porto-alegre', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 1492000, isCapital: true },
    { name: 'Caxias do Sul', slug: 'caxias-do-sul', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 517000, isCapital: false },
    { name: 'Canoas', slug: 'canoas', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 348000, isCapital: false },
    { name: 'Pelotas', slug: 'pelotas', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 343000, isCapital: false },
    { name: 'Santa Maria', slug: 'santa-maria', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 283000, isCapital: false },
    { name: 'Gravataí', slug: 'gravatai', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 281000, isCapital: false },
    { name: 'Viamão', slug: 'viamao', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 255000, isCapital: false },
    { name: 'Novo Hamburgo', slug: 'novo-hamburgo', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 247000, isCapital: false },
    { name: 'São Leopoldo', slug: 'sao-leopoldo', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 238000, isCapital: false },
    { name: 'Rio Grande', slug: 'rio-grande', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 211000, isCapital: false },
    { name: 'Alvorada', slug: 'alvorada', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 210000, isCapital: false },
    { name: 'Passo Fundo', slug: 'passo-fundo', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 204000, isCapital: false },
    { name: 'Sapucaia do Sul', slug: 'sapucaia-do-sul', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 141000, isCapital: false },
    { name: 'Uruguaiana', slug: 'uruguaiana', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 130000, isCapital: false },
    { name: 'Santa Cruz do Sul', slug: 'santa-cruz-do-sul', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 131000, isCapital: false },
    { name: 'Cachoeirinha', slug: 'cachoeirinha', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 128000, isCapital: false },
    { name: 'Bagé', slug: 'bage', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 122000, isCapital: false },
    { name: 'Bento Gonçalves', slug: 'bento-goncalves', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 120000, isCapital: false },
    { name: 'Erechim', slug: 'erechim', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 106000, isCapital: false },
    { name: 'Guaíba', slug: 'guaiba', stateSlug: 'rio-grande-do-sul', stateName: 'Rio Grande do Sul', stateAbbreviation: 'RS', population: 100000, isCapital: false },
  ],

  'santa-catarina': [
    { name: 'Florianópolis', slug: 'florianopolis', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 508000, isCapital: true },
    { name: 'Joinville', slug: 'joinville', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 604000, isCapital: false },
    { name: 'Blumenau', slug: 'blumenau', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 361000, isCapital: false },
    { name: 'São José', slug: 'sao-jose', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 250000, isCapital: false },
    { name: 'Chapecó', slug: 'chapeco', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 224000, isCapital: false },
    { name: 'Itajaí', slug: 'itajai', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 223000, isCapital: false },
    { name: 'Criciúma', slug: 'criciuma', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 217000, isCapital: false },
    { name: 'Jaraguá do Sul', slug: 'jaragua-do-sul', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 181000, isCapital: false },
    { name: 'Lages', slug: 'lages', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 158000, isCapital: false },
    { name: 'Palhoça', slug: 'palhoca', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 178000, isCapital: false },
    { name: 'Balneário Camboriú', slug: 'balneario-camboriu', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 145000, isCapital: false },
    { name: 'Brusque', slug: 'brusque', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 137000, isCapital: false },
    { name: 'Tubarão', slug: 'tubarao', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 107000, isCapital: false },
    { name: 'São Bento do Sul', slug: 'sao-bento-do-sul', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 86000, isCapital: false },
    { name: 'Caçador', slug: 'cacador', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 78000, isCapital: false },
    { name: 'Concórdia', slug: 'concordia', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 75000, isCapital: false },
    { name: 'Camboriú', slug: 'camboriu', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 90000, isCapital: false },
    { name: 'Navegantes', slug: 'navegantes', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 84000, isCapital: false },
    { name: 'Rio do Sul', slug: 'rio-do-sul', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 71000, isCapital: false },
    { name: 'Indaial', slug: 'indaial', stateSlug: 'santa-catarina', stateName: 'Santa Catarina', stateAbbreviation: 'SC', population: 70000, isCapital: false },
  ],

  'bahia': [
    { name: 'Salvador', slug: 'salvador', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 2900000, isCapital: true },
    { name: 'Feira de Santana', slug: 'feira-de-santana', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 619000, isCapital: false },
    { name: 'Vitória da Conquista', slug: 'vitoria-da-conquista', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 343000, isCapital: false },
    { name: 'Camaçari', slug: 'camacari', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 304000, isCapital: false },
    { name: 'Itabuna', slug: 'itabuna', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 213000, isCapital: false },
    { name: 'Juazeiro', slug: 'juazeiro', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 218000, isCapital: false },
    { name: 'Lauro de Freitas', slug: 'lauro-de-freitas', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 201000, isCapital: false },
    { name: 'Ilhéus', slug: 'ilheus', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 180000, isCapital: false },
    { name: 'Jequié', slug: 'jequie', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 155000, isCapital: false },
    { name: 'Teixeira de Freitas', slug: 'teixeira-de-freitas', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 162000, isCapital: false },
    { name: 'Alagoinhas', slug: 'alagoinhas', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 158000, isCapital: false },
    { name: 'Barreiras', slug: 'barreiras', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 156000, isCapital: false },
    { name: 'Porto Seguro', slug: 'porto-seguro', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 150000, isCapital: false },
    { name: 'Simões Filho', slug: 'simoes-filho', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 135000, isCapital: false },
    { name: 'Paulo Afonso', slug: 'paulo-afonso', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 120000, isCapital: false },
    { name: 'Eunápolis', slug: 'eunapolis', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 115000, isCapital: false },
    { name: 'Santo Antônio de Jesus', slug: 'santo-antonio-de-jesus', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 103000, isCapital: false },
    { name: 'Valença', slug: 'valenca', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 100000, isCapital: false },
    { name: 'Candeias', slug: 'candeias', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 92000, isCapital: false },
    { name: 'Luís Eduardo Magalhães', slug: 'luis-eduardo-magalhaes', stateSlug: 'bahia', stateName: 'Bahia', stateAbbreviation: 'BA', population: 90000, isCapital: false },
  ],

  'pernambuco': [
    { name: 'Recife', slug: 'recife', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 1661000, isCapital: true },
    { name: 'Jaboatão dos Guararapes', slug: 'jaboatao-dos-guararapes', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 706000, isCapital: false },
    { name: 'Olinda', slug: 'olinda', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 393000, isCapital: false },
    { name: 'Caruaru', slug: 'caruaru', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 365000, isCapital: false },
    { name: 'Petrolina', slug: 'petrolina', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 354000, isCapital: false },
    { name: 'Paulista', slug: 'paulista', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 334000, isCapital: false },
    { name: 'Cabo de Santo Agostinho', slug: 'cabo-de-santo-agostinho', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 207000, isCapital: false },
    { name: 'Camaragibe', slug: 'camaragibe', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 157000, isCapital: false },
    { name: 'Garanhuns', slug: 'garanhuns', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 140000, isCapital: false },
    { name: 'Vitória de Santo Antão', slug: 'vitoria-de-santo-antao', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 138000, isCapital: false },
    { name: 'Igarassu', slug: 'igarassu', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 121000, isCapital: false },
    { name: 'São Lourenço da Mata', slug: 'sao-lourenco-da-mata', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 115000, isCapital: false },
    { name: 'Abreu e Lima', slug: 'abreu-e-lima', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 100000, isCapital: false },
    { name: 'Ipojuca', slug: 'ipojuca', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 97000, isCapital: false },
    { name: 'Serra Talhada', slug: 'serra-talhada', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 87000, isCapital: false },
    { name: 'Araripina', slug: 'araripina', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 84000, isCapital: false },
    { name: 'Gravatá', slug: 'gravata', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 84000, isCapital: false },
    { name: 'Carpina', slug: 'carpina', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 83000, isCapital: false },
    { name: 'Goiana', slug: 'goiana', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 80000, isCapital: false },
    { name: 'Santa Cruz do Capibaribe', slug: 'santa-cruz-do-capibaribe', stateSlug: 'pernambuco', stateName: 'Pernambuco', stateAbbreviation: 'PE', population: 110000, isCapital: false },
  ],

  'ceara': [
    { name: 'Fortaleza', slug: 'fortaleza', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 2687000, isCapital: true },
    { name: 'Caucaia', slug: 'caucaia', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 368000, isCapital: false },
    { name: 'Juazeiro do Norte', slug: 'juazeiro-do-norte', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 278000, isCapital: false },
    { name: 'Maracanaú', slug: 'maracanau', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 229000, isCapital: false },
    { name: 'Sobral', slug: 'sobral', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 212000, isCapital: false },
    { name: 'Crato', slug: 'crato', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 133000, isCapital: false },
    { name: 'Itapipoca', slug: 'itapipoca', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 130000, isCapital: false },
    { name: 'Maranguape', slug: 'maranguape', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 127000, isCapital: false },
    { name: 'Iguatu', slug: 'iguatu', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 103000, isCapital: false },
    { name: 'Quixadá', slug: 'quixada', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 87000, isCapital: false },
    { name: 'Pacatuba', slug: 'pacatuba', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 85000, isCapital: false },
    { name: 'Aquiraz', slug: 'aquiraz', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 82000, isCapital: false },
    { name: 'Russas', slug: 'russas', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 78000, isCapital: false },
    { name: 'Canindé', slug: 'caninde', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 77000, isCapital: false },
    { name: 'Tianguá', slug: 'tiangua', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 77000, isCapital: false },
    { name: 'Crateús', slug: 'crateus', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 75000, isCapital: false },
    { name: 'Pacajus', slug: 'pacajus', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 74000, isCapital: false },
    { name: 'Aracati', slug: 'aracati', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 74000, isCapital: false },
    { name: 'Horizonte', slug: 'horizonte', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 70000, isCapital: false },
    { name: 'Eusébio', slug: 'eusebio', stateSlug: 'ceara', stateName: 'Ceará', stateAbbreviation: 'CE', population: 60000, isCapital: false },
  ],

  'maranhao': [
    { name: 'São Luís', slug: 'sao-luis', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 1115000, isCapital: true },
    { name: 'Imperatriz', slug: 'imperatriz', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 259000, isCapital: false },
    { name: 'São José de Ribamar', slug: 'sao-jose-de-ribamar', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 179000, isCapital: false },
    { name: 'Timon', slug: 'timon', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 171000, isCapital: false },
    { name: 'Caxias', slug: 'caxias', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 165000, isCapital: false },
    { name: 'Codó', slug: 'codo', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 123000, isCapital: false },
    { name: 'Paço do Lumiar', slug: 'paco-do-lumiar', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 122000, isCapital: false },
    { name: 'Açailândia', slug: 'acailandia', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 113000, isCapital: false },
    { name: 'Bacabal', slug: 'bacabal', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 104000, isCapital: false },
    { name: 'Balsas', slug: 'balsas', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 96000, isCapital: false },
    { name: 'Santa Inês', slug: 'santa-ines', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 90000, isCapital: false },
    { name: 'Barra do Corda', slug: 'barra-do-corda', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 87000, isCapital: false },
    { name: 'Pinheiro', slug: 'pinheiro', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 83000, isCapital: false },
    { name: 'Chapadinha', slug: 'chapadinha', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 80000, isCapital: false },
    { name: 'Viana', slug: 'viana-ma', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 55000, isCapital: false },
    { name: 'Buriticupu', slug: 'buriticupu', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 72000, isCapital: false },
    { name: 'Grajaú', slug: 'grajau', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 70000, isCapital: false },
    { name: 'Itapecuru Mirim', slug: 'itapecuru-mirim', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 68000, isCapital: false },
    { name: 'Coroatá', slug: 'coroata', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 67000, isCapital: false },
    { name: 'Zé Doca', slug: 'ze-doca', stateSlug: 'maranhao', stateName: 'Maranhão', stateAbbreviation: 'MA', population: 52000, isCapital: false },
  ],

  'paraiba': [
    { name: 'João Pessoa', slug: 'joao-pessoa', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 817000, isCapital: true },
    { name: 'Campina Grande', slug: 'campina-grande', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 411000, isCapital: false },
    { name: 'Santa Rita', slug: 'santa-rita', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 136000, isCapital: false },
    { name: 'Patos', slug: 'patos', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 108000, isCapital: false },
    { name: 'Bayeux', slug: 'bayeux', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 103000, isCapital: false },
    { name: 'Sousa', slug: 'sousa', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 69000, isCapital: false },
    { name: 'Cajazeiras', slug: 'cajazeiras', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 64000, isCapital: false },
    { name: 'Cabedelo', slug: 'cabedelo', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 68000, isCapital: false },
    { name: 'Guarabira', slug: 'guarabira', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 60000, isCapital: false },
    { name: 'Sapé', slug: 'sape', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 53000, isCapital: false },
    { name: 'Mamanguape', slug: 'mamanguape', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 45000, isCapital: false },
    { name: 'Pombal', slug: 'pombal', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 33000, isCapital: false },
    { name: 'Queimadas', slug: 'queimadas-pb', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 45000, isCapital: false },
    { name: 'Monteiro', slug: 'monteiro', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 34000, isCapital: false },
    { name: 'Esperança', slug: 'esperanca', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 34000, isCapital: false },
    { name: 'Itabaiana', slug: 'itabaiana-pb', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 26000, isCapital: false },
    { name: 'Rio Tinto', slug: 'rio-tinto', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 24000, isCapital: false },
    { name: 'Alagoa Grande', slug: 'alagoa-grande', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 29000, isCapital: false },
    { name: 'Catolé do Rocha', slug: 'catole-do-rocha', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 30000, isCapital: false },
    { name: 'Solânea', slug: 'solanea', stateSlug: 'paraiba', stateName: 'Paraíba', stateAbbreviation: 'PB', population: 28000, isCapital: false },
  ],

  'rio-grande-do-norte': [
    { name: 'Natal', slug: 'natal', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 896000, isCapital: true },
    { name: 'Mossoró', slug: 'mossoro', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 300000, isCapital: false },
    { name: 'Parnamirim', slug: 'parnamirim', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 267000, isCapital: false },
    { name: 'São Gonçalo do Amarante', slug: 'sao-goncalo-do-amarante', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 105000, isCapital: false },
    { name: 'Macaíba', slug: 'macaiba', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 80000, isCapital: false },
    { name: 'Ceará-Mirim', slug: 'ceara-mirim', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 74000, isCapital: false },
    { name: 'Caicó', slug: 'caico', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 68000, isCapital: false },
    { name: 'Açu', slug: 'acu', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 58000, isCapital: false },
    { name: 'Currais Novos', slug: 'currais-novos', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 46000, isCapital: false },
    { name: 'Santa Cruz', slug: 'santa-cruz-rn', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 39000, isCapital: false },
    { name: 'Nova Cruz', slug: 'nova-cruz', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 37000, isCapital: false },
    { name: 'Apodi', slug: 'apodi', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 36000, isCapital: false },
    { name: 'João Câmara', slug: 'joao-camara', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 36000, isCapital: false },
    { name: 'Pau dos Ferros', slug: 'pau-dos-ferros', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 31000, isCapital: false },
    { name: 'Extremoz', slug: 'extremoz', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 32000, isCapital: false },
    { name: 'Areia Branca', slug: 'areia-branca', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 27000, isCapital: false },
    { name: 'Canguaretama', slug: 'canguaretama', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 34000, isCapital: false },
    { name: 'Touros', slug: 'touros', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 36000, isCapital: false },
    { name: 'Baraúna', slug: 'barauna', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 29000, isCapital: false },
    { name: 'Tibau do Sul', slug: 'tibau-do-sul', stateSlug: 'rio-grande-do-norte', stateName: 'Rio Grande do Norte', stateAbbreviation: 'RN', population: 14000, isCapital: false },
  ],

  'piaui': [
    { name: 'Teresina', slug: 'teresina', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 868000, isCapital: true },
    { name: 'Parnaíba', slug: 'parnaiba', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 153000, isCapital: false },
    { name: 'Picos', slug: 'picos', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 79000, isCapital: false },
    { name: 'Piripiri', slug: 'piripiri', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 64000, isCapital: false },
    { name: 'Floriano', slug: 'floriano', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 60000, isCapital: false },
    { name: 'Campo Maior', slug: 'campo-maior', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 47000, isCapital: false },
    { name: 'Barras', slug: 'barras', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 46000, isCapital: false },
    { name: 'União', slug: 'uniao', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 45000, isCapital: false },
    { name: 'Altos', slug: 'altos', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 40000, isCapital: false },
    { name: 'José de Freitas', slug: 'jose-de-freitas', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 40000, isCapital: false },
    { name: 'Pedro II', slug: 'pedro-ii', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 38000, isCapital: false },
    { name: 'Oeiras', slug: 'oeiras', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 37000, isCapital: false },
    { name: 'Esperantina', slug: 'esperantina', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 39000, isCapital: false },
    { name: 'Corrente', slug: 'corrente', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 27000, isCapital: false },
    { name: 'São Raimundo Nonato', slug: 'sao-raimundo-nonato', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 35000, isCapital: false },
    { name: 'Luzilândia', slug: 'luzilandia', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 28000, isCapital: false },
    { name: 'Bom Jesus', slug: 'bom-jesus', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 25000, isCapital: false },
    { name: 'Uruçuí', slug: 'urucui', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 23000, isCapital: false },
    { name: 'Cocal', slug: 'cocal', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 28000, isCapital: false },
    { name: 'Regeneração', slug: 'regeneracao', stateSlug: 'piaui', stateName: 'Piauí', stateAbbreviation: 'PI', population: 18000, isCapital: false },
  ],

  'alagoas': [
    { name: 'Maceió', slug: 'maceio', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 1025000, isCapital: true },
    { name: 'Arapiraca', slug: 'arapiraca', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 234000, isCapital: false },
    { name: 'Rio Largo', slug: 'rio-largo', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 77000, isCapital: false },
    { name: 'Palmeira dos Índios', slug: 'palmeira-dos-indios', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 74000, isCapital: false },
    { name: 'União dos Palmares', slug: 'uniao-dos-palmares', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 67000, isCapital: false },
    { name: 'Penedo', slug: 'penedo', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 65000, isCapital: false },
    { name: 'São Miguel dos Campos', slug: 'sao-miguel-dos-campos', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 60000, isCapital: false },
    { name: 'Coruripe', slug: 'coruripe', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 56000, isCapital: false },
    { name: 'Delmiro Gouveia', slug: 'delmiro-gouveia', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 53000, isCapital: false },
    { name: 'Marechal Deodoro', slug: 'marechal-deodoro', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 52000, isCapital: false },
    { name: 'Campo Alegre', slug: 'campo-alegre', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 51000, isCapital: false },
    { name: 'Santana do Ipanema', slug: 'santana-do-ipanema', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 48000, isCapital: false },
    { name: 'São Sebastião', slug: 'sao-sebastiao-al', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 35000, isCapital: false },
    { name: 'Pilar', slug: 'pilar', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 35000, isCapital: false },
    { name: 'Girau do Ponciano', slug: 'girau-do-ponciano', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 40000, isCapital: false },
    { name: 'Atalaia', slug: 'atalaia', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 48000, isCapital: false },
    { name: 'Viçosa', slug: 'vicosa-al', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 27000, isCapital: false },
    { name: 'Matriz de Camaragibe', slug: 'matriz-de-camaragibe', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 27000, isCapital: false },
    { name: 'Joaquim Gomes', slug: 'joaquim-gomes', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 24000, isCapital: false },
    { name: 'Satuba', slug: 'satuba', stateSlug: 'alagoas', stateName: 'Alagoas', stateAbbreviation: 'AL', population: 16000, isCapital: false },
  ],

  'sergipe': [
    { name: 'Aracaju', slug: 'aracaju', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 664000, isCapital: true },
    { name: 'Nossa Senhora do Socorro', slug: 'nossa-senhora-do-socorro', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 185000, isCapital: false },
    { name: 'Lagarto', slug: 'lagarto', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 106000, isCapital: false },
    { name: 'Itabaiana', slug: 'itabaiana-se', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 95000, isCapital: false },
    { name: 'São Cristóvão', slug: 'sao-cristovao', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 91000, isCapital: false },
    { name: 'Estância', slug: 'estancia', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 70000, isCapital: false },
    { name: 'Tobias Barreto', slug: 'tobias-barreto', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 53000, isCapital: false },
    { name: 'Barra dos Coqueiros', slug: 'barra-dos-coqueiros', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 34000, isCapital: false },
    { name: 'Simão Dias', slug: 'simao-dias', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 40000, isCapital: false },
    { name: 'Capela', slug: 'capela', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 35000, isCapital: false },
    { name: 'Propriá', slug: 'propria', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 30000, isCapital: false },
    { name: 'Poço Redondo', slug: 'poco-redondo', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 34000, isCapital: false },
    { name: 'Carira', slug: 'carira', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 22000, isCapital: false },
    { name: 'Canindé de São Francisco', slug: 'caninde-de-sao-francisco', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 29000, isCapital: false },
    { name: 'Laranjeiras', slug: 'laranjeiras', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 30000, isCapital: false },
    { name: 'Maruim', slug: 'maruim', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 18000, isCapital: false },
    { name: 'Ribeirópolis', slug: 'ribeiropolis', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 18000, isCapital: false },
    { name: 'Nossa Senhora da Glória', slug: 'nossa-senhora-da-gloria', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 37000, isCapital: false },
    { name: 'Neópolis', slug: 'neopolis', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 19000, isCapital: false },
    { name: 'Itabaianinha', slug: 'itabaianinha', stateSlug: 'sergipe', stateName: 'Sergipe', stateAbbreviation: 'SE', population: 42000, isCapital: false },
  ],

  'goias': [
    { name: 'Goiânia', slug: 'goiania', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 1555000, isCapital: true },
    { name: 'Aparecida de Goiânia', slug: 'aparecida-de-goiania', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 590000, isCapital: false },
    { name: 'Anápolis', slug: 'anapolis', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 391000, isCapital: false },
    { name: 'Rio Verde', slug: 'rio-verde', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 235000, isCapital: false },
    { name: 'Luziânia', slug: 'luziania', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 210000, isCapital: false },
    { name: 'Águas Lindas de Goiás', slug: 'aguas-lindas-de-goias', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 212000, isCapital: false },
    { name: 'Valparaíso de Goiás', slug: 'valparaiso-de-goias', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 180000, isCapital: false },
    { name: 'Trindade', slug: 'trindade', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 129000, isCapital: false },
    { name: 'Formosa', slug: 'formosa', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 123000, isCapital: false },
    { name: 'Novo Gama', slug: 'novo-gama', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 117000, isCapital: false },
    { name: 'Itumbiara', slug: 'itumbiara', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 106000, isCapital: false },
    { name: 'Senador Canedo', slug: 'senador-canedo', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 115000, isCapital: false },
    { name: 'Catalão', slug: 'catalao', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 112000, isCapital: false },
    { name: 'Jataí', slug: 'jatai', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 102000, isCapital: false },
    { name: 'Planaltina', slug: 'planaltina', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 95000, isCapital: false },
    { name: 'Caldas Novas', slug: 'caldas-novas', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 93000, isCapital: false },
    { name: 'Cidade Ocidental', slug: 'cidade-ocidental', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 76000, isCapital: false },
    { name: 'Goianésia', slug: 'goianesia', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 71000, isCapital: false },
    { name: 'Inhumas', slug: 'inhumas', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 54000, isCapital: false },
    { name: 'Mineiros', slug: 'mineiros', stateSlug: 'goias', stateName: 'Goiás', stateAbbreviation: 'GO', population: 61000, isCapital: false },
  ],

  'distrito-federal': [
    { name: 'Brasília', slug: 'brasilia', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 3094000, isCapital: true },
    { name: 'Ceilândia', slug: 'ceilandia', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 489000, isCapital: false },
    { name: 'Taguatinga', slug: 'taguatinga', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 222000, isCapital: false },
    { name: 'Samambaia', slug: 'samambaia', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 264000, isCapital: false },
    { name: 'Plano Piloto', slug: 'plano-piloto', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 221000, isCapital: false },
    { name: 'Águas Claras', slug: 'aguas-claras', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 161000, isCapital: false },
    { name: 'Recanto das Emas', slug: 'recanto-das-emas', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 158000, isCapital: false },
    { name: 'Gama', slug: 'gama', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 142000, isCapital: false },
    { name: 'Santa Maria', slug: 'santa-maria-df', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 135000, isCapital: false },
    { name: 'Sobradinho', slug: 'sobradinho', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 97000, isCapital: false },
    { name: 'Planaltina', slug: 'planaltina-df', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 206000, isCapital: false },
    { name: 'São Sebastião', slug: 'sao-sebastiao-df', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 115000, isCapital: false },
    { name: 'Vicente Pires', slug: 'vicente-pires', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 72000, isCapital: false },
    { name: 'Itapoã', slug: 'itapoa', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 68000, isCapital: false },
    { name: 'Paranoá', slug: 'paranoa', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 65000, isCapital: false },
    { name: 'Riacho Fundo', slug: 'riacho-fundo', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 45000, isCapital: false },
    { name: 'Núcleo Bandeirante', slug: 'nucleo-bandeirante', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 25000, isCapital: false },
    { name: 'Brazlândia', slug: 'brazlandia', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 57000, isCapital: false },
    { name: 'Guará', slug: 'guara', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 134000, isCapital: false },
    { name: 'Candangolândia', slug: 'candangolandia', stateSlug: 'distrito-federal', stateName: 'Distrito Federal', stateAbbreviation: 'DF', population: 16000, isCapital: false },
  ],

  'mato-grosso': [
    { name: 'Cuiabá', slug: 'cuiaba', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 618000, isCapital: true },
    { name: 'Várzea Grande', slug: 'varzea-grande', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 287000, isCapital: false },
    { name: 'Rondonópolis', slug: 'rondonopolis', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 239000, isCapital: false },
    { name: 'Sinop', slug: 'sinop', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 196000, isCapital: false },
    { name: 'Cáceres', slug: 'caceres', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 94000, isCapital: false },
    { name: 'Tangará da Serra', slug: 'tangara-da-serra', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 107000, isCapital: false },
    { name: 'Sorriso', slug: 'sorriso', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 100000, isCapital: false },
    { name: 'Lucas do Rio Verde', slug: 'lucas-do-rio-verde', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 78000, isCapital: false },
    { name: 'Primavera do Leste', slug: 'primavera-do-leste', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 67000, isCapital: false },
    { name: 'Barra do Garças', slug: 'barra-do-garcas', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 62000, isCapital: false },
    { name: 'Alta Floresta', slug: 'alta-floresta', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 52000, isCapital: false },
    { name: 'Pontes e Lacerda', slug: 'pontes-e-lacerda', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 45000, isCapital: false },
    { name: 'Nova Mutum', slug: 'nova-mutum', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 51000, isCapital: false },
    { name: 'Campo Verde', slug: 'campo-verde', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 47000, isCapital: false },
    { name: 'Juína', slug: 'juina', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 42000, isCapital: false },
    { name: 'Colíder', slug: 'colider', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 35000, isCapital: false },
    { name: 'Juara', slug: 'juara', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 37000, isCapital: false },
    { name: 'Peixoto de Azevedo', slug: 'peixoto-de-azevedo', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 38000, isCapital: false },
    { name: 'Guarantã do Norte', slug: 'guaranta-do-norte', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 37000, isCapital: false },
    { name: 'Confresa', slug: 'confresa', stateSlug: 'mato-grosso', stateName: 'Mato Grosso', stateAbbreviation: 'MT', population: 31000, isCapital: false },
  ],

  'mato-grosso-do-sul': [
    { name: 'Campo Grande', slug: 'campo-grande', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 916000, isCapital: true },
    { name: 'Dourados', slug: 'dourados', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 225000, isCapital: false },
    { name: 'Três Lagoas', slug: 'tres-lagoas', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 131000, isCapital: false },
    { name: 'Corumbá', slug: 'corumba', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 112000, isCapital: false },
    { name: 'Ponta Porã', slug: 'ponta-pora', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 93000, isCapital: false },
    { name: 'Naviraí', slug: 'navirai', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 55000, isCapital: false },
    { name: 'Nova Andradina', slug: 'nova-andradina', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 55000, isCapital: false },
    { name: 'Aquidauana', slug: 'aquidauana', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 48000, isCapital: false },
    { name: 'Sidrolândia', slug: 'sidrolandia', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 60000, isCapital: false },
    { name: 'Paranaíba', slug: 'paranaiba', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 42000, isCapital: false },
    { name: 'Maracaju', slug: 'maracaju', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 47000, isCapital: false },
    { name: 'Coxim', slug: 'coxim', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 34000, isCapital: false },
    { name: 'Amambai', slug: 'amambai', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 40000, isCapital: false },
    { name: 'Rio Brilhante', slug: 'rio-brilhante', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 40000, isCapital: false },
    { name: 'Cassilândia', slug: 'cassilandia', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 22000, isCapital: false },
    { name: 'Jardim', slug: 'jardim-ms', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 26000, isCapital: false },
    { name: 'Caarapó', slug: 'caarapo', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 30000, isCapital: false },
    { name: 'Ivinhema', slug: 'ivinhema', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 24000, isCapital: false },
    { name: 'São Gabriel do Oeste', slug: 'sao-gabriel-do-oeste', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 26000, isCapital: false },
    { name: 'Bataguassu', slug: 'bataguassu', stateSlug: 'mato-grosso-do-sul', stateName: 'Mato Grosso do Sul', stateAbbreviation: 'MS', population: 24000, isCapital: false },
  ],

  'para': [
    { name: 'Belém', slug: 'belem', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 1506000, isCapital: true },
    { name: 'Ananindeua', slug: 'ananindeua', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 535000, isCapital: false },
    { name: 'Santarém', slug: 'santarem', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 308000, isCapital: false },
    { name: 'Marabá', slug: 'maraba', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 283000, isCapital: false },
    { name: 'Parauapebas', slug: 'parauapebas', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 213000, isCapital: false },
    { name: 'Castanhal', slug: 'castanhal', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 203000, isCapital: false },
    { name: 'Abaetetuba', slug: 'abaetetuba', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 160000, isCapital: false },
    { name: 'Cametá', slug: 'cameta', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 140000, isCapital: false },
    { name: 'Marituba', slug: 'marituba', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 133000, isCapital: false },
    { name: 'Bragança', slug: 'braganca', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 128000, isCapital: false },
    { name: 'Altamira', slug: 'altamira', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 117000, isCapital: false },
    { name: 'Tucuruí', slug: 'tucurui', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 114000, isCapital: false },
    { name: 'Barcarena', slug: 'barcarena', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 124000, isCapital: false },
    { name: 'Tailândia', slug: 'tailandia', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 103000, isCapital: false },
    { name: 'Paragominas', slug: 'paragominas', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 113000, isCapital: false },
    { name: 'Itaituba', slug: 'itaituba', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 101000, isCapital: false },
    { name: 'Benevides', slug: 'benevides', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 64000, isCapital: false },
    { name: 'Moju', slug: 'moju', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 83000, isCapital: false },
    { name: 'Redenção', slug: 'redencao', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 86000, isCapital: false },
    { name: 'Tomé-Açu', slug: 'tome-acu', stateSlug: 'para', stateName: 'Pará', stateAbbreviation: 'PA', population: 65000, isCapital: false },
  ],

  'amazonas': [
    { name: 'Manaus', slug: 'manaus', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 2220000, isCapital: true },
    { name: 'Parintins', slug: 'parintins', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 115000, isCapital: false },
    { name: 'Itacoatiara', slug: 'itacoatiara', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 103000, isCapital: false },
    { name: 'Manacapuru', slug: 'manacapuru', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 100000, isCapital: false },
    { name: 'Coari', slug: 'coari', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 87000, isCapital: false },
    { name: 'Tefé', slug: 'tefe', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 62000, isCapital: false },
    { name: 'Tabatinga', slug: 'tabatinga', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 67000, isCapital: false },
    { name: 'Maués', slug: 'maues', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 64000, isCapital: false },
    { name: 'Rio Preto da Eva', slug: 'rio-preto-da-eva', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 37000, isCapital: false },
    { name: 'Iranduba', slug: 'iranduba', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 52000, isCapital: false },
    { name: 'Presidente Figueiredo', slug: 'presidente-figueiredo', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 38000, isCapital: false },
    { name: 'Humaitá', slug: 'humaita', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 57000, isCapital: false },
    { name: 'São Gabriel da Cachoeira', slug: 'sao-gabriel-da-cachoeira', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 47000, isCapital: false },
    { name: 'Lábrea', slug: 'labrea', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 48000, isCapital: false },
    { name: 'Benjamin Constant', slug: 'benjamin-constant', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 44000, isCapital: false },
    { name: 'Boca do Acre', slug: 'boca-do-acre', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 36000, isCapital: false },
    { name: 'Carauari', slug: 'carauari', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 29000, isCapital: false },
    { name: 'Eirunepé', slug: 'eirunepe', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 36000, isCapital: false },
    { name: 'Autazes', slug: 'autazes', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 41000, isCapital: false },
    { name: 'Borba', slug: 'borba', stateSlug: 'amazonas', stateName: 'Amazonas', stateAbbreviation: 'AM', population: 42000, isCapital: false },
  ],

  'rondonia': [
    { name: 'Porto Velho', slug: 'porto-velho', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 548000, isCapital: true },
    { name: 'Ji-Paraná', slug: 'ji-parana', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 130000, isCapital: false },
    { name: 'Ariquemes', slug: 'ariquemes', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 112000, isCapital: false },
    { name: 'Cacoal', slug: 'cacoal', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 90000, isCapital: false },
    { name: 'Vilhena', slug: 'vilhena', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 102000, isCapital: false },
    { name: 'Jaru', slug: 'jaru', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 58000, isCapital: false },
    { name: 'Rolim de Moura', slug: 'rolim-de-moura', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 57000, isCapital: false },
    { name: 'Guajará-Mirim', slug: 'guajara-mirim', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 47000, isCapital: false },
    { name: 'Ouro Preto do Oeste', slug: 'ouro-preto-do-oeste', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 40000, isCapital: false },
    { name: 'Pimenta Bueno', slug: 'pimenta-bueno', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 38000, isCapital: false },
    { name: 'Buritis', slug: 'buritis', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 41000, isCapital: false },
    { name: 'Machadinho d\'Oeste', slug: 'machadinho-doeste', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 40000, isCapital: false },
    { name: 'Candeias do Jamari', slug: 'candeias-do-jamari', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 27000, isCapital: false },
    { name: 'Espigão d\'Oeste', slug: 'espigao-doeste', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 33000, isCapital: false },
    { name: 'Nova Mamoré', slug: 'nova-mamore', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 32000, isCapital: false },
    { name: 'Colorado do Oeste', slug: 'colorado-do-oeste', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 18000, isCapital: false },
    { name: 'Presidente Médici', slug: 'presidente-medici', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 24000, isCapital: false },
    { name: 'São Miguel do Guaporé', slug: 'sao-miguel-do-guapore', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 25000, isCapital: false },
    { name: 'Alta Floresta d\'Oeste', slug: 'alta-floresta-doeste', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 25000, isCapital: false },
    { name: 'Cerejeiras', slug: 'cerejeiras', stateSlug: 'rondonia', stateName: 'Rondônia', stateAbbreviation: 'RO', population: 18000, isCapital: false },
  ],

  'tocantins': [
    { name: 'Palmas', slug: 'palmas', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 313000, isCapital: true },
    { name: 'Araguaína', slug: 'araguaina', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 183000, isCapital: false },
    { name: 'Gurupi', slug: 'gurupi', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 87000, isCapital: false },
    { name: 'Porto Nacional', slug: 'porto-nacional', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 54000, isCapital: false },
    { name: 'Paraíso do Tocantins', slug: 'paraiso-do-tocantins', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 52000, isCapital: false },
    { name: 'Colinas do Tocantins', slug: 'colinas-do-tocantins', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 39000, isCapital: false },
    { name: 'Guaraí', slug: 'guarai', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 26000, isCapital: false },
    { name: 'Tocantinópolis', slug: 'tocantinopolis', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 23000, isCapital: false },
    { name: 'Dianópolis', slug: 'dianopolis', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 22000, isCapital: false },
    { name: 'Miracema do Tocantins', slug: 'miracema-do-tocantins', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 20000, isCapital: false },
    { name: 'Formoso do Araguaia', slug: 'formoso-do-araguaia', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 19000, isCapital: false },
    { name: 'Augustinópolis', slug: 'augustinopolis', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 18000, isCapital: false },
    { name: 'Pedro Afonso', slug: 'pedro-afonso', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 15000, isCapital: false },
    { name: 'Taguatinga', slug: 'taguatinga-to', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 16000, isCapital: false },
    { name: 'Araguatins', slug: 'araguatins', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 35000, isCapital: false },
    { name: 'Xambioá', slug: 'xambioa', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 12000, isCapital: false },
    { name: 'Arraias', slug: 'arraias', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 11000, isCapital: false },
    { name: 'Natividade', slug: 'natividade', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 9000, isCapital: false },
    { name: 'Alvorada', slug: 'alvorada-to', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 9000, isCapital: false },
    { name: 'Lagoa da Confusão', slug: 'lagoa-da-confusao', stateSlug: 'tocantins', stateName: 'Tocantins', stateAbbreviation: 'TO', population: 14000, isCapital: false },
  ],

  'acre': [
    { name: 'Rio Branco', slug: 'rio-branco', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 419000, isCapital: true },
    { name: 'Cruzeiro do Sul', slug: 'cruzeiro-do-sul', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 89000, isCapital: false },
    { name: 'Sena Madureira', slug: 'sena-madureira', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 46000, isCapital: false },
    { name: 'Tarauacá', slug: 'tarauaca', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 43000, isCapital: false },
    { name: 'Feijó', slug: 'feijo', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 35000, isCapital: false },
    { name: 'Brasileia', slug: 'brasileia', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 27000, isCapital: false },
    { name: 'Epitaciolândia', slug: 'epitaciolandia', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 20000, isCapital: false },
    { name: 'Senador Guiomard', slug: 'senador-guiomard', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 23000, isCapital: false },
    { name: 'Xapuri', slug: 'xapuri', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 20000, isCapital: false },
    { name: 'Plácido de Castro', slug: 'placido-de-castro', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 19000, isCapital: false },
    { name: 'Mâncio Lima', slug: 'mancio-lima', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 19000, isCapital: false },
    { name: 'Rodrigues Alves', slug: 'rodrigues-alves', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 19000, isCapital: false },
    { name: 'Acrelândia', slug: 'acrelandia', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 16000, isCapital: false },
    { name: 'Bujari', slug: 'bujari', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 11000, isCapital: false },
    { name: 'Capixaba', slug: 'capixaba', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 13000, isCapital: false },
    { name: 'Porto Acre', slug: 'porto-acre', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 19000, isCapital: false },
    { name: 'Jordão', slug: 'jordao', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 9000, isCapital: false },
    { name: 'Marechal Thaumaturgo', slug: 'marechal-thaumaturgo', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 19000, isCapital: false },
    { name: 'Santa Rosa do Purus', slug: 'santa-rosa-do-purus', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 7000, isCapital: false },
    { name: 'Manoel Urbano', slug: 'manoel-urbano', stateSlug: 'acre', stateName: 'Acre', stateAbbreviation: 'AC', population: 10000, isCapital: false },
  ],

  'amapa': [
    { name: 'Macapá', slug: 'macapa', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 512000, isCapital: true },
    { name: 'Santana', slug: 'santana', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 123000, isCapital: false },
    { name: 'Laranjal do Jari', slug: 'laranjal-do-jari', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 52000, isCapital: false },
    { name: 'Oiapoque', slug: 'oiapoque', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 28000, isCapital: false },
    { name: 'Mazagão', slug: 'mazagao', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 22000, isCapital: false },
    { name: 'Porto Grande', slug: 'porto-grande', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 21000, isCapital: false },
    { name: 'Tartarugalzinho', slug: 'tartarugalzinho', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 17000, isCapital: false },
    { name: 'Pedra Branca do Amapari', slug: 'pedra-branca-do-amapari', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 18000, isCapital: false },
    { name: 'Ferreira Gomes', slug: 'ferreira-gomes', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 8000, isCapital: false },
    { name: 'Serra do Navio', slug: 'serra-do-navio', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 5000, isCapital: false },
    { name: 'Calçoene', slug: 'calcoene', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 11000, isCapital: false },
    { name: 'Amapá', slug: 'amapa-cidade', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 9000, isCapital: false },
    { name: 'Pracuúba', slug: 'pracuuba', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 5000, isCapital: false },
    { name: 'Cutias', slug: 'cutias', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 6000, isCapital: false },
    { name: 'Itaubal', slug: 'itaubal', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 5000, isCapital: false },
    { name: 'Vitória do Jari', slug: 'vitoria-do-jari', stateSlug: 'amapa', stateName: 'Amapá', stateAbbreviation: 'AP', population: 16000, isCapital: false },
  ],

  'roraima': [
    { name: 'Boa Vista', slug: 'boa-vista', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 426000, isCapital: true },
    { name: 'Rorainópolis', slug: 'rorainopolis', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 31000, isCapital: false },
    { name: 'Caracaraí', slug: 'caracarai', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 22000, isCapital: false },
    { name: 'Alto Alegre', slug: 'alto-alegre', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 17000, isCapital: false },
    { name: 'Mucajaí', slug: 'mucajai', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 18000, isCapital: false },
    { name: 'Cantá', slug: 'canta', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 18000, isCapital: false },
    { name: 'Bonfim', slug: 'bonfim', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 12000, isCapital: false },
    { name: 'Pacaraima', slug: 'pacaraima', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 18000, isCapital: false },
    { name: 'São João da Baliza', slug: 'sao-joao-da-baliza', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 8000, isCapital: false },
    { name: 'São Luiz', slug: 'sao-luiz-rr', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 8000, isCapital: false },
    { name: 'Normandia', slug: 'normandia', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 12000, isCapital: false },
    { name: 'Caroebe', slug: 'caroebe', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 10000, isCapital: false },
    { name: 'Amajari', slug: 'amajari', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 13000, isCapital: false },
    { name: 'Uiramutã', slug: 'uiramuta', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 14000, isCapital: false },
    { name: 'Iracema', slug: 'iracema', stateSlug: 'roraima', stateName: 'Roraima', stateAbbreviation: 'RR', population: 11000, isCapital: false },
  ],
};

// Helper function to get city by slug
export const getCityBySlug = (stateSlug: string, citySlug: string): CityContent | undefined => {
  const cities = citiesByState[stateSlug];
  if (!cities) return undefined;
  return cities.find(city => city.slug === citySlug);
};

// Helper function to get all cities for sitemap
export const getAllCities = (): Array<{ stateSlug: string; citySlug: string }> => {
  const result: Array<{ stateSlug: string; citySlug: string }> = [];
  for (const [stateSlug, cities] of Object.entries(citiesByState)) {
    for (const city of cities) {
      result.push({ stateSlug, citySlug: city.slug });
    }
  }
  return result;
};

// Get total count of cities
export const getTotalCitiesCount = (): number => {
  return Object.values(citiesByState).reduce((total, cities) => total + cities.length, 0);
};
