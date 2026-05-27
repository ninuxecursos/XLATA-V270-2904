import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Pause, Star, Users, Shield, SkipBack, SkipForward, Maximize2, Minimize2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface LandingHeroProps {
  settings: {
    hero_main_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_button_text?: string;
    hero_badge_text?: string;
    hero_highlight_text?: string;
    hero_secondary_button_text?: string;
    hero_social_proof_users?: string;
    hero_social_proof_users_label?: string;
    hero_social_proof_rating?: string;
    hero_social_proof_rating_label?: string;
    hero_security_label?: string;
    background_image_url?: string;
    video_url?: string;
    hero_image_url?: string;
    hero_image_size_desktop?: string;
    hero_image_size_tablet?: string;
    hero_image_size_mobile?: string;
    hero_image_alt?: string;
    hero_media_type?: string;
    hero_video_url?: string;
    hero_video_type?: string;
  } | null;
  onStartTrial: () => void;
  onWatchVideo: () => void;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function LandingHero({ settings, onStartTrial, onWatchVideo }: LandingHeroProps) {
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const title = settings?.hero_main_title || 'Sistema completo para seu depósito de reciclagem.';
  const highlight = settings?.hero_highlight_text || 'Simples como deveria ser.';
  const subtitle = settings?.hero_subtitle || '';
  const description = settings?.hero_description || 'Substitua o caderno de papel. Controle pesagens, gerencie clientes e saiba exatamente quanto você tem a receber. Tudo pelo celular.';
  const buttonText = settings?.hero_button_text || 'Começar Grátis';
  const badgeText = settings?.hero_badge_text || '✨ Simplifique seu controle de pesagens';

  const heroMediaType = settings?.hero_media_type || 'image';
  const heroImageUrl = settings?.hero_image_url || settings?.background_image_url;
  const heroVideoUrl = settings?.hero_video_url;
  const heroImageAlt = settings?.hero_image_alt || 'Sistema XLata em funcionamento';

  const youtubeId = heroVideoUrl ? getYouTubeId(heroVideoUrl) : null;
  const vimeoId = heroVideoUrl ? getVimeoId(heroVideoUrl) : null;
  const isEmbedVideo = !!youtubeId || !!vimeoId;
  const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause(); else { videoRef.current.play(); setHasStarted(true); }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipBack = () => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); };
  const handleSkipForward = () => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!isFullscreen) { if (containerRef.current.requestFullscreen) await containerRef.current.requestFullscreen(); }
    else { if (document.exitFullscreen) await document.exitFullscreen(); }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setProgress((video.currentTime / video.duration) * 100);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onEnded = () => { setIsPlaying(false); setShowControls(true); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const handlePlayVideo = () => { if (isEmbedVideo) setShowVideoEmbed(true); };

  const renderVideoPlayer = () => {
    if (!heroVideoUrl) return null;
    if (isEmbedVideo) {
      const embedUrl = youtubeId 
        ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
        : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      if (showVideoEmbed) {
        return (
          <div className="relative aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        );
      }
      return (
        <div className="relative aspect-video w-full bg-slate-800 rounded-2xl overflow-hidden cursor-pointer group shadow-2xl" onClick={handlePlayVideo}>
          {thumbUrl && <img src={thumbUrl} alt="Vídeo" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
              <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div ref={containerRef} className="relative aspect-video w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl group" onMouseMove={resetControlsTimeout} onMouseLeave={() => isPlaying && setShowControls(false)}>
        <video ref={videoRef} src={heroVideoUrl} className="w-full h-full object-cover cursor-pointer" onClick={handlePlayPause} preload="metadata" />
        {!hasStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handlePlayPause}>
            <button className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110">
              <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        )}
        {hasStarted && (
          <div className={cn("absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0")}>
            <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress" onClick={handleProgressClick}>
              <div className="h-full bg-emerald-500 rounded-full relative transition-all" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handleSkipBack} className="text-white/80 hover:text-emerald-400 p-1"><SkipBack className="w-5 h-5" /></button>
                <button onClick={handlePlayPause} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center">
                  {isPlaying ? <Pause className="w-5 h-5 text-white" fill="white" /> : <Play className="w-5 h-5 text-white ml-0.5" fill="white" />}
                </button>
                <button onClick={handleSkipForward} className="text-white/80 hover:text-emerald-400 p-1"><SkipForward className="w-5 h-5" /></button>
              </div>
              <button onClick={toggleFullscreen} className="text-white/80 hover:text-emerald-400 p-1">
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" aria-labelledby="hero-heading">
      <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" aria-hidden="true" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image/Video */}
          <div className="order-1 lg:order-1">
            {heroMediaType === 'video' && heroVideoUrl ? (
              renderVideoPlayer()
            ) : heroImageUrl ? (
              <img src={heroImageUrl} alt={heroImageAlt} width={700} height={400} loading="eager" fetchPriority="high" decoding="sync" className="w-full rounded-2xl" />
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 shadow-2xl aspect-video flex items-center justify-center">
                <div className="text-center text-emerald-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium opacity-70">Sistema XLata</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Content */}
          <div className="order-2 lg:order-2 text-center lg:text-left">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-fade-in">
              {badgeText}
            </Badge>
            
            <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold text-white mb-4 leading-tight animate-fade-in">
              {title}{' '}
              <span className="text-emerald-400">{highlight}</span>
            </h1>
            
            {subtitle && (
              <p className="text-xl md:text-2xl text-emerald-400 font-medium mb-4 animate-fade-in">{subtitle}</p>
            )}
            
            <p className="text-lg text-slate-300 mb-8 max-w-xl animate-fade-in">{description}</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-8 animate-fade-in">
              <Button size="lg" onClick={onStartTrial} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105 rounded-lg">
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex flex-col gap-1 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Sem cartão</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Com plano grátis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
