import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Shield,
  Heart
} from 'lucide-react';
import { useShopConfig, FooterConfig, ShopColors } from '@/hooks/useShopConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Social Media Icons
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
  colors?: ShopColors;
  isMobile?: boolean;
}

function FooterColumn({ title, children, colors, isMobile }: FooterColumnProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger 
          className="w-full flex items-center justify-between py-4 border-b"
          style={{ borderColor: `${colors?.footer_text || '#F9FAFB'}20` }}
        >
          <span 
            className="font-medium"
            style={{ color: colors?.footer_text || '#F9FAFB' }}
          >
            {title}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" style={{ color: colors?.footer_text || '#F9FAFB' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: colors?.footer_text || '#F9FAFB' }} />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="py-3 space-y-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div>
      <h3 
        className="font-semibold mb-4"
        style={{ color: colors?.footer_text || '#F9FAFB' }}
      >
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

interface FooterLinkProps {
  href?: string;
  children: React.ReactNode;
  colors?: ShopColors;
  external?: boolean;
}

function FooterLink({ href, children, colors, external }: FooterLinkProps) {
  const style = { 
    color: `${colors?.footer_text || '#F9FAFB'}99`,
  };

  const className = "text-sm hover:opacity-100 transition-opacity block py-0.5";

  if (!href) {
    return <span className={className} style={style}>{children}</span>;
  }

  if (external) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  );
}

// Formatar número de WhatsApp para exibição
function formatPhoneDisplay(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return phone;
}

