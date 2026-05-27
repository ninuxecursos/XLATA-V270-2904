import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { Store, Users, Shield, Heart, MapPin, Clock } from 'lucide-react';

export default function ShopAbout() {
  const { data: config } = useShopConfig();
  
  const pages = config?.institutional_pages;
  const aboutPage = pages?.about;
  const footerConfig = config?.footer_config;
  const primaryColor = config?.colors?.primary || '#10B981';

  // Valores padrão se não configurado
  const title = aboutPage?.title || 'Sobre Nós';
  const subtitle = aboutPage?.subtitle || 'Conheça nossa história e nossos valores';
  const content = aboutPage?.content || `
Somos uma empresa comprometida em oferecer os melhores produtos e serviços para nossos clientes.

Nossa missão é proporcionar uma experiência de compra única, com produtos de qualidade e atendimento excepcional.

Trabalhamos diariamente para superar as expectativas de nossos clientes, mantendo sempre o compromisso com a excelência e a satisfação.
  `.trim();
  
  const values = aboutPage?.values || [
    { icon: 'quality', title: 'Qualidade', description: 'Produtos selecionados com rigor' },
    { icon: 'trust', title: 'Confiança', description: 'Transparência em todas as negociações' },
    { icon: 'service', title: 'Atendimento', description: 'Suporte humanizado e eficiente' },
    { icon: 'commitment', title: 'Compromisso', description: 'Entrega garantida e pontual' },
  ];

  const getValueIcon = (iconName: string) => {
    switch (iconName) {
      case 'quality': return Shield;
      case 'trust': return Users;
      case 'service': return Heart;
      case 'commitment': return Store;
      default: return Store;
    }
  };

  return (
    <ShopLayout hideBottomNav>
      <Helmet>
        <title>{title} | {config?.store_name || 'Loja'}</title>
        <meta name="description" content={subtitle} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div 
          className="py-12 px-4"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {title}
            </h1>
            <p className="text-white/90 text-lg">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Sobre */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Store className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quem Somos</h2>
                <p className="text-sm text-gray-500">{config?.store_name}</p>
              </div>
            </div>
            
            <div className="prose prose-gray max-w-none">
              {content.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="text-gray-600 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>

          {/* Nossos Valores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nossos Valores</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, index) => {
                const Icon = getValueIcon(value.icon);
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{value.title}</h3>
                      <p className="text-sm text-gray-500">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Localização e Contato */}
          {(footerConfig?.address || footerConfig?.whatsapp) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Onde Estamos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {footerConfig?.address && (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                      <p className="text-sm text-gray-600">
                        {footerConfig.address}
                        {footerConfig.neighborhood && `, ${footerConfig.neighborhood}`}
                        {footerConfig.city && ` - ${footerConfig.city}`}
                      </p>
                    </div>
                  </div>
                )}

                {footerConfig?.opening_hours && (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Horário</h3>
                      <p className="text-sm text-gray-600">{footerConfig.opening_hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
