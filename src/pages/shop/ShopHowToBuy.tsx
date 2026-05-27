import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { ShoppingCart, CreditCard, Truck, CheckCircle, Search, UserCheck, Package, HelpCircle } from 'lucide-react';

export default function ShopHowToBuy() {
  const { data: config } = useShopConfig();
  
  const pages = config?.institutional_pages;
  const howToBuyPage = pages?.how_to_buy;
  const primaryColor = config?.colors?.primary || '#10B981';

  // Valores padrão se não configurado
  const title = howToBuyPage?.title || 'Como Comprar';
  const subtitle = howToBuyPage?.subtitle || 'Guia rápido para sua primeira compra';

  const steps = howToBuyPage?.steps || [
    {
      icon: 'search',
      title: 'Encontre seu Produto',
      description: 'Navegue pelas categorias ou use a barra de busca para encontrar o que você precisa. Você pode filtrar por categoria e ordenar por preço.'
    },
    {
      icon: 'cart',
      title: 'Adicione ao Carrinho',
      description: 'Escolha a quantidade desejada e clique em "Adicionar ao Carrinho". Você pode continuar comprando ou ir para o checkout.'
    },
    {
      icon: 'user',
      title: 'Faça Login ou Cadastre-se',
      description: 'Para finalizar sua compra, você precisa ter uma conta. O cadastro é rápido e seguro, usando apenas seu e-mail e WhatsApp.'
    },
    {
      icon: 'payment',
      title: 'Escolha a Forma de Pagamento',
      description: 'Oferecemos várias opções de pagamento: PIX (pagamento instantâneo), cartão de crédito ou débito. Escolha a que for mais conveniente.'
    },
    {
      icon: 'delivery',
      title: 'Receba seu Pedido',
      description: 'Após a confirmação do pagamento, seu pedido será preparado e enviado. Você pode acompanhar o status pelo WhatsApp ou na sua conta.'
    },
    {
      icon: 'done',
      title: 'Pronto!',
      description: 'Receba seu produto em casa ou retire na loja. Qualquer dúvida, nosso atendimento está disponível para ajudar.'
    },
  ];

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'search': return Search;
      case 'cart': return ShoppingCart;
      case 'user': return UserCheck;
      case 'payment': return CreditCard;
      case 'delivery': return Truck;
      case 'done': return CheckCircle;
      case 'package': return Package;
      default: return HelpCircle;
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

        {/* Steps Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.icon);
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden"
                >
                  {/* Step Number */}
                  <div 
                    className="absolute top-0 right-0 w-16 h-16 flex items-center justify-center text-3xl font-bold opacity-10"
                    style={{ color: primaryColor }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          Passo {index + 1}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h2>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dúvidas */}
          <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">Ficou com alguma dúvida?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Nossa equipe está pronta para ajudar! Entre em contato pelo WhatsApp ou consulte nossa seção de Perguntas Frequentes.
            </p>
            <div className="flex flex-wrap gap-3">
              {config?.footer_config?.whatsapp && (
                <a
                  href={`https://wa.me/${config.footer_config.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Falar pelo WhatsApp
                </a>
              )}
              <a
                href="/shop/faq"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Ver Perguntas Frequentes
              </a>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
