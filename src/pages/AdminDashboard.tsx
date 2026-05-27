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
import { Users, FileText, Settings, Home, Play, Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Bot, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { PlansManagement } from '@/components/admin/PlansManagement';
import PromotionalCampaignsManager from '@/components/admin/PromotionalCampaignsManager';
import { MaterialsConsolidation } from '@/components/admin/MaterialsConsolidation';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { AIAutomationPanel } from '@/components/admin/AIAutomationPanel';
import { LocalSeoManagement } from '@/components/admin/LocalSeoManagement';
import { SEOHead } from '@/components/portal/SEOHead';

interface GuideVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  category: string;
  difficulty: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    category: 'Geral',
    difficulty: 'Iniciante',
    order_position: 0,
    is_active: true
  });
  const [editingVideo, setEditingVideo] = useState<GuideVideo | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'videos') {
      loadVideos();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_videos')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vídeos",
        variant: "destructive"
      });
    }
  };

  const handleSaveVideo = async () => {
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('guide_videos')
          .update(videoFormData)
          .eq('id', editingVideo.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('guide_videos')
          .insert([videoFormData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo adicionado com sucesso"
        });
      }

      setIsVideoDialogOpen(false);
      resetVideoForm();
      loadVideos();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar vídeo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('guide_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vídeo excluído com sucesso"
      });

      loadVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir vídeo",
        variant: "destructive"
      });
    }
  };

  const handleToggleVideoStatus = async (video: GuideVideo) => {
    try {
      const { error } = await supabase
        .from('guide_videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Vídeo ${!video.is_active ? 'ativado' : 'desativado'} com sucesso`
      });

      loadVideos();
    } catch (error) {
      console.error('Erro ao alterar status do vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do vídeo",
        variant: "destructive"
      });
    }
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      duration: '',
      category: 'Geral',
      difficulty: 'Iniciante',
      order_position: 0,
      is_active: true
    });
    setEditingVideo(null);
  };

  const handleEditVideo = (video: GuideVideo) => {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      duration: video.duration || '',
      category: video.category,
      difficulty: video.difficulty,
      order_position: video.order_position,
      is_active: video.is_active
    });
    setIsVideoDialogOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-green-600';
      case 'Intermediário': return 'bg-yellow-600';
      case 'Avançado': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Painel Administrativo - XLata"
        description="Painel de administração do sistema XLata."
        allowIndexing={false}
      />
      <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/0b938627-d0e9-401b-9b55-a047bea2ddb8.png"
                alt="AIRK Soluções Digitais"
                className="h-8 w-auto mr-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Promoções
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Guia
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="local-seo" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              SEO Local
            </TabsTrigger>
            <TabsTrigger value="ai-automation" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              IA
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vídeos Publicados
                  </CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{videos.filter(v => v.is_active).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter(u => u.status === 'user').length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <PlansManagement />
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <PromotionalCampaignsManager />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{user.name || 'Nome não informado'}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === 'admin' ? 'default' : 'secondary'}>
                          {user.status === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gerenciar Vídeos do Guia</CardTitle>
                <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetVideoForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Vídeo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Título *
                        </Label>
                        <Input
                          id="title"
                          value={videoFormData.title}
                          onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                          className="col-span-3"
                          placeholder="Ex: Como configurar o sistema"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Descrição
                        </Label>
                        <Textarea
                          id="description"
                          value={videoFormData.description}
                          onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                          className="col-span-3"
                          placeholder="Descrição detalhada do vídeo"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="video_url" className="text-right">
                          URL do Vídeo *
                        </Label>
                        <Input
                          id="video_url"
                          value={videoFormData.video_url}
                          onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                          className="col-span-3"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="thumbnail_url" className="text-right">
                          URL da Miniatura
                        </Label>
                        <Input
                          id="thumbnail_url"
                          value={videoFormData.thumbnail_url}
                          onChange={(e) => setVideoFormData({ ...videoFormData, thumbnail_url: e.target.value })}
                          className="col-span-3"
                          placeholder="URL da imagem de capa"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                          Duração
                        </Label>
                        <Input
                          id="duration"
                          value={videoFormData.duration}
                          onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                          className="col-span-3"
                          placeholder="Ex: 12:30"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Categoria
                        </Label>
                        <Select
                          value={videoFormData.category}
                          onValueChange={(value) => setVideoFormData({ ...videoFormData, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Geral">Geral</SelectItem>
                            <SelectItem value="Configuração">Configuração</SelectItem>
                            <SelectItem value="Materiais">Materiais</SelectItem>
                            <SelectItem value="Vendas">Vendas</SelectItem>
                            <SelectItem value="Relatórios">Relatórios</SelectItem>
                            <SelectItem value="Avançado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="difficulty" className="text-right">
                          Dificuldade
                        </Label>
                        <Select
                          value={videoFormData.difficulty}
                          onValueChange={(value) => setVideoFormData({ ...videoFormData, difficulty: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Iniciante">Iniciante</SelectItem>
                            <SelectItem value="Intermediário">Intermediário</SelectItem>
                            <SelectItem value="Avançado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="order_position" className="text-right">
                          Posição
                        </Label>
                        <Input
                          id="order_position"
                          type="number"
                          value={videoFormData.order_position}
                          onChange={(e) => setVideoFormData({ ...videoFormData, order_position: parseInt(e.target.value) || 0 })}
                          className="col-span-3"
                          placeholder="Ordem de exibição"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_active" className="text-right">
                          Ativo
                        </Label>
                        <Switch
                          id="is_active"
                          checked={videoFormData.is_active}
                          onCheckedChange={(checked) => setVideoFormData({ ...videoFormData, is_active: checked })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveVideo}>
                        {editingVideo ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{video.title}</h3>
                          <Badge className={getDifficultyColor(video.difficulty)}>
                            {video.difficulty}
                          </Badge>
                          <Badge variant="outline">{video.category}</Badge>
                          {video.is_active ? (
                            <Badge className="bg-green-600">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{video.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Duração: {video.duration || 'N/A'}</span>
                          <span>Posição: {video.order_position}</span>
                          <span>Criado: {new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVideoStatus(video)}
                        >
                          {video.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditVideo(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o vídeo "{video.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVideo(video.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {videos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum vídeo cadastrado ainda.</p>
                      <p className="text-sm">Clique em "Adicionar Vídeo" para começar.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Consolidation Tab */}
          <TabsContent value="materials" className="space-y-6">
            <MaterialsConsolidation />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <ContentManagement />
          </TabsContent>

          {/* AI Automation Tab */}
          <TabsContent value="ai-automation" className="space-y-6">
            <AIAutomationPanel />
          </TabsContent>

          {/* Local SEO Tab */}
          <TabsContent value="local-seo" className="space-y-6">
            <LocalSeoManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Configurações do sistema em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;
