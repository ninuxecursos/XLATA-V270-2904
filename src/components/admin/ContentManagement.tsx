import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, HelpCircle, Lightbulb, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { marked } from 'marked';
import { sanitizeRichHtml } from '@/utils/sanitization';

// Types
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  is_featured: boolean | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  category_id: string | null;
  tags: string[] | null;
  status: 'draft' | 'published';
  is_featured: boolean | null;
  pillar_page_slug: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  reading_time_minutes: number | null;
}

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  module: string | null;
  sort_order: number | null;
}

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  category_id: string | null;
  module: string | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  reading_time_minutes: number | null;
}

interface PillarPage {
  id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  intro_text: string | null;
  hero_image: string | null;
  features: any;
  faq: any;
  how_it_works: any;
  benefits: any;
  testimonials: any;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  cta_primary_text: string | null;
  cta_primary_url: string | null;
  status: 'draft' | 'published';
}

interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  short_definition: string;
  long_definition: string | null;
  examples: string | null;
  related_terms: string[] | null;
  related_links: any;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published';
}

const SYSTEM_MODULES = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'despesas', label: 'Despesas' },
  { value: 'compra', label: 'PDV de Compra' },
  { value: 'venda', label: 'Venda por KG' },
  { value: 'estoque', label: 'Estoque e Projeção' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'transacoes', label: 'Transações' },
  { value: 'assinatura', label: 'Conta e Assinatura' },
  { value: 'geral', label: 'Geral' },
];

