// SEO programático: 12 templates x ~580 cidades = ~6960 páginas únicas
import { CityContent } from './recyclingCitiesContent';

export type ArticleTemplate =
  | 'sistema' | 'software' | 'app-gestao'
  | 'gestao' | 'gestao-reciclagem' | 'como-gerenciar'
  | 'estoque' | 'controle-materiais'
  | 'financeiro' | 'lucro'
  | 'organizar' | 'organizar-patio';

const characterNames = [
  'Carlos', 'José', 'Antônio', 'Francisco', 'João', 'Pedro', 'Paulo',
  'Marcos', 'Roberto', 'Luís', 'Sérgio', 'Fernando', 'Ricardo', 'Eduardo',
  'Valdir', 'Cláudio', 'Reginaldo', 'Geraldo', 'Márcio', 'Adriano',
  'Sebastião', 'Mário', 'Osvaldo', 'Reinaldo', 'Edson', 'Nilton',
  'Wellington', 'Anderson', 'Ronaldo', 'Leandro'
];

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pick = <T,>(arr: T[], seed: number, offset = 0): T =>
  arr[(seed + offset) % arr.length];

// Template cluster mapping
type Cluster = 'sistema' | 'gestao' | 'estoque' | 'financeiro' | 'operacao';

const templateCluster: Record<ArticleTemplate, Cluster> = {
  sistema: 'sistema', software: 'sistema', 'app-gestao': 'sistema',
  gestao: 'gestao', 'gestao-reciclagem': 'gestao', 'como-gerenciar': 'gestao',
  estoque: 'estoque', 'controle-materiais': 'estoque',
  financeiro: 'financeiro', lucro: 'financeiro',
  organizar: 'operacao', 'organizar-patio': 'operacao',
};

export const templateConfigs: Record<ArticleTemplate, {
  urlPrefix: string; titlePrefix: string; titleSuffix: string;
  metaPrefix: string; metaSuffix: string;
}> = {
  sistema: {
    urlPrefix: 'sistema-ferro-velho',
    titlePrefix: 'Sistema para Ferro Velho em',
    titleSuffix: 'Como Organizar Seu Depósito de Sucata',
    metaPrefix: 'Sistema completo para ferro velho em',
    metaSuffix: 'Controle estoque, registre compras e gerencie seu depósito de sucata.',
  },
  software: {
    urlPrefix: 'software-ferro-velho',
    titlePrefix: 'Software para Ferro Velho em',
    titleSuffix: 'Tecnologia para Depósitos de Sucata',
    metaPrefix: 'Software especializado para ferro velho em',
    metaSuffix: 'Automatize operações do seu depósito de sucata com tecnologia.',
  },
  'app-gestao': {
    urlPrefix: 'app-gestao-reciclagem',
    titlePrefix: 'App de Gestão de Reciclagem em',
    titleSuffix: 'Gerencie Seu Ferro Velho pelo Celular',
    metaPrefix: 'App de gestão para reciclagem em',
    metaSuffix: 'Gerencie seu ferro velho de qualquer lugar pelo celular.',
  },
  gestao: {
    urlPrefix: 'gestao-deposito-sucata',
    titlePrefix: 'Gestão de Depósito de Sucata em',
    titleSuffix: 'Administre Seu Ferro Velho com Eficiência',
    metaPrefix: 'Gestão profissional para depósito de sucata em',
    metaSuffix: 'Administre seu ferro velho com controle financeiro e relatórios.',
  },
  'gestao-reciclagem': {
    urlPrefix: 'gestao-reciclagem',
    titlePrefix: 'Gestão de Reciclagem em',
    titleSuffix: 'Organize Seu Centro de Reciclagem',
    metaPrefix: 'Sistema de gestão de reciclagem em',
    metaSuffix: 'Organize e profissionalize seu centro de reciclagem.',
  },
  'como-gerenciar': {
    urlPrefix: 'como-gerenciar-ferro-velho',
    titlePrefix: 'Como Gerenciar um Ferro Velho em',
    titleSuffix: 'Guia Completo de Gestão',
    metaPrefix: 'Aprenda como gerenciar ferro velho em',
    metaSuffix: 'Guia completo para administrar seu depósito de sucata.',
  },
  estoque: {
    urlPrefix: 'controle-estoque-sucata',
    titlePrefix: 'Controle de Estoque de Sucata em',
    titleSuffix: 'Gerencie Materiais do Seu Ferro Velho',
    metaPrefix: 'Controle de estoque para ferro velho em',
    metaSuffix: 'Saiba exatamente quanto de cada material tem no seu depósito.',
  },
  'controle-materiais': {
    urlPrefix: 'controle-materiais-reciclagem',
    titlePrefix: 'Controle de Materiais Recicláveis em',
    titleSuffix: 'Gestão de Inventário para Reciclagem',
    metaPrefix: 'Controle de materiais recicláveis em',
    metaSuffix: 'Gerencie o inventário do seu depósito de reciclagem.',
  },
  financeiro: {
    urlPrefix: 'controle-financeiro-ferro-velho',
    titlePrefix: 'Controle Financeiro de Ferro Velho em',
    titleSuffix: 'Finanças do Seu Depósito de Sucata',
    metaPrefix: 'Controle financeiro para ferro velho em',
    metaSuffix: 'Gerencie receitas, despesas e lucro do seu depósito.',
  },
  lucro: {
    urlPrefix: 'lucro-ferro-velho',
    titlePrefix: 'Como Ter Mais Lucro no Ferro Velho em',
    titleSuffix: 'Aumente a Rentabilidade do Depósito',
    metaPrefix: 'Aumente o lucro do seu ferro velho em',
    metaSuffix: 'Estratégias para maximizar a rentabilidade do seu depósito.',
  },
  organizar: {
    urlPrefix: 'como-organizar-ferro-velho',
    titlePrefix: 'Como Organizar um Ferro Velho em',
    titleSuffix: 'Dicas de Organização para Depósitos',
    metaPrefix: 'Como organizar ferro velho em',
    metaSuffix: 'Dicas práticas para organizar seu depósito de sucata.',
  },
  'organizar-patio': {
    urlPrefix: 'organizar-patio-sucata',
    titlePrefix: 'Como Organizar o Pátio de Sucata em',
    titleSuffix: 'Layout e Organização do Depósito',
    metaPrefix: 'Organize o pátio de sucata em',
    metaSuffix: 'Layout profissional para o pátio do seu ferro velho.',
  },
};

