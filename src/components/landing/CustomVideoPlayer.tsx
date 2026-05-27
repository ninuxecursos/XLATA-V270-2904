import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  thumbnail?: string | null;
  title: string;
  isYouTube?: boolean;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function CustomVideoPlayer({ src, thumbnail, title, isYouTube = false }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar se é um vídeo do YouTube/Vimeo
  const youtubeId = getYouTubeId(src);
  const vimeoId = getVimeoId(src);
  const isEmbedVideo = !!youtubeId || !!vimeoId;

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && hasStarted) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, hasStarted]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && hasStarted) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setHasStarted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Para vídeos embed (YouTube/Vimeo), usar iframe com overlay de play
  if (isEmbedVideo) {
    const embedUrl = youtubeId 
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
      : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    
    const thumbUrl = thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

    if (showEmbed) {
      return (
        <div className="relative aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div 
        className="relative aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setShowEmbed(true)}
      >
        {thumbUrl && (
          <img 
            src={thumbUrl} 
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            aria-label={`Reproduzir vídeo: ${title}`}
            className="w-20 h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" aria-hidden="true" />
          </button>
        </div>
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h4 className="text-white font-medium">{title}</h4>
        </div>
      </div>
    );
  }

  // Player nativo para vídeos de upload
  return (
    <div 
      ref={containerRef}
      className="relative aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Overlay escuro quando pausado */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Play button central (quando não iniciou) */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={togglePlay}
            aria-label={`Reproduzir vídeo: ${title}`}
            className="w-20 h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Controles */}
      {hasStarted && (
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress bar */}
          <div 
            className="h-1 bg-slate-700 cursor-pointer mx-4 mb-3"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-2">
              {/* Skip back */}
              <button 
                onClick={() => skip(-10)}
                aria-label="Retroceder 10 segundos"
                className="w-10 h-10 flex items-center justify-center text-white hover:text-emerald-400 transition-colors"
              >
                <SkipBack className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Play/Pause */}
              <button 
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" fill="white" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" aria-hidden="true" />
                )}
              </button>

              {/* Skip forward */}
              <button 
                onClick={() => skip(10)}
                aria-label="Avançar 10 segundos"
                className="w-10 h-10 flex items-center justify-center text-white hover:text-emerald-400 transition-colors"
              >
                <SkipForward className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Time */}
              <span className="text-white text-sm ml-2">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
            <button 
              onClick={toggleMute}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar vídeo'}
              className="w-10 h-10 flex items-center justify-center text-white hover:text-emerald-400 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Title overlay */}
      {!hasStarted && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h4 className="text-white font-medium">{title}</h4>
        </div>
      )}
    </div>
  );
}
