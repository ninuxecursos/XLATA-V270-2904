import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReceiptFormatSettings {
  format: '50mm' | '80mm';
  container_width: string;
  padding: string;
  margins: string;
  logo_max_width: string;
  logo_max_height: string;
  phone_font_size: string;
  address_font_size: string;
  title_font_size: string;
  customer_font_size: string;
  table_font_size: string;
  totals_font_size: string;
  final_total_font_size: string;
  datetime_font_size: string;
  quote_font_size: string;
}

interface CompanySettings {
  company: string;
  address: string;
  whatsapp1: string;
  whatsapp2: string;
  logo: string | null;
}

interface ReceiptPreviewProps {
  settings: ReceiptFormatSettings;
  format: '50mm' | '80mm';
  companySettings: CompanySettings;
  onTestPrint?: () => void;
}

// Dados de exemplo para visualização
const sampleData = {
  customerName: 'Cliente Exemplo',
  items: [
    { materialName: 'Ferro/Aço', quantity: 25.5, tara: 2.0, price: 1.50, total: 35.25 },
    { materialName: 'Alumínio Mole', quantity: 10.0, tara: 0.5, price: 8.00, total: 76.00 },
    { materialName: 'Cobre Vermelho', quantity: 5.0, tara: 0.2, price: 45.00, total: 216.00 },
  ],
  total: 327.25,
  timestamp: new Date().toISOString(),
  quote: 'Obrigado pela preferência!'
};

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  settings,
  format,
  companySettings,
  onTestPrint
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleTestPrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste de Impressão - ${format}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page {
              size: ${format === '50mm' ? '50mm' : '80mm'} auto;
              margin: 0;
              padding: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
            @media print {
              html, body {
                min-height: auto !important;
                height: auto !important;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              background: white;
              color: black;
            }
            .receipt-container {
              width: ${settings.container_width};
              padding: ${settings.padding};
              margin: ${settings.margins};
              background: white;
            }
            .receipt-logo {
              max-width: ${settings.logo_max_width};
              max-height: ${settings.logo_max_height};
              display: block;
              margin: 0 auto 4px;
            }
            .receipt-phone {
              font-size: ${settings.phone_font_size};
              font-weight: bold;
              text-align: center;
            }
            .receipt-address {
              font-size: ${settings.address_font_size};
              text-align: center;
            }
            .receipt-title {
              font-size: ${settings.title_font_size};
              font-weight: bold;
              text-align: center;
              margin: 8px 0;
              padding: 4px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            .receipt-customer {
              font-size: ${settings.customer_font_size};
              margin-bottom: 8px;
            }
            .receipt-table {
              width: 100%;
              font-size: ${settings.table_font_size};
              border-collapse: collapse;
            }
            .receipt-table th,
            .receipt-table td {
              padding: 2px;
              text-align: left;
            }
            .receipt-table th:last-child,
            .receipt-table td:last-child {
              text-align: right;
            }
            .receipt-totals {
              font-size: ${settings.totals_font_size};
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px dashed #000;
            }
            .receipt-final-total {
              font-size: ${settings.final_total_font_size};
              font-weight: bold;
              margin-top: 4px;
            }
            .receipt-datetime {
              font-size: ${settings.datetime_font_size};
              text-align: center;
              margin-top: 8px;
            }
            .receipt-quote {
              font-size: ${settings.quote_font_size};
              text-align: center;
              font-style: italic;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px dashed #000;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    onTestPrint?.();
  };

  const containerStyle: React.CSSProperties = {
    width: settings.container_width,
    padding: settings.padding,
    margin: settings.margins,
    background: 'white',
    color: 'black',
    fontFamily: "'Courier New', monospace",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground text-center font-medium">
        Preview {format} — Visualização em escala real
      </div>
      
      {/* Preview Container */}
      <div className="bg-white border border-border rounded-lg p-3 mx-auto overflow-auto max-h-[400px] shadow-inner">
        <div ref={printRef} style={containerStyle} className="receipt-container">
          {/* Logo */}
          {companySettings.logo && (
            <img 
              src={companySettings.logo} 
              alt="Logo" 
              className="receipt-logo"
              style={{ 
                maxWidth: settings.logo_max_width, 
                maxHeight: settings.logo_max_height,
                display: 'block',
                margin: '0 auto 4px'
              }}
            />
          )}
          
          {/* Company Info */}
          <div className="receipt-phone" style={{ fontSize: settings.phone_font_size, fontWeight: 'bold', textAlign: 'center' }}>
            {companySettings.whatsapp1 || '(00) 00000-0000'}
          </div>
          {companySettings.whatsapp2 && (
            <div className="receipt-phone" style={{ fontSize: settings.phone_font_size, fontWeight: 'bold', textAlign: 'center' }}>
              {companySettings.whatsapp2}
            </div>
          )}
          <div className="receipt-address" style={{ fontSize: settings.address_font_size, textAlign: 'center' }}>
            {companySettings.address || 'Endereço da empresa'}
          </div>
          
          {/* Title */}
          <div 
            className="receipt-title" 
            style={{ 
              fontSize: settings.title_font_size, 
              fontWeight: 'bold', 
              textAlign: 'center',
              margin: '8px 0',
              padding: '4px 0',
              borderTop: '1px dashed #000',
              borderBottom: '1px dashed #000'
            }}
          >
            COMPROVANTE DE COMPRA
          </div>
          
          {/* Customer */}
          <div className="receipt-customer" style={{ fontSize: settings.customer_font_size, marginBottom: '8px' }}>
            <strong>Cliente:</strong> {sampleData.customerName}
          </div>
          
          {/* Items Table */}
          <table className="receipt-table" style={{ width: '100%', fontSize: settings.table_font_size, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ padding: '2px', textAlign: 'left' }}>Material</th>
                <th style={{ padding: '2px', textAlign: 'right' }}>Peso</th>
                <th style={{ padding: '2px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '2px', textAlign: 'left' }}>{item.materialName}</td>
                  <td style={{ padding: '2px', textAlign: 'right' }}>{item.quantity.toFixed(2)}kg</td>
                  <td style={{ padding: '2px', textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Totals */}
          <div 
            className="receipt-totals" 
            style={{ 
              fontSize: settings.totals_font_size, 
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px dashed #000'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(sampleData.total)}</span>
            </div>
          </div>
          
          {/* Final Total */}
          <div 
            className="receipt-final-total" 
            style={{ 
              fontSize: settings.final_total_font_size, 
              fontWeight: 'bold',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(sampleData.total)}</span>
          </div>
          
          {/* DateTime */}
          <div 
            className="receipt-datetime" 
            style={{ 
              fontSize: settings.datetime_font_size, 
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            {formatDate(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
          
          {/* Quote */}
          <div 
            className="receipt-quote" 
            style={{ 
              fontSize: settings.quote_font_size, 
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px dashed #000'
            }}
          >
            {sampleData.quote}
          </div>
        </div>
      </div>
      
      {/* Test Print Button */}
      <Button 
        onClick={handleTestPrint} 
        variant="outline" 
        className="gap-2 bg-muted border-border text-foreground hover:bg-muted/80"
      >
        <Printer className="h-4 w-4" />
        Teste de Impressão
      </Button>
    </div>
  );
};

export default ReceiptPreview;