// ===== INTRO VARIATIONS (by cluster) =====
const introPool: Record<Cluster, Array<(c: string, s: string) => string>> = {
  sistema: [
    (c, s) => `O setor de reciclagem e compra de sucata em ${c}, ${s}, tem crescido de forma consistente nos últimos anos. Com o aumento da demanda por materiais reciclados e a valorização de metais como cobre, alumínio e ferro, os depósitos de sucata da região se tornaram peças fundamentais na cadeia produtiva local.`,
    (c, s) => `${c}, no estado de ${s}, possui uma economia diversificada onde o comércio de sucata e materiais recicláveis ocupa um papel cada vez mais relevante. Ferro-velhos e depósitos de reciclagem atendem tanto catadores autônomos quanto empresas que precisam descartar resíduos metálicos.`,
    (c, s) => `A atividade de compra e venda de sucata em ${c}, ${s}, movimenta milhões de reais anualmente. Os depósitos de reciclagem da cidade processam toneladas de materiais ferrosos e não-ferrosos, contribuindo para a economia circular e a preservação ambiental.`,
    (c, s) => `Em ${c}, ${s}, o mercado de sucata e reciclagem é uma das atividades comerciais mais tradicionais. Dezenas de ferro-velhos operam na cidade e arredores, comprando materiais de catadores, empresas e indústrias.`,
  ],
  gestao: [
    (c, s) => `Administrar um depósito de sucata em ${c}, ${s}, exige habilidades que vão muito além do conhecimento técnico sobre materiais recicláveis. O proprietário precisa lidar com gestão de pessoas, finanças, logística e relacionamento com fornecedores simultaneamente.`,
    (c, s) => `A gestão profissional de ferro-velhos em ${c}, ${s}, é o diferencial que separa depósitos que crescem daqueles que estagnam. Em um mercado cada vez mais competitivo, administrar com eficiência é uma necessidade básica.`,
    (c, s) => `Os donos de ferro-velho em ${c}, ${s}, enfrentam diariamente o desafio de administrar um negócio complexo. São dezenas de tipos de materiais, fornecedores variados e uma operação que não para, exigindo gestão profissional.`,
    (c, s) => `O gerenciamento de depósitos de reciclagem em ${c}, ${s}, evoluiu significativamente nos últimos anos. Os proprietários que se adaptaram às novas tecnologias de gestão conquistaram vantagem competitiva expressiva na região.`,
  ],
  estoque: [
    (c, s) => `O controle de estoque em ferro-velhos de ${c}, ${s}, é um dos maiores desafios operacionais do setor de reciclagem. Diferente de um comércio convencional, o depósito lida com materiais a granel que precisam de rastreamento preciso.`,
    (c, s) => `Gerenciar materiais recicláveis em ${c}, ${s}, exige um controle de inventário robusto. Cada tipo de sucata possui peso, preço e condições de armazenamento específicos que precisam ser monitorados constantemente.`,
    (c, s) => `Os depósitos de sucata em ${c}, ${s}, processam toneladas de materiais diariamente. Sem um sistema de controle de estoque eficiente, é impossível saber com precisão o que está disponível para venda a qualquer momento.`,
    (c, s) => `O mercado de materiais recicláveis em ${c}, ${s}, é dinâmico e exige que os depósitos tenham controle preciso sobre seus estoques. Saber exatamente quanto de cada material está disponível é fundamental para negociar com compradores.`,
  ],
  financeiro: [
    (c, s) => `A gestão financeira é o calcanhar de Aquiles de muitos ferro-velhos em ${c}, ${s}. Embora movimentem volumes consideráveis de dinheiro, a maioria dos depósitos não tem controle real sobre receitas, despesas e lucro líquido.`,
    (c, s) => `O controle financeiro dos depósitos de sucata em ${c}, ${s}, é frequentemente negligenciado pelos proprietários, que focam na operação diária sem perceber quanto dinheiro escoa por falta de gestão adequada.`,
    (c, s) => `Maximizar o lucro de um ferro-velho em ${c}, ${s}, depende diretamente da qualidade do controle financeiro. Proprietários que dominam suas finanças conseguem reinvestir com inteligência e expandir seus negócios de forma sustentável.`,
    (c, s) => `Os ferro-velhos em ${c}, ${s}, movimentam valores expressivos diariamente, mas poucos proprietários sabem dizer com certeza qual é o lucro real do negócio ao final do mês. Isso acontece pela falta de controle financeiro adequado.`,
  ],
  operacao: [
    (c, s) => `A organização de um ferro-velho em ${c}, ${s}, impacta diretamente na produtividade e na lucratividade do negócio. Um depósito bem organizado processa mais material em menos tempo e com menos erros.`,
    (c, s) => `Organizar um depósito de sucata em ${c}, ${s}, vai muito além de empilhar materiais no pátio. Envolve criar um layout eficiente, definir processos e implementar um sistema que mantenha tudo sob controle.`,
    (c, s) => `O pátio de sucata é o coração operacional de qualquer ferro-velho em ${c}, ${s}. Quando bem organizado, permite atender mais fornecedores, despachar cargas com agilidade e reduzir perdas de material.`,
    (c, s) => `A desorganização é um dos maiores vilões da rentabilidade nos ferro-velhos de ${c}, ${s}. Materiais misturados, pátio caótico e processos informais geram perdas diárias que comprometem o resultado do negócio.`,
  ],
};

