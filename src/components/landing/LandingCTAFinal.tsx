import { ArrowRight, CheckCircle } from 'lucide-react';
import { LandingCTAFinal as CTAType } from '@/hooks/useLandingData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LandingCTAFinalProps {
  data: CTAType | null;
  onStartTrial: () => void;
}

export function LandingCTAFinal({ data, onStartTrial }: LandingCTAFinalProps) {
  const navigate = useNavigate();
  if (!data) return null;

  const handleClick = () => {
    if (data.button_url?.startsWith('http')) window.open(data.button_url, '_blank');
    else if (data.button_url) navigate(data.button_url);
    else onStartTrial();
  };

  const notes = data.notes?.split(/[✓\n]/).filter(n => n.trim()) || [];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto bg-emerald-500 rounded-3xl px-8 py-16 md:px-16 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{data.main_text}</h2>
          {data.sub_text && <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">{data.sub_text}</p>}
          <Button size="lg" onClick={handleClick} className="bg-white text-emerald-700 hover:bg-emerald-50 px-10 py-7 text-xl font-semibold shadow-lg transition-all hover:scale-105 rounded-lg">
            {data.button_text}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          {notes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 text-emerald-100 mt-8">
              {notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /><span>{note.trim()}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
