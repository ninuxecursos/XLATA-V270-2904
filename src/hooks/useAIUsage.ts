import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIUsageCategory {
  type: string;
  label: string;
  count: number;
  limit: number;
}

export interface AIUsageData {
  categories: AIUsageCategory[];
  totalCalls: number;
  totalLimit: number;
  isLoading: boolean;
  scanner: ScannerUsageData;
}

export interface ScannerUsageEntry {
  id: string;
  created_at: string;
  usage_type: string;
  feature_label: string | null;
  ai_model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
}

export interface ScannerUsageData {
  today: {
    scans: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  month: {
    scans: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  recent: ScannerUsageEntry[];
  // Free tier daily limits (Gemini)
  dailyLimit: number;
}

const GEMINI_FREE_LIMITS: Record<string, { limit: number; label: string }> = {
  product_generation: { limit: 500, label: 'Produtos gerados' },
  image_generation: { limit: 50, label: 'Imagens geradas' },
  seo_article: { limit: 500, label: 'Artigos SEO' },
  product_scanner_content: { limit: 500, label: 'Scanner de Produto (análise)' },
  product_scanner_image_edit: { limit: 50, label: 'Scanner de Produto (imagens)' },
};

const SCANNER_TYPES = new Set([
  'product_scanner_content',
  'product_scanner_image_edit',
  'product_scanner_marketplace',
]);

export function useAIUsage(): AIUsageData {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-usage-today-month'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from('ai_usage_log')
        .select('id, usage_type, feature_label, ai_model, input_tokens, output_tokens, estimated_cost_usd, created_at')
        .gte('created_at', monthStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI usage:', error);
        return { todayLogs: [], monthLogs: [] as any[], todayStartIso: todayStart.toISOString() };
      }
      return {
        todayLogs: (logs || []).filter(l => l.created_at >= todayStart.toISOString()),
        monthLogs: logs || [],
        todayStartIso: todayStart.toISOString(),
      };
    },
    refetchInterval: 30000,
  });

  const todayLogs = data?.todayLogs || [];
  const monthLogs = data?.monthLogs || [];

  const counts: Record<string, number> = {};
  todayLogs.forEach((log: any) => {
    counts[log.usage_type] = (counts[log.usage_type] || 0) + 1;
  });

  const categories: AIUsageCategory[] = Object.entries(GEMINI_FREE_LIMITS).map(
    ([type, { limit, label }]) => ({
      type,
      label,
      count: counts[type] || 0,
      limit,
    })
  );

  const totalCalls = categories.reduce((sum, c) => sum + c.count, 0);
  const totalLimit = 500;

  // Scanner-specific aggregation
  const aggregate = (logs: any[]) => {
    const filt = logs.filter(l => SCANNER_TYPES.has(l.usage_type));
    return {
      scans: filt.length,
      inputTokens: filt.reduce((s, l) => s + (l.input_tokens || 0), 0),
      outputTokens: filt.reduce((s, l) => s + (l.output_tokens || 0), 0),
      costUsd: filt.reduce((s, l) => s + (Number(l.estimated_cost_usd) || 0), 0),
    };
  };

  const scanner: ScannerUsageData = {
    today: aggregate(todayLogs),
    month: aggregate(monthLogs),
    recent: monthLogs
      .filter((l: any) => SCANNER_TYPES.has(l.usage_type))
      .slice(0, 20) as ScannerUsageEntry[],
    dailyLimit: 500,
  };

  return { categories, totalCalls, totalLimit, isLoading, scanner };
}
