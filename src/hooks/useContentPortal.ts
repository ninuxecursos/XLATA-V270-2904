import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  category_id: string | null;
  tags: string[];
  status: 'draft' | 'published';
  is_featured: boolean;
  pillar_page_slug: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  view_count: number;
  reading_time_minutes: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  category?: BlogCategory;
}

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  module: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  category_id: string | null;
  module: string;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  view_count: number;
  reading_time_minutes: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: HelpCategory;
  // Video fields
  video_url?: string | null;
  video_thumbnail?: string | null;
  youtube_video_id?: string | null;
}

export interface PillarPage {
  id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  hero_image: string | null;
  intro_text: string | null;
  sections: any[];
  features: any[];
  how_it_works: any[];
  benefits: any[];
  faq: any[];
  testimonials: any[];
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  cta_primary_text: string;
  cta_primary_url: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
  status: 'draft' | 'published';
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  short_definition: string;
  long_definition: string | null;
  examples: string | null;
  related_links: any[];
  related_terms: string[];
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  allow_indexing: boolean | null;
  status: 'draft' | 'published';
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Blog Hooks
export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setCategories(data as BlogCategory[]);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useBlogPosts = (options?: { featured?: boolean; categorySlug?: string; limit?: number }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, category:blog_categories(*)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredPosts = data as BlogPost[];
        
        if (options?.categorySlug) {
          filteredPosts = filteredPosts.filter(
            post => post.category?.slug === options.categorySlug
          );
        }
        
        setPosts(filteredPosts);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [options?.featured, options?.categorySlug, options?.limit]);

  return { posts, loading };
};

export const useBlogPost = (slug: string) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, category:blog_categories(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        setPost(data as BlogPost);
        // Increment view count
        supabase.rpc('increment_view_count', { table_name: 'blog_posts', record_id: data.id });
      }
      setLoading(false);
    };

    if (slug) fetchPost();
  }, [slug]);

  return { post, loading };
};

// Help Hooks
export const useHelpCategories = () => {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setCategories(data as HelpCategory[]);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useHelpArticles = (options?: { categorySlug?: string; module?: string; enabled?: boolean }) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Default enabled to true if not provided
  const isEnabled = options?.enabled !== false;

  useEffect(() => {
    // Skip fetch if disabled
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    const fetchArticles = async () => {
      let query = supabase
        .from('help_articles')
        .select('*, category:help_categories(*)')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (options?.module) {
        query = query.eq('module', options.module as any);
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredArticles = data as HelpArticle[];
        
        if (options?.categorySlug) {
          filteredArticles = filteredArticles.filter(
            article => article.category?.slug === options.categorySlug
          );
        }
        
        setArticles(filteredArticles);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [options?.categorySlug, options?.module, isEnabled]);

  return { articles, loading };
};

export const useHelpArticle = (slug: string) => {
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*, category:help_categories(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        setArticle(data as HelpArticle);
        supabase.rpc('increment_view_count', { table_name: 'help_articles', record_id: data.id });
      }
      setLoading(false);
    };

    if (slug) fetchArticle();
  }, [slug]);

  return { article, loading };
};

// Pillar Pages Hooks
export const usePillarPages = () => {
  const [pages, setPages] = useState<PillarPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('pillar_pages')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPages(data as PillarPage[]);
      }
      setLoading(false);
    };

    fetchPages();
  }, []);

  return { pages, loading };
};

export const usePillarPage = (slug: string) => {
  const [page, setPage] = useState<PillarPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from('pillar_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        setPage(data as PillarPage);
        supabase.rpc('increment_view_count', { table_name: 'pillar_pages', record_id: data.id });
      }
      setLoading(false);
    };

    if (slug) fetchPage();
  }, [slug]);

  return { page, loading };
};

// Glossary Hooks
export const useGlossaryTerms = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('status', 'published')
        .order('term', { ascending: true });

      if (!error && data) {
        setTerms(data as GlossaryTerm[]);
      }
      setLoading(false);
    };

    fetchTerms();
  }, []);

  return { terms, loading };
};

export const useGlossaryTerm = (slug: string) => {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerm = async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        setTerm(data as GlossaryTerm);
        supabase.rpc('increment_view_count', { table_name: 'glossary_terms', record_id: data.id });
      }
      setLoading(false);
    };

    if (slug) fetchTerm();
  }, [slug]);

  return { term, loading };
};

// Search Hook
export const useContentSearch = (query: string) => {
  const [results, setResults] = useState<{
    posts: BlogPost[];
    articles: HelpArticle[];
    terms: GlossaryTerm[];
  }>({ posts: [], articles: [], terms: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!query || query.length < 2) {
        setResults({ posts: [], articles: [], terms: [] });
        return;
      }

      setLoading(true);
      const searchTerm = `%${query}%`;

      const [postsRes, articlesRes, termsRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*, category:blog_categories(*)')
          .eq('status', 'published')
          .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content_md.ilike.${searchTerm},seo_title.ilike.${searchTerm}`)
          .order('view_count', { ascending: false })
          .limit(10),
        supabase
          .from('help_articles')
          .select('*')
          .eq('status', 'published')
          .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('glossary_terms')
          .select('*')
          .eq('status', 'published')
          .or(`term.ilike.${searchTerm},short_definition.ilike.${searchTerm}`)
          .limit(5),
      ]);

      setResults({
        posts: (postsRes.data || []) as BlogPost[],
        articles: (articlesRes.data || []) as HelpArticle[],
        terms: (termsRes.data || []) as GlossaryTerm[],
      });
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, loading };
};
