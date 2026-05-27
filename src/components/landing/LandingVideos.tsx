import { Clock } from 'lucide-react';
import { LandingVideo } from '@/hooks/useLandingData';
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface LandingVideosProps { items: LandingVideo[]; }

export function LandingVideos({ items }: LandingVideosProps) {
  if (!items.length) return null;

  const sortedItems = [...items].sort((a, b) => a.display_order - b.display_order);

  const getGridClass = () => {
    if (sortedItems.length === 1) return 'flex justify-center';
    if (sortedItems.length === 2) return 'grid grid-cols-2 gap-6 max-w-lg mx-auto';
    return 'grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl mx-auto';
  };

  const getItemClass = () => sortedItems.length === 1 ? 'w-full max-w-[280px]' : '';

  const getVideoSrc = (video: LandingVideo) => {
    if (video.video_type === 'upload' && video.video_file_url) return video.video_file_url;
    return video.video_url;
  };

  return (
    <section id="videos" className="py-24 bg-slate-800/50 scroll-mt-20 min-h-[600px]" aria-labelledby="videos-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 id="videos-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Veja o XLata Funcionando</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Vídeos curtos mostrando como é simples usar o sistema no dia a dia</p>
        </header>

        <div className={getGridClass()}>
          {sortedItems.map((video, index) => (
            <div key={video.id} className={`group ${getItemClass()}`}>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                <CustomVideoPlayer src={getVideoSrc(video)} thumbnail={video.thumbnail_url} title={video.title} isYouTube={video.video_type === 'url'} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{video.title}</h3>
                    {video.duration && <div className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{video.duration}</div>}
                  </div>
                  {video.description && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{video.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
