import { Helmet } from 'react-helmet-async';
import { ShopLayout } from '@/components/shop/public/ShopLayout';
import { useShopConfig } from '@/hooks/useShopConfig';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ShopFAQ() {
  const { data: config } = useShopConfig();
  
  const pages = config?.institutional_pages;
  const faqPage = pages?.faq;
  const primaryColor = config?.colors?.primary || '#10B981';

  // Valores padrão se não configurado
  const title = faqPage?.title || 'Perguntas Frequentes';
  const subtitle = faqPage?.subtitle || 'Tire suas dúvidas sobre nossos produtos e serviços';

  const questions = faqPage?.questions || [
    {
      question: 'Como faço para comprar?',
      answer: 'Para comprar, basta navegar pelos produtos, adicionar ao carrinho e finalizar o pedido. Você pode pagar via PIX, cartão de crédito ou débito. Após a confirmação do pagamento, seu pedido será preparado e enviado.'
    },
    {
      question: 'Quais formas de pagamento são aceitas?',
      answer: 'Aceitamos PIX (pagamento instantâneo com desconto especial), cartão de crédito (parcelamos em até 12x) e cartão de débito. Todas as transações são processadas de forma segura.'
    },
    {
      question: 'Qual o prazo de entrega?',
      answer: 'O prazo de entrega varia conforme sua região. Após a confirmação do pagamento, o pedido é preparado em até 24 horas úteis. O prazo de transporte é calculado no momento da compra, baseado no seu CEP.'
    },
    {
      question: 'Posso retirar meu pedido na loja?',
      answer: 'Sim! Oferecemos a opção de retirada na loja. Basta selecionar esta opção no checkout. Você será notificado por WhatsApp quando seu pedido estiver pronto para retirada.'
    },
    {
      question: 'Como funciona a troca ou devolução?',
      answer: 'Você tem até 7 dias após o recebimento para solicitar troca ou devolução (direito de arrependimento). Para produtos com defeito, o prazo é de 30 dias. Entre em contato pelo WhatsApp para iniciar o processo.'
    },
    {
      question: 'Os produtos têm garantia?',
      answer: 'Nossos produtos são usados e não possuem garantia tradicional. O que garantimos é que o produto é exatamente o que está sendo anunciado - você compra totalmente ciente do estado, com todas as informações claras e detalhadas na descrição de cada item.'
    },
    {
      question: 'Como acompanho meu pedido?',
      answer: 'Você pode acompanhar seu pedido pela sua conta no site ou pelo WhatsApp. Enviamos atualizações automáticas sobre cada etapa: confirmação, preparação, envio e entrega.'
    },
    {
      question: 'Como funciona a oferta interativa?',
      answer: 'Nas ofertas interativas, você pode fazer propostas de valor em produtos selecionados. O sistema funciona em tempo real, e você pode acompanhar as ofertas de outros participantes. O produto vai para quem fizer a melhor oferta dentro do prazo.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim! Utilizamos criptografia de ponta a ponta para proteger seus dados. Seguimos todas as diretrizes da LGPD (Lei Geral de Proteção de Dados) e não compartilhamos suas informações com terceiros.'
    },
    {
      question: 'Como entro em contato com vocês?',
      answer: 'Você pode entrar em contato pelo WhatsApp (disponível no rodapé do site), por e-mail ou visitando nossa loja física. Nosso horário de atendimento está disponível na página inicial.'
    },
  ];

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
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="w-8 h-8 text-white" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              {subtitle}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Accordion type="single" collapsible className="space-y-3">
            {questions.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <span 
                        className="text-sm font-bold"
                        style={{ color: primaryColor }}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="pl-11">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contato */}
          <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">Não encontrou sua resposta?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Nossa equipe está pronta para esclarecer qualquer dúvida. Entre em contato pelo WhatsApp e responderemos o mais rápido possível.
            </p>
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
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
