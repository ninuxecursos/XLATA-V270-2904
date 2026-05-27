import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Clock, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FooterConfig, ShopColors } from '@/hooks/useShopConfig';

interface ShopLocationSectionProps {
  footerConfig?: FooterConfig;
  colors?: ShopColors;
}

export function ShopLocationSection({ footerConfig, colors }: ShopLocationSectionProps) {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Extract the src URL from iframe HTML if needed
  const mapEmbedUrl = useMemo(() => {
    const embedValue = footerConfig?.google_maps_embed || '';
    if (!embedValue) return '';
    
    // If it's a full iframe tag, extract the src
    if (embedValue.includes('<iframe')) {
      const srcMatch = embedValue.match(/src=["']([^"']+)["']/);
      return srcMatch?.[1] || '';
    }
    
    // If it's already a URL, return it
    return embedValue;
  }, [footerConfig?.google_maps_embed]);

  // Lazy load map with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!footerConfig?.address && !footerConfig?.google_maps_embed) {
    return null;
  }

  const fullAddress = [
    footerConfig.address,
    footerConfig.neighborhood,
    footerConfig.city
  ].filter(Boolean).join(', ');

  return (
    <section 
      className="py-8 lg:py-12"
      style={{ backgroundColor: colors?.background || '#F9FAFB' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h2 
            className="text-xl lg:text-2xl font-bold mb-2"
            style={{ color: colors?.text_primary || '#111827' }}
          >
            📍 Onde Estamos
          </h2>
          <p 
            className="text-sm lg:text-base"
            style={{ color: colors?.text_secondary || '#4B5563' }}
          >
            Visite nossa loja física
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div 
            ref={mapRef}
            className="rounded-xl overflow-hidden shadow-lg shop-map-container relative"
            style={{ 
              backgroundColor: colors?.surface || '#FFFFFF',
              border: `1px solid ${colors?.border || '#E5E7EB'}`,
              minHeight: '280px'
            }}
          >
            {mapEmbedUrl && isMapVisible ? (
              <iframe
                src={mapEmbedUrl}
                className="w-full h-full min-h-[280px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da loja"
              />
            ) : mapEmbedUrl ? (
              <div 
                className="w-full h-full min-h-[280px] flex items-center justify-center"
                style={{ backgroundColor: colors?.background_alt || '#F3F4F6' }}
              >
                <div className="text-center">
                  <MapPin 
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: colors?.primary || '#10B981' }}
                  />
                  <p 
                    className="text-sm"
                    style={{ color: colors?.text_muted || '#9CA3AF' }}
                  >
                    Carregando mapa...
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-full min-h-[280px] flex items-center justify-center"
                style={{ backgroundColor: colors?.background_alt || '#F3F4F6' }}
              >
                <div className="text-center">
                  <MapPin 
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: colors?.text_muted || '#9CA3AF' }}
                  />
                  <p 
                    className="text-sm"
                    style={{ color: colors?.text_muted || '#9CA3AF' }}
                  >
                    Mapa não configurado
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div 
            className="rounded-xl p-6 lg:p-8"
            style={{ 
              backgroundColor: colors?.surface || '#FFFFFF',
              border: `1px solid ${colors?.border || '#E5E7EB'}`
            }}
          >
            {/* Address */}
            {fullAddress && (
              <div className="flex gap-4 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${colors?.primary || '#10B981'}15` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: colors?.primary || '#10B981' }} />
                </div>
                <div>
                  <p 
                    className="font-medium mb-1"
                    style={{ color: colors?.text_primary || '#111827' }}
                  >
                    Endereço
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: colors?.text_secondary || '#4B5563' }}
                  >
                    {fullAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {footerConfig.opening_hours && (
              <div className="flex gap-4 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${colors?.primary || '#10B981'}15` }}
                >
                  <Clock className="w-5 h-5" style={{ color: colors?.primary || '#10B981' }} />
                </div>
                <div>
                  <p 
                    className="font-medium mb-1"
                    style={{ color: colors?.text_primary || '#111827' }}
                  >
                    Horário de Funcionamento
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: colors?.text_secondary || '#4B5563' }}
                  >
                    {footerConfig.opening_hours}
                  </p>
                </div>
              </div>
            )}

            {/* Button */}
            {footerConfig.google_maps_link && (
              <Button 
                asChild
                className="w-full mt-4 gap-2"
                style={{ 
                  backgroundColor: colors?.primary || '#10B981',
                  color: '#FFFFFF'
                }}
              >
                <a 
                  href={footerConfig.google_maps_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4" />
                  Abrir no Google Maps
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