const intro2Pool: Record<Cluster, Array<(c: string) => string>> = {
  sistema: [
    (c) => `No entanto, muitos donos de ferro-velho em ${c} ainda enfrentam dificuldades para organizar suas operações. Controlar o estoque, registrar compras, calcular lucros e manter o histórico de transações são tarefas que, sem um sistema adequado, consomem tempo e geram prejuízos.`,
    (c) => `Apesar do potencial econômico, a maioria dos depósitos de sucata em ${c} opera sem ferramentas digitais de gestão. Anotações em cadernos, cálculos manuais e falta de controle financeiro são problemas que limitam o crescimento.`,
  ],
  gestao: [
    (c) => `A transição de uma gestão informal para uma administração profissional é o maior desafio dos ferro-velhos em ${c}. Sem processos estruturados e ferramentas adequadas, o proprietário fica preso à operação diária sem conseguir planejar o crescimento.`,
    (c) => `Muitos depósitos em ${c} ainda dependem exclusivamente da presença do dono para funcionar. Isso limita a capacidade de expansão e torna o negócio vulnerável a qualquer imprevisto.`,
  ],
  estoque: [
    (c) => `Sem um controle de estoque digital, os ferro-velhos de ${c} operam às cegas — comprando materiais que já têm em excesso e perdendo vendas por não saber o que está disponível no pátio.`,
    (c) => `A falta de controle de inventário nos depósitos de ${c} causa prejuízos silenciosos: materiais que deterioram, vendas perdidas por informação imprecisa e compras desnecessárias que travam o capital de giro.`,
  ],
  financeiro: [
    (c) => `Sem um controle financeiro estruturado, os proprietários de ferro-velho em ${c} não conseguem distinguir faturamento de lucro, e frequentemente descobrem tarde demais que estão operando no prejuízo.`,
    (c) => `A maioria dos ferro-velhos em ${c} mistura finanças pessoais com as do negócio, tornando impossível saber se o depósito está realmente sendo lucrativo ou apenas movimentando dinheiro.`,
  ],
  operacao: [
    (c) => `Um pátio desorganizado em ${c} significa materiais misturados, pesagem imprecisa, atendimento lento e, consequentemente, perda de fornecedores e compradores para concorrentes mais organizados.`,
    (c) => `A organização do ferro-velho em ${c} não é apenas uma questão estética — é uma estratégia de negócio que impacta diretamente no lucro, na produtividade e na satisfação dos clientes.`,
  ],
};

// ===== SECTION CONTENT GENERATORS =====

const section1Content: Record<Cluster, Array<(c: string) => string>> = {
  sistema: [
    (c) => `Um ferro-velho moderno em ${c} funciona como uma verdadeira empresa de logística reversa. O processo começa com a recepção de materiais — catadores, empresas e pessoas físicas trazem sucata para o depósito. O material é separado por tipo, pesado em balança calibrada e precificado conforme a tabela do dia.\n\nEm seguida, o material é armazenado no pátio até atingir volume suficiente para revenda a indústrias recicladoras. Esse ciclo exige controle rigoroso de entradas, saídas e valores para que o negócio seja lucrativo.\n\nOs depósitos em ${c} que adotam sistemas de gestão conseguem processar mais materiais com menos erros, aumentando significativamente sua margem de lucro.`,
    (c) => `O funcionamento de um ferro-velho profissional em ${c} vai além de simplesmente comprar e vender sucata. Envolve gestão de fornecedores, controle de qualidade dos materiais, negociação de preços e administração financeira completa.\n\nO depósito moderno utiliza balanças digitais, registra cada transação e mantém histórico de todos os fornecedores. Isso permite identificar padrões, negociar melhores preços e planejar compras estrategicamente.\n\nEm ${c}, os ferro-velhos que se modernizaram conseguem atender mais fornecedores por dia e oferecer um serviço mais profissional.`,
  ],
  gestao: [
    (c) => `A administração de um depósito de sucata em ${c} envolve múltiplos processos simultâneos que precisam funcionar em harmonia. Desde a recepção de materiais até o fechamento financeiro do mês, cada etapa impacta na rentabilidade.\n\nUm ferro-velho bem administrado organiza seus processos em fluxos claros: recepção, classificação, pesagem, pagamento, armazenamento e venda. Cada etapa gera dados que permitem análises valiosas sobre o desempenho.\n\nOs gestores de depósitos em ${c} que dominam esses processos tomam decisões baseadas em dados reais, não em intuição.`,
    (c) => `Gerenciar um ferro-velho em ${c} exige que o proprietário domine diversas áreas ao mesmo tempo: operacional, financeira, comercial e de pessoal. Sem ferramentas adequadas, é impossível ter controle sobre todas essas frentes.\n\nA profissionalização da gestão começa com a padronização de processos. Quando cada tarefa segue um fluxo definido, erros diminuem, a velocidade aumenta e o proprietário ganha tempo para focar no estratégico.\n\nOs depósitos mais bem-sucedidos de ${c} são aqueles que tratam a gestão como prioridade, não como consequência da operação.`,
  ],
  estoque: [
    (c) => `O controle de estoque em um ferro-velho de ${c} é um dos aspectos mais críticos da operação. Diferente de um comércio tradicional, o estoque é composto por materiais a granel que precisam ser quantificados com precisão.\n\nSem controle adequado, o proprietário não sabe quanto material tem disponível, quanto pagou por cada tipo e qual o valor real do seu estoque.\n\nOs ferro-velhos de ${c} que implementam controle rigoroso conseguem otimizar suas compras, negociar melhores preços de venda e reduzir perdas.`,
    (c) => `Controlar materiais recicláveis em ${c} exige monitoramento constante de dezenas de tipos de sucata, cada um com suas particularidades de armazenamento, preço e demanda.\n\nO estoque de um ferro-velho é extremamente dinâmico — novos materiais entram diariamente enquanto lotes saem para recicladores. Manter o registro atualizado em tempo real é essencial.\n\nEm ${c}, os depósitos que dominam o controle de materiais maximizam seus lucros porque sabem exatamente o custo médio de cada item.`,
  ],
  financeiro: [
    (c) => `O controle financeiro é o coração de um ferro-velho lucrativo em ${c}. Sem ele, é impossível saber se o negócio está realmente gerando lucro ou apenas movimentando dinheiro.\n\nUm controle financeiro eficiente inclui registro de todas as entradas e saídas, separação entre dinheiro do negócio e pessoal, caixa diário e relatórios periódicos.\n\nOs proprietários em ${c} que implementam controle financeiro rigoroso frequentemente se surpreendem ao descobrir onde estão os vazamentos de dinheiro.`,
    (c) => `A saúde financeira de um ferro-velho em ${c} depende de um controle meticuloso de cada centavo que entra e sai do negócio. O fluxo de caixa precisa ser acompanhado diariamente.\n\nMuitos proprietários em ${c} confundem faturamento com lucro. Movimentar R$ 50 mil por mês não significa lucrar R$ 50 mil. Sem calcular custos, despesas e margem por material, o resultado real fica obscuro.\n\nO controle financeiro profissional transforma dados em decisões: quando comprar mais, quando vender, quando cortar custos.`,
  ],
  operacao: [
    (c) => `Organizar um ferro-velho em ${c} começa pelo layout do pátio. Cada tipo de material deve ter uma área demarcada, facilitando a pesagem, o controle visual e a preparação para venda.\n\nA organização física deve ser complementada pela organização digital. Quando o pátio reflete o que está no sistema, a operação flui sem gargalos.\n\nOs ferro-velhos mais eficientes de ${c} investem em sinalização, treinamento de equipe e processos padronizados que garantem ordem mesmo nos dias de maior movimento.`,
    (c) => `O pátio de um ferro-velho em ${c} é onde o dinheiro está — literalmente. Toneladas de materiais com valores variados precisam ser organizados de forma que permitam fácil acesso, contagem e despacho.\n\nA desorganização gera custos invisíveis: tempo perdido procurando materiais, contaminação entre tipos diferentes de sucata e atrasos no carregamento de caminhões.\n\nDepósitos bem organizados em ${c} conseguem processar o dobro de volume com a mesma equipe, simplesmente por ter um layout eficiente e processos claros.`,
  ],
};

