import { useState, useRef } from 'react';
import { Upload, X, Link, Video } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUploaderProps {
  value: string | null;
  videoType: 'url' | 'upload';
  onChange: (url: string | null, type: 'url' | 'upload') => void;
  bucket?: string;
  folder?: string;
  className?: string;
}

export function VideoUploader({
  value,
  videoType,
  onChange,
  bucket = 'landing-videos',
  folder = '',
  className = ''
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(videoType === 'url' ? (value || '') : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido. Use MP4, WebM ou OGG.');
      return;
    }

    // Validar tamanho (máximo 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl, 'upload');
      toast.success('Vídeo enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar vídeo: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url || null, 'url');
  };

  const handleClear = () => {
    setUrlInput('');
    onChange(null, videoType);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tabs para escolher tipo */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={videoType === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(urlInput || null, 'url')}
          className="flex items-center gap-2"
        >
          <Link className="w-4 h-4" />
          URL
        </Button>
        <Button
          type="button"
          variant={videoType === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(value, 'upload')}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Campo de URL */}
      {videoType === 'url' && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="flex-1"
          />
          {urlInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload de arquivo */}
      {videoType === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {value && videoType === 'upload' ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <video
                src={value}
                className="w-full h-32 object-cover"
                controls={false}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Enviando...</span>
                </>
              ) : (
                <>
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para enviar vídeo
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    MP4, WebM ou OGG (máx. 50MB)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
