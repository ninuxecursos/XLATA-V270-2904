import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Building2, 
  Globe, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Search,
  FileText,
  BarChart3
} from 'lucide-react';
import { useLocalSeoAdmin, PageStatus } from '@/hooks/useLocalSeoAdmin';

export const LocalSeoManagement: React.FC = () => {
  const {
    allPages,
    stats,
    loadingPages,
    isGenerating,
    generationProgress,
    refetchPages,
    generateSinglePage,
    generateBatch,
    updatePageStatus,
  } = useLocalSeoAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'states' | 'cities'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-content' | 'without-content'>('all');
  const [batchLimit, setBatchLimit] = useState(10);

  // Filter pages based on search and filters
  const filteredPages = allPages?.filter(page => {
    const matchesSearch = searchTerm === '' || 
      page.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.cityName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' ||
      (filterType === 'states' && page.pageType === 'state') ||
      (filterType === 'cities' && page.pageType === 'city');
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'with-content' && page.hasContent) ||
      (filterStatus === 'without-content' && !page.hasContent);

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const contentPercentage = stats.totalPages > 0 
    ? Math.round((stats.pagesWithContent / stats.totalPages) * 100) 
    : 0;

  const handleGenerateBatch = async (type: 'states' | 'cities' | 'all', forceRegenerate: boolean = false) => {
    await generateBatch(type, batchLimit, forceRegenerate);
  };

  const getStatusBadge = (page: PageStatus) => {
    if (!page.hasContent) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Sem conteúdo</Badge>;
    }
    if (page.wordCount < 600) {
      return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><AlertCircle className="h-3 w-3" /> Curto ({page.wordCount})</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> OK ({page.wordCount})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-red-500" />
            Gestão de SEO Local
          </h2>
          <p className="text-muted-foreground">
            Geração e gerenciamento de conteúdo para páginas locais
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchPages()}
          disabled={loadingPages}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingPages ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Páginas</p>
                <p className="text-3xl font-bold">{stats.totalPages}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estados</p>
                <p className="text-3xl font-bold">{stats.totalStates}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cidades</p>
                <p className="text-3xl font-bold">{stats.totalCities}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Palavras</p>
                <p className="text-3xl font-bold">{stats.averageWordCount}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status do Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  <span className="text-green-600 font-medium">{stats.pagesWithContent}</span> com conteúdo
                </span>
                <span className="text-sm text-muted-foreground">
                  <span className="text-red-600 font-medium">{stats.pagesWithoutContent}</span> sem conteúdo
                </span>
              </div>
              <Progress value={contentPercentage} className="h-3" />
              <p className="text-sm text-center mt-2 font-medium">{contentPercentage}% completo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="generate">Gerar Conteúdo</TabsTrigger>
        </TabsList>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por estado ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="states">Estados</SelectItem>
                    <SelectItem value="cities">Cidades</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="with-content">Com conteúdo</SelectItem>
                    <SelectItem value="without-content">Sem conteúdo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pages List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Páginas ({filteredPages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPages ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma página encontrada
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredPages.map((page) => (
                    <div 
                      key={page.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {page.pageType === 'state' ? (
                          <MapPin className="h-4 w-4 text-green-500" />
                        ) : (
                          <Building2 className="h-4 w-4 text-purple-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {page.cityName ? `${page.cityName}, ${page.stateName}` : page.stateName}
                          </p>
                          <p className="text-xs text-muted-foreground">{page.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(page)}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateSinglePage.mutate(page.id)}
                          disabled={isGenerating || generateSinglePage.isPending}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          {page.hasContent ? 'Regenerar' : 'Gerar'}
                        </Button>

                        <a 
                          href={`/${page.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Geração em Lote
              </CardTitle>
              <CardDescription>
                Gere conteúdo automaticamente para múltiplas páginas usando IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade de páginas por lote</label>
                <Select value={String(batchLimit)} onValueChange={(v) => setBatchLimit(Number(v))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 páginas</SelectItem>
                    <SelectItem value="10">10 páginas</SelectItem>
                    <SelectItem value="20">20 páginas</SelectItem>
                    <SelectItem value="30">30 páginas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Cada página leva ~5 segundos para ser gerada. Lotes maiores demoram mais.
                </p>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Gerando conteúdo...</span>
                  </div>
                  <Progress 
                    value={generationProgress.total > 0 
                      ? (generationProgress.current / generationProgress.total) * 100 
                      : 0
                    } 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {generationProgress.current} de {generationProgress.total} páginas
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Estados</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gerar conteúdo para páginas de estados
                    </p>
                    <Button 
                      onClick={() => handleGenerateBatch('states')}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar para Estados
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">Cidades</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gerar conteúdo para páginas de cidades
                    </p>
                    <Button 
                      onClick={() => handleGenerateBatch('cities')}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar para Cidades
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Todas</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gerar conteúdo para todas as páginas
                    </p>
                    <Button 
                      onClick={() => handleGenerateBatch('all')}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Todas
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Force Regenerate */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-lg">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  🔄 Regenerar Conteúdo (Forçar)
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Substitui o conteúdo existente por novos artigos de 1500+ palavras, únicos e otimizados para SEO.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleGenerateBatch('cities', true)}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerar Cidades ({batchLimit})
                  </Button>
                  <Button 
                    onClick={() => handleGenerateBatch('all', true)}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerar Todas ({batchLimit})
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Como funciona a geração
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• A IA gera conteúdo único de <strong>1500+ palavras</strong> para cada página</li>
                  <li>• Cada página inclui H2, H3, FAQ, links internos, Schema.org e CTAs</li>
                  <li>• O conteúdo é variado por ângulo editorial para evitar duplicação</li>
                  <li>• Páginas são automaticamente publicadas e indexáveis</li>
                  <li>• Use "Regenerar" para substituir páginas curtas por conteúdo completo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
