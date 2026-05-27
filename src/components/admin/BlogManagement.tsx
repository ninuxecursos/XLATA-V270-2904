import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  FolderOpen,
  Tag,
  Calendar,
  ExternalLink,
  Copy,
  Star,
  Filter,
  LayoutGrid,
  List,
  ImageIcon,
  Sparkles,
  TrendingUp,
  Loader2,
  X,
  Shield,
  Link,
  AlertTriangle
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIImageGenerator } from './AIImageGenerator';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { InternalLinksPanel } from './InternalLinksPanel';
import { SEOChecklist } from './SEOChecklist';
import { ArticleTemplates } from './ArticleTemplates';
import { WordCountIndicator } from './WordCountIndicator';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  status: 'draft' | 'published';
  category_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  reading_time_minutes: number | null;
  view_count: number | null;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
}

const initialPostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content_md: '',
  status: 'draft' as 'draft' | 'published',
  category_id: '',
  seo_title: '',
  seo_description: '',
  og_image: '',
  tags: '',
  is_featured: false,
  allow_indexing: true,
  canonical_url: ''
};

export const BlogManagement = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isSmallScreen = isMobile || isTablet;
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormState, setInitialFormState] = useState(initialPostForm);
  
  const [postForm, setPostForm] = useState(initialPostForm);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_categories').select('*').order('sort_order', { ascending: true })
      ]);

      if (postsRes.error) throw postsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const typedPosts = (postsRes.data || []).map(post => ({
        ...post,
        status: (post.status === 'draft' || post.status === 'published') ? post.status : 'draft'
      })) as BlogPost[];

      setPosts(typedPosts);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Track unsaved changes
  const updatePostForm = useCallback((updates: Partial<typeof postForm>) => {
    setPostForm(prev => {
      const newForm = { ...prev, ...updates };
      const hasChanges = JSON.stringify(newForm) !== JSON.stringify(initialFormState);
      setHasUnsavedChanges(hasChanges);
      return newForm;
    });
  }, [initialFormState]);

  const validatePost = () => {
    if (!postForm.title.trim()) {
      toast({ title: "Erro", description: "O título é obrigatório", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSavePost = async () => {
    if (!validatePost()) return;
    
    setIsSaving(true);
    try {
      const postData = {
        title: postForm.title,
        slug: postForm.slug || generateSlug(postForm.title),
        excerpt: postForm.excerpt || null,
        content_md: postForm.content_md || null,
        status: postForm.status,
        category_id: postForm.category_id || null,
        seo_title: postForm.seo_title || null,
        seo_description: postForm.seo_description || null,
        og_image: postForm.og_image || null,
        tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        is_featured: postForm.is_featured,
        reading_time_minutes: Math.ceil((postForm.content_md?.split(' ').length || 0) / 200),
        published_at: postForm.status === 'published' ? new Date().toISOString() : null,
        allow_indexing: postForm.allow_indexing,
        canonical_url: postForm.canonical_url || null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Post atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Post criado com sucesso!" });
      }

      setHasUnsavedChanges(false);
      setIsPostDialogOpen(false);
      resetPostForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      toast({ title: "Erro", description: "Falha ao salvar post", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug || generateSlug(categoryForm.name),
        description: categoryForm.description || null,
        icon: categoryForm.icon || null,
        sort_order: categoryForm.sort_order
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria atualizada" });
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria criada" });
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({ title: "Erro", description: "Falha ao salvar categoria", variant: "destructive" });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Excluir este post permanentemente?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Post excluído" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Categoria excluída" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const handleDuplicatePost = (post: BlogPost) => {
    setEditingPost(null);
    setPostForm({
      title: `${post.title} (Cópia)`,
      slug: `${post.slug}-copia`,
      excerpt: post.excerpt || '',
      content_md: post.content_md || '',
      status: 'draft',
      category_id: post.category_id || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      og_image: post.og_image || '',
      tags: post.tags?.join(', ') || '',
      is_featured: false,
      allow_indexing: (post as any).allow_indexing ?? true,
      canonical_url: ''
    });
    setIsPostDialogOpen(true);
  };

  const handlePublishPost = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', post.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Post publicado com sucesso!" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao publicar", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !post.is_featured })
        .eq('id', post.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: post.is_featured ? "Removido dos destaques" : "Adicionado aos destaques" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    }
  };

  const editPost = (post: BlogPost) => {
    setEditingPost(post);
    const formData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content_md: post.content_md || '',
      status: post.status,
      category_id: post.category_id || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      og_image: post.og_image || '',
      tags: post.tags?.join(', ') || '',
      is_featured: post.is_featured || false,
      allow_indexing: (post as any).allow_indexing ?? true,
      canonical_url: (post as any).canonical_url || ''
    };
    setPostForm(formData);
    setInitialFormState(formData);
    setHasUnsavedChanges(false);
    setIsPostDialogOpen(true);
  };

  const editCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0
    });
    setIsCategoryDialogOpen(true);
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setPostForm(initialPostForm);
    setInitialFormState(initialPostForm);
    setHasUnsavedChanges(false);
    setShowPreview(false);
  };

  const handleCloseDialog = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Você tem alterações não salvas. Deseja realmente fechar?')) {
        return;
      }
    }
    setIsPostDialogOpen(false);
    resetPostForm();
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', icon: '', sort_order: 0 });
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryName = (id: string | null) => {
    if (!id) return 'Sem categoria';
    return categories.find(c => c.id === id)?.name || 'Sem categoria';
  };

  const getPreviewHtml = () => {
    if (!postForm.content_md) return '';
    return DOMPurify.sanitize(marked(postForm.content_md) as string);
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    featured: posts.filter(p => p.is_featured).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400">Total de Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Eye className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.published}</p>
                <p className="text-xs text-gray-400">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Edit className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.draft}</p>
                <p className="text-xs text-gray-400">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Star className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.featured}</p>
                <p className="text-xs text-gray-400">Em Destaque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="posts" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categorias ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerenciar Posts
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-700 border-gray-600 text-white w-48"
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v: 'all' | 'draft' | 'published') => setStatusFilter(v)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="published">Publicados</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-40">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex bg-gray-700 rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-gray-600' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-gray-600' : ''}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                {/* New Post Button */}
                <Button 
                  onClick={() => {
                    resetPostForm();
                    setIsPostDialogOpen(true);
                  }} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPostDialogOpen ? (
                /* Inline Post Editor */
                <div className="border border-gray-600 rounded-lg overflow-hidden">
                  <div className="p-4 md:p-6 pb-3 border-b border-gray-700">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-lg font-semibold text-white truncate">{editingPost ? 'Editar Post' : 'Novo Post'}</span>
                        {hasUnsavedChanges && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 text-xs whitespace-nowrap">
                            ● Alterações não salvas
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!isSmallScreen && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-400">Preview</Label>
                            <Switch
                              checked={showPreview}
                              onCheckedChange={setShowPreview}
                            />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCloseDialog}
                          className="text-gray-400 hover:text-white h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "flex",
                    isSmallScreen ? "flex-col" : "min-h-[60vh]"
                  )}>
                    {/* Editor */}
                    <ScrollArea className={cn(
                      "p-4 md:p-6",
                      showPreview && !isSmallScreen ? "w-1/2" : "w-full",
                      !isSmallScreen && "max-h-[70vh]"
                    )}>
                      <div className="space-y-4">
                        {/* Title & Slug */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Título *</Label>
                            <Input
                              value={postForm.title}
                              onChange={(e) => updatePostForm({ title: e.target.value })}
                              className="bg-gray-700 border-gray-600 mt-1"
                              placeholder="Título do artigo"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Slug (URL)</Label>
                            <Input
                              value={postForm.slug}
                              onChange={(e) => updatePostForm({ slug: e.target.value })}
                              placeholder={generateSlug(postForm.title) || 'gerado-automaticamente'}
                              className="bg-gray-700 border-gray-600 mt-1"
                            />
                          </div>
                        </div>
                        
                        {/* Category, Status, Featured */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm">Categoria</Label>
                            <Select
                              value={postForm.category_id}
                              onValueChange={(value) => updatePostForm({ category_id: value })}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 mt-1">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Status</Label>
                            <Select
                              value={postForm.status}
                              onValueChange={(value: 'draft' | 'published') => updatePostForm({ status: value })}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="draft">📝 Rascunho</SelectItem>
                                <SelectItem value="published">✅ Publicado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end sm:col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-md w-full h-10">
                              <Switch
                                checked={postForm.is_featured}
                                onCheckedChange={(checked) => updatePostForm({ is_featured: checked })}
                              />
                              <Label className="text-sm">Destaque</Label>
                              <Star className={`h-4 w-4 ml-auto ${postForm.is_featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <Label className="text-sm">Tags (separadas por vírgula)</Label>
                          <Input
                            value={postForm.tags}
                            onChange={(e) => updatePostForm({ tags: e.target.value })}
                            placeholder="reciclagem, dicas, sustentabilidade"
                            className="bg-gray-700 border-gray-600 mt-1"
                          />
                          {postForm.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {postForm.tags.split(',').filter(Boolean).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="bg-emerald-600/20 text-emerald-300 text-xs">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Excerpt */}
                        <div>
                          <Label className="text-sm">Resumo (Excerpt)</Label>
                          <Textarea
                            value={postForm.excerpt}
                            onChange={(e) => updatePostForm({ excerpt: e.target.value })}
                            className="bg-gray-700 border-gray-600 mt-1"
                            rows={2}
                            placeholder="Breve descrição do artigo (exibido nos cards)"
                          />
                        </div>

                        {/* Content */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm">Conteúdo (Markdown)</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                ~{Math.ceil((postForm.content_md?.split(' ').length || 0) / 200)} min de leitura
                              </span>
                              <ArticleTemplates 
                                onSelectTemplate={(content) => updatePostForm({ content_md: content })}
                              />
                            </div>
                          </div>
                          <Textarea
                            value={postForm.content_md}
                            onChange={(e) => updatePostForm({ content_md: e.target.value })}
                            className="bg-gray-700 border-gray-600 font-mono text-sm"
                            rows={isSmallScreen ? 8 : 14}
                            placeholder="# Título&#10;&#10;Escreva seu conteúdo em Markdown..."
                          />
                          <div className="mt-3">
                            <WordCountIndicator content={postForm.content_md || ''} />
                          </div>
                        </div>

                        {/* SEO Section */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            SEO & Meta Tags
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <Label className="flex items-center gap-2 mb-2 text-sm">
                                <ImageIcon className="h-4 w-4" />
                                Imagem de Capa (OG Image)
                              </Label>
                              {postForm.og_image && (
                                <div className="mb-3 relative rounded-lg overflow-hidden">
                                  <img
                                    src={postForm.og_image}
                                    alt="Preview"
                                    className="w-full h-36 object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Input
                                  value={postForm.og_image}
                                  onChange={(e) => updatePostForm({ og_image: e.target.value })}
                                  placeholder="https://exemplo.com/imagem.jpg"
                                  className="bg-gray-700 border-gray-600 flex-1"
                                />
                                <AIImageGenerator
                                  title={postForm.title}
                                  content={postForm.content_md}
                                  articleType="blog"
                                  keywords={postForm.tags}
                                  currentImage={postForm.og_image}
                                  onImageGenerated={(url) => updatePostForm({ og_image: url })}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <Label className="text-sm">Título SEO</Label>
                                <span className={cn(
                                  "text-xs",
                                  (postForm.seo_title?.length || 0) > 60 ? 'text-red-400' : 'text-gray-400'
                                )}>
                                  {postForm.seo_title?.length || 0}/60
                                </span>
                              </div>
                              <Input
                                value={postForm.seo_title}
                                onChange={(e) => updatePostForm({ seo_title: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                placeholder={postForm.title || "Título para mecanismos de busca"}
                              />
                              <Progress 
                                value={Math.min((postForm.seo_title?.length || 0) / 60 * 100, 100)} 
                                className={cn(
                                  "h-1 mt-1",
                                  (postForm.seo_title?.length || 0) > 60 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"
                                )}
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <Label className="text-sm">Meta Descrição</Label>
                                <span className={cn(
                                  "text-xs",
                                  (postForm.seo_description?.length || 0) > 160 ? 'text-red-400' : 'text-gray-400'
                                )}>
                                  {postForm.seo_description?.length || 0}/160
                                </span>
                              </div>
                              <Textarea
                                value={postForm.seo_description}
                                onChange={(e) => updatePostForm({ seo_description: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                rows={2}
                                placeholder={postForm.excerpt || "Descrição para mecanismos de busca"}
                              />
                              <Progress 
                                value={Math.min((postForm.seo_description?.length || 0) / 160 * 100, 100)} 
                                className={cn(
                                  "h-1 mt-1",
                                  (postForm.seo_description?.length || 0) > 160 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* SEO Avançado Section */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            SEO Avançado
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                              <div>
                                <Label className="text-white">Permitir indexação no Google</Label>
                                <p className="text-xs text-gray-400 mt-1">
                                  Quando desativado, esta página não aparecerá nos resultados de busca
                                </p>
                              </div>
                              <Switch
                                checked={postForm.allow_indexing}
                                onCheckedChange={(v) => updatePostForm({ allow_indexing: v })}
                              />
                            </div>
                            <div>
                              <Label className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                Canonical URL (opcional)
                              </Label>
                              <Input
                                value={postForm.canonical_url}
                                onChange={(e) => updatePostForm({ canonical_url: e.target.value })}
                                placeholder="https://xlata.site/blog/..."
                                className="bg-gray-700 border-gray-600 mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Deixe vazio para usar a URL padrão. Use para evitar duplicidade de conteúdo.
                              </p>
                            </div>
                            {!postForm.allow_indexing && (
                              <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm text-yellow-300">
                                  Este post NÃO será indexado pelo Google
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SEO Tools Section */}
                        <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Ferramentas SEO
                          </h4>
                          <SEOChecklist
                            title={postForm.title}
                            seoTitle={postForm.seo_title}
                            seoDescription={postForm.seo_description}
                            content={postForm.content_md}
                            ogImage={postForm.og_image}
                            categoryId={postForm.category_id}
                            tags={postForm.tags}
                          />
                          <InternalLinksPanel />
                        </div>

                        {/* Mobile Preview Button */}
                        {isSmallScreen && (
                          <Button
                            variant="outline"
                            onClick={() => setShowPreview(true)}
                            className="w-full gap-2 border-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Preview do Artigo
                          </Button>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Desktop Preview */}
                    {showPreview && !isSmallScreen && (
                      <div className="w-1/2 border-l border-gray-700 bg-white overflow-hidden">
                        <div className="p-3 bg-gray-100 border-b text-gray-600 text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview do Artigo
                        </div>
                        <ScrollArea className="max-h-[70vh] p-6">
                          <article className="prose prose-lg max-w-none">
                            {postForm.og_image && (
                              <img 
                                src={postForm.og_image} 
                                alt="Capa" 
                                className="w-full h-48 object-cover rounded-lg mb-4"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                              {postForm.title || 'Título do Artigo'}
                            </h1>
                            {postForm.excerpt && (
                              <p className="text-gray-600 italic mb-4">{postForm.excerpt}</p>
                            )}
                            <div 
                              className="prose-emerald"
                              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} 
                            />
                          </article>
                        </ScrollArea>
                      </div>
                    )}
                  </div>

                  {/* Mobile Preview Modal */}
                  {isSmallScreen && showPreview && (
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogContent className="max-w-full w-[98vw] h-[90vh] p-0 bg-white">
                        <DialogHeader className="p-4 bg-gray-100 border-b sticky top-0">
                          <DialogTitle className="flex items-center justify-between text-gray-800">
                            <span className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Preview do Artigo
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPreview(false)}
                              className="text-gray-600 h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[calc(90vh-60px)] p-6">
                          <article className="prose prose-lg max-w-none">
                            {postForm.og_image && (
                              <img 
                                src={postForm.og_image} 
                                alt="Capa" 
                                className="w-full h-48 object-cover rounded-lg mb-4"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                              {postForm.title || 'Título do Artigo'}
                            </h1>
                            {postForm.excerpt && (
                              <p className="text-gray-600 italic mb-4">{postForm.excerpt}</p>
                            )}
                            <div 
                              className="prose-emerald"
                              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} 
                            />
                          </article>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCloseDialog}
                      className="order-2 sm:order-1"
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSavePost} 
                      disabled={isSaving || !postForm.title.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px] order-1 sm:order-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        editingPost ? 'Atualizar Post' : 'Criar Post'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
              <>
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {filteredPosts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-start gap-4 flex-1">
                        {post.og_image && (
                          <img
                            src={post.og_image}
                            alt={post.title}
                            className="w-20 h-14 object-cover rounded-md hidden sm:block"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium text-white truncate">{post.title}</h4>
                            <Badge className={post.status === 'published' ? 'bg-emerald-600' : 'bg-yellow-600'}>
                              {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                            </Badge>
                            {post.is_featured && (
                              <Badge className="bg-purple-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Destaque
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              {getCategoryName(post.category_id)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.view_count || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {post.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePublishPost(post)}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Publicar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(post)}
                          className={`${post.is_featured ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400`}
                          title={post.is_featured ? 'Remover destaque' : 'Destacar'}
                        >
                          <Star className={`h-4 w-4 ${post.is_featured ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicatePost(post)}
                          className="text-gray-400 hover:text-white"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          className="text-gray-400 hover:text-white"
                          title="Visualizar"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editPost(post)}
                          className="text-gray-400 hover:text-white"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum post encontrado</p>
                      <p className="text-sm mt-1">Tente ajustar os filtros ou criar um novo post</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.map(post => (
                    <Card key={post.id} className="bg-gray-700/50 border-gray-600 hover:border-emerald-500/50 transition-colors overflow-hidden">
                      {post.og_image && (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={post.og_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={post.status === 'published' ? 'bg-emerald-600' : 'bg-yellow-600'}>
                            {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                          {post.is_featured && (
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        <h4 className="font-medium text-white line-clamp-2 mb-2">{post.title}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{getCategoryName(post.category_id)}</span>
                          <span>{post.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-600">
                          {post.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => handlePublishPost(post)} className="h-8 w-8 text-emerald-400 hover:text-emerald-300" title="Publicar">
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => editPost(post)} className="h-8 w-8">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicatePost(post)} className="h-8 w-8">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, '_blank')} className="h-8 w-8">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)} className="h-8 w-8 hover:text-red-400">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Categorias
              </CardTitle>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                        placeholder="Nome da categoria"
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                        placeholder={generateSlug(categoryForm.name) || 'gerado-automaticamente'}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                        placeholder="Breve descrição da categoria"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Emoji/Ícone</Label>
                        <Input
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          placeholder="📦 ou Recycle"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div>
                        <Label>Ordem</Label>
                        <Input
                          type="number"
                          value={categoryForm.sort_order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </div>
                    {/* Preview Badge */}
                    <div>
                      <Label className="text-gray-400">Preview</Label>
                      <div className="mt-2">
                        <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                          {categoryForm.icon && <span className="mr-1">{categoryForm.icon}</span>}
                          {categoryForm.name || 'Nome da Categoria'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700">
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <Card key={category.id} className="bg-gray-700/50 border-gray-600 hover:border-emerald-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {category.icon && <span className="mr-1">{category.icon}</span>}
                          {category.name}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editCategory(category)}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {category.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          /{category.slug}
                        </span>
                        <span>Ordem: {category.sort_order || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma categoria encontrada</p>
                    <p className="text-sm mt-1">Crie categorias para organizar seus posts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogManagement;
