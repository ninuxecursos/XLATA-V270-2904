import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Search, HelpCircle, BookOpen, ArrowRight, Wallet, ShoppingCart, Package, BarChart3, Receipt, Settings, Users, Megaphone, Shield, Filter, X, MessageCircle, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useHelpCategories, useHelpArticles } from '@/hooks/useContentPortal';

const moduleConfig: Record<string, { label: string; icon: any; color: string }> = {
  venda: { label: 'PDV / Vendas', icon: ShoppingCart, color: 'bg-emerald-500/20 text-emerald-400' },
  estoque: { label: 'Estoque', icon: Package, color: 'bg-blue-500/20 text-blue-400' },
  caixa: { label: 'Caixa', icon: Wallet, color: 'bg-purple-500/20 text-purple-400' },
  compra: { label: 'Compras', icon: ShoppingCart, color: 'bg-orange-500/20 text-orange-400' },
  despesas: { label: 'Despesas', icon: Receipt, color: 'bg-red-500/20 text-red-400' },
  relatorios: { label: 'Relatórios', icon: BarChart3, color: 'bg-cyan-500/20 text-cyan-400' },
  transacoes: { label: 'Transações', icon: Receipt, color: 'bg-yellow-500/20 text-yellow-400' },
  assinatura: { label: 'Assinatura', icon: Settings, color: 'bg-pink-500/20 text-pink-400' },
  geral: { label: 'Geral', icon: HelpCircle, color: 'bg-gray-500/20 text-gray-400' },
  campanha: { label: 'Campanha', icon: Megaphone, color: 'bg-indigo-500/20 text-indigo-400' },
  admin: { label: 'Painel Admin', icon: Shield, color: 'bg-rose-500/20 text-rose-400' },
  indicacoes: { label: 'Indicações', icon: Users, color: 'bg-teal-500/20 text-teal-400' },
};

const HelpCenter = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>(searchParams.get('module') || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { categories, loading: categoriesLoading } = useHelpCategories();
  const { articles, loading: articlesLoading } = useHelpArticles();

  // Sync category from URL param
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        setSelectedCategory(category.id);
      }
    }
  }, [categorySlug, categories]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync URL params with module filter
  useEffect(() => {
    const moduleFromUrl = searchParams.get('module');
    if (moduleFromUrl && moduleFromUrl !== selectedModule) {
      setSelectedModule(moduleFromUrl);
    }
  }, [searchParams]);

  // Count articles per module
  const articleCountByModule = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    articles.forEach(article => {
      const module = article.module || 'geral';
      counts[module] = (counts[module] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Get available modules that have articles
  const availableModules = useMemo(() => {
    const modules = new Set<string>();
    articles.forEach(article => {
      if (article.module) modules.add(article.module);
    });
    return Array.from(modules).sort();
  }, [articles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch || 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower) ||
        article.content_md?.toLowerCase().includes(searchLower);
      
      const matchesModule = selectedModule === 'all' || article.module === selectedModule;
      const matchesCategory = selectedCategory === 'all' || article.category_id === selectedCategory;
      
      return matchesSearch && matchesModule && matchesCategory;
    });
  }, [articles, debouncedSearch, selectedModule, selectedCategory]);

  // Highlight search term in text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-emerald-500/30 text-emerald-300 px-0.5 rounded">{part}</mark> : part
    );
  };

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    if (module === 'all') {
      searchParams.delete('module');
    } else {
      searchParams.set('module', module);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedModule('all');
    setSelectedCategory('all');
    searchParams.delete('module');
    setSearchParams(searchParams);
  };

  const hasActiveFilters = debouncedSearch || selectedModule !== 'all' || selectedCategory !== 'all';

  return (
    <PortalLayout>
      <SEOHead
        title="Central de Ajuda - XLata"
        description="Encontre respostas para suas dúvidas sobre o XLata. Tutoriais, guias passo a passo e soluções para problemas comuns."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Ajuda' }]} />

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Central de Ajuda XLata
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            Encontre respostas rápidas, tutoriais passo a passo e soluções para suas dúvidas.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar artigos de ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 py-6 text-lg bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
          )}
          </div>

          {/* WhatsApp quick contact - after search */}
          <a
            href="https://wa.me/5511963512105?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20XLata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/25 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Não encontrou? Fale com o suporte via WhatsApp
          </a>
        </div>

        {/* Module Chips */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleModuleChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedModule === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
              }`}
            >
              Todos ({articleCountByModule.all || 0})
            </button>
            {availableModules.map(module => {
              const config = moduleConfig[module] || { label: module, icon: HelpCircle, color: 'bg-gray-500/20 text-gray-400' };
              const Icon = config.icon;
              return (
                <button
                  key={module}
                  onClick={() => handleModuleChange(module)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedModule === module
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label} ({articleCountByModule[module] || 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="text-center mb-6">
            <p className="text-gray-400">
              {filteredArticles.length === 0 
                ? 'Nenhum artigo encontrado' 
                : `${filteredArticles.length} artigo${filteredArticles.length !== 1 ? 's' : ''} encontrado${filteredArticles.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        )}

        {/* Filtered Results */}
        {hasActiveFilters ? (
          <section className="mb-12">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => {
                  const moduleConf = moduleConfig[article.module || 'geral'] || moduleConfig.geral;
                  const Icon = moduleConf.icon;
                  return (
                    <Link key={article.id} to={`/ajuda/artigo/${article.slug}`}>
                      <Card className="h-full bg-gray-800 border-gray-700 hover:shadow-lg transition-all hover:border-emerald-500/50 hover:-translate-y-1">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <Badge className={`${moduleConf.color} text-xs`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {moduleConf.label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mb-2 line-clamp-2 text-white">
                            {debouncedSearch ? highlightText(article.title, debouncedSearch) : article.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {debouncedSearch && article.excerpt 
                              ? highlightText(article.excerpt, debouncedSearch) 
                              : article.excerpt
                            }
                          </p>
                          {article.reading_time_minutes && (
                            <p className="text-xs text-gray-500 mt-3">
                              {article.reading_time_minutes} min de leitura
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                  <p className="text-white font-medium mb-2">Nenhum artigo encontrado</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Tente buscar por outros termos ou limpar os filtros.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        ) : (
          <>
            {/* Getting Started - Only show when no filters */}
            {articles.filter(a => a.module === 'geral').length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                    Comece por Aqui
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {articles.filter(a => a.module === 'geral').slice(0, 4).map((article) => (
                    <Link key={article.id} to={`/ajuda/artigo/${article.slug}`}>
                      <Card className="h-full bg-gray-800 border-gray-700 hover:shadow-md transition-shadow hover:border-emerald-500/50">
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2 line-clamp-2 text-white">{article.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {article.excerpt}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Categories by Module - Only show when no filters */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-white">Categorias por Módulo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableModules.map((module) => {
                  const config = moduleConfig[module] || { label: module, icon: HelpCircle, color: 'bg-gray-500/20 text-gray-400' };
                  const Icon = config.icon;
                  const moduleArticles = articles.filter(a => a.module === module);

                  return (
                    <Card key={module} className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-3 text-lg text-white">
                          <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                            <Icon className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
                          </div>
                          {config.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {moduleArticles.slice(0, 4).map((article) => (
                            <li key={article.id}>
                              <Link
                                to={`/ajuda/artigo/${article.slug}`}
                                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors line-clamp-1"
                              >
                                {article.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {moduleArticles.length > 4 && (
                          <button
                            onClick={() => handleModuleChange(module)}
                            className="inline-flex items-center text-sm text-emerald-400 mt-3 hover:underline"
                          >
                            Ver todos ({moduleArticles.length})
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Mid-page WhatsApp banner */}
        <div className="mt-8 p-4 rounded-xl bg-[#111827] border border-slate-700/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-semibold text-sm">Suporte rápido pelo WhatsApp</h3>
            <p className="text-slate-400 text-xs mt-0.5">Atendimento de segunda a sexta, das 8h às 18h</p>
          </div>
          <a
            href="https://wa.me/5511963512105?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20XLata"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 whitespace-nowrap">
              <MessageCircle className="w-4 h-4" />
              Chamar no WhatsApp
            </Button>
          </a>
        </div>

        {/* Empty State */}
        {!articlesLoading && articles.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Nenhum artigo de ajuda publicado ainda.</p>
              <p className="text-sm text-gray-500 mt-2">
                Volte em breve para novos conteúdos!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bottom CTA */}
        <Card className="mt-12 bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2 text-white">
              Travou em alguma coisa?
            </h3>
            <p className="text-gray-400 mb-4">
              O suporte do XLata resolve no WhatsApp. Manda um zap agora!
            </p>
            <a
              href="https://wa.me/5511963512105?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20XLata"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <MessageCircle className="w-4 h-4" />
                Preciso de ajuda agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Floating WhatsApp button (mobile) */}
        <a
          href="https://wa.me/5511963512105?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20XLata"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </a>
      </div>
    </PortalLayout>
  );
};

export default HelpCenter;