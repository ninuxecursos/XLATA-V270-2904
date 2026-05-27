import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
}

const sections: Section[] = [
  { id: 'hero', label: 'Início' },
  { id: 'como-funciona', label: 'Como Funciona' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'beneficios', label: 'Benefícios' },
  { id: 'roi', label: 'Resultados' },
  { id: 'depoimentos', label: 'Depoimentos' },
  { id: 'planos', label: 'Planos' },
  { id: 'faq', label: 'Dúvidas' }
];

export const ProgressIndicator: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar apenas após rolar um pouco
      setIsVisible(window.scrollY > 300);
      
      // Encontrar seção ativa
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(i);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const progress = ((activeSection + 1) / sections.length) * 100;

  if (!isVisible) return null;

  return (
    <nav 
      aria-label="Progresso de leitura da página"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden md:block"
    >
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Barra de progresso */}
          <div 
            className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso de leitura: ${Math.round(progress)}%`}
          >
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Indicador de seção */}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            <span className="text-white font-medium">{sections[activeSection].label}</span>
            <span className="mx-1.5">•</span>
            <span>{activeSection + 1}/{sections.length}</span>
          </span>
          
          {/* Dots navegáveis */}
          <div className="flex gap-1 ml-2" role="tablist" aria-label="Navegação por seções">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                role="tab"
                aria-selected={index === activeSection}
                aria-label={`Ir para seção ${section.label}`}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === activeSection 
                    ? 'bg-green-500 scale-125' 
                    : index < activeSection 
                      ? 'bg-green-500/50 hover:bg-green-500/70' 
                      : 'bg-gray-600 hover:bg-gray-500'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