export const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Blog state
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Help state
  const [helpCategories, setHelpCategories] = useState<HelpCategory[]>([]);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isHelpCategoryDialogOpen, setIsHelpCategoryDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [editingHelpCategory, setEditingHelpCategory] = useState<HelpCategory | null>(null);
  
  // Solutions state
  const [pillarPages, setPillarPages] = useState<PillarPage[]>([]);
  const [isSolutionDialogOpen, setIsSolutionDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<PillarPage | null>(null);
  
  // Glossary state
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [isGlossaryDialogOpen, setIsGlossaryDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  
  // Form states
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_md: '',
    category_id: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    is_featured: false,
    pillar_page_slug: '',
    seo_title: '',
    seo_description: '',
    og_image: '',
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_featured: false,
  });
  
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_md: '',
    category_id: '',
    module: 'geral',
    status: 'draft' as 'draft' | 'published',
    seo_title: '',
    seo_description: '',
  });
  
  const [helpCategoryForm, setHelpCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    module: 'geral',
    sort_order: 0,
  });
  
  const [solutionForm, setSolutionForm] = useState({
    slug: '',
    headline: '',
    subheadline: '',
    intro_text: '',
    hero_image: '',
    features: '[]',
    faq: '[]',
    how_it_works: '[]',
    benefits: '[]',
    testimonials: '[]',
    seo_title: '',
    seo_description: '',
    og_image: '',
    cta_primary_text: 'Começar teste grátis 7 dias',
    cta_primary_url: '/register',
    status: 'draft' as 'draft' | 'published',
  });
  
  const [termForm, setTermForm] = useState({
    term: '',
    slug: '',
    short_definition: '',
    long_definition: '',
    examples: '',
    related_terms: '',
    seo_title: '',
    seo_description: '',
    status: 'draft' as 'draft' | 'published',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    switch (activeTab) {
      case 'blog':
        await Promise.all([loadBlogCategories(), loadBlogPosts()]);
        break;
      case 'help':
        await Promise.all([loadHelpCategories(), loadHelpArticles()]);
        break;
      case 'solutions':
        await loadPillarPages();
        break;
      case 'glossary':
        await loadGlossaryTerms();
        break;
    }
  };

  // Blog functions
  const loadBlogCategories = async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setBlogCategories(data);
  };

  const loadBlogPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setBlogPosts(data);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleSavePost = async () => {
    try {
      const contentHtml = await marked(postForm.content_md);
      const readingTime = calculateReadingTime(postForm.content_md);
      
      const postData = {
        title: postForm.title,
        slug: postForm.slug || generateSlug(postForm.title),
        excerpt: postForm.excerpt,
        content_md: postForm.content_md,
        content_html: contentHtml,
        category_id: postForm.category_id || null,
        tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()) : [],
        status: postForm.status,
        is_featured: postForm.is_featured,
        pillar_page_slug: postForm.pillar_page_slug || null,
        seo_title: postForm.seo_title || postForm.title,
        seo_description: postForm.seo_description || postForm.excerpt,
        og_image: postForm.og_image || null,
        reading_time_minutes: readingTime,
        published_at: postForm.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
        toast({ title: "Post atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);
        if (error) throw error;
        toast({ title: "Post criado com sucesso" });
      }

      setIsBlogDialogOpen(false);
      resetPostForm();
      loadBlogPosts();
    } catch (error: any) {
      toast({ title: "Erro ao salvar post", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Post excluído com sucesso" });
      loadBlogPosts();
    } catch (error: any) {
      toast({ title: "Erro ao excluir post", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePostStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', post.id);
      if (error) throw error;
      toast({ title: `Post ${newStatus === 'published' ? 'publicado' : 'despublicado'}` });
      loadBlogPosts();
    } catch (error: any) {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content_md: post.content_md || '',
      category_id: post.category_id || '',
      tags: post.tags?.join(', ') || '',
      status: post.status,
      is_featured: post.is_featured || false,
      pillar_page_slug: post.pillar_page_slug || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      og_image: post.og_image || '',
    });
    setIsBlogDialogOpen(true);
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      slug: '',
      excerpt: '',
      content_md: '',
      category_id: '',
      tags: '',
      status: 'draft',
      is_featured: false,
      pillar_page_slug: '',
      seo_title: '',
      seo_description: '',
      og_image: '',
    });
    setShowPreview(false);
  };

  // Category functions
  const handleSaveCategory = async () => {
    try {
      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug || generateSlug(categoryForm.name),
        description: categoryForm.description || null,
        icon: categoryForm.icon || null,
        sort_order: categoryForm.sort_order,
        is_featured: categoryForm.is_featured,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: "Categoria atualizada" });
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);
        if (error) throw error;
        toast({ title: "Categoria criada" });
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadBlogCategories();
    } catch (error: any) {
      toast({ title: "Erro ao salvar categoria", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Categoria excluída" });
      loadBlogCategories();
    } catch (error: any) {
      toast({ title: "Erro ao excluir categoria", variant: "destructive" });
    }
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0,
      is_featured: category.is_featured || false,
    });
    setIsCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: '',
      sort_order: 0,
      is_featured: false,
    });
  };

  // Help functions
  const loadHelpCategories = async () => {
    const { data, error } = await supabase
      .from('help_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setHelpCategories(data);
  };

  const loadHelpArticles = async () => {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setHelpArticles(data);
  };

  const handleSaveArticle = async () => {
    try {
      const contentHtml = await marked(articleForm.content_md);
      const readingTime = calculateReadingTime(articleForm.content_md);
      
      const articleData = {
        title: articleForm.title,
        slug: articleForm.slug || generateSlug(articleForm.title),
        excerpt: articleForm.excerpt,
        content_md: articleForm.content_md,
        content_html: contentHtml,
        category_id: articleForm.category_id || null,
        module: articleForm.module as any,
        status: articleForm.status,
        seo_title: articleForm.seo_title || articleForm.title,
        seo_description: articleForm.seo_description || articleForm.excerpt,
        reading_time_minutes: readingTime,
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('help_articles')
          .update(articleData)
          .eq('id', editingArticle.id);
        if (error) throw error;
        toast({ title: "Artigo atualizado" });
      } else {
        const { error } = await supabase
          .from('help_articles')
          .insert([articleData]);
        if (error) throw error;
        toast({ title: "Artigo criado" });
      }

      setIsHelpDialogOpen(false);
      resetArticleForm();
      loadHelpArticles();
    } catch (error: any) {
      toast({ title: "Erro ao salvar artigo", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Artigo excluído" });
      loadHelpArticles();
    } catch (error: any) {
      toast({ title: "Erro ao excluir artigo", variant: "destructive" });
    }
  };

  const handleEditArticle = (article: HelpArticle) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content_md: article.content_md || '',
      category_id: article.category_id || '',
      module: article.module || 'geral',
      status: article.status,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
    });
    setIsHelpDialogOpen(true);
  };

  const resetArticleForm = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      slug: '',
      excerpt: '',
      content_md: '',
      category_id: '',
      module: 'geral',
      status: 'draft',
      seo_title: '',
      seo_description: '',
    });
  };

  // Help Category functions
  const handleSaveHelpCategory = async () => {
    try {
      const categoryData = {
        name: helpCategoryForm.name,
        slug: helpCategoryForm.slug || generateSlug(helpCategoryForm.name),
        description: helpCategoryForm.description || null,
        icon: helpCategoryForm.icon || null,
        module: helpCategoryForm.module as any,
        sort_order: helpCategoryForm.sort_order,
      };

      if (editingHelpCategory) {
        const { error } = await supabase
          .from('help_categories')
          .update(categoryData)
          .eq('id', editingHelpCategory.id);
        if (error) throw error;
        toast({ title: "Categoria atualizada" });
      } else {
        const { error } = await supabase
          .from('help_categories')
          .insert([categoryData]);
        if (error) throw error;
        toast({ title: "Categoria criada" });
      }

      setIsHelpCategoryDialogOpen(false);
      resetHelpCategoryForm();
      loadHelpCategories();
    } catch (error: any) {
      toast({ title: "Erro ao salvar categoria", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteHelpCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('help_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Categoria excluída" });
      loadHelpCategories();
    } catch (error: any) {
      toast({ title: "Erro ao excluir categoria", variant: "destructive" });
    }
  };

  const handleEditHelpCategory = (category: HelpCategory) => {
    setEditingHelpCategory(category);
    setHelpCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      module: category.module || 'geral',
      sort_order: category.sort_order || 0,
    });
    setIsHelpCategoryDialogOpen(true);
  };

  const resetHelpCategoryForm = () => {
    setEditingHelpCategory(null);
    setHelpCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: '',
      module: 'geral',
      sort_order: 0,
    });
  };

  // Pillar Pages functions
  const loadPillarPages = async () => {
    const { data, error } = await supabase
      .from('pillar_pages')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPillarPages(data);
  };

  const handleSaveSolution = async () => {
    try {
      const solutionData = {
        slug: solutionForm.slug || generateSlug(solutionForm.headline),
        headline: solutionForm.headline,
        subheadline: solutionForm.subheadline || null,
        intro_text: solutionForm.intro_text || null,
        hero_image: solutionForm.hero_image || null,
        features: JSON.parse(solutionForm.features || '[]'),
        faq: JSON.parse(solutionForm.faq || '[]'),
        how_it_works: JSON.parse(solutionForm.how_it_works || '[]'),
        benefits: JSON.parse(solutionForm.benefits || '[]'),
        testimonials: JSON.parse(solutionForm.testimonials || '[]'),
        seo_title: solutionForm.seo_title || solutionForm.headline,
        seo_description: solutionForm.seo_description || solutionForm.subheadline,
        og_image: solutionForm.og_image || null,
        cta_primary_text: solutionForm.cta_primary_text,
        cta_primary_url: solutionForm.cta_primary_url,
        status: solutionForm.status,
      };

      if (editingSolution) {
        const { error } = await supabase
          .from('pillar_pages')
          .update(solutionData)
          .eq('id', editingSolution.id);
        if (error) throw error;
        toast({ title: "Página atualizada" });
      } else {
        const { error } = await supabase
          .from('pillar_pages')
          .insert([solutionData]);
        if (error) throw error;
        toast({ title: "Página criada" });
      }

      setIsSolutionDialogOpen(false);
      resetSolutionForm();
      loadPillarPages();
    } catch (error: any) {
      toast({ title: "Erro ao salvar página", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSolution = async (id: string) => {
    try {
      const { error } = await supabase.from('pillar_pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Página excluída" });
      loadPillarPages();
    } catch (error: any) {
      toast({ title: "Erro ao excluir página", variant: "destructive" });
    }
  };

  const handleEditSolution = (solution: PillarPage) => {
    setEditingSolution(solution);
    setSolutionForm({
      slug: solution.slug,
      headline: solution.headline,
      subheadline: solution.subheadline || '',
      intro_text: solution.intro_text || '',
      hero_image: solution.hero_image || '',
      features: JSON.stringify(solution.features || [], null, 2),
      faq: JSON.stringify(solution.faq || [], null, 2),
      how_it_works: JSON.stringify(solution.how_it_works || [], null, 2),
      benefits: JSON.stringify(solution.benefits || [], null, 2),
      testimonials: JSON.stringify(solution.testimonials || [], null, 2),
      seo_title: solution.seo_title || '',
      seo_description: solution.seo_description || '',
      og_image: solution.og_image || '',
      cta_primary_text: solution.cta_primary_text || 'Começar teste grátis 7 dias',
      cta_primary_url: solution.cta_primary_url || '/register',
      status: solution.status,
    });
    setIsSolutionDialogOpen(true);
  };

  const resetSolutionForm = () => {
    setEditingSolution(null);
    setSolutionForm({
      slug: '',
      headline: '',
      subheadline: '',
      intro_text: '',
      hero_image: '',
      features: '[]',
      faq: '[]',
      how_it_works: '[]',
      benefits: '[]',
      testimonials: '[]',
      seo_title: '',
      seo_description: '',
      og_image: '',
      cta_primary_text: 'Começar teste grátis 7 dias',
      cta_primary_url: '/register',
      status: 'draft',
    });
  };

  // Glossary functions
  const loadGlossaryTerms = async () => {
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true });
    if (!error && data) setGlossaryTerms(data);
  };

  const handleSaveTerm = async () => {
    try {
      const termData = {
        term: termForm.term,
        slug: termForm.slug || generateSlug(termForm.term),
        short_definition: termForm.short_definition,
        long_definition: termForm.long_definition || null,
        examples: termForm.examples || null,
        related_terms: termForm.related_terms ? termForm.related_terms.split(',').map(t => t.trim()) : [],
        seo_title: termForm.seo_title || termForm.term,
        seo_description: termForm.seo_description || termForm.short_definition,
        status: termForm.status,
      };

      if (editingTerm) {
        const { error } = await supabase
          .from('glossary_terms')
          .update(termData)
          .eq('id', editingTerm.id);
        if (error) throw error;
        toast({ title: "Termo atualizado" });
      } else {
        const { error } = await supabase
          .from('glossary_terms')
          .insert([termData]);
        if (error) throw error;
        toast({ title: "Termo criado" });
      }

      setIsGlossaryDialogOpen(false);
      resetTermForm();
      loadGlossaryTerms();
    } catch (error: any) {
      toast({ title: "Erro ao salvar termo", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      const { error } = await supabase.from('glossary_terms').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Termo excluído" });
      loadGlossaryTerms();
    } catch (error: any) {
      toast({ title: "Erro ao excluir termo", variant: "destructive" });
    }
  };

  const handleEditTerm = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setTermForm({
      term: term.term,
      slug: term.slug,
      short_definition: term.short_definition,
      long_definition: term.long_definition || '',
      examples: term.examples || '',
      related_terms: term.related_terms?.join(', ') || '',
      seo_title: term.seo_title || '',
      seo_description: term.seo_description || '',
      status: term.status,
    });
    setIsGlossaryDialogOpen(true);
  };

  const resetTermForm = () => {
    setEditingTerm(null);
    setTermForm({
      term: '',
      slug: '',
      short_definition: '',
      long_definition: '',
      examples: '',
      related_terms: '',
      seo_title: '',
      seo_description: '',
      status: 'draft',
    });
  };

  // Filter items based on search
  const filteredPosts = blogPosts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArticles = helpArticles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSolutions = pillarPages.filter(s => 
    s.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subheadline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTerms = glossaryTerms.filter(t => 
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.short_definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Conteúdo</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Soluções
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Glossário
          </TabsTrigger>
        </TabsList>

        {/* Blog Tab */}
        <TabsContent value="blog" className="space-y-4">
          <div className="flex gap-4">
            {/* Categories */}
            <Card className="w-64 shrink-0">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Categorias</CardTitle>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={resetCategoryForm}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={categoryForm.slug}
                          onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                          placeholder="Auto-gerado se vazio"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Ícone (Lucide)</Label>
                        <Input
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          placeholder="Ex: FileText"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={categoryForm.is_featured}
                          onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_featured: checked })}
                        />
                        <Label>Destaque</Label>
                      </div>
                      <Button onClick={handleSaveCategory} className="w-full">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      Todas ({blogPosts.length})
                    </button>
                    {blogCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex-1 text-left px-3 py-2 rounded text-sm truncate ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                          {cat.name}
                        </button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Posts */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Posts ({filteredPosts.length})</CardTitle>
                <Dialog open={isBlogDialogOpen} onOpenChange={setIsBlogDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetPostForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPost ? 'Editar' : 'Novo'} Post</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={postForm.title}
                            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Slug</Label>
                          <Input
                            value={postForm.slug}
                            onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                            placeholder="Auto-gerado se vazio"
                          />
                        </div>
                        <div>
                          <Label>Resumo</Label>
                          <Textarea
                            value={postForm.excerpt}
                            onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Select
                            value={postForm.category_id}
                            onValueChange={(value) => setPostForm({ ...postForm, category_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {blogCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tags (separadas por vírgula)</Label>
                          <Input
                            value={postForm.tags}
                            onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Slug da Página Pilar Relacionada</Label>
                          <Input
                            value={postForm.pillar_page_slug}
                            onChange={(e) => setPostForm({ ...postForm, pillar_page_slug: e.target.value })}
                            placeholder="Ex: sistema-para-deposito-de-reciclagem"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={postForm.is_featured}
                              onCheckedChange={(checked) => setPostForm({ ...postForm, is_featured: checked })}
                            />
                            <Label>Destaque</Label>
                          </div>
                          <Select
                            value={postForm.status}
                            onValueChange={(value: 'draft' | 'published') => setPostForm({ ...postForm, status: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="published">Publicado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>SEO Título</Label>
                          <Input
                            value={postForm.seo_title}
                            onChange={(e) => setPostForm({ ...postForm, seo_title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>SEO Descrição</Label>
                          <Textarea
                            value={postForm.seo_description}
                            onChange={(e) => setPostForm({ ...postForm, seo_description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>OG Image URL</Label>
                          <Input
                            value={postForm.og_image}
                            onChange={(e) => setPostForm({ ...postForm, og_image: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label>Conteúdo (Markdown)</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                          >
                            {showPreview ? 'Editar' : 'Preview'}
                          </Button>
                        </div>
                        {showPreview ? (
                          <div 
                            className="prose prose-sm max-w-none p-4 border rounded-md bg-muted min-h-[300px]"
                            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(marked(postForm.content_md) as string) }}
                          />
                        ) : (
                          <Textarea
                            value={postForm.content_md}
                            onChange={(e) => setPostForm({ ...postForm, content_md: e.target.value })}
                            rows={12}
                            className="font-mono text-sm"
                          />
                        )}
                      </div>
                      <div className="col-span-2">
                        <Button onClick={handleSavePost} className="w-full">Salvar Post</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <div className="space-y-2">
                    {filteredPosts
                      .filter(p => !selectedCategory || p.category_id === selectedCategory)
                      .map((post) => (
                        <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{post.title}</h4>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </Badge>
                              {post.is_featured && <Badge variant="outline">Destaque</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleTogglePostStatus(post)}>
                              {post.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleEditPost(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-4">
          <div className="flex gap-4">
            {/* Help Categories */}
            <Card className="w-64 shrink-0">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Categorias</CardTitle>
                <Dialog open={isHelpCategoryDialogOpen} onOpenChange={setIsHelpCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={resetHelpCategoryForm}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingHelpCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          value={helpCategoryForm.name}
                          onChange={(e) => setHelpCategoryForm({ ...helpCategoryForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={helpCategoryForm.slug}
                          onChange={(e) => setHelpCategoryForm({ ...helpCategoryForm, slug: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={helpCategoryForm.description}
                          onChange={(e) => setHelpCategoryForm({ ...helpCategoryForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Módulo</Label>
                        <Select
                          value={helpCategoryForm.module}
                          onValueChange={(value) => setHelpCategoryForm({ ...helpCategoryForm, module: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SYSTEM_MODULES.map((mod) => (
                              <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleSaveHelpCategory} className="w-full">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {helpCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-1">
                        <span className="flex-1 px-3 py-2 text-sm truncate">{cat.name}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditHelpCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteHelpCategory(cat.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Articles */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Artigos ({filteredArticles.length})</CardTitle>
                <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetArticleForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Artigo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingArticle ? 'Editar' : 'Novo'} Artigo</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={articleForm.title}
                            onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Slug</Label>
                          <Input
                            value={articleForm.slug}
                            onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Resumo</Label>
                          <Textarea
                            value={articleForm.excerpt}
                            onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Select
                            value={articleForm.category_id}
                            onValueChange={(value) => setArticleForm({ ...articleForm, category_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {helpCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Módulo</Label>
                          <Select
                            value={articleForm.module}
                            onValueChange={(value) => setArticleForm({ ...articleForm, module: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SYSTEM_MODULES.map((mod) => (
                                <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Select
                          value={articleForm.status}
                          onValueChange={(value: 'draft' | 'published') => setArticleForm({ ...articleForm, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="published">Publicado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>SEO Título</Label>
                          <Input
                            value={articleForm.seo_title}
                            onChange={(e) => setArticleForm({ ...articleForm, seo_title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>SEO Descrição</Label>
                          <Textarea
                            value={articleForm.seo_description}
                            onChange={(e) => setArticleForm({ ...articleForm, seo_description: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label>Conteúdo (Markdown)</Label>
                        <Textarea
                          value={articleForm.content_md}
                          onChange={(e) => setArticleForm({ ...articleForm, content_md: e.target.value })}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Button onClick={handleSaveArticle} className="w-full">Salvar Artigo</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <div className="space-y-2">
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{article.title}</h4>
                            <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                              {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                            </Badge>
                            {article.module && <Badge variant="outline">{article.module}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{article.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditArticle(article)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteArticle(article.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Solutions Tab */}
        <TabsContent value="solutions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle>Páginas Pilar / Soluções ({filteredSolutions.length})</CardTitle>
              <Dialog open={isSolutionDialogOpen} onOpenChange={setIsSolutionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetSolutionForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Solução
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSolution ? 'Editar' : 'Nova'} Página Pilar</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Headline *</Label>
                        <Input
                          value={solutionForm.headline}
                          onChange={(e) => setSolutionForm({ ...solutionForm, headline: e.target.value })}
                          placeholder="Ex: Sistema completo para depósito de reciclagem"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={solutionForm.slug}
                          onChange={(e) => setSolutionForm({ ...solutionForm, slug: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Subheadline</Label>
                        <Input
                          value={solutionForm.subheadline}
                          onChange={(e) => setSolutionForm({ ...solutionForm, subheadline: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Texto Introdutório</Label>
                        <Textarea
                          value={solutionForm.intro_text}
                          onChange={(e) => setSolutionForm({ ...solutionForm, intro_text: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Hero Image URL</Label>
                        <Input
                          value={solutionForm.hero_image}
                          onChange={(e) => setSolutionForm({ ...solutionForm, hero_image: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>CTA Texto</Label>
                        <Input
                          value={solutionForm.cta_primary_text}
                          onChange={(e) => setSolutionForm({ ...solutionForm, cta_primary_text: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>CTA URL</Label>
                        <Input
                          value={solutionForm.cta_primary_url}
                          onChange={(e) => setSolutionForm({ ...solutionForm, cta_primary_url: e.target.value })}
                        />
                      </div>
                      <Select
                        value={solutionForm.status}
                        onValueChange={(value: 'draft' | 'published') => setSolutionForm({ ...solutionForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>SEO Título</Label>
                        <Input
                          value={solutionForm.seo_title}
                          onChange={(e) => setSolutionForm({ ...solutionForm, seo_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>SEO Descrição</Label>
                        <Textarea
                          value={solutionForm.seo_description}
                          onChange={(e) => setSolutionForm({ ...solutionForm, seo_description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>OG Image URL</Label>
                        <Input
                          value={solutionForm.og_image}
                          onChange={(e) => setSolutionForm({ ...solutionForm, og_image: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-4">
                      <div>
                        <Label>Features (JSON)</Label>
                        <Textarea
                          value={solutionForm.features}
                          onChange={(e) => setSolutionForm({ ...solutionForm, features: e.target.value })}
                          rows={4}
                          className="font-mono text-xs"
                          placeholder='[{"title": "Feature", "description": "Descrição"}]'
                        />
                      </div>
                      <div>
                        <Label>Como Funciona (JSON)</Label>
                        <Textarea
                          value={solutionForm.how_it_works}
                          onChange={(e) => setSolutionForm({ ...solutionForm, how_it_works: e.target.value })}
                          rows={4}
                          className="font-mono text-xs"
                          placeholder='[{"step": 1, "title": "Passo 1", "description": "Descrição"}]'
                        />
                      </div>
                      <div>
                        <Label>Benefícios (JSON)</Label>
                        <Textarea
                          value={solutionForm.benefits}
                          onChange={(e) => setSolutionForm({ ...solutionForm, benefits: e.target.value })}
                          rows={4}
                          className="font-mono text-xs"
                          placeholder='[{"title": "Benefício", "description": "Descrição"}]'
                        />
                      </div>
                      <div>
                        <Label>FAQ (JSON)</Label>
                        <Textarea
                          value={solutionForm.faq}
                          onChange={(e) => setSolutionForm({ ...solutionForm, faq: e.target.value })}
                          rows={4}
                          className="font-mono text-xs"
                          placeholder='[{"question": "Pergunta?", "answer": "Resposta."}]'
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleSaveSolution} className="w-full">Salvar Página</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredSolutions.map((solution) => (
                    <div key={solution.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{solution.headline}</h4>
                          <Badge variant={solution.status === 'published' ? 'default' : 'secondary'}>
                            {solution.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">/solucoes/{solution.slug}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => window.open(`/solucoes/${solution.slug}`, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEditSolution(solution)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir página?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSolution(solution.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glossary Tab */}
        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle>Glossário ({filteredTerms.length} termos)</CardTitle>
              <Dialog open={isGlossaryDialogOpen} onOpenChange={setIsGlossaryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetTermForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Termo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingTerm ? 'Editar' : 'Novo'} Termo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Termo *</Label>
                        <Input
                          value={termForm.term}
                          onChange={(e) => setTermForm({ ...termForm, term: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={termForm.slug}
                          onChange={(e) => setTermForm({ ...termForm, slug: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Definição Curta *</Label>
                      <Textarea
                        value={termForm.short_definition}
                        onChange={(e) => setTermForm({ ...termForm, short_definition: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Definição Longa</Label>
                      <Textarea
                        value={termForm.long_definition}
                        onChange={(e) => setTermForm({ ...termForm, long_definition: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Exemplos</Label>
                      <Textarea
                        value={termForm.examples}
                        onChange={(e) => setTermForm({ ...termForm, examples: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Termos Relacionados (separados por vírgula)</Label>
                      <Input
                        value={termForm.related_terms}
                        onChange={(e) => setTermForm({ ...termForm, related_terms: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>SEO Título</Label>
                        <Input
                          value={termForm.seo_title}
                          onChange={(e) => setTermForm({ ...termForm, seo_title: e.target.value })}
                        />
                      </div>
                      <Select
                        value={termForm.status}
                        onValueChange={(value: 'draft' | 'published') => setTermForm({ ...termForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>SEO Descrição</Label>
                      <Textarea
                        value={termForm.seo_description}
                        onChange={(e) => setTermForm({ ...termForm, seo_description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleSaveTerm} className="w-full">Salvar Termo</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 gap-2">
                  {filteredTerms.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{term.term}</h4>
                          <Badge variant={term.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                            {term.status === 'published' ? 'Pub' : 'Rasc'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{term.short_definition}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditTerm(term)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir termo?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTerm(term.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
