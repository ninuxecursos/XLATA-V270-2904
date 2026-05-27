
import React, { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Customer, Order } from "../types/pdv";
import { getRandomMotivationalQuote } from "../utils/motivationalQuotes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMobilePrint } from "@/hooks/useMobilePrint";
import MobilePrintOptions from "./MobilePrintOptions";
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { cleanMaterialName } from '@/utils/materialNameCleaner';

interface ReceiptPrintModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  order: Order | null;
  formatPeso: (value: string | number) => string;
  isSaleMode?: boolean;
  onSave?: () => void;
}

const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  open,
  onClose,
  customer,
  order,
  formatPeso,
  isSaleMode = false,
  onSave,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { 
    handlePrint, 
    showPrintOptions, 
    setShowPrintOptions, 
    isMobileDevice 
  } = useMobilePrint();
  
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });
  const [printContent, setPrintContent] = useState<string>('');

  // Get current format and settings
  const receiptFormat = getCurrentFormat();
  const formatSettings = getCurrentFormatSettings();

  // Load system settings from Supabase
  const loadSystemSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadSystemSettings();
    }
  }, [open, user]);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onClose]);

  if (!customer || !order) return null;

  const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
  const netWeight = totalWeight - totalTara;
  // CRITICAL: recompute total from items to keep print and stored total consistent
  const computedTotal = order.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const motivationalQuote = getRandomMotivationalQuote();

  // Gera o conteúdo para impressão usando configurações personalizadas
  const generatePrintContent = () => {
    const { logo, whatsapp1, whatsapp2, address } = settings;

    return `
      <div style="
        width: ${formatSettings.container_width};
        max-width: ${formatSettings.container_width};
        margin: 0;
        padding: ${formatSettings.padding};
        font-family: 'Roboto', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.3;
        color: #000 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      ">
        <!-- Header com logo 30% à esquerda e WhatsApp/Endereço 70% à direita -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${formatSettings.margins};">
          ${logo ? `
            <div style="width: 30%; flex: 0 0 30%; margin: 0; padding: 0;">
              <img src="${logo}" alt="Logo" style="
                max-width: ${formatSettings.logo_max_width};
                max-height: ${formatSettings.logo_max_height};
                margin: 0;
                padding: 0;
                filter: contrast(200%) brightness(0);
                -webkit-filter: contrast(200%) brightness(0);
              " />
            </div>
          ` : `<div style="width: 30%; flex: 0 0 30%;"></div>`}
          
          <div style="width: 70%; flex: 0 0 70%; text-align: center;">
            <div style="font-size: ${formatSettings.phone_font_size}; font-weight: bold;">
              ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
              ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
            </div>
            ${address ? `
              <div style="font-size: ${formatSettings.address_font_size}; margin-top: 3mm; font-weight: bold; text-align: center; word-wrap: break-word; overflow-wrap: break-word;">
                ${address}
              </div>
            ` : ""}
          </div>
        </div>
        
        <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 1.05mm;">
          ${isSaleMode ? "COMPROVANTE DE VENDA" : "COMPROVANTE DE PEDIDO"}
        </div>
        
        <div style="text-align: center; margin-bottom: 3.6mm; font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
          Cliente: ${customer.name}
        </div>
        
        <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
        
        <table style="
          width: 100%;
          border-collapse: collapse;
          font-size: ${formatSettings.table_font_size};
          margin-bottom: 3mm;
          font-weight: bold;
        ">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Material</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Peso</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">R$/kg</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
              const pesoLiquido = item.quantity - (item.tara || 0);
              return `
                <tr>
                  <td style="padding: 1mm 0; vertical-align: top; font-weight: bold; word-wrap: break-word;">
                    ${cleanMaterialName(item.materialName)}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${receiptFormat === '50mm' ? '5px' : '10.8px'}; font-weight: bold;">Tara: ${formatPeso(item.tara).replace('/kg', '')} kg</span>` : ""}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${receiptFormat === '50mm' ? '5px' : '10.8px'}; font-weight: bold;">P. Líquido: ${formatPeso(pesoLiquido).replace('/kg', '')} kg</span>` : ""}
                  </td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${formatPeso(item.quantity).replace('/kg','')}</td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.price.toFixed(2)}</td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.total.toFixed(2)}</td>
                </tr>
              `}).join("")}
          </tbody>
        </table>
        
        <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
          <span>Peso Bruto:</span>
          <span>${formatPeso(totalWeight).replace('/kg','')} kg</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
          <span>Total Tara:</span>
          <span>${formatPeso(totalTara).replace('/kg','')} kg</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
          <span>Peso Líquido:</span>
          <span>${formatPeso(netWeight).replace('/kg','')} kg</span>
        </div>
        
        <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
        
        <div style="text-align: right; font-weight: bold; font-size: ${formatSettings.final_total_font_size}; margin: 2.16mm 0;">
          ${isSaleMode ? "Total a Receber: " : "Total: "} R$ ${computedTotal.toFixed(2)}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: ${formatSettings.margins}; font-weight: bold;">
          ${new Date(order.timestamp).toLocaleString('pt-BR')}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.quote_font_size}; margin-top: 4mm; font-weight: bold; font-style: italic; word-wrap: break-word;">
          ${motivationalQuote}
        </div>
      </div>
    `;
  };

  // Dynamic styles for preview based on user's custom settings
  const getPreviewStyles = () => {
    return {
      container: receiptFormat === '50mm' ? "max-w-[200px] text-xs" : "max-w-sm",
      headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: formatSettings.margins },
      logoContainer: { width: "30%", flex: "0 0 30%", margin: "0", padding: "0" },
      logoImg: { 
        background: "transparent", 
        maxWidth: formatSettings.logo_max_width,
        maxHeight: formatSettings.logo_max_height,
        margin: "0",
        padding: "0",
        filter: "contrast(200%) brightness(0)"
      },
      infoContainer: { width: "70%", flex: "0 0 70%", textAlign: "center" as const },
      phoneNumbers: { fontSize: formatSettings.phone_font_size, fontWeight: "bold" as const },
      address: { fontSize: formatSettings.address_font_size, fontWeight: "bold" as const, marginTop: "3mm", textAlign: "center" as const },
      title: "center font-bold mb-2",
      customer: "center mb-3 font-bold",
      table: { width: "100%", fontFamily: "'Roboto', Arial, sans-serif", fontWeight: "bold" as const, fontSize: formatSettings.table_font_size },
      totals: { fontSize: formatSettings.totals_font_size, fontWeight: "bold" as const, marginBottom: "2px" },
      finalTotal: { fontWeight: "bold" as const, fontSize: formatSettings.final_total_font_size, textAlign: "right" as const, marginTop: "4px" },
      datetime: "center font-bold",
      quote: "center font-bold italic"
    };
  };

  const handlePrintClick = async () => {
    const content = generatePrintContent();
    setPrintContent(content);
    
    await handlePrint(content, {
      title: 'Comprovante',
      format: receiptFormat
    });
  };

  // Auto-trigger print when modal opens (only for desktop)
  useEffect(() => {
    if (open && !isMobileDevice) {
      setTimeout(() => {
        handlePrintClick();
      }, 100);
    }
  }, [open, isMobileDevice]);

  const previewStyles = getPreviewStyles();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm bg-white border-gray-200 text-black">
          <DialogHeader>
            <DialogTitle className="text-base font-bold mb-1 text-center">
              Pré-visualização do Comprovante ({receiptFormat})
            </DialogTitle>
          </DialogHeader>
          <div ref={printRef} className="bg-white px-2 py-1.5 text-black">
            <div className={`receipt-container ${previewStyles.container} mx-auto`} style={{ fontFamily: "'Roboto', Arial, sans-serif" }}>
              {/* Header com logo à esquerda e WhatsApp/Endereço à direita */}
              <div style={previewStyles.headerFlex}>
                <div style={previewStyles.logoContainer}>
                  {settings.logo && (
                    <img 
                      src={settings.logo} 
                      alt="Logo" 
                      style={previewStyles.logoImg}
                    />
                  )}
                </div>
                
                <div style={previewStyles.infoContainer}>
                  <div style={previewStyles.phoneNumbers}>
                    {settings.whatsapp1 && <div style={{ wordWrap: 'break-word' }}>{settings.whatsapp1}</div>}
                    {settings.whatsapp2 && <div style={{ marginTop: "2px", wordWrap: 'break-word' }}>{settings.whatsapp2}</div>}
                  </div>
                  {settings.address && <div style={previewStyles.address}>
                    <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {settings.address}
                    </div>
                  </div>}
                </div>
              </div>
              
              <div className={previewStyles.title} style={{ fontSize: formatSettings.title_font_size }}>
                {isSaleMode ? "COMPROVANTE DE VENDA" : "COMPROVANTE DE PEDIDO"}
              </div>
              
              <div className={previewStyles.customer} style={{ fontSize: formatSettings.customer_font_size }}>
                Cliente: <span style={{ fontWeight: 700 }}>{customer.name}</span>
              </div>
              
              <div style={{ borderBottom: "1px dashed #000", margin: `${receiptFormat === '50mm' ? '2px' : '8px'} 0 ${receiptFormat === '50mm' ? '2px' : '7px'} 0` }}></div>
              
              <table className="material-list" style={previewStyles.table}>
                <thead>
                  <tr>
                    <th style={{ minWidth: receiptFormat === '50mm' ? 40 : 65, fontWeight: "bold" }}>Material</th>
                    <th style={{ textAlign:"right", fontWeight: "bold" }}>Peso</th>
                    <th style={{ textAlign:"right", fontWeight: "bold" }}>R$/kg</th>
                    <th style={{ textAlign:"right", fontWeight: "bold" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const pesoLiquido = item.quantity - (item.tara || 0);
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: "bold", wordWrap: 'break-word' }}>
                          {cleanMaterialName(item.materialName)}
                          {item.tara && item.tara > 0 ? (
                            <span style={{ fontSize: receiptFormat === '50mm' ? 5 : 10.8, color: "#222", display: "block", fontStyle:"italic", marginTop:1, fontWeight: "bold" }}>
                              Tara: {formatPeso(item.tara).replace('/kg', '')} kg
                            </span>
                          ) : null}
                          {item.tara && item.tara > 0 ? (
                            <span style={{ fontSize: receiptFormat === '50mm' ? 5 : 10.8, color: "#222", display: "block", fontStyle:"italic", marginTop:1, fontWeight: "bold" }}>
                              P. Líquido: {formatPeso(pesoLiquido).replace('/kg', '')} kg
                            </span>
                          ) : null}
                        </td>
                        <td style={{ textAlign:"right", fontWeight: "bold" }}>{formatPeso(item.quantity).replace('/kg','')}</td>
                        <td style={{ textAlign:"right", fontWeight: "bold" }}>{item.price.toFixed(2)}</td>
                        <td style={{ textAlign:"right", fontWeight: "bold" }}>{item.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div style={{ borderBottom: "1px dashed #000", margin: `${receiptFormat === '50mm' ? '2px' : '8px'} 0 ${receiptFormat === '50mm' ? '2px' : '7px'} 0` }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", ...previewStyles.totals }}>
                <span>Peso Bruto:</span>
                <span>{formatPeso(totalWeight).replace('/kg','')} kg</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", ...previewStyles.totals }}>
                <span>Total Tara:</span>
                <span>{formatPeso(totalTara).replace('/kg','')} kg</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", ...previewStyles.totals }}>
                <span>Peso Líquido:</span>
                <span>{formatPeso(netWeight).replace('/kg','')} kg</span>
              </div>
              
              <div style={previewStyles.finalTotal}>
                {isSaleMode ? "Total a Receber: " : "Total: "} R$ {computedTotal.toFixed(2)}
              </div>
              
              <div className={`${previewStyles.datetime}`} style={{ fontSize: formatSettings.datetime_font_size }}>
                {new Date(order.timestamp).toLocaleString('pt-BR')}
              </div>
              
              <div className={`${previewStyles.quote}`} style={{ fontSize: formatSettings.quote_font_size }}>
                {motivationalQuote}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2 justify-center">
            <Button 
              type="button" 
              onClick={handlePrintClick} 
              className="bg-pdv-green text-white hover:bg-pdv-green/90"
            >
              {isMobileDevice ? 'Opções de Impressão' : 'Imprimir'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de opções para dispositivos móveis */}
      <MobilePrintOptions
        open={showPrintOptions}
        onClose={() => {
          setShowPrintOptions(false);
          if (onSave) onSave();
          onClose();
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }}
        content={printContent}
        filename={`comprovante-${order.id.substring(0, 8)}.pdf`}
        title="Comprovante"
      />
    </>
  );
};

export default ReceiptPrintModal;
