import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link, BookOpen, FileText, ChevronDown, Copy, Check, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PillarPage {
  id: string;
  slug: string;
  headline: string;
}

interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
}

interface InternalLinksPanelProps {
  onInsertLink?: (markdown: string) => void;
}

export const InternalLinksPanel: React.FC<InternalLinksPanelProps> = ({ onInsertLink }) => {
  const [pillarPages, setPillarPages] = useState<PillarPage[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pillarRes, glossaryRes, blogRes] = await Promise.all([
        supabase.from('pillar_pages').select('id, slug, headline').eq('status', 'published').order('headline'),
        supabase.from('glossary_terms').select('id, slug, term').eq('status', 'published').order('term').limit(20),
        supabase.from('blog_posts').select('id, slug, title').eq('status', 'published').order('created_at', { ascending: false }).limit(10)
      ]);

      if (pillarRes.data) setPillarPages(pillarRes.data);
      if (glossaryRes.data) setGlossaryTerms(glossaryRes.data);
      if (blogRes.data) setBlogPosts(blogRes.data);
    } catch (error) {
      console.error('Erro ao carregar links internos:', error);
    }
  };

  const generateMarkdownLink = (type: 'pillar' | 'glossary' | 'blog', item: { slug: string; title?: string; term?: string; headline?: string }) => {
    const paths = {
      pillar: '/solucoes',
      glossary: '/glossario',
      blog: '/blog'
    };
    const text = item.title || item.term || item.headline || item.slug;
    return `[${text}](${paths[type]}/${item.slug})`;
  };

  const copyToClipboard = async (id: string, type: 'pillar' | 'glossary' | 'blog', item: { slug: string; title?: string; term?: string; headline?: string }) => {
    const markdown = generateMarkdownLink(type, item);
    
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedId(id);
      toast({ title: "Copiado!", description: "Link Markdown copiado para a área de transferência" });
      
      if (onInsertLink) {
        onInsertLink(markdown);
      }
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao copiar", variant: "destructive" });
    }
  };

  const LinkButton: React.FC<{ 
    id: string; 
    type: 'pillar' | 'glossary' | 'blog'; 
    item: { slug: string; title?: string; term?: string; headline?: string };
    label: string;
  }> = ({ id, type, item, label }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(id, type, item)}
      className="w-full justify-between h-auto py-2 px-3 text-left hover:bg-gray-600/50 group"
    >
      <span className="text-sm text-gray-300 truncate flex-1">{label}</span>
      {copiedId === id ? (
        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <Copy className="h-4 w-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
      )}
    </Button>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gray-700/50 border-gray-600">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-700/30 transition-colors py-3 px-4">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-emerald-400">
                <Link className="h-4 w-4" />
                Links Internos Sugeridos
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <p className="text-xs text-gray-500 mb-3">
              Clique para copiar o link em Markdown
            </p>
            
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {/* Pillar Pages */}
                {pillarPages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-3 w-3 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400 uppercase">Páginas Pilares</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{pillarPages.length}</Badge>
                    </div>
                    <div className="space-y-1 bg-gray-800/50 rounded-md p-1">
                      {pillarPages.map(page => (
                        <LinkButton key={page.id} id={page.id} type="pillar" item={page} label={page.headline} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Glossary Terms */}
                {glossaryTerms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-3 w-3 text-blue-400" />
                      <span className="text-xs font-medium text-blue-400 uppercase">Termos do Glossário</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{glossaryTerms.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 bg-gray-800/50 rounded-md p-2">
                      {glossaryTerms.map(term => (
                        <Button
                          key={term.id}
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(term.id, 'glossary', term)}
                          className="h-7 px-2 text-xs bg-transparent border-gray-600 hover:bg-gray-600/50 hover:border-blue-500/50"
                        >
                          {copiedId === term.id ? (
                            <Check className="h-3 w-3 text-emerald-400 mr-1" />
                          ) : null}
                          {term.term}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Blog Posts */}
                {blogPosts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-orange-400" />
                      <span className="text-xs font-medium text-orange-400 uppercase">Artigos Recentes</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{blogPosts.length}</Badge>
                    </div>
                    <div className="space-y-1 bg-gray-800/50 rounded-md p-1">
                      {blogPosts.map(post => (
                        <LinkButton key={post.id} id={post.id} type="blog" item={post} label={post.title} />
                      ))}
                    </div>
                  </div>
                )}

                {pillarPages.length === 0 && glossaryTerms.length === 0 && blogPosts.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum conteúdo publicado disponível para linkagem.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default InternalLinksPanel;
