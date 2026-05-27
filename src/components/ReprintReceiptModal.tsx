
import React, { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Customer, Order } from "../types/pdv";
import { getRandomMotivationalQuote } from "../utils/motivationalQuotes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import PasswordAuthModal from './PasswordAuthModal';

interface ReprintReceiptModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  order: Order | null;
  formatPeso: (value: string | number) => string;
  isSaleMode?: boolean;
}

const ReprintReceiptModal: React.FC<ReprintReceiptModalProps> = ({
  open,
  onClose,
  customer,
  order,
  formatPeso,
  isSaleMode = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });

  // When modal opens, show password auth first
  useEffect(() => {
    if (open) {
      setIsAuthenticated(false);
      setShowPasswordModal(true);
    } else {
      setShowPasswordModal(false);
      setIsAuthenticated(false);
    }
  }, [open]);

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
    if (isAuthenticated && user) {
      loadSystemSettings();
    }
  }, [isAuthenticated, user]);

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setIsAuthenticated(true);
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    onClose();
  };

  if (!customer || !order) return null;

  const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
  const netWeight = totalWeight - totalTara;
  // CRITICAL: recompute total from items to keep reprint consistent with the actual saved items
  const computedTotal = order.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const motivationalQuote = getRandomMotivationalQuote();

  // Get current format and settings
  const currentFormat = getCurrentFormat();
  const formatSettings = getCurrentFormatSettings();

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
        
        <div style="text-align: center; margin-bottom: 2mm; font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
          Cliente: ${customer.name}
        </div>
        
        <div style="text-align: center; margin-bottom: 2mm; font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
          ID do Pedido: ${order.id}
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
                    ${item.materialName}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${currentFormat === '50mm' ? '6px' : '10px'}; font-weight: bold;">Tara: ${formatPeso(item.tara).replace('/kg', '')} kg</span>` : ""}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${currentFormat === '50mm' ? '6px' : '10px'}; font-weight: bold;">P. Líquido: ${formatPeso(pesoLiquido).replace('/kg', '')} kg</span>` : ""}
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
        
        <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
        
        <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: ${formatSettings.margins}; font-weight: bold;">
          Data/Hora do Pedido: ${new Date(order.timestamp).toLocaleString('pt-BR')}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: ${formatSettings.margins}; font-weight: bold;">
          Data/Hora da Reimpressão: ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <div style="text-align: center; font-size: ${formatSettings.quote_font_size}; margin-top: 4mm; font-weight: bold; font-style: italic; word-wrap: break-word;">
          ${motivationalQuote}
        </div>
      </div>
    `;
  };

  const handlePrintClick = () => {
    const printContent = generatePrintContent();
    
    // Store original URL for return navigation
    const originalUrl = window.location.href;
    
    // Create complete HTML document for printing with dynamic page size using user settings
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reimpressão - Comprovante</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: ${formatSettings.container_width} auto; margin: 0; padding: 0; }
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            html, body {
              width: ${formatSettings.container_width};
              max-width: ${formatSettings.container_width};
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              color: #000 !important;
              font-family: 'Roboto', Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              html, body {
                width: ${formatSettings.container_width} !important;
                max-width: ${formatSettings.container_width} !important;
                margin: 0 !important;
                padding: 0 !important;
                min-height: auto !important;
                height: auto !important;
              }
              .no-print { display: none !important; height: 0 !important; visibility: hidden !important; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            let printCompleted = false;
            let returnTimer = null;
            const originalUrl = "${originalUrl}";
            
            function returnToPDV() {
              if (!printCompleted) {
                printCompleted = true;
                setTimeout(() => {
                  try { window.location.replace(originalUrl); } 
                  catch (e) { 
                    try { window.location.href = originalUrl; } 
                    catch (e2) { window.history.back(); }
                  }
                }, 300);
              }
            }
            
            window.onload = function() {
              setTimeout(() => { window.print(); }, 100);
              returnTimer = setTimeout(returnToPDV, 8000);
            };
            
            window.onafterprint = function() {
              if (returnTimer) clearTimeout(returnTimer);
              returnToPDV();
            };
            
            window.addEventListener('keydown', function(e) {
              if ((e.key === 'Escape' || e.keyCode === 27) && !printCompleted) {
                if (returnTimer) clearTimeout(returnTimer);
                returnToPDV();
              }
            });
            
            window.addEventListener('focus', function() {
              setTimeout(() => {
                if (!printCompleted) {
                  if (returnTimer) clearTimeout(returnTimer);
                  returnToPDV();
                }
              }, 1000);
            });
            
            document.addEventListener('visibilitychange', function() {
              if (!document.hidden && !printCompleted) {
                setTimeout(() => {
                  if (!printCompleted) {
                    if (returnTimer) clearTimeout(returnTimer);
                    returnToPDV();
                  }
                }, 500);
              }
            });
          </script>
        </body>
      </html>
    `;

    // Delay the print to allow modal to close first
    onClose();
    setTimeout(() => {
      document.open();
      document.write(printDocument);
      document.close();
    }, 300);
  };

  return (
    <>
      {/* Password Authentication Modal */}
      <PasswordAuthModal
        open={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
        title="Autenticação Necessária"
        description="Digite sua senha para reimprimir o comprovante"
      />

      {/* Confirmation Modal - only shows after authentication */}
      <Dialog open={isAuthenticated} onOpenChange={(newOpen) => {
        if (!newOpen) onClose();
      }}>
        <DialogContent className="sm:max-w-md text-white border-none" style={{ backgroundColor: '#303030' }}>
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ color: '#10B981' }}>
              Reimprimir Comprovante ({currentFormat})
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Confirme para reimprimir o comprovante de {isSaleMode ? "venda" : "pedido"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-base text-gray-300">
              Clique em Confirmar Impressão para reimprimir o comprovante no formato {currentFormat}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 text-white hover:bg-gray-600 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePrintClick}
                className="flex-1 text-white hover:opacity-90 text-base"
                style={{ backgroundColor: '#10B981' }}
              >
                Confirmar impressão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReprintReceiptModal;
