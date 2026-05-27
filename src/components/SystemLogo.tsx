
import React from 'react';
import { useSystemLogo } from '@/hooks/useSystemLogo';

interface SystemLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCompanyName?: boolean;
  fallbackSrc?: string;
}

const SystemLogo: React.FC<SystemLogoProps> = ({ 
  className = '', 
  size = 'md',
  showCompanyName = false,
  fallbackSrc = '/lovable-uploads/0a88c5b7-5cee-4840-953d-8ac270aaa491.png'
}) => {
  const { getCompanyName, getLogoUrl, loading } = useSystemLogo();

  const companyName = getCompanyName();
  const logoUrl = getLogoUrl();

  // Definir tamanhos baseados no prop size
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto', 
    lg: 'h-16 w-auto'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-300 animate-pulse rounded ${className}`}>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoUrl || fallbackSrc}
        alt={companyName}
        width={size === 'sm' ? 32 : size === 'md' ? 134 : 64}
        height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
        className={`${sizeClasses[size]} object-contain`}
        loading={size === 'md' ? 'eager' : 'lazy'}
        decoding={size === 'md' ? 'sync' : 'async'}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== fallbackSrc) {
            target.src = fallbackSrc;
          }
        }}
      />
      {/*{showCompanyName && (
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg">{companyName}</span>
          <span className="text-gray-400 text-xs">Sistema para Ferro Velho</span>
        </div>
      )}*/}
    </div>
  );
};

export default SystemLogo;