const section2Content: Record<Cluster, Array<(c: string) => string>> = {
  sistema: [
    (c) => `Os depósitos de sucata em ${c} enfrentam problemas operacionais que comprometem a lucratividade:\n\n• **Falta de controle de estoque**: sem saber quanto material há disponível, o proprietário perde oportunidades de venda\n\n• **Materiais perdidos ou desviados**: sem registro formal, é impossível detectar perdas no pátio\n\n• **Dificuldade em calcular o lucro real**: misturar despesas pessoais com as do negócio torna impossível saber se há lucro\n\n• **Vendas não registradas**: transações verbais geram disputas com fornecedores\n\n• **Desorganização do pátio**: sem categorização adequada, a operação fica lenta e ineficiente`,
  ],
  gestao: [
    (c) => `A gestão informal é o maior inimigo dos depósitos em ${c}. Sem processos estruturados:\n\n• **Decisões baseadas em intuição**: sem dados, o gestor não sabe quais materiais são mais rentáveis\n\n• **Fluxo de caixa descontrolado**: entradas e saídas sem registro tornam impossível planejar\n\n• **Dependência de anotações manuais**: cadernos se perdem e não permitem consultas rápidas\n\n• **Dificuldade em delegar**: sem sistema padronizado, o dono precisa estar presente em tudo\n\n• **Ausência de relatórios**: sem relatórios, o gestor navega às cegas`,
  ],
  estoque: [
    (c) => `O descontrole de estoque nos ferro-velhos de ${c} gera problemas financeiros sérios:\n\n• **Compra em excesso de materiais encalhados**: sem saber o estoque atual, compra-se o que não precisa\n\n• **Perda por não saber o preço de custo**: vender abaixo do custo sem perceber\n\n• **Deterioração de materiais**: sem controle, materiais ficam expostos e perdem valor\n\n• **Impossibilidade de calcular margem**: sem custo médio, não há como definir preço de venda\n\n• **Desorganização física do pátio**: materiais se misturam e a operação de carga fica lenta`,
  ],
  financeiro: [
    (c) => `Os problemas financeiros mais comuns nos ferro-velhos de ${c} incluem:\n\n• **Mistura de finanças pessoais e empresariais**: torna impossível saber o lucro real\n\n• **Falta de registro de despesas operacionais**: combustível, manutenção e outros custos ignorados\n\n• **Desconhecimento da margem por material**: vender sem saber se está lucrando\n\n• **Ausência de fluxo de caixa**: não saber se terá dinheiro para pagar fornecedores na semana seguinte\n\n• **Não calcular ponto de equilíbrio**: operar sem saber o faturamento mínimo necessário`,
  ],
  operacao: [
    (c) => `Os problemas operacionais mais comuns nos ferro-velhos de ${c}:\n\n• **Pátio sem demarcação**: materiais misturados dificultam a localização e pesagem\n\n• **Fluxo de recepção desorganizado**: filas e atrasos no atendimento a fornecedores\n\n• **Falta de padronização**: cada funcionário faz de um jeito diferente\n\n• **Perda de tempo em tarefas manuais**: cálculos, anotações e conferências que poderiam ser automatizados\n\n• **Dificuldade no despacho**: não saber onde cada material está no momento de carregar um caminhão`,
  ],
};

const section3Titles: Record<Cluster, string> = {
  sistema: 'A importância de ter um sistema de gestão',
  gestao: 'Por que a gestão profissional faz diferença',
  estoque: 'A importância do controle de estoque digital',
  financeiro: 'Por que o controle financeiro é essencial',
  operacao: 'A importância da organização no ferro-velho',
};

const section3Content: Record<Cluster, Array<(c: string) => string>> = {
  sistema: [
    (c) => `Ter um sistema de gestão em um ferro-velho de ${c} não é mais um luxo — é uma necessidade competitiva. O mercado de sucata está cada vez mais profissional.\n\nUm bom sistema automatiza tarefas repetitivas, como cálculo de valores baseados em peso e tipo de material. Isso acelera o atendimento, reduz erros e aumenta a satisfação dos fornecedores.\n\nAlém disso, ter dados organizados facilita a tomada de decisão. O proprietário identifica quais materiais são mais lucrativos e onde estão os gargalos.\n\nPara os ferro-velhos de ${c}, a digitalização representa um salto de produtividade que se traduz diretamente em mais lucro.`,
  ],
  gestao: [
    (c) => `A gestão profissional transforma um ferro-velho em ${c} de um negócio informal em uma empresa estruturada. Processos documentados e padronizados geram tempo, redução de custos e previsibilidade financeira.\n\nDepósitos bem geridos negociam melhores condições com compradores industriais, demonstrando volume consistente e qualidade.\n\nA profissionalização facilita o acesso a crédito bancário e financiamentos, com relatórios que comprovam a saúde financeira.\n\nEm ${c}, os depósitos que investem em gestão profissional se destacam e constroem negócios sustentáveis a longo prazo.`,
  ],
  estoque: [
    (c) => `O controle de estoque digital é o alicerce de um ferro-velho eficiente em ${c}. Quando cada entrada e saída é registrada digitalmente, o proprietário tem visibilidade total.\n\nCom dados em tempo real, é possível definir o momento ideal para vender cada material, evitando venda precipitada e acúmulo excessivo.\n\nO controle digital permite rastrear a origem de cada lote, identificar fornecedores confiáveis e detectar inconsistências.\n\nPara os depósitos de ${c}, investir em controle digital é o primeiro passo para profissionalizar e maximizar a rentabilidade.`,
  ],
  financeiro: [
    (c) => `O controle financeiro profissional separa os ferro-velhos que crescem daqueles que sobrevivem em ${c}. Quando o proprietário sabe exatamente quanto ganha e quanto gasta, pode tomar decisões estratégicas.\n\nConhecer a margem de lucro por material permite focar nos itens mais rentáveis. Entender os custos fixos ajuda a definir metas de faturamento.\n\nCom controle financeiro, o proprietário em ${c} consegue projetar investimentos, criar reservas e planejar a expansão do negócio com segurança.\n\nA diferença entre um ferro-velho que estagna e outro que prospera está, quase sempre, na qualidade da gestão financeira.`,
  ],
  operacao: [
    (c) => `A organização de um ferro-velho em ${c} não é apenas questão de aparência — é uma estratégia de negócio com impacto direto nos resultados.\n\nUm pátio organizado permite atender mais fornecedores por dia, reduzir erros de pesagem e classificação, e despachar cargas com agilidade.\n\nA organização também melhora a segurança do trabalho, reduzindo riscos de acidentes e melhorando as condições para os funcionários.\n\nOs depósitos mais organizados de ${c} conseguem fazer mais com menos, alcançando resultados superiores com equipes menores.`,
  ],
};

const section4Content: Array<(c: string) => string> = [
  (c) => `Organizar materiais recicláveis no pátio de um ferro-velho em ${c} é fundamental para a eficiência:\n\n• **Metais ferrosos**: ferro, aço, chapas, perfis, sucata automotiva\n• **Metais não-ferrosos**: cobre, alumínio, latão, bronze, zinco\n• **Plásticos**: PET, PEAD, PVC, PP\n• **Papéis e papelão**: branco, misto, ondulado\n• **Eletrônicos**: placas, fios, cabos, baterias\n\nCada categoria deve ter uma área demarcada no pátio, facilitando a pesagem e a preparação para venda. O sistema de gestão complementa a organização física.\n\nOs ferro-velhos de ${c} que organizam materiais sistematicamente processam mais volume em menos tempo.`,
  (c) => `A classificação eficiente de materiais em um depósito de ${c} impacta diretamente na produtividade e no lucro:\n\n• Localizar qualquer material rapidamente quando um comprador solicita\n• Pesar e despachar cargas com agilidade\n• Evitar contaminação entre materiais diferentes\n• Otimizar o espaço disponível no depósito\n• Facilitar o inventário e a conferência de estoque\n\nMateriais de maior valor como cobre e alumínio limpo devem ficar em área segura. Materiais volumosos devem ter espaço adequado para movimentação.\n\nOs depósitos mais organizados de ${c} investem em sinalização no pátio e treinamento dos funcionários.`,
];

const section5Content: Array<(c: string) => string> = [
  (c) => `Controlar as compras de sucata é essencial para a saúde financeira de qualquer ferro-velho em ${c}. Cada transação deve registrar:\n\n• **Fornecedor**: nome e contato\n• **Material**: tipo exato da sucata\n• **Peso**: quantidade em quilos ou toneladas\n• **Preço por quilo**: valor negociado\n• **Valor total**: peso x preço\n• **Data e hora**: quando a transação ocorreu\n\nCom esses registros, o proprietário analisa o custo médio ao longo do tempo, identifica melhores fornecedores e planeja o fluxo de caixa.\n\nOs ferro-velhos de ${c} que controlam compras negociam melhor com compradores, pois conhecem seu custo de aquisição.`,
  (c) => `O registro detalhado de compras no ferro-velho de ${c} é a base para uma gestão financeira sólida. Quando todas as aquisições são documentadas, o proprietário ganha visibilidade sobre:\n\n• Quanto está investindo em cada tipo de material por mês\n• Quais fornecedores oferecem melhor relação preço-qualidade\n• Se os preços de compra estão alinhados com o mercado\n• Qual o volume médio de compras por período\n• Como o fluxo de caixa é impactado pelas aquisições\n\nO controle de compras protege o proprietário em caso de disputas com fornecedores, pois há registro formal de cada transação.\n\nEm ${c}, os depósitos com controle rigoroso identificam tendências e antecipam variações de preço.`,
];

const section6Content: Array<(c: string) => string> = [
  (c) => `O controle financeiro é o coração de um ferro-velho lucrativo em ${c}. Um controle eficiente inclui:\n\n• **Registro de entradas**: cada venda, cada recebimento\n• **Registro de saídas**: compras, despesas operacionais, salários, aluguel\n• **Separação pessoal e empresarial**: fundamental para saber o lucro real\n• **Caixa diário**: conferência no início e fim de cada dia\n• **Relatórios periódicos**: análise semanal e mensal\n\nOs proprietários em ${c} que implementam controle financeiro frequentemente se surpreendem ao descobrir onde estão os vazamentos de dinheiro.`,
  (c) => `A gestão financeira profissional de um depósito de sucata em ${c} envolve:\n\n• **Fluxo de caixa detalhado**: acompanhar cada real que entra e sai\n• **Margem por material**: saber quanto ganha com cada tipo de sucata\n• **Despesas fixas vs. variáveis**: entender a estrutura de custos\n• **Ponto de equilíbrio**: saber quanto precisa faturar para cobrir todas as despesas\n• **Reserva de capital**: separar recursos para períodos de baixa\n\nOs depósitos de ${c} que dominam sua gestão financeira crescem de forma sustentável, reinvestindo lucros estrategicamente.`,
];

// Section 7 - Como o XLATA ajuda (per cluster)
const section7Content: Record<Cluster, Array<(c: string) => string>> = {
  sistema: [
    (c) => `O XLata é o sistema completo para ferro-velhos e depósitos de sucata em ${c}. Diferente de planilhas ou sistemas genéricos, o XLata entende as necessidades de quem trabalha com reciclagem.\n\nFuncionalidades:\n\n• **Cadastro ilimitado de materiais**: todos os tipos de sucata com preços por quilo\n• **Registro rápido de compras**: pese, selecione o tipo e o sistema calcula automaticamente\n• **Controle de estoque em tempo real**: saiba exatamente quanto de cada material está disponível\n• **Gestão financeira integrada**: receitas, despesas e lucro em um só lugar\n• **Histórico completo**: todas as transações registradas permanentemente\n• **Relatórios inteligentes**: gráficos e números para tomada de decisão\n\nO sistema funciona 100% online — computador, tablet ou celular. Acompanhe seu ferro-velho em ${c} de qualquer lugar.`,
  ],
  gestao: [
    (c) => `O XLata foi projetado para resolver os desafios de gestão de depósitos em ${c}. A plataforma substitui cadernos, planilhas e anotações soltas.\n\nFuncionalidades de gestão:\n\n• **Dashboard gerencial**: visão panorâmica com indicadores-chave\n• **Gestão de fornecedores**: cadastro com histórico completo\n• **Controle de funcionários**: permissões de acesso por colaborador\n• **Caixa diário**: abertura e fechamento com conferência automática\n• **Despesas operacionais**: registre todos os custos do negócio\n• **Relatórios financeiros**: lucro bruto, líquido, movimentação por período\n\nPara gestores de depósitos em ${c}, o XLata representa a transição para uma gestão profissional baseada em dados.`,
  ],
  estoque: [
    (c) => `O XLata oferece o controle de estoque mais completo para ferro-velhos em ${c}. O sistema foi desenvolvido para materiais recicláveis.\n\nFuncionalidades de estoque:\n\n• **Cadastro detalhado**: cada material com nome, categoria e preço/kg\n• **Entradas automáticas**: cada compra atualiza o estoque\n• **Saídas controladas**: vendas ajustam o inventário em tempo real\n• **Custo médio automático**: cálculo de custo médio por material\n• **Alertas de estoque**: quantidade baixa ou excessiva\n• **Inventário digital**: visualize todo o pátio em uma tela\n\nPara os depósitos de ${c}, controle total do estoque significa comprar melhor, vender no momento certo e nunca perder dinheiro.`,
  ],
  financeiro: [
    (c) => `O XLata transforma o controle financeiro do seu ferro-velho em ${c} com ferramentas específicas para o setor:\n\n• **Fluxo de caixa completo**: todas as entradas e saídas registradas automaticamente\n• **Lucro por material**: saiba quanto ganha com cada tipo de sucata\n• **Caixa diário**: abertura e fechamento com conferência de valores\n• **Despesas categorizadas**: combustível, aluguel, manutenção, salários\n• **Relatórios de lucro**: bruto, líquido, por período ou por material\n• **Histórico financeiro**: evolução do negócio ao longo dos meses\n\nCom o XLata, os proprietários de ferro-velho em ${c} finalmente conseguem saber o lucro real do negócio.`,
  ],
  operacao: [
    (c) => `O XLata ajuda a organizar a operação do seu ferro-velho em ${c} com ferramentas práticas:\n\n• **Cadastro de materiais por categoria**: organize digitalmente como está no pátio\n• **Fluxo de recepção**: registre cada entrada de material de forma rápida\n• **Comprovantes automáticos**: emita recibos profissionais para fornecedores\n• **Controle de funcionários**: cada um com seu acesso e permissões\n• **Estoque visual**: saiba o que tem no pátio sem precisar conferir fisicamente\n• **Relatórios operacionais**: volume processado por dia, semana, mês\n\nOs depósitos de ${c} que usam o XLata organizam sua operação e conseguem atender mais fornecedores com menos esforço.`,
  ],
};

