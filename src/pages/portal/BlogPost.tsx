import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft, ArrowRight, Share2, Copy, Check, Eye, Tag, Facebook, Twitter, Linkedin, User, RefreshCw, TrendingUp } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { sanitizeJsonLd } from '@/utils/sanitization';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BlogArticleLayout } from '@/components/portal/BlogArticleLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { TableOfContents } from '@/components/portal/TableOfContents';
import { BlogInlineCTA } from '@/components/portal/BlogInlineCTA';
import { BlogConversionBlock } from '@/components/portal/BlogConversionBlock';
import { BlogSocialProof } from '@/components/portal/BlogSocialProof';
import { BlogObjectionBreaker } from '@/components/portal/BlogObjectionBreaker';
import { BlogLeadMagnet } from '@/components/portal/BlogLeadMagnet';
import { BlogFinalConversion } from '@/components/portal/BlogFinalConversion';
import { useBlogPost, useBlogPosts } from '@/hooks/useContentPortal';

/**
 * Injects CTA blocks into HTML content at strategic positions:
 * after intro, mid-article, before conclusion, end.
 */
function injectCTAPlaceholders(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allElements = Array.from(doc.body.children);
  
  if (allElements.length < 6) return html;

  const h2Indices: number[] = [];
  allElements.forEach((el, i) => {
    if (el.tagName === 'H2') h2Indices.push(i);
  });

  const insertPositions = new Set<number>();

  // After first H2's content block (after intro)
  if (h2Indices.length >= 1) {
    const afterFirst = h2Indices.length >= 2 ? h2Indices[1] : Math.floor(allElements.length * 0.25);
    insertPositions.add(afterFirst);
  }

  // Mid article
  const mid = Math.floor(allElements.length * 0.5);
  insertPositions.add(mid);

  // Before last H2 (before conclusion)
  if (h2Indices.length >= 3) {
    insertPositions.add(h2Indices[h2Indices.length - 1]);
  }

  // Convert to sorted array and inject markers
  const positions = Array.from(insertPositions).sort((a, b) => b - a);
  positions.forEach((pos, idx) => {
    const marker = doc.createElement('div');
    marker.setAttribute('data-cta-placeholder', String(idx));
    if (pos < allElements.length) {
      doc.body.insertBefore(marker, allElements[pos]);
    } else {
      doc.body.appendChild(marker);
    }
  });

  return doc.body.innerHTML;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = useBlogPost(slug || '');
  const { posts: relatedPosts } = useBlogPosts({ limit: 6 });
  const [copied, setCopied] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (post?.content_md) {
      const html = marked(post.content_md) as string;
      const sanitized = DOMPurify.sanitize(html);
      setHtmlContent(injectCTAPlaceholders(sanitized));
    } else if (post?.content_html) {
      const sanitized = DOMPurify.sanitize(post.content_html);
      setHtmlContent(injectCTAPlaceholders(sanitized));
    }
  }, [post]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  // Render content with injected CTAs
  const renderedContent = useMemo(() => {
    if (!htmlContent) return null;

    const parts = htmlContent.split(/<div data-cta-placeholder="(\d+)"><\/div>/);
    const elements: JSX.Element[] = [];
    const ctaVariants: Array<'primary' | 'secondary' | 'minimal' | 'urgency' | 'pain'> = ['pain', 'urgency', 'primary'];
    const conversionVariants: Array<'warning' | 'comparison' | 'benefit'> = ['warning', 'comparison', 'benefit'];
    let placeholderCount = 0;

    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        if (part.trim()) {
          elements.push(
            <div key={`content-${i}`} dangerouslySetInnerHTML={{ __html: part }} />
          );
        }
      } else {
        const idx = placeholderCount;
        placeholderCount++;

        if (idx === 0) {
          // After intro: pain CTA + conversion block
          elements.push(<BlogInlineCTA key={`cta-${i}`} variant="pain" />);
          elements.push(<BlogConversionBlock key={`conv-${i}`} variant="warning" />);
        } else if (idx === 1) {
          // Mid article: social proof + lead magnet
          elements.push(<BlogSocialProof key={`social-${i}`} />);
          elements.push(<BlogLeadMagnet key={`lead-${i}`} />);
          elements.push(<BlogInlineCTA key={`cta-${i}`} variant="urgency" />);
        } else if (idx === 2) {
          // Before conclusion: objection breaker + comparison
          elements.push(<BlogConversionBlock key={`conv-${i}`} variant="comparison" />);
          elements.push(<BlogObjectionBreaker key={`obj-${i}`} />);
          elements.push(<BlogInlineCTA key={`cta-${i}`} variant="primary" />);
        } else {
          elements.push(<BlogInlineCTA key={`cta-${i}`} variant={ctaVariants[idx % ctaVariants.length]} />);
        }
      }
    });

    return elements;
  }, [htmlContent]);

  if (loading) {
    return (
      <BlogArticleLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
            <div className="h-10 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-5 bg-slate-200 rounded w-1/4 mb-8"></div>
            <div className="h-80 bg-slate-200 rounded-2xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </BlogArticleLayout>
    );
  }

  if (!post) {
    return (
      <BlogArticleLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-slate-900">Artigo não encontrado</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link to="/blog">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </BlogArticleLayout>
    );
  }

  const filteredRelated = relatedPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.seo_description,
    image: post.og_image || 'https://xlata.site/lovable-uploads/XLATALOGO.png',
    datePublished: post.published_at,
    dateModified: post.updated_at,
    wordCount: post.content_md ? post.content_md.split(/\s+/).length : undefined,
    author: {
      '@type': 'Organization',
      name: 'Equipe XLata',
      url: 'https://xlata.site',
    },
    publisher: {
      '@type': 'Organization',
      name: 'XLata',
      logo: {
        '@type': 'ImageObject',
        url: 'https://xlata.site/lovable-uploads/XLATALOGO.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://xlata.site/blog/${post.slug}`,
    },
  };

  // Extract FAQ from content if present
  const faqItems: Array<{ question: string; answer: string }> = [];
  if (post.content_md) {
    const faqRegex = /#{2,3}\s*(.+\?)\s*\n+([\s\S]*?)(?=\n#{2,3}|\n*$)/g;
    let match;
    while ((match = faqRegex.exec(post.content_md)) !== null) {
      const answer = match[2].trim().replace(/\n/g, ' ').slice(0, 500);
      if (answer.length > 30) {
        faqItems.push({ question: match[1].trim(), answer });
      }
    }
  }

  const faqSchema = faqItems.length >= 2 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.slice(0, 10).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <BlogArticleLayout>
      <SEOHead
        title={post.seo_title || post.title || 'Carregando artigo...'}
        description={post.seo_description || post.excerpt || ''}
        ogImage={post.og_image || '/images/og-blog-default.jpg'}
        ogType="article"
        publishedTime={post.published_at || undefined}
        modifiedTime={post.updated_at}
        author="Equipe XLata"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(faqSchema) }}
        />
      )}

      <article>
        {/* Hero Header - Light Theme */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumbs
              items={[
                { label: 'Blog', href: '/blog' },
                ...(post.category ? [{ label: post.category.name, href: `/blog/categoria/${post.category.slug}` }] : []),
                { label: post.title },
              ]}
            />

            <div className="max-w-4xl mx-auto pt-8 pb-10">
              {post.category && (
                <Link to={`/blog/categoria/${post.category.slug}`}>
                  <Badge className="mb-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-1.5 text-sm border-0 font-medium">
                    {post.category.name}
                  </Badge>
                </Link>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-slate-500 mb-8 max-w-3xl leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Author & Meta Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="font-medium text-slate-700">Equipe XLata</span>
                </div>
                {post.published_at && (
                  <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-full">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {new Date(post.published_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {post.updated_at && post.updated_at !== post.published_at && (
                  <span className="flex items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-full text-blue-600">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizado em {new Date(post.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-full">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  {post.reading_time_minutes} min de leitura
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-full">
                  <Eye className="h-4 w-4 text-slate-400" />
                  {post.view_count || 0} visualizações
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.og_image && (
          <div className="container mx-auto px-4 -mt-2">
            <div className="max-w-5xl mx-auto">
              <img
                src={post.og_image}
                alt={post.title}
                className="w-full h-64 md:h-96 lg:h-[28rem] object-cover rounded-2xl shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Share Bar - Mobile */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-8 pb-8 border-b border-slate-200">
                <span className="text-sm text-slate-500 mr-2">Compartilhar:</span>
                <Button variant="outline" size="icon" onClick={() => shareOnSocial('facebook')} className="h-9 w-9 rounded-full border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareOnSocial('twitter')} className="h-9 w-9 rounded-full border-slate-200 bg-white hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareOnSocial('linkedin')} className="h-9 w-9 rounded-full border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="h-9 w-9 rounded-full border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Article Content - Light Theme Prose */}
              <div className="prose prose-lg max-w-none
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-5 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3
                prose-h3:text-xl prose-h3:mt-9 prose-h3:mb-4
                prose-p:text-slate-700 prose-p:leading-[1.8] prose-p:mb-5
                prose-a:text-emerald-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700
                prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-emerald-700 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-950 prose-pre:rounded-xl
                prose-img:rounded-xl prose-img:shadow-md
                prose-ul:text-slate-700 prose-ol:text-slate-700
                prose-li:marker:text-emerald-500 prose-li:mb-2
                prose-table:border prose-table:border-slate-200
                prose-th:bg-slate-100 prose-th:text-slate-800
                prose-td:border-slate-200
                mb-12"
              >
                {renderedContent}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-10 pb-10 border-b border-slate-200">
                  <Tag className="h-4 w-4 text-slate-400" />
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100 bg-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Final Conversion Section */}
              <BlogFinalConversion />

              {/* Related Posts */}
              {filteredRelated.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-slate-900">Artigos Relacionados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredRelated.map((relatedPost) => (
                      <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                        <Card className="h-full group hover:shadow-lg transition-all duration-300 bg-white border-slate-200 hover:border-emerald-300 overflow-hidden">
                          {relatedPost.og_image && (
                            <div className="h-36 overflow-hidden">
                              <img
                                src={relatedPost.og_image}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            {relatedPost.category && (
                              <Badge className="mb-2 bg-emerald-100 text-emerald-700 text-xs border-0">
                                {relatedPost.category.name}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                              {relatedPost.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                              <Clock className="h-3 w-3" />
                              {relatedPost.reading_time_minutes} min
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Share Card - Desktop */}
              <Card className="hidden lg:block bg-white border-slate-200 sticky top-24 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-600" />
                    Compartilhar
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial('facebook')} className="flex-1 h-10 rounded-lg border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial('twitter')} className="flex-1 h-10 rounded-lg border-slate-200 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial('linkedin')} className="flex-1 h-10 rounded-lg border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-1 h-10 rounded-lg border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table of Contents */}
              <div className="hidden lg:block">
                <TableOfContents content={htmlContent} />
              </div>

              {/* Strategic Articles */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Mais Lidos
                  </h4>
                  <ul className="space-y-3">
                    {[
                      { slug: 'preco-sucata-hoje-tabela-atualizada', title: 'Preço da Sucata Hoje: Tabela 2026' },
                      { slug: 'quanto-vale-kg-cobre-hoje', title: 'Quanto Vale o Kg do Cobre Hoje' },
                      { slug: 'como-abrir-ferro-velho-lucrativo', title: 'Como Abrir um Ferro Velho Lucrativo' },
                      { slug: 'como-calcular-preco-sucata-corretamente', title: 'Como Calcular Preço da Sucata' },
                      { slug: 'sistema-ferro-velho-guia-definitivo', title: 'Melhor Sistema para Ferro Velho' },
                    ].filter(a => a.slug !== slug).slice(0, 4).map((article) => (
                      <li key={article.slug}>
                        <Link 
                          to={`/blog/${article.slug}`}
                          className="text-sm text-slate-600 hover:text-emerald-600 transition-colors block leading-snug"
                        >
                          → {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Sidebar CTA */}
              <Card className="bg-gradient-to-br from-emerald-600 to-emerald-500 border-0 shadow-lg shadow-emerald-200 overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-3 text-white">Sistema para Ferro Velho</h3>
                    <p className="text-sm text-emerald-100 mb-5">
                      Controle caixa, compras, vendas e estoque em um só lugar.
                    </p>
                    <Link to="/register">
                      <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-md">
                        Teste Grátis
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Link to Landing */}
              <Card className="bg-slate-50 border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-slate-800 mb-2">Conheça o XLata</h4>
                  <p className="text-sm text-slate-500 mb-3">Veja como nosso sistema transforma a gestão do seu ferro velho.</p>
                  <Link to="/sistema-para-ferro-velho" className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
                    Ver página completa <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </article>
    </BlogArticleLayout>
  );
};

export default BlogPost;
