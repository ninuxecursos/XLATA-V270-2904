import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for landing page data
export interface LandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  display_order: number;
  background_class: string | null;
}

export interface LandingHowItWorks {
  id: string;
  step_number: number;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface LandingRequirement {
  id: string;
  text: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export interface LandingProblem {
  id: string;
  title: string;
  loss_value: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export interface LandingKPI {
  id: string;
  value: string;
  label: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

export interface LandingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_file_url: string | null;
  video_type: 'url' | 'upload';
  column_position: number;
  thumbnail_url: string | null;
  duration: string | null;
  is_active: boolean;
  display_order: number;
}

export interface LandingTestimonial {
  id: string;
  name: string;
  company: string | null;
  location: string | null;
  rating: number;
  text: string;
  revenue: string | null;
  photo_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface LandingFAQ {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  display_order: number;
}

export interface LandingCTAFinal {
  id: string;
  main_text: string;
  sub_text: string | null;
  button_text: string;
  button_url: string | null;
  notes: string | null;
  is_active: boolean;
}

// Hook to fetch all landing data
export function useLandingData() {
  const sectionsQuery = useQuery({
    queryKey: ['landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_sections')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as LandingSection[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const howItWorksQuery = useQuery({
    queryKey: ['landing-how-it-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_how_it_works')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingHowItWorks[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const requirementsQuery = useQuery({
    queryKey: ['landing-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_requirements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingRequirement[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const problemsQuery = useQuery({
    queryKey: ['landing-problems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_problems')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingProblem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const kpisQuery = useQuery({
    queryKey: ['landing-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_kpis')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingKPI[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const videosQuery = useQuery({
    queryKey: ['landing-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingVideo[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const testimonialsQuery = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_testimonials')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingTestimonial[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const faqQuery = useQuery({
    queryKey: ['landing-faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_faq')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as LandingFAQ[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const ctaFinalQuery = useQuery({
    queryKey: ['landing-cta-final'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_cta_final')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as LandingCTAFinal | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const isSectionVisible = (key: string): boolean => {
    const section = sectionsQuery.data?.find(s => s.section_key === key);
    return section?.is_visible ?? true;
  };

  return {
    sections: sectionsQuery.data ?? [],
    howItWorks: howItWorksQuery.data ?? [],
    requirements: requirementsQuery.data ?? [],
    problems: problemsQuery.data ?? [],
    kpis: kpisQuery.data ?? [],
    videos: videosQuery.data ?? [],
    testimonials: testimonialsQuery.data ?? [],
    faq: faqQuery.data ?? [],
    ctaFinal: ctaFinalQuery.data,
    isSectionVisible,
    isLoading: sectionsQuery.isLoading || howItWorksQuery.isLoading,
    error: sectionsQuery.error || howItWorksQuery.error,
  };
}
