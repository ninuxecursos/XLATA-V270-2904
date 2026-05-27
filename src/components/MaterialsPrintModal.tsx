import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptFormatSettings, ReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { useMobilePrint } from '@/hooks/useMobilePrint';
import MobilePrintOptions from './MobilePrintOptions';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Material {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  unit: string;
  previousPrice?: number | null;
  previousSalePrice?: number | null;
}

interface SystemSettings {
  logo: string | null;
  whatsapp1: string | null;
  whatsapp2: string | null;
  address: string | null;
  company: string | null;
}

interface MaterialsPrintModalProps {
  onPrintComplete: () => void;
  isSaleMode: boolean;
}

export function MaterialsPrintModal({ onPrintComplete, isSaleMode }: MaterialsPrintModalProps) {
  const { user } = useAuth();
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  const { handlePrint, showPrintOptions, setShowPrintOptions, isMobileDevice } = useMobilePrint();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [printContent, setPrintContent] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Carregar materiais
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('id, name, price, sale_price, unit, previous_price, previous_sale_price')
          .eq('user_id', user.id)
          .order('name');

        if (materialsError) {
          console.error('Erro ao carregar materiais:', materialsError);
        } else {
          setMaterials(materialsData?.map(m => ({
            id: m.id,
            name: m.name,
            price: m.price || 0,
            salePrice: m.sale_price || 0,
            unit: m.unit,
            previousPrice: m.previous_price != null ? Number(m.previous_price) : null,
            previousSalePrice: m.previous_sale_price != null ? Number(m.previous_sale_price) : null
          })) || []);
        }

        // Carregar configurações do sistema
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('logo, whatsapp1, whatsapp2, address, company')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          console.error('Erro ao carregar configurações:', settingsError);
        } else {
          setSystemSettings(settingsData);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (!loading && materials.length >= 0) {
      // Aguardar um pequeno delay para garantir que os dados estejam carregados
      setTimeout(() => {
        handlePrintProcess();
      }, 100);
    }
  }, [loading, materials, systemSettings]);

  const handlePrintProcess = async () => {
    const currentFormat = getCurrentFormat();
    const formatSettings = getCurrentFormatSettings();
    
    const content = generatePrintContent(formatSettings, currentFormat);
    setPrintContent(content);

    if (isMobileDevice) {
      await handlePrint(content, { title: 'Tabela de Preços', format: currentFormat });
    } else {
      // Comportamento para desktop
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(content);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        
        // Aguardar um pouco e então fechar automaticamente
        setTimeout(() => {
          printWindow.close();
          onPrintComplete();
        }, 1000);
        
        // Também adicionar listener para quando a impressão terminar
        printWindow.onafterprint = () => {
          setTimeout(() => {
            printWindow.close();
            onPrintComplete();
          }, 500);
        };
      };
    }
  };

  // Helper function for price variation indicator
  const getPriceIndicator = (currentPrice: number, previousPrice: number | null | undefined): { symbol: string; color: string } => {
    if (previousPrice === null || previousPrice === undefined) return { symbol: '', color: '' };
    if (currentPrice > previousPrice) return { symbol: ' ▲', color: '#dc2626' }; // Red for increase
    if (currentPrice < previousPrice) return { symbol: ' ▼', color: '#16a34a' }; // Green for decrease
    return { symbol: '', color: '' }; // No change
  };

  const generatePrintContent = (settings: ReceiptFormatSettings, format: '50mm' | '80mm') => {
    const now = new Date();
    const currentDate = formatDate(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Tabela de Preços - ${isSaleMode ? 'Venda' : 'Compra'}</title>
          <style>
            @page {
              size: ${format === '50mm' ? '50mm' : '80mm'} auto;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            body {
              width: ${settings.container_width};
              max-width: ${settings.container_width};
              margin: 0;
              padding: ${settings.padding};
              font-family: 'Roboto', Arial, sans-serif;
              font-size: 12px;
              line-height: 1.3;
              color: #000 !important;
              background: #fff !important;
            }
            
            .header-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: ${settings.margins};
            }
            
            .logo-container {
              width: 30%;
              flex: 0 0 30%;
              margin: 0;
              padding: 0;
            }
            
            .logo {
              max-width: ${settings.logo_max_width};
              max-height: ${settings.logo_max_height};
              margin: 0;
              padding: 0;
              filter: contrast(200%) brightness(0);
              -webkit-filter: contrast(200%) brightness(0);
            }
            
            .info-container {
              width: 70%;
              flex: 0 0 70%;
              text-align: center;
            }
            
            .phone-numbers {
              font-size: ${settings.phone_font_size};
              font-weight: bold;
            }
            
            .address {
              font-size: ${settings.address_font_size};
              margin-top: 3mm;
              font-weight: bold;
              text-align: center;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            .document-title {
              text-align: center;
              font-weight: bold;
              font-size: ${settings.title_font_size};
              margin-bottom: 1.05mm;
            }
            
            .datetime {
              text-align: center;
              margin-bottom: 3.6mm;
              font-size: ${settings.customer_font_size};
              font-weight: bold;
            }
            
            .separator {
              border-bottom: 2px solid #000;
              margin: ${settings.margins};
            }
            
            .materials-table {
              width: 100%;
              border-collapse: collapse;
              font-size: ${settings.table_font_size};
              margin-bottom: 3mm;
              font-weight: bold;
            }
            
            .materials-table th {
              text-align: left;
              border-bottom: 1px solid #000;
              padding: 2mm 0;
              font-weight: bold;
            }
            
            .materials-table th.price-col {
              text-align: right;
            }
            
            .materials-table td {
              padding: 0.7mm 0;
              vertical-align: top;
              font-weight: bold;
              word-wrap: break-word;
              line-height: 0.9;
            }
            
            .materials-table td.price-col {
              text-align: right;
            }
            
            .total-materials {
              font-size: ${settings.totals_font_size};
              font-weight: bold;
              text-align: center;
              margin-top: 4mm;
              padding-top: 4mm;
              border-top: 2px solid #000;
            }
            
            .footer {
              margin-top: 4mm;
              text-align: center;
              font-size: ${settings.quote_font_size};
              font-weight: bold;
              font-style: italic;
            }
            
            @media print {
              body { 
                width: ${settings.container_width};
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header com logo 30% à esquerda e WhatsApp/Endereço 70% à direita -->
          <div class="header-flex">
            ${systemSettings?.logo ? `
              <div class="logo-container">
                <img src="${systemSettings.logo}" alt="Logo" class="logo" />
              </div>
            ` : `<div class="logo-container"></div>`}
            
            <div class="info-container">
              <div class="phone-numbers">
                ${systemSettings?.whatsapp1 ? `<div style="word-wrap: break-word;">${systemSettings.whatsapp1}</div>` : ""}
                ${systemSettings?.whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${systemSettings.whatsapp2}</div>` : ""}
              </div>
              ${systemSettings?.address ? `
                <div class="address">
                  ${systemSettings.address}
                </div>
              ` : ""}
            </div>
          </div>
          
          <div class="document-title">TABELA DE PREÇOS - ${isSaleMode ? 'VENDA' : 'COMPRA'}</div>
          
          <div class="datetime">${currentDate}</div>
          
          <div class="separator"></div>
          
          <table class="materials-table">
            <thead>
              <tr>
                <th>Material</th>
                <th class="price-col">Preço/Kg</th>
              </tr>
            </thead>
            <tbody>
              ${materials.map(material => {
                const displayPrice = isSaleMode ? material.salePrice : material.price;
                const previousPrice = isSaleMode ? material.previousSalePrice : material.previousPrice;
                const indicator = getPriceIndicator(displayPrice, previousPrice);
                return `
                <tr>
                  <td>${material.name}</td>
                  <td class="price-col">
                    R$ ${displayPrice.toFixed(2)}/kg${indicator.symbol ? `<span style="color: ${indicator.color}; font-weight: bold;">${indicator.symbol}</span>` : ''}
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total-materials">
            Total de materiais: ${materials.length}
          </div>
          
          <div class="footer">
            Documento gerado automaticamente<br>
            Sistema XLata.site - ${currentDate}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <>
      {/* Modal de opções para dispositivos móveis */}
      <MobilePrintOptions
        open={showPrintOptions}
        onClose={() => {
          setShowPrintOptions(false);
          onPrintComplete();
        }}
        content={printContent}
        filename="tabela-precos.pdf"
        title="Tabela de Preços"
      />
    </>
  );
}