import { FEATURE_KEYS, type FeatureKey } from './featureAccess';

/** Contextual persuasion messages per feature */
export const FEATURE_UPGRADE_MESSAGES: Record<FeatureKey, {
  headline: string;
  description: string;
  benefit: string;
}> = {
  [FEATURE_KEYS.PDV_ACCESS]: {
    headline: 'Ponto de Venda',
    description: 'Registre vendas de forma rápida e organizada.',
    benefit: 'Controle total das suas vendas diárias',
  },
  [FEATURE_KEYS.REGISTER_PURCHASES]: {
    headline: 'Registro de Compras',
    description: 'Cadastre todas as suas compras de materiais.',
    benefit: 'Nunca perca o controle do que entrou',
  },
  [FEATURE_KEYS.REGISTER_EXPENSES]: {
    headline: 'Registro de Despesas',
    description: 'Controle todas as saídas do seu negócio.',
    benefit: 'Saiba exatamente para onde vai seu dinheiro',
  },
  [FEATURE_KEYS.CASH_SUMMARY]: {
    headline: 'Resumo de Saldos',
    description: 'Veja o resumo de saldos ao fechar o caixa.',
    benefit: 'Saiba quanto movimentou no dia sem complicação',
  },
  [FEATURE_KEYS.BASIC_HISTORY]: {
    headline: 'Histórico Completo',
    description: 'Consulte o histórico detalhado de compras e vendas.',
    benefit: 'Tenha sempre um registro confiável e completo',
  },
  [FEATURE_KEYS.PRINT_RECEIPTS]: {
    headline: 'Impressão de Comprovantes',
    description: 'Imprima comprovantes de compra e venda.',
    benefit: 'Transparência para você e seus clientes',
  },
  [FEATURE_KEYS.CASH_REGISTER]: {
    headline: 'Controle de Caixa',
    description: 'Abra e feche o caixa com controle total.',
    benefit: 'Saiba exatamente quanto entrou e saiu',
  },
  [FEATURE_KEYS.AVULSA_SALES]: {
    headline: 'Venda Avulsa',
    description: 'Venda materiais avulsos com valor personalizado.',
    benefit: 'Flexibilidade para vendas não catalogadas',
  },
  [FEATURE_KEYS.STOCK_CONTROL]: {
    headline: 'Controle de Estoque Automático',
    description: 'Com o plano Pro, seu estoque é atualizado automaticamente a cada compra e venda.',
    benefit: 'Elimine perdas por falta de controle de materiais',
  },
  [FEATURE_KEYS.COST_TRACKING]: {
    headline: 'Rastreamento de Custos',
    description: 'Saiba exatamente quanto custa cada material e operação do seu depósito.',
    benefit: 'Identifique onde você está perdendo margem',
  },
  [FEATURE_KEYS.BASIC_REPORTS]: {
    headline: 'Relatórios Detalhados',
    description: 'Visualize relatórios de vendas, compras e despesas em um só lugar.',
    benefit: 'Tome decisões baseadas em dados reais',
  },
  [FEATURE_KEYS.PROFIT_PER_SALE]: {
    headline: 'Lucro por Venda',
    description: 'Veja o lucro real de cada venda, descontando custos de compra.',
    benefit: 'Descubra quais vendas realmente dão lucro',
  },
  [FEATURE_KEYS.CLIENT_MANAGEMENT]: {
    headline: 'Cadastro de Clientes',
    description: 'Gerencie seus clientes com histórico de compras e contato.',
    benefit: 'Fidelize seus melhores clientes',
  },
  [FEATURE_KEYS.EMPLOYEE_MANAGEMENT]: {
    headline: 'Gestão de Funcionários',
    description: 'Cadastre funcionários com controle de acesso e horário.',
    benefit: 'Delegue com segurança e controle',
  },
  [FEATURE_KEYS.ADVANCED_DASHBOARD]: {
    headline: 'Dashboard Avançado',
    description: 'Gráficos detalhados, tendências e visão completa do seu negócio.',
    benefit: 'Visão 360° do seu depósito em tempo real',
  },
  [FEATURE_KEYS.PROFIT_PROJECTIONS]: {
    headline: 'Projeções de Lucro',
    description: 'Faça upgrade para o Pro e veja projeções de lucro baseadas no seu estoque atual.',
    benefit: 'Planeje o futuro com dados concretos',
  },
  [FEATURE_KEYS.ADVANCED_ANALYTICS]: {
    headline: 'Analytics Avançado',
    description: 'Análises profundas de performance, sazonalidade e tendências.',
    benefit: 'Entenda padrões que outros não veem',
  },
  [FEATURE_KEYS.EXPORT_CSV_EXCEL]: {
    headline: 'Exportar CSV/Excel',
    description: 'Exporte seus dados para planilhas e compartilhe com seu contador.',
    benefit: 'Seus dados sempre acessíveis fora do sistema',
  },
};

/** Urgency messages for upgrade prompts */
export const URGENCY_MESSAGES = [
  'Teste grátis de 7 dias disponível',
  'Desbloqueie o controle total do seu negócio',
  'Donos de depósito que usam o Pro economizam em média 15%',
  'Sem compromisso — cancele quando quiser',
] as const;
