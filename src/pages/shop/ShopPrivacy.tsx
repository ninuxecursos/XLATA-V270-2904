import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { Shield, Eye, Lock, Database, UserCheck, Mail } from 'lucide-react';

export default function ShopPrivacy() {
  const { data: config } = useShopConfig();
  
  const pages = config?.institutional_pages;
  const privacyPage = pages?.privacy;
  const primaryColor = config?.colors?.primary || '#10B981';

  // Valores padrão se não configurado
  const title = privacyPage?.title || 'Política de Privacidade';
  const subtitle = privacyPage?.subtitle || 'Como protegemos seus dados';
  const lastUpdate = privacyPage?.last_update || new Date().toLocaleDateString('pt-BR');

  const sections = privacyPage?.sections || [
    {
      icon: 'collect',
      title: 'Coleta de Informações',
      content: `Coletamos informações que você nos fornece diretamente, como:
• Nome completo e dados de contato
• Endereço de e-mail e telefone
• Endereço para entrega
• Informações de pagamento (processadas de forma segura)

Também coletamos automaticamente:
• Endereço IP e dados de navegação
• Tipo de dispositivo e navegador
• Páginas visitadas e tempo de permanência`
    },
    {
      icon: 'usage',
      title: 'Uso das Informações',
      content: `Utilizamos suas informações para:
• Processar pedidos e entregas
• Enviar atualizações sobre seus pedidos
• Melhorar nossos produtos e serviços
• Personalizar sua experiência de compra
• Comunicar promoções e novidades (com seu consentimento)
• Cumprir obrigações legais`
    },
    {
      icon: 'protection',
      title: 'Proteção dos Dados',
      content: `Implementamos medidas de segurança robustas:
• Criptografia de dados sensíveis
• Servidores protegidos por firewall
• Acesso restrito a informações pessoais
• Monitoramento contínuo de segurança
• Backups regulares e seguros`
    },
    {
      icon: 'sharing',
      title: 'Compartilhamento de Dados',
      content: `Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
• Parceiros de entrega para envio de produtos
• Processadores de pagamento autorizados
• Autoridades quando exigido por lei
• Prestadores de serviços essenciais (sob acordo de confidencialidade)`
    },
    {
      icon: 'rights',
      title: 'Seus Direitos',
      content: `Você tem direito a:
• Acessar seus dados pessoais
• Corrigir informações incorretas
• Solicitar exclusão de seus dados
• Revogar consentimentos dados
• Portabilidade de dados
• Fazer reclamações à autoridade competente`
    },
    {
      icon: 'contact',
      title: 'Contato',
      content: `Para questões sobre privacidade, entre em contato:
• Através do WhatsApp da loja
• Por e-mail: ${config?.footer_config?.email || 'contato@loja.com'}

Respondemos solicitações em até 15 dias úteis.`
    },
  ];

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'collect': return Database;
      case 'usage': return Eye;
      case 'protection': return Lock;
      case 'sharing': return UserCheck;
      case 'rights': return Shield;
      case 'contact': return Mail;
      default: return Shield;
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
            <p className="text-white/70 text-sm mt-2">
              Última atualização: {lastUpdate}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = getSectionIcon(section.icon);
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                  </div>
                  
                  <div className="prose prose-sm prose-gray max-w-none">
                    {section.content.split('\n').map((line, lineIndex) => (
                      line.trim() && (
                        <p key={lineIndex} className="text-gray-600 leading-relaxed mb-2 whitespace-pre-wrap">
                          {line}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conformidade LGPD */}
          <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">Conformidade LGPD</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              Garantimos transparência no tratamento dos seus dados pessoais e respeitamos todos os seus direitos como titular.
            </p>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
