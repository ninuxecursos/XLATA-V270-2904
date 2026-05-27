
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface LogoProcessorProps {
  logo: string | null;
  onLogoProcessed: (processedLogo: string) => void;
}

const LogoProcessor: React.FC<LogoProcessorProps> = ({ logo, onLogoProcessed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processLogoToMonochrome = () => {
    if (!logo || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to monochrome (black and transparent)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // If pixel is not transparent and has significant color, make it black
        if (alpha > 50 && luminance < 240) {
          data[i] = 0;     // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
          data[i + 3] = 255; // A (fully opaque)
        } else {
          // Make transparent pixels or very light pixels fully transparent
          data[i + 3] = 0;
        }
      }

      // Put the modified data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to data URL
      const processedLogo = canvas.toDataURL('image/png');
      onLogoProcessed(processedLogo);
      
      toast({
        title: "Logo processado",
        description: "O logotipo foi convertido para monocromático com sucesso!",
      });
      
      setIsProcessing(false);
    };

    img.onerror = () => {
      toast({
        title: "Erro",
        description: "Não foi possível processar o logotipo.",
        variant: "destructive"
      });
      setIsProcessing(false);
    };

    img.src = logo;
  };

  if (!logo) return null;

  return (
    <div className="mt-4">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Button 
        onClick={processLogoToMonochrome}
        disabled={isProcessing}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isProcessing ? "Processando..." : "Gerar Comprovante"}
      </Button>
      <p className="text-xs text-gray-400 mt-1">
        Converte o logotipo para preto monocromático para impressão térmica
      </p>
    </div>
  );
};

export default LogoProcessor;
