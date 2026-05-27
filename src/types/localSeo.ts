// Types for Local SEO functionality

export interface LocalSeoState {
  id: string;
  name: string;
  abbreviation: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocalSeoCity {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  is_capital: boolean;
  population_rank: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  state?: LocalSeoState;
}

export interface LocalSeoPage {
  id: string;
  slug: string;
  page_type: 'state' | 'city';
  state_id: string;
  city_id?: string | null;
  headline: string;
  subheadline?: string | null;
  content_html: string;
  features: LocalSeoFeature[];
  faq: LocalSeoFaq[];
  seo_title: string;
  seo_description: string;
  og_image?: string | null;
  canonical_url: string;
  schema_data?: LocalSeoSchema | null;
  status: 'draft' | 'published';
  allow_indexing: boolean;
  sitemap_priority: number;
  sitemap_changefreq: string;
  view_count: number;
  created_at?: string;
  updated_at?: string;
  state?: LocalSeoState;
  city?: LocalSeoCity;
}

export interface LocalSeoFeature {
  icon?: string;
  title: string;
  description: string;
}

export interface LocalSeoFaq {
  question: string;
  answer: string;
}

export interface LocalSeoSchema {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  areaServed?: {
    '@type': string;
    name: string;
    containedInPlace?: {
      '@type': string;
      name: string;
    };
  };
  provider?: {
    '@type': string;
    name: string;
    url?: string;
    serviceArea?: {
      '@type': string;
      name: string;
    };
  };
  [key: string]: unknown;
}

export interface NationalCoverageData {
  states: LocalSeoState[];
  citiesByState: Record<string, LocalSeoCity[]>;
  pagesByLocation: Record<string, LocalSeoPage>;
}
