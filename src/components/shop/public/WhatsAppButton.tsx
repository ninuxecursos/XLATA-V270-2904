import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  productName?: string;
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  label?: string;
}

export function WhatsAppButton({ 
  phoneNumber = '551963512105',
  message,
  productName,
  variant = 'full',
  className,
  label
}: WhatsAppButtonProps) {
  const defaultMessage = productName 
    ? `Olá! Tenho interesse no produto: ${productName}. Gostaria de mais informações.`
    : 'Olá! Gostaria de mais informações sobre um produto.';
  
  const finalMessage = message || defaultMessage;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleClick}
        size="icon"
        className={cn(
          "bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg",
          className
        )}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleClick}
        size="sm"
        className={cn(
          "bg-green-500 hover:bg-green-600 text-white gap-1.5",
          className
        )}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "bg-transparent hover:bg-green-50 border-2 border-green-500 text-green-600 w-full gap-2 h-12 text-base font-medium",
        className
      )}
    >
      <MessageCircle className="w-5 h-5" />
      {label || 'Tirar Dúvidas no WhatsApp'}
    </Button>
  );
}
