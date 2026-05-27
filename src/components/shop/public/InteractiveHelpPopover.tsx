import { HelpCircle, Search, MousePointerClick, Activity, Trophy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WhatsAppButton } from './WhatsAppButton';

interface InteractiveHelpPopoverProps {
  productName?: string;
}

const steps = [
  {
    icon: Search,
    title: 'Escolha o Produto',
    description: 'Navegue pela loja e encontre produtos com a tag "Oferta Interativa"'
  },
  {
    icon: MousePointerClick,
    title: 'Faça Sua Oferta',
    description: 'Digite um valor igual ou maior que o mínimo exigido e clique em Ofertar'
  },
  {
    icon: Activity,
    title: 'Acompanhe em Tempo Real',
    description: 'Veja as ofertas de outros clientes e aumente sua oferta se desejar'
  },
  {
    icon: Trophy,
    title: 'Ganhe a Disputa',
    description: 'Quando o tempo acabar, a maior oferta vence e o pedido é criado automaticamente!'
  }
];

export function InteractiveHelpPopover({ productName }: InteractiveHelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Como Funciona?</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 shadow-xl border-purple-100 bg-white" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-t-md">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Como Funciona?
          </h3>
          <p className="text-purple-100 text-sm mt-1">
            Passo a passo da Oferta Interativa
          </p>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <step.icon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">
                  {index + 1}. {step.title}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="p-4 pt-0">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-gray-600 text-xs text-center mb-2 flex items-center justify-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              Dúvidas? Fale conosco!
            </p>
            <WhatsAppButton 
              productName={productName} 
              variant="full"
              className="h-10 text-sm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
