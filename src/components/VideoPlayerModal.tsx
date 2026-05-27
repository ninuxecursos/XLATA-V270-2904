
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, ExternalLink } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title
}) => {
  const [loadError, setLoadError] = useState(false);

  // Reset error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadError(false);
    }
  }, [isOpen]);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // Diferentes formatos de URL do YouTube - incluindo IDs que começam com hífen
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
      /[?&]v=([a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Usar youtube-nocookie.com para melhor privacidade
        return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      }
    }
    
    return null;
  };

  const openInYouTube = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-black/95 border-gray-700 p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-bold">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Player de vídeo para {title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="aspect-video w-full">
          {embedUrl && !loadError ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              loading="lazy"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900 gap-4">
              <Play className="h-16 w-16 text-gray-500" />
              <p className="text-lg font-semibold">
                {loadError ? 'Não foi possível carregar o vídeo' : 'Vídeo não disponível'}
              </p>
              {videoUrl && (
                <Button 
                  onClick={openInYouTube}
                  variant="outline"
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Assistir no YouTube
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Botão alternativo sempre visível */}
        {embedUrl && !loadError && (
          <div className="p-4 pt-2 flex justify-center">
            <Button 
              onClick={openInYouTube}
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-400 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir no YouTube
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerModal;