// Section 8 - Storytelling
const generateStory = (c: string, name: string, cluster: Cluster): string => {
  const stories: Record<Cluster, string> = {
    sistema: `${name} é dono de um ferro-velho em ${c} há mais de 10 anos. Controlava tudo em cadernos. "Eu sabia mais ou menos quanto tinha no pátio, mas nunca tinha certeza", conta.\n\nQuando descobriu o XLata, testou por uma semana. "A primeira coisa que percebi foi que eu estava pagando preços diferentes pelo mesmo material, sem perceber", relata.\n\nCom o controle financeiro do XLata, ${name} descobriu despesas ocultas corroendo seu lucro. Ajustou preços, reorganizou o pátio e, em dois meses, aumentou sua margem em 15%.\n\n"Hoje eu sei exatamente quanto cada material me custa, quanto tenho em estoque e qual meu lucro real. O XLata transformou meu ferro-velho em ${c} em um negócio de verdade", conclui.`,
    gestao: `${name} administra um depósito de sucata em ${c} e tinha dificuldade em delegar. "Se eu não estivesse presente, as coisas não funcionavam", explica.\n\nCom o XLata, padronizou os processos. Cada funcionário recebeu acesso com permissões específicas. O balanceiro registra compras, o financeiro controla o caixa e ${name} acompanha tudo pelo celular.\n\n"Agora eu viajo para negociar vendas em outras cidades, porque sei que o depósito está funcionando. O sistema registra tudo", conta.\n\nA gestão profissional que o XLata trouxe permitiu que ${name} expandisse a operação e dobrasse seu faturamento em um ano.`,
    estoque: `${name} perdeu uma venda importante de cobre em ${c} porque não sabia quanto tinha em estoque. "O comprador pediu 2 toneladas e eu disse que tinha, mas eram apenas 800 quilos", lembra.\n\nIsso o levou ao XLata. "Cadastrei todos os materiais, fiz um inventário e comecei a registrar cada entrada e saída", explica.\n\nEm poucas semanas, ${name} tinha visibilidade total. "Quando um comprador liga, consulto no celular e dou a resposta na hora."\n\nCom o controle do XLata, ${name} nunca mais perdeu uma venda por falta de informação e planeja compras com base no que realmente precisa.`,
    financeiro: `${name} achava que seu ferro-velho em ${c} dava bom lucro, até começar a usar o XLata. "Quando vi os relatórios, descobri que minha margem real era muito menor do que eu imaginava", conta.\n\nO sistema mostrou que algumas despesas estavam escondidas em compras informais não registradas. ${name} também descobriu que vendia alguns materiais abaixo do custo médio de aquisição.\n\n"Ajustei meus preços, cortei despesas desnecessárias e em três meses meu lucro líquido quase dobrou. Eu estava perdendo dinheiro sem saber", explica.\n\nHoje ${name} confere os relatórios financeiros do XLata semanalmente e toma todas as decisões baseado nos dados.`,
    operacao: `O pátio do ferro-velho de ${name} em ${c} era caótico. "Material misturado, caminhão esperando horas para carregar, fornecedores reclamando da demora", relembra.\n\nCom o XLata, ${name} reorganizou todo o depósito. Cadastrou cada material com categoria, definiu áreas no pátio e começou a registrar entradas e saídas sistematicamente.\n\n"A diferença foi absurda. O tempo de carregamento caiu pela metade e consigo atender o dobro de fornecedores por dia", conta.\n\nA organização que o XLata trouxe transformou o depósito de ${name} em ${c} em referência na região, atraindo mais clientes pela agilidade no atendimento.`,
  };
  return stories[cluster];
};

// Section 9 - Benefícios
const benefitsContent: Record<Cluster, string> = {
  sistema: `Os benefícios de usar o XLata como sistema para seu ferro-velho:\n\n• **Controle total do estoque** — saiba o que tem disponível no pátio\n• **Registro automático de compras** — cada transação calculada e salva\n• **Gestão financeira completa** — receitas, despesas e lucro real\n• **Comprovantes profissionais** — emita recibos na hora\n• **Acesso pelo celular ou computador** — de qualquer lugar\n• **Histórico permanente** — nenhuma informação se perde\n• **Relatórios inteligentes** — decisões baseadas em dados\n• **Cadastro ilimitado** — todos os materiais que trabalha\n• **Múltiplos usuários** — cada funcionário com suas permissões`,
  gestao: `Os benefícios da gestão profissional com o XLata:\n\n• **Dashboard gerencial** — visão completa em uma tela\n• **Controle de funcionários** — permissões e produtividade\n• **Caixa diário** — abertura e fechamento automático\n• **Gestão de despesas** — todos os custos registrados\n• **Relatórios financeiros** — lucro bruto, líquido, por período\n• **Cadastro de fornecedores** — histórico de cada parceiro\n• **Operação remota** — administre pelo celular\n• **Dados seguros** — backup automático na nuvem\n• **Suporte especializado** — equipe que entende reciclagem`,
  estoque: `Os benefícios do controle de estoque com o XLata:\n\n• **Estoque em tempo real** — atualização automática\n• **Custo médio por material** — cálculo automático\n• **Alerta de quantidades** — falta ou excesso\n• **Histórico de movimentações** — rastreabilidade total\n• **Inventário digital** — todo o pátio em uma tela\n• **Otimização de compras** — compre apenas o necessário\n• **Venda no momento certo** — volume ideal identificado\n• **Redução de perdas** — inconsistências detectadas\n• **Integração financeira** — estoque conectado às finanças`,
  financeiro: `Os benefícios do controle financeiro com o XLata:\n\n• **Lucro real calculado** — saiba exatamente quanto ganha\n• **Margem por material** — identifique os mais rentáveis\n• **Despesas categorizadas** — saiba onde gasta cada real\n• **Fluxo de caixa visual** — acompanhe entradas e saídas\n• **Caixa diário** — conferência automatizada\n• **Relatórios de evolução** — compare meses e trimestres\n• **Ponto de equilíbrio** — saiba o mínimo para lucrar\n• **Planejamento financeiro** — projete investimentos\n• **Separação pessoal/empresa** — finanças organizadas`,
  operacao: `Os benefícios de organizar seu ferro-velho com o XLata:\n\n• **Pátio organizado digitalmente** — cada material em seu lugar\n• **Recepção rápida** — registre materiais em segundos\n• **Comprovantes automáticos** — profissionalismo no atendimento\n• **Equipe coordenada** — cada um com suas funções definidas\n• **Despacho ágil** — saiba onde cada material está\n• **Menos erros operacionais** — processos padronizados\n• **Mais fornecedores atendidos** — operação eficiente\n• **Redução de custos** — menos desperdício de tempo\n• **Controle remoto** — acompanhe a operação pelo celular`,
};

