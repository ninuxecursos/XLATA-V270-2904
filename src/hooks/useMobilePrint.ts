
import { useState } from 'react';
import { isMobileDevice, isIOSDevice, isAndroidDevice } from '@/utils/mobileDetection';
import html2pdf from 'html2pdf.js';

interface MobilePrintOptions {
  title?: string;
  format?: '50mm' | '80mm';
  saveAsPdf?: boolean;
}

export const useMobilePrint = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  /**
   * Cria um iframe oculto com o conteúdo para impressão
   */
  const createPrintIframe = (content: string, title: string = 'Comprovante'): HTMLIFrameElement => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                size: auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Roboto', Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      iframeDoc.close();
    }
    
    return iframe;
  };

  /**
   * Imprime usando iframe em dispositivos móveis
   */
  const printWithIframe = async (content: string, options: MobilePrintOptions = {}) => {
    setIsProcessing(true);
    
    try {
      const iframe = createPrintIframe(content, options.title);
      
      // Aguarda o carregamento do iframe
      await new Promise((resolve) => {
        iframe.onload = resolve;
        setTimeout(resolve, 1000); // Fallback timeout
      });
      
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        // Focus no iframe antes de imprimir
        iframeWindow.focus();
        
        // Executa impressão no iframe
        iframeWindow.print();
        
        // Remove o iframe após impressão
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao imprimir com iframe:', error);
      // Fallback para window.print()
      window.print();
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Salva como PDF usando html2pdf.js
   */
  const saveAsPdf = async (content: string, filename: string = 'comprovante.pdf') => {
    setIsProcessing(true);
    
    try {
      // Cria um elemento temporário com o conteúdo
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '-9999px';
      document.body.appendChild(tempElement);
      
      // Configurações do PDF
      const options = {
        margin: [2, 2, 2, 2],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      // Gera e baixa o PDF
      await html2pdf().set(options).from(tempElement).save();
      
      // Remove elemento temporário
      document.body.removeChild(tempElement);
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      alert('Erro ao salvar PDF. Tente usar a opção de impressão do navegador.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Função principal de impressão que decide a estratégia baseada no dispositivo
   */
  const handlePrint = async (content: string, options: MobilePrintOptions = {}) => {
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      // Para mobile, sempre usa iframe isolado
      await printWithIframe(content, options);
    } else {
      // Comportamento padrão para desktop
      const printContent = `
        <style>
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Roboto', Arial, sans-serif; }
          * { -webkit-print-color-adjust: exact; color-adjust: exact; }
        </style>
        ${content}
      `;
      
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      
      try {
        window.print();
      } catch (error) {
        console.error('Erro ao imprimir:', error);
        alert('Erro ao imprimir. Tente novamente.');
      } finally {
        document.body.innerHTML = originalContent;
      }
    }
  };

  /**
   * Mostra instruções para impressão Bluetooth
   */
  const showBluetoothInstructions = () => {
    const isIOS = isIOSDevice();
    const isAndroid = isAndroidDevice();
    
    let instructions = 'Para imprimir em impressora Bluetooth:\n\n';
    
    if (isIOS) {
      instructions += '• Conecte sua impressora Bluetooth nas configurações do iOS\n';
      instructions += '• Use o botão "Imprimir" e selecione sua impressora\n';
      instructions += '• Para impressoras térmicas, ajuste o tamanho do papel';
    } else if (isAndroid) {
      instructions += '• Conecte sua impressora Bluetooth nas configurações do Android\n';
      instructions += '• Use o botão "Imprimir" e selecione sua impressora\n';
      instructions += '• Para impressoras térmicas GS-MTP5S, selecione papel 58mm';
    } else {
      instructions += '• Use a função "Imprimir" do seu navegador\n';
      instructions += '• Selecione sua impressora Bluetooth conectada';
    }
    
    alert(instructions);
  };

  return {
    isProcessing,
    showPrintOptions,
    setShowPrintOptions,
    handlePrint,
    printWithIframe,
    saveAsPdf,
    showBluetoothInstructions,
    isMobileDevice: isMobileDevice()
  };
};