export function ShopFooter() {
  const { data: config } = useShopConfig();
  const isMobile = useIsMobile();
  
  const colors = config?.colors;
  const footerConfig = config?.footer_config;

  return (
    <footer 
      className="pt-8 pb-24 lg:pb-8"
      style={{ backgroundColor: colors?.footer_bg || '#1F2937' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 mb-8">
          {/* Institucional */}
          <FooterColumn title={footerConfig?.col_title_institutional || 'Institucional'} colors={colors} isMobile={isMobile}>
            {footerConfig?.about_text && (
              <p 
                className="text-sm mb-3 leading-relaxed"
                style={{ color: `${colors?.footer_text || '#F9FAFB'}80` }}
              >
                {footerConfig.about_text}
              </p>
            )}
            {footerConfig?.show_link_about !== false && (
              <FooterLink href="/shop/sobre" colors={colors}>{footerConfig?.link_about_text || 'Sobre Nós'}</FooterLink>
            )}
            {footerConfig?.show_link_privacy !== false && (
              <FooterLink href="/shop/privacidade" colors={colors}>{footerConfig?.link_privacy_text || 'Política de Privacidade'}</FooterLink>
            )}
            {footerConfig?.show_link_terms !== false && (
              <FooterLink href="/shop/termos" colors={colors}>{footerConfig?.link_terms_text || 'Termos de Uso'}</FooterLink>
            )}
          </FooterColumn>

          {/* Loja */}
          <FooterColumn title={footerConfig?.col_title_shop || 'Loja'} colors={colors} isMobile={isMobile}>
            {footerConfig?.show_link_products !== false && (
              <FooterLink href="/shop" colors={colors}>{footerConfig?.link_products_text || 'Todos os Produtos'}</FooterLink>
            )}
            {footerConfig?.show_link_offers !== false && (
              <FooterLink href="/shop/ofertas-interativas" colors={colors}>{footerConfig?.link_offers_text || 'Ofertas Interativas'}</FooterLink>
            )}
            {footerConfig?.show_link_how_to_buy !== false && (
              <FooterLink href="/shop/como-comprar" colors={colors}>{footerConfig?.link_how_to_buy_text || 'Como Comprar'}</FooterLink>
            )}
            {footerConfig?.show_link_faq !== false && (
              <FooterLink href="/shop/faq" colors={colors}>{footerConfig?.link_faq_text || 'Perguntas Frequentes'}</FooterLink>
            )}
          </FooterColumn>

          {/* Atendimento */}
          <FooterColumn title={footerConfig?.col_title_contact || 'Atendimento'} colors={colors} isMobile={isMobile}>
            {footerConfig?.whatsapp && footerConfig?.show_whatsapp_in_footer !== false && (
              <div className="flex items-center gap-2 py-0.5">
                <Phone className="w-4 h-4" style={{ color: colors?.primary || '#10B981' }} />
                <FooterLink 
                  href={`https://wa.me/${footerConfig.whatsapp.replace(/\D/g, '')}`} 
                  colors={colors}
                  external
                >
                  {formatPhoneDisplay(footerConfig.whatsapp)}
                </FooterLink>
              </div>
            )}
            {footerConfig?.email && (
              <div className="flex items-center gap-2 py-0.5">
                <Mail className="w-4 h-4" style={{ color: colors?.primary || '#10B981' }} />
                <FooterLink 
                  href={`mailto:${footerConfig.email}`} 
                  colors={colors}
                  external
                >
                  {footerConfig.email}
                </FooterLink>
              </div>
            )}
            {footerConfig?.opening_hours && (
              <div className="flex items-center gap-2 py-0.5">
                <Clock className="w-4 h-4" style={{ color: colors?.primary || '#10B981' }} />
                <span 
                  className="text-sm"
                  style={{ color: `${colors?.footer_text || '#F9FAFB'}99` }}
                >
                  {footerConfig.opening_hours}
                </span>
              </div>
            )}
          </FooterColumn>

          {/* Localização */}
          <FooterColumn title={footerConfig?.col_title_location || 'Localização'} colors={colors} isMobile={isMobile}>
            {(footerConfig?.address || footerConfig?.city) && (
              <div className="flex items-start gap-2 py-0.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors?.primary || '#10B981' }} />
                <span 
                  className="text-sm"
                  style={{ color: `${colors?.footer_text || '#F9FAFB'}99` }}
                >
                  {[footerConfig.address, footerConfig.neighborhood, footerConfig.city]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            {footerConfig?.google_maps_link && (
              <FooterLink href={footerConfig.google_maps_link} colors={colors} external>
                {footerConfig?.google_maps_label || 'Ver no Google Maps →'}
              </FooterLink>
            )}
          </FooterColumn>
        </div>

        {/* Divider */}
        <div 
          className="border-t my-6"
          style={{ borderColor: `${colors?.footer_text || '#F9FAFB'}15` }}
        />

        {/* Social Media + Trust */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {footerConfig?.instagram && (
              <a 
                href={footerConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all shop-social-icon hover:scale-110"
                style={{ 
                  backgroundColor: `${colors?.footer_text || '#F9FAFB'}15`,
                  color: colors?.footer_text || '#F9FAFB'
                }}
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            )}
            {footerConfig?.facebook && (
              <a 
                href={footerConfig.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all shop-social-icon hover:scale-110"
                style={{ 
                  backgroundColor: `${colors?.footer_text || '#F9FAFB'}15`,
                  color: colors?.footer_text || '#F9FAFB'
                }}
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
            )}
            {footerConfig?.whatsapp && footerConfig?.show_whatsapp_in_footer !== false && (
              <a 
                href={`https://wa.me/${footerConfig.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all shop-social-icon hover:scale-110"
                style={{ 
                  backgroundColor: `${colors?.footer_text || '#F9FAFB'}15`,
                  color: colors?.footer_text || '#F9FAFB'
                }}
              >
                <WhatsAppIcon className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: colors?.success || '#22C55E' }} />
            <span 
              className="text-sm"
              style={{ color: `${colors?.footer_text || '#F9FAFB'}80` }}
            >
              {footerConfig?.trust_text || 'Loja física • Produtos revisados • Atendimento humano'}
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div 
          className="text-center mt-6 pt-6 border-t"
          style={{ borderColor: `${colors?.footer_text || '#F9FAFB'}10` }}
        >
          <p 
            className="text-xs flex items-center justify-center gap-1"
            style={{ color: `${colors?.footer_text || '#F9FAFB'}60` }}
          >
            {footerConfig?.copyright_text || `© ${new Date().getFullYear()} ${config?.store_name || 'Loja XLata'} — Todos os direitos reservados`}
          </p>
        </div>
      </div>
    </footer>
  );
}
