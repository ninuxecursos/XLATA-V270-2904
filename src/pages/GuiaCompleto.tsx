import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Clock, CheckCircle, BookOpen, Edit, Plus, Trash2, Settings, Cog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import VideoPlayerModal from '@/components/VideoPlayerModal';
import AdminVideoEditModal from '@/components/AdminVideoEditModal';
import GuidePageSettingsModal from '@/components/GuidePageSettingsModal';

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
  youtube_video_id?: string;
  cover_image_url?: string;
}

interface GuidePageSettings {
  id?: string;
  user_id: string;
  badge_text: string;
  main_title: string;
  subtitle: string;
  feature1_title: string;
  feature1_subtitle: string;
  feature2_title: string;
  feature2_subtitle: string;
  feature3_title: string;
  feature3_subtitle: string;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
}

const GuiaCompleto: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GuideVideo | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<GuideVideo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [pageSettings, setPageSettings] = useState<GuidePageSettings>({
    user_id: '',
    badge_text: 'GUIA COMPLETO EXCLUSIVO',
    main_title: 'Aprenda a Dominar o Sistema XLata',
    subtitle: 'Vídeos tutoriais exclusivos para você se tornar um expert no sistema',
    feature1_title: 'Vídeos Exclusivos',
    feature1_subtitle: 'Conteúdo completo e detalhado',
    feature2_title: 'Conteúdo Premium',
    feature2_subtitle: 'Aprenda no seu ritmo',
    feature3_title: 'Acesso ao Guia Vitalício',
    feature3_subtitle: 'Reveja quantas vezes quiser',
    cta_title: 'Pronto para Começar?',
    cta_subtitle: 'Acesse o sistema xlata completo e comece a transformar seu ferro velho hoje mesmo.',
    cta_button_text: 'ACESSAR SISTEMA COMPLETO'
  });

  useEffect(() => {
    checkAdminStatus();
    loadVideos();
    loadPageSettings();
    loadWatchedVideos();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.status === 'admin');
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
    }
  };

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_videos')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vídeos do guia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPageSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('guide_page_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setPageSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da página:', error);
    }
  };

  const loadWatchedVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_video_progress')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar progresso:', error);
        return;
      }

      if (data) {
        setWatchedVideos(new Set(data.map(p => p.video_id)));
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  };

  const markAsWatched = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_video_progress')
        .upsert({ 
          user_id: user.id, 
          video_id: videoId,
          watched_at: new Date().toISOString(),
          is_completed: true 
        });

      if (error) {
        console.error('Erro ao marcar como assistido:', error);
        return;
      }

      setWatchedVideos(prev => new Set([...prev, videoId]));
    } catch (error) {
      console.error('Erro ao registrar progresso:', error);
    }
  };

  const isWatched = (videoId: string) => watchedVideos.has(videoId);
  const watchedCount = watchedVideos.size;
  const totalVideos = videos.length;
  const progressPercent = totalVideos > 0 ? (watchedCount / totalVideos) * 100 : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-emerald-600';
      case 'Intermediário': return 'bg-yellow-600';
      case 'Avançado': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  const openVideo = (video: GuideVideo) => {
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  const handleCloseVideo = () => {
    if (selectedVideo) {
      markAsWatched(selectedVideo.id);
    }
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
  };

  const openEditModal = (video?: GuideVideo) => {
    setEditingVideo(video || null);
    setIsAdminEditOpen(true);
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('guide_videos')
        .delete()
        .eq('id', videoId);

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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Compacto */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Lado esquerdo - Voltar + Título */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-white">Guia Completo</h1>
                <p className="text-xs text-slate-400 hidden sm:block">{pageSettings.subtitle}</p>
              </div>
            </div>
            
            {/* Centro - Barra de Progresso */}
            <div className="flex-1 max-w-xs hidden md:flex items-center gap-3">
              <div className="flex-1">
                <Progress value={progressPercent} className="h-2 bg-slate-700" />
              </div>
              <span className="text-sm text-slate-400 whitespace-nowrap">
                {watchedCount}/{totalVideos}
              </span>
            </div>

            {/* Lado direito - Admin controls */}
            <div className="flex items-center gap-2">
              {/* Progresso mobile */}
              <div className="flex md:hidden items-center gap-2 text-sm text-slate-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{watchedCount}/{totalVideos}</span>
              </div>

              {isAdmin && (
                <>
                  <Badge className="bg-orange-600 text-white text-xs hidden sm:flex">
                    <Settings className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setIsSettingsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Cog className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openEditModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Carregando vídeos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-400 mb-1">Nenhum vídeo disponível</h3>
            <p className="text-slate-500 text-sm">Os vídeos do guia estão sendo preparados.</p>
          </div>
        ) : (
          <>
            {/* Grid de Vídeos Compacto */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {videos.map((video, index) => (
                <Card 
                  key={video.id} 
                  className={`bg-slate-800 border transition-all duration-200 overflow-hidden cursor-pointer group hover:scale-[1.02] ${
                    isWatched(video.id) 
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => openVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video">
                    <img
                      src={video.cover_image_url || video.thumbnail_url || "/lovable-uploads/7e573df6-43ec-4eac-a025-777ac1ecdd0f.png"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay de play */}
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Badge Assistido */}
                    {isWatched(video.id) && (
                      <div className="absolute top-1.5 right-1.5">
                        <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                          Visto
                        </Badge>
                      </div>
                    )}

                    {/* Número do vídeo */}
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 font-bold">
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Duração */}
                    {video.duration && (
                      <div className="absolute bottom-1.5 right-1.5">
                        <Badge className="bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {video.duration}
                        </Badge>
                      </div>
                    )}

                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(video);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVideo(video.id);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo do Card */}
                  <CardContent className="p-2.5">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-0 text-[10px] px-1.5 py-0">
                        {video.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(video.difficulty)} text-white text-[10px] px-1.5 py-0`}>
                        {video.difficulty}
                      </Badge>
                    </div>
                    
                    {/* Título */}
                    <h3 className="text-white text-xs font-semibold leading-tight line-clamp-2">
                      {video.title}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rodapé com progresso completo */}
            {watchedCount === totalVideos && totalVideos > 0 && (
              <div className="mt-8 text-center py-6 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white mb-1">🎉 Parabéns!</h3>
                <p className="text-slate-400 text-sm">Você assistiu todos os vídeos do guia!</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={isVideoPlayerOpen}
          onClose={handleCloseVideo}
          videoUrl={selectedVideo.video_url}
          title={selectedVideo.title}
        />
      )}

      {/* Admin Edit Modal */}
      {isAdmin && (
        <AdminVideoEditModal
          isOpen={isAdminEditOpen}
          onClose={() => {
            setIsAdminEditOpen(false);
            setEditingVideo(null);
          }}
          video={editingVideo}
          onVideoUpdated={loadVideos}
        />
      )}

      {/* Page Settings Modal */}
      {isAdmin && (
        <GuidePageSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsUpdated={loadPageSettings}
          currentSettings={pageSettings}
        />
      )}
    </div>
  );
};

export default GuiaCompleto;