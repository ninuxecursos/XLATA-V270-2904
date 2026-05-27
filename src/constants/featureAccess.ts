/**
 * Feature Access System - Constants & Feature Map
 * 
 * Plans: ESSENCIAL → PRO (each includes all features from lower tiers)
 * 
 * ESSENCIAL: PDV (compra/venda), comprovantes, caixa, despesas, resumo de saldos, venda avulsa
 * PRO: + histórico, estoque, custos, relatórios, lucro por venda, clientes, funcionários,
 *        dashboard avançado, projeções, analytics, exportação CSV/Excel
 */

export const FEATURE_KEYS = {
  // ESSENCIAL features — o básico para operar
  PDV_ACCESS: 'pdv_access',
  REGISTER_PURCHASES: 'register_purchases',
  REGISTER_EXPENSES: 'register_expenses',
  CASH_SUMMARY: 'cash_summary',
  PRINT_RECEIPTS: 'print_receipts',
  CASH_REGISTER: 'cash_register',
  AVULSA_SALES: 'avulsa_sales',

  // PRO features (+ essencial)
  BASIC_HISTORY: 'basic_history',
  STOCK_CONTROL: 'stock_control',
  COST_TRACKING: 'cost_tracking',
  BASIC_REPORTS: 'basic_reports',
  PROFIT_PER_SALE: 'profit_per_sale',
  CLIENT_MANAGEMENT: 'client_management',
  EMPLOYEE_MANAGEMENT: 'employee_management',
  ADVANCED_DASHBOARD: 'advanced_dashboard',
  PROFIT_PROJECTIONS: 'profit_projections',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXPORT_CSV_EXCEL: 'export_csv_excel',
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

export const TIER_NAMES = {
  ESSENCIAL: 'essencial',
  PRO: 'pro',
} as const;

export type TierName = typeof TIER_NAMES[keyof typeof TIER_NAMES];

/** Static fallback: features included in each tier */
export const TIER_FEATURES: Record<TierName, FeatureKey[]> = {
  essencial: [
    FEATURE_KEYS.PDV_ACCESS,
    FEATURE_KEYS.REGISTER_PURCHASES,
    FEATURE_KEYS.REGISTER_EXPENSES,
    FEATURE_KEYS.CASH_SUMMARY,
    FEATURE_KEYS.PRINT_RECEIPTS,
    FEATURE_KEYS.CASH_REGISTER,
    FEATURE_KEYS.AVULSA_SALES,
  ],
  pro: [
    FEATURE_KEYS.PDV_ACCESS,
    FEATURE_KEYS.REGISTER_PURCHASES,
    FEATURE_KEYS.REGISTER_EXPENSES,
    FEATURE_KEYS.CASH_SUMMARY,
    FEATURE_KEYS.PRINT_RECEIPTS,
    FEATURE_KEYS.CASH_REGISTER,
    FEATURE_KEYS.AVULSA_SALES,
    FEATURE_KEYS.BASIC_HISTORY,
    FEATURE_KEYS.STOCK_CONTROL,
    FEATURE_KEYS.COST_TRACKING,
    FEATURE_KEYS.BASIC_REPORTS,
    FEATURE_KEYS.PROFIT_PER_SALE,
    FEATURE_KEYS.CLIENT_MANAGEMENT,
    FEATURE_KEYS.EMPLOYEE_MANAGEMENT,
    FEATURE_KEYS.ADVANCED_DASHBOARD,
    FEATURE_KEYS.PROFIT_PROJECTIONS,
    FEATURE_KEYS.ADVANCED_ANALYTICS,
    FEATURE_KEYS.EXPORT_CSV_EXCEL,
  ],
};

/** Minimum tier required for each feature */
export const FEATURE_MIN_TIER: Record<FeatureKey, TierName> = {
  [FEATURE_KEYS.PDV_ACCESS]: 'essencial',
  [FEATURE_KEYS.REGISTER_PURCHASES]: 'essencial',
  [FEATURE_KEYS.REGISTER_EXPENSES]: 'essencial',
  [FEATURE_KEYS.CASH_SUMMARY]: 'essencial',
  [FEATURE_KEYS.PRINT_RECEIPTS]: 'essencial',
  [FEATURE_KEYS.CASH_REGISTER]: 'essencial',
  [FEATURE_KEYS.AVULSA_SALES]: 'essencial',
  [FEATURE_KEYS.BASIC_HISTORY]: 'pro',
  [FEATURE_KEYS.STOCK_CONTROL]: 'pro',
  [FEATURE_KEYS.COST_TRACKING]: 'pro',
  [FEATURE_KEYS.BASIC_REPORTS]: 'pro',
  [FEATURE_KEYS.PROFIT_PER_SALE]: 'pro',
  [FEATURE_KEYS.CLIENT_MANAGEMENT]: 'pro',
  [FEATURE_KEYS.EMPLOYEE_MANAGEMENT]: 'pro',
  [FEATURE_KEYS.ADVANCED_DASHBOARD]: 'pro',
  [FEATURE_KEYS.PROFIT_PROJECTIONS]: 'pro',
  [FEATURE_KEYS.ADVANCED_ANALYTICS]: 'pro',
  [FEATURE_KEYS.EXPORT_CSV_EXCEL]: 'pro',
};

/** Feature labels in Portuguese */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  [FEATURE_KEYS.PDV_ACCESS]: 'PDV (compra e venda)',
  [FEATURE_KEYS.REGISTER_PURCHASES]: 'Registrar compras',
  [FEATURE_KEYS.REGISTER_EXPENSES]: 'Registrar despesas',
  [FEATURE_KEYS.CASH_SUMMARY]: 'Resumo de saldos no fechamento',
  [FEATURE_KEYS.PRINT_RECEIPTS]: 'Impressão de comprovantes',
  [FEATURE_KEYS.CASH_REGISTER]: 'Abertura/fechamento de caixa',
  [FEATURE_KEYS.AVULSA_SALES]: 'Venda avulsa com valor livre',
  [FEATURE_KEYS.BASIC_HISTORY]: 'Histórico de compras e vendas',
  [FEATURE_KEYS.STOCK_CONTROL]: 'Controle de estoque automático',
  [FEATURE_KEYS.COST_TRACKING]: 'Rastreamento de custos',
  [FEATURE_KEYS.BASIC_REPORTS]: 'Relatórios detalhados',
  [FEATURE_KEYS.PROFIT_PER_SALE]: 'Lucro por venda',
  [FEATURE_KEYS.CLIENT_MANAGEMENT]: 'Cadastro de clientes',
  [FEATURE_KEYS.EMPLOYEE_MANAGEMENT]: 'Gestão de funcionários',
  [FEATURE_KEYS.ADVANCED_DASHBOARD]: 'Dashboard avançado',
  [FEATURE_KEYS.PROFIT_PROJECTIONS]: 'Projeções de lucro',
  [FEATURE_KEYS.ADVANCED_ANALYTICS]: 'Analytics avançado',
  [FEATURE_KEYS.EXPORT_CSV_EXCEL]: 'Exportar CSV/Excel',
};
