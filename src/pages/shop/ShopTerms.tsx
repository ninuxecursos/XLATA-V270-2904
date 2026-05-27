import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { FileText, Scale, ShoppingBag, CreditCard, Truck, AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

export default function ShopTerms() {
  const { data: config } = useShopConfig();
  
  const pages = config?.institutional_pages;
  const termsPage = pages?.terms;
  const primaryColor = config?.colors?.primary || '#10B981';

  // Valores padrão se não configurado
  const title = termsPage?.title || 'Termos de Uso';
  const subtitle = termsPage?.subtitle || 'Condições para uso da nossa loja';
  const lastUpdate = termsPage?.last_update || new Date().toLocaleDateString('pt-BR');

  const sections = termsPage?.sections || [
    {
      icon: 'acceptance',
      title: 'Aceitação dos Termos',
      content: `Ao acessar e utilizar nossa loja, você concorda com estes termos e condições.

Se você não concordar com qualquer parte destes termos, solicitamos que não utilize nossos serviços.

Reservamo-nos o direito de atualizar estes termos a qualquer momento, e as alterações entrarão em vigor imediatamente após a publicação.`
    },
    {
      icon: 'products',
      title: 'Produtos e Serviços',
      content: `• Os produtos exibidos estão sujeitos à disponibilidade de estoque
• Imagens são ilustrativas e podem ter pequenas variações
• Preços podem ser alterados sem aviso prévio
• Promoções têm prazo de validade determinado
• Reservamo-nos o direito de limitar quantidades por cliente
• Produtos interativos seguem regras específicas de cada oferta`
    },
    {
      icon: 'payments',
      title: 'Pagamentos',
      content: `Aceitamos as seguintes formas de pagamento:
• PIX (pagamento instantâneo)
• Cartão de crédito
• Cartão de débito

O pagamento deve ser confirmado para que o pedido seja processado. Em caso de pagamento não aprovado, o pedido será automaticamente cancelado.`
    },
    {
      icon: 'delivery',
      title: 'Entregas e Retiradas',
      content: `• Prazos de entrega variam conforme a região
• O cliente é responsável por fornecer endereço correto
• Tentativas de entrega serão realizadas conforme contratado
• Retiradas na loja devem ser agendadas
• Atrasos por força maior não geram direito a ressarcimento`
    },
    {
      icon: 'warranty',
      title: 'Trocas e Devoluções',
      content: `Conforme o Código de Defesa do Consumidor:
• Direito de arrependimento em até 7 dias para compras online
• Produtos com defeito podem ser trocados em até 30 dias
• O produto deve estar em sua embalagem original
• Itens personalizados ou sob encomenda não são elegíveis
• Custos de envio para troca podem ser cobrados`
    },
    {
      icon: 'responsibility',
      title: 'Limitação de Responsabilidade',
      content: `Não nos responsabilizamos por:
• Uso indevido dos produtos adquiridos
• Danos causados por mau uso ou negligência
• Informações incorretas fornecidas pelo cliente
• Indisponibilidade temporária do sistema
• Ações de terceiros que afetem o serviço`
    },
    {
      icon: 'account',
      title: 'Conta do Usuário',
      content: `• Você é responsável por manter suas credenciais em sigilo
• Atividades realizadas em sua conta são de sua responsabilidade
• Notifique-nos imediatamente em caso de uso não autorizado
• Reservamo-nos o direito de suspender contas suspeitas
• Contas inativas por mais de 12 meses podem ser desativadas`
    },
    {
      icon: 'contact',
      title: 'Contato e Suporte',
      content: `Para dúvidas sobre estes termos ou sobre nossos serviços:
• WhatsApp: ${config?.footer_config?.whatsapp || 'Disponível no site'}
• E-mail: ${config?.footer_config?.email || 'Disponível no site'}
• Horário de atendimento: ${config?.footer_config?.opening_hours || 'Consulte o site'}

Respondemos em até 48 horas úteis.`
    },
  ];

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'acceptance': return Scale;
      case 'products': return ShoppingBag;
      case 'payments': return CreditCard;
      case 'delivery': return Truck;
      case 'warranty': return RefreshCw;
      case 'responsibility': return AlertTriangle;
      case 'account': return FileText;
      case 'contact': return MessageCircle;
      default: return FileText;
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

          {/* Foro e Lei */}
          <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Scale className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">Legislação Aplicável</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Estes termos são regidos pelas leis brasileiras, especialmente o Código de Defesa do Consumidor (Lei nº 8.078/90) 
              e o Marco Civil da Internet (Lei nº 12.965/14). Qualquer disputa será resolvida no foro da comarca onde o consumidor residir.
            </p>
          </div>

          {/* Nota Final */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} {config?.store_name || 'Loja'} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
