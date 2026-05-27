import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  LocalSeoState, 
  LocalSeoCity, 
  LocalSeoPage,
  LocalSeoFeature,
  LocalSeoFaq,
  NationalCoverageData 
} from '@/types/localSeo';

// Helper to safely parse JSONB features
const parseFeatures = (features: unknown): LocalSeoFeature[] => {
  if (!Array.isArray(features)) return [];
  return features.map(f => {
    if (typeof f === 'object' && f !== null) {
      return {
        icon: typeof (f as Record<string, unknown>).icon === 'string' ? (f as Record<string, unknown>).icon as string : undefined,
        title: typeof (f as Record<string, unknown>).title === 'string' ? (f as Record<string, unknown>).title as string : '',
        description: typeof (f as Record<string, unknown>).description === 'string' ? (f as Record<string, unknown>).description as string : '',
      };
    }
    return { title: '', description: '' };
  });
};

// Helper to safely parse JSONB FAQ
const parseFaq = (faq: unknown): LocalSeoFaq[] => {
  if (!Array.isArray(faq)) return [];
  return faq.map(f => {
    if (typeof f === 'object' && f !== null) {
      return {
        question: typeof (f as Record<string, unknown>).question === 'string' ? (f as Record<string, unknown>).question as string : '',
        answer: typeof (f as Record<string, unknown>).answer === 'string' ? (f as Record<string, unknown>).answer as string : '',
      };
    }
    return { question: '', answer: '' };
  });
};

// Fetch all active states ordered by display_order
export const useLocalSeoStates = () => {
  return useQuery({
    queryKey: ['local-seo-states'],
    queryFn: async (): Promise<LocalSeoState[]> => {
      const { data, error } = await supabase
        .from('local_seo_states')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};

// Fetch cities for a specific state
export const useLocalSeoCities = (stateId?: string) => {
  return useQuery({
    queryKey: ['local-seo-cities', stateId],
    queryFn: async (): Promise<LocalSeoCity[]> => {
      let query = supabase
        .from('local_seo_cities')
        .select('*')
        .eq('is_active', true)
        .order('population_rank', { ascending: true });

      if (stateId) {
        query = query.eq('state_id', stateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!stateId || stateId === undefined,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};

// Fetch a single local SEO page by slug
export const useLocalSeoPage = (slug: string) => {
  return useQuery({
    queryKey: ['local-seo-page', slug],
    queryFn: async (): Promise<LocalSeoPage | null> => {
      const { data, error } = await supabase
        .from('local_seo_pages')
        .select(`
          *,
          state:local_seo_states(*),
          city:local_seo_cities(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Parse JSONB fields with proper typing
        return {
          ...data,
          page_type: data.page_type as 'state' | 'city',
          status: data.status as 'draft' | 'published',
          features: parseFeatures(data.features),
          faq: parseFaq(data.faq),
          schema_data: data.schema_data as LocalSeoPage['schema_data'] || null,
          state: data.state as LocalSeoState | undefined,
          city: data.city as LocalSeoCity | undefined,
        } as LocalSeoPage;
      }
      
      return null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });
};

// Fetch all data for national coverage section (states + cities grouped)
export const useNationalCoverage = () => {
  return useQuery({
    queryKey: ['national-coverage'],
    queryFn: async (): Promise<NationalCoverageData> => {
      // Fetch states and cities in parallel
      const [statesRes, citiesRes, pagesRes] = await Promise.all([
        supabase
          .from('local_seo_states')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('local_seo_cities')
          .select('*')
          .eq('is_active', true)
          .order('population_rank', { ascending: true }),
        supabase
          .from('local_seo_pages')
          .select('slug, page_type, state_id, city_id')
          .eq('status', 'published')
      ]);

      if (statesRes.error) throw statesRes.error;
      if (citiesRes.error) throw citiesRes.error;

      const states = statesRes.data || [];
      const cities = citiesRes.data || [];
      const pages = pagesRes.data || [];

      // Group cities by state_id
      const citiesByState: Record<string, LocalSeoCity[]> = {};
      cities.forEach(city => {
        if (!citiesByState[city.state_id]) {
          citiesByState[city.state_id] = [];
        }
        citiesByState[city.state_id].push(city as LocalSeoCity);
      });

      // Create page slug lookup by state/city
      const pagesByLocation: Record<string, LocalSeoPage> = {};
      pages.forEach(page => {
        const key = page.city_id || page.state_id;
        if (key) {
          pagesByLocation[key] = page as LocalSeoPage;
        }
      });

      return {
        states: states as LocalSeoState[],
        citiesByState,
        pagesByLocation
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};

// Fetch related cities for a local page (other cities in the same state)
export const useRelatedCities = (stateId: string, currentCityId?: string) => {
  return useQuery({
    queryKey: ['related-cities', stateId, currentCityId],
    queryFn: async (): Promise<LocalSeoCity[]> => {
      let query = supabase
        .from('local_seo_cities')
        .select('*')
        .eq('state_id', stateId)
        .eq('is_active', true)
        .order('population_rank', { ascending: true })
        .limit(5);

      if (currentCityId) {
        query = query.neq('id', currentCityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!stateId,
    staleTime: 1000 * 60 * 60,
  });
};

// Increment view count for a page (fire and forget)
export const incrementPageView = async (pageId: string) => {
  try {
    // Use raw SQL increment via RPC or simple update
    const { data } = await supabase
      .from('local_seo_pages')
      .select('view_count')
      .eq('id', pageId)
      .single();
    
    if (data) {
      await supabase
        .from('local_seo_pages')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', pageId);
    }
  } catch {
    // Silent fail - view count is not critical
  }
};
