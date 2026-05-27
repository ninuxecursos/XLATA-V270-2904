import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, Calendar, Eye, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogArticleLayout } from '@/components/portal/BlogArticleLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useBlogPosts, useBlogCategories, useContentSearch } from '@/hooks/useContentPortal';
import { sanitizeJsonLd } from '@/utils/sanitization';

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { posts, loading: postsLoading } = useBlogPosts();
  const { posts: featuredPosts } = useBlogPosts({ featured: true, limit: 3 });
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { results: searchResults } = useContentSearch(searchQuery);

  const popularPosts = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  const filteredPosts = searchQuery.length >= 2
    ? searchResults.posts
    : selectedCategory
      ? posts.filter(post => post.category?.slug === selectedCategory)
      : posts;

  const getCategoryColor = (slug: string) => {
    const colors: Record<string, string> = {
      'dicas': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      'guias': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      'tutoriais': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      'noticias': 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      'default': 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    };
    return colors[slug] || colors['default'];
  };

  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog XLata - Dicas para Ferro Velho e Reciclagem',
    description: 'Aprenda como organizar seu depósito de reciclagem, controlar caixa, compras, vendas por kg e muito mais.',
    url: 'https://xlata.site/blog',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.slice(0, 10).map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://xlata.site/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <BlogArticleLayout>
      <SEOHead
        title="Blog - Dicas e Guias para Depósitos de Reciclagem"
        description="Aprenda como organizar seu depósito de reciclagem, controlar caixa, compras, vendas por kg e muito mais. Dicas práticas e guias completos."
      />

      {posts.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(blogListSchema) }}
        />
      )}

      {/* Hero Section - Light Theme */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Breadcrumbs items={[{ label: 'Blog' }]} />

          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              Conteúdo Exclusivo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Blog <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">XLata</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
              Dicas práticas, guias completos e templates prontos para você organizar seu depósito de reciclagem e aumentar seus lucros.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                <Input
                  type="search"
                  placeholder="Buscar artigos, dicas, guias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchQuery.length >= 2 && searchResults.posts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 max-h-80 overflow-y-auto">
                  {searchResults.posts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="block p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                      <p className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{post.title}</p>
                      <p className="text-sm text-slate-400 line-clamp-1 mt-1">{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.posts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-4 text-center">
                  <p className="text-slate-500 text-sm">Nenhum artigo encontrado para "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {!categoriesLoading && categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.slug
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {category.icon && <span>{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && !selectedCategory && (
              <section className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Em Destaque</h2>
                </div>
                <div className="grid gap-6">
                  {featuredPosts[0] && (
                    <Link to={`/blog/${featuredPosts[0].slug}`}>
                      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white border-slate-200 hover:border-emerald-300">
                        <div className="relative">
                          {featuredPosts[0].og_image ? (
                            <div className="relative h-64 md:h-80 overflow-hidden">
                              <img src={featuredPosts[0].og_image} alt={featuredPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                {featuredPosts[0].category && (
                                  <Badge className="mb-3 bg-emerald-500 hover:bg-emerald-600 border-0 text-white">{featuredPosts[0].category.name}</Badge>
                                )}
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">{featuredPosts[0].title}</h3>
                                <p className="text-slate-200 line-clamp-2 mb-3">{featuredPosts[0].excerpt}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-300">
                                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featuredPosts[0].reading_time_minutes} min</span>
                                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{featuredPosts[0].view_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <CardContent className="p-6">
                              {featuredPosts[0].category && (
                                <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">{featuredPosts[0].category.name}</Badge>
                              )}
                              <h3 className="text-2xl font-bold mb-2 text-slate-900 group-hover:text-emerald-600 transition-colors">{featuredPosts[0].title}</h3>
                              <p className="text-slate-500 line-clamp-2">{featuredPosts[0].excerpt}</p>
                            </CardContent>
                          )}
                        </div>
                      </Card>
                    </Link>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredPosts.slice(1).map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`}>
                        <Card className="h-full group hover:shadow-lg transition-all duration-300 bg-white border-slate-200 hover:border-emerald-300">
                          <CardContent className="p-5">
                            {post.category && (
                              <Badge className={`mb-3 border-0 ${getCategoryColor(post.category.slug)}`}>{post.category.name}</Badge>
                            )}
                            <h3 className="font-semibold text-lg mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2">{post.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_time_minutes} min</span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count || 0}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* All Posts */}
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedCategory ? `Artigos: ${categories.find(c => c.slug === selectedCategory)?.name}` : 'Todos os Artigos'}
                </h2>
                <Badge variant="outline" className="border-slate-200 text-slate-500">
                  {filteredPosts.length} artigos
                </Badge>
              </div>

              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse bg-white border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="h-5 bg-slate-200 rounded w-24 mb-3"></div>
                            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                          </div>
                          <div className="w-32 h-24 bg-slate-200 rounded-lg hidden sm:block"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card className="bg-white border-slate-200">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-800 font-medium">Nenhum artigo encontrado</p>
                    <p className="text-sm text-slate-400 mt-2">Volte em breve para novos conteúdos!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-slate-200 hover:border-emerald-300 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {post.og_image && (
                              <div className="sm:w-48 h-48 sm:h-auto overflow-hidden">
                                <img src={post.og_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              </div>
                            )}
                            <div className="flex-1 p-5">
                              {post.category && (
                                <Badge className={`mb-3 border-0 ${getCategoryColor(post.category.slug)}`}>{post.category.name}</Badge>
                              )}
                              <h3 className="font-semibold text-lg mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2">{post.title}</h3>
                              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_time_minutes} min de leitura</span>
                                {post.published_at && (
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
                                )}
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-emerald-600 to-emerald-500 border-0 shadow-xl shadow-emerald-200 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-3 text-white">Quer parar de perder dinheiro?</h3>
                  <p className="text-sm text-emerald-100 mb-5">O XLata organiza seu depósito e coloca cada centavo no lugar certo.</p>
                  <Link to="/register">
                    <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-lg">
                      Organizar meu depósito
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Popular Posts */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Mais Lidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularPosts.map((post, index) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <div className="flex gap-3 group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-2xl font-bold text-emerald-200 group-hover:text-emerald-500 transition-colors">{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-700 group-hover:text-emerald-600 line-clamp-2 transition-colors">{post.title}</p>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Eye className="h-3 w-3" />{post.view_count || 0} views
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <h4 className="font-semibold mb-3 text-slate-800">Receba novidades</h4>
                <p className="text-sm text-slate-500 mb-4">Dicas e novidades sobre gestão de depósitos direto no seu email.</p>
                <div className="space-y-2">
                  <Input placeholder="Seu melhor email" type="email" className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400" />
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Quero receber</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </BlogArticleLayout>
  );
};

export default Blog;
