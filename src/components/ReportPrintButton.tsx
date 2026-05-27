import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { supabase } from '@/integrations/supabase/client';
import { useMobilePrint } from '@/hooks/useMobilePrint';
import MobilePrintOptions from '@/components/MobilePrintOptions';

export interface ReportMetric {
  label: string;
  value: string | number;
  color?: string;
}

export interface ReportPrintButtonProps {
  reportTitle: string;
  period: { start: Date; end: Date } | { label: string };
  metrics: ReportMetric[];
  detailItems?: Array<{ label: string; value: string | number }>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ReportPrintButton({
  reportTitle,
  period,
  metrics,
  detailItems,
  className = '',
  variant = 'outline',
  size = 'sm'
}: ReportPrintButtonProps) {
  const { user } = useAuth();
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  const { handlePrint, showPrintOptions, setShowPrintOptions, isProcessing } = useMobilePrint();
  const [printContent, setPrintContent] = useState('');

  const formatPeriodLabel = () => {
    if ('label' in period) {
      return period.label;
    }
    const startStr = period.start.toLocaleDateString('pt-BR');
    const endStr = period.end.toLocaleDateString('pt-BR');
    return `${startStr} a ${endStr}`;
  };

  const generatePrintContent = async () => {
    const formatSettings = getCurrentFormatSettings();
    const format = getCurrentFormat();

    // Carregar configurações do sistema
    let logo = '';
    let company = '';
    let address = '';
    let whatsapp1 = '';

    if (user?.id) {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('logo, company, address, whatsapp1')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          logo = data.logo || '';
          company = data.company || '';
          address = data.address || '';
          whatsapp1 = data.whatsapp1 || '';
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }

    const now = new Date();
    const generatedAt = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const content = `
      <div style="width: ${formatSettings.container_width}; max-width: ${formatSettings.container_width}; margin: 0; padding: ${formatSettings.padding}; font-family: Arial, sans-serif; font-size: ${formatSettings.table_font_size}; color: #000; background: #fff;">
        ${logo ? `<div style="text-align: center; margin-bottom: 10px;"><img src="${logo}" alt="Logo" style="max-width: ${formatSettings.logo_max_width}; max-height: ${formatSettings.logo_max_height}; filter: grayscale(100%) contrast(1.2);" /></div>` : ''}
        
        ${company ? `<div style="text-align: center; font-weight: bold; font-size: ${formatSettings.phone_font_size}; margin-bottom: 5px; color: #000;">${company}</div>` : ''}
        
        <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 5px; margin-top: 10px; color: #000;">
          ${reportTitle}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin-bottom: 10px; color: #000;">
          Período: ${formatPeriodLabel()}
        </div>
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: ${formatSettings.table_font_size}; color: #000;">
          ${metrics.map(m => `
            <tr>
              <td style="padding: 3px 0; color: #000;">${m.label}:</td>
              <td style="text-align: right; font-weight: bold; padding: 3px 0; color: #000;">${m.value}</td>
            </tr>
          `).join('')}
        </table>
        
        ${detailItems && detailItems.length > 0 ? `
          <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
          <div style="font-size: ${formatSettings.table_font_size}; font-weight: bold; margin-bottom: 5px; color: #000;">Detalhes:</div>
          <table style="width: 100%; border-collapse: collapse; font-size: ${formatSettings.table_font_size}; color: #000;">
            ${detailItems.map(item => `
              <tr>
                <td style="padding: 2px 0; color: #000;">${item.label}:</td>
                <td style="text-align: right; padding: 2px 0; color: #000;">${item.value}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>
        
        <div style="text-align: center; font-size: ${formatSettings.quote_font_size}; color: #000; margin-top: 10px;">
          Gerado em ${generatedAt}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.address_font_size}; margin-top: 5px; color: #000;">
          Sistema XLata.site
        </div>
        
        ${address ? `<div style="text-align: center; font-size: ${formatSettings.address_font_size}; color: #000; margin-top: 3px;">${address}</div>` : ''}
        ${whatsapp1 ? `<div style="text-align: center; font-size: ${formatSettings.address_font_size}; color: #000; margin-top: 2px;">WhatsApp: ${whatsapp1}</div>` : ''}
      </div>
    `;

    return content;
  };

  const handlePrintClick = async () => {
    const content = await generatePrintContent();
    setPrintContent(content);
    
    const format = getCurrentFormat();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      handlePrint(content, { title: reportTitle, format });
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${reportTitle}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @page { margin: 0; padding: 0; size: auto; }
                html, body { margin: 0 !important; padding: 0 !important; }
                @media print {
                  html, body { margin: 0 !important; padding: 0 !important; min-height: auto !important; height: auto !important; }
                }
              </style>
            </head>
            <body onload="window.print(); setTimeout(() => window.close(), 1000);">
              ${content}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <>
      <Button
        onClick={handlePrintClick}
        variant={variant}
        size={size}
        className={`bg-slate-700 border-slate-600 text-white hover:bg-slate-600 ${className}`}
        disabled={isProcessing}
      >
        <Printer className={`h-4 w-4 ${size !== 'icon' ? 'mr-1' : ''}`} />
        {size !== 'icon' && <span className="hidden sm:inline text-xs">Imprimir</span>}
      </Button>
      
      <MobilePrintOptions
        open={showPrintOptions}
        onClose={() => setShowPrintOptions(false)}
        content={printContent}
        filename={`${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`}
        title={reportTitle}
      />
    </>
  );
}

export default ReportPrintButton;