// FAQ
const generateFAQ = (city: string, state: string, cluster: Cluster) => {
  const common = [
    { q: `O XLata funciona para ferro-velhos em ${city}?`, a: `Sim, o XLata atende ferro-velhos, depósitos de sucata e centros de reciclagem em ${city} e em todo o Brasil. Funciona 100% online.` },
    { q: `Preciso instalar algo no computador?`, a: `Não. O XLata funciona no navegador, sem instalação. Acesse de qualquer computador, tablet ou celular.` },
    { q: `Quanto custa o XLata?`, a: `O XLata oferece período de teste gratuito. Após o teste, há planos acessíveis para qualquer ferro-velho.` },
    { q: `Posso cadastrar vários funcionários?`, a: `Sim. O XLata permite cadastrar funcionários com diferentes níveis de permissão.` },
    { q: `Meus dados ficam seguros?`, a: `Sim. Dados armazenados em servidores seguros com backup automático.` },
  ];
  const extras: Record<Cluster, { q: string; a: string }> = {
    sistema: { q: `O sistema calcula valores automaticamente?`, a: `Sim. Basta informar o peso e o tipo de material que o XLata calcula o valor da compra automaticamente baseado na sua tabela de preços.` },
    gestao: { q: `Consigo ver relatórios pelo celular?`, a: `Sim. Todos os relatórios e dashboards do XLata são acessíveis pelo celular, de qualquer lugar.` },
    estoque: { q: `O estoque atualiza automaticamente?`, a: `Sim. Cada compra ou venda registrada atualiza o estoque em tempo real automaticamente.` },
    financeiro: { q: `Consigo separar despesas pessoais das do negócio?`, a: `Sim. O XLata permite registrar apenas as despesas do depósito, mantendo as finanças do negócio separadas.` },
    operacao: { q: `O sistema ajuda a organizar o pátio?`, a: `Sim. Com o cadastro de materiais por categoria, você organiza digitalmente o que tem no pátio e mantém controle visual.` },
  };
  return [...common.slice(0, 4), extras[cluster]];
};

// ===================== MAIN GENERATOR =====================

export interface ProgrammaticArticle {
  template: ArticleTemplate;
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  sections: Array<{ title: string; content: string }>;
  faq: Array<{ q: string; a: string }>;
  characterName: string;
  city: CityContent;
}

export const generateArticle = (city: CityContent, template: ArticleTemplate): ProgrammaticArticle => {
  const cluster = templateCluster[template];
  const config = templateConfigs[template];
  const seed = hashString(`${city.slug}-${template}`);
  const stateAbbr = city.stateAbbreviation.toLowerCase();
  const characterName = pick(characterNames, seed);

  const title = `${config.titlePrefix} ${city.name} – ${config.titleSuffix}`;
  const metaTitle = `${config.titlePrefix} ${city.name} - ${city.stateAbbreviation} | XLata`;
  const metaDescription = `${config.metaPrefix} ${city.name}, ${city.stateAbbreviation}. ${config.metaSuffix} Teste grátis o XLata.`;
  const canonical = `https://xlata.site/blog/${config.urlPrefix}-${city.slug}-${stateAbbr}`;

  const sections = [
    {
      title,
      content: pick(introPool[cluster], seed)(city.name, city.stateName) + '\n\n' + pick(intro2Pool[cluster], seed)(city.name),
    },
    {
      title: `Como funciona um ferro-velho moderno em ${city.name}`,
      content: pick(section1Content[cluster], seed)(city.name),
    },
    {
      title: cluster === 'operacao' ? `Problemas operacionais nos ferro-velhos de ${city.name}` : `Problemas comuns nos depósitos de sucata em ${city.name}`,
      content: pick(section2Content[cluster], seed)(city.name),
    },
    {
      title: section3Titles[cluster],
      content: pick(section3Content[cluster], seed)(city.name),
    },
    {
      title: `Como organizar materiais recicláveis em ${city.name}`,
      content: pick(section4Content, seed)(city.name),
    },
    {
      title: `Como controlar compras de sucata em ${city.name}`,
      content: pick(section5Content, seed)(city.name),
    },
    {
      title: `Controle financeiro do ferro-velho em ${city.name}`,
      content: pick(section6Content, seed)(city.name),
    },
    {
      title: `Como o XLata ajuda depósitos de sucata em ${city.name}`,
      content: pick(section7Content[cluster], seed)(city.name),
    },
    {
      title: `Exemplo real de uso do XLata em ${city.name}`,
      content: generateStory(city.name, characterName, cluster),
    },
    {
      title: `Benefícios do XLata para ferro-velhos`,
      content: benefitsContent[cluster],
    },
  ];

  const faq = generateFAQ(city.name, city.stateName, cluster);

  return { template, title, metaTitle, metaDescription, canonical, sections, faq, characterName, city };
};

// Parse URL slug into template + city
export const parseArticleUrl = (path: string): { citySlug: string; stateAbbr: string; template: ArticleTemplate } | null => {
  const allTemplates = Object.entries(templateConfigs) as [ArticleTemplate, typeof templateConfigs[ArticleTemplate]][];
  // Sort by prefix length DESC to match longer prefixes first
  const sorted = allTemplates.sort((a, b) => b[1].urlPrefix.length - a[1].urlPrefix.length);

  for (const [template, config] of sorted) {
    const prefix = config.urlPrefix + '-';
    if (path.startsWith(prefix)) {
      const rest = path.slice(prefix.length);
      const lastDash = rest.lastIndexOf('-');
      if (lastDash > 0) {
        return {
          citySlug: rest.slice(0, lastDash),
          stateAbbr: rest.slice(lastDash + 1),
          template,
        };
      }
    }
  }
  return null;
};

// Generate all URLs for sitemap
export const getAllProgrammaticUrls = (citiesByState: Record<string, CityContent[]>): string[] => {
  const urls: string[] = [];
  const templates = Object.keys(templateConfigs) as ArticleTemplate[];

  for (const cities of Object.values(citiesByState)) {
    for (const city of cities) {
      const stateAbbr = city.stateAbbreviation.toLowerCase();
      for (const template of templates) {
        urls.push(`/blog/${templateConfigs[template].urlPrefix}-${city.slug}-${stateAbbr}`);
      }
    }
  }
  return urls;
};
