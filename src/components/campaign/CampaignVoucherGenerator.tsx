import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMobilePrint } from "@/hooks/useMobilePrint";
import { useReceiptFormatSettings } from "@/hooks/useReceiptFormatSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";

// Função para escapar HTML e prevenir XSS
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

interface CampaignClient {
  id: string;
  name: string;
  cpf: string;
}

interface DeliveryData {
  material_name: string;
  weight_kg: number;
  price_per_kg: number;
  total_value: number;
  delivery_date: string;
}

interface VoucherData {
  client: CampaignClient;
  deliveries: DeliveryData[];
  totalAccumulated: number;
  finalValue: number;
  startDate: string;
  endDate: string;
  accountValue: number;
  discountPercentage: number;
}

interface Props {
  periodSummary: VoucherData;
  onBack: () => void;
}

export function CampaignVoucherGenerator({ periodSummary, onBack }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handlePrint } = useMobilePrint();
  const { getCurrentFormatSettings } = useReceiptFormatSettings();
  const [showPreview, setShowPreview] = useState(true);

  const formatSettings = getCurrentFormatSettings();

  const generateVoucherHTML = () => {
    const logoUrl = "/lovable-uploads/XLATALOGO.png";
    
    return `
      <div class="voucher-container" style="
        width: ${formatSettings.container_width};
        max-width: ${formatSettings.container_width};
        margin: 0 auto;
        padding: ${formatSettings.padding};
        font-family: 'Roboto', Arial, sans-serif;
        color: #000;
        background: #fff;
        line-height: 1.4;
      ">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">
          <img src="${logoUrl}" alt="XLata Logo" style="
            max-width: ${formatSettings.logo_max_width};
            max-height: ${formatSettings.logo_max_height};
            margin-bottom: 8px;
          ">
          <div style="font-size: ${formatSettings.title_font_size}; font-weight: bold; color: #22c55e;">
            XLATA - RECICLANDO
          </div>
          <div style="font-size: ${formatSettings.quote_font_size}; color: #666; margin-top: 4px;">
            Reciclando para um futuro sustentável
          </div>
        </div>

        <!-- Título da Campanha -->
        <div style="text-align: center; margin-bottom: 15px; padding: 8px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: 4px;">
          <div style="font-size: ${formatSettings.title_font_size}; font-weight: bold;">
            🌱 SUA RECICLAGEM PAGA SUA CONTA
          </div>
          <div style="font-size: ${formatSettings.quote_font_size}; margin-top: 2px;">
            Comprovante de Desconto
          </div>
        </div>

        <!-- Dados do Cliente -->
        <div style="margin-bottom: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
          <div style="font-size: ${formatSettings.customer_font_size}; font-weight: bold; margin-bottom: 4px;">
            CLIENTE: ${escapeHtml(periodSummary.client.name)}
          </div>
          <div style="font-size: ${formatSettings.table_font_size}; color: #666;">
            CPF: ${escapeHtml(periodSummary.client.cpf)}
          </div>
          <div style="font-size: ${formatSettings.table_font_size}; color: #666;">
            ID: ${escapeHtml(periodSummary.client.id.substring(0, 8))}...
          </div>
        </div>

        <!-- Período -->
        <div style="margin-bottom: 15px; text-align: center;">
          <div style="font-size: ${formatSettings.table_font_size}; color: #666;">
            PERÍODO DE REFERÊNCIA
          </div>
          <div style="font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
            ${new Date(periodSummary.startDate).toLocaleDateString('pt-BR')} até ${new Date(periodSummary.endDate).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <!-- Resumo dos Materiais -->
        <div style="margin-bottom: 15px;">
          <div style="font-size: ${formatSettings.table_font_size}; font-weight: bold; margin-bottom: 8px; text-align: center; padding: 4px; background: #e5e7eb;">
            MATERIAIS ENTREGUES
          </div>
          ${periodSummary.deliveries.slice(0, 5).map(delivery => `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #ccc; font-size: ${formatSettings.table_font_size};">
              <span>${escapeHtml(delivery.material_name)} (${Number(delivery.weight_kg).toFixed(2)}kg)</span>
              <span>R$ ${Number(delivery.total_value).toFixed(2)}</span>
            </div>
          `).join('')}
          ${periodSummary.deliveries.length > 5 ? `
            <div style="text-align: center; padding: 4px 0; font-size: ${formatSettings.table_font_size}; color: #666; font-style: italic;">
              ... e mais ${periodSummary.deliveries.length - 5} entregas
            </div>
          ` : ''}
        </div>

        <!-- Totais -->
        <div style="margin-bottom: 15px; padding: 8px; background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: ${formatSettings.totals_font_size};">Total Entregas:</span>
            <span style="font-size: ${formatSettings.totals_font_size}; font-weight: bold;">${periodSummary.deliveries.length}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: ${formatSettings.totals_font_size};">Total Acumulado:</span>
            <span style="font-size: ${formatSettings.totals_font_size}; font-weight: bold;">R$ ${periodSummary.totalAccumulated.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: ${formatSettings.totals_font_size};">Valor Final (80%):</span>
            <span style="font-size: ${formatSettings.totals_font_size}; font-weight: bold; color: #22c55e;">R$ ${periodSummary.finalValue.toFixed(2)}</span>
          </div>
        </div>

        <!-- Desconto Aplicado -->
        <div style="margin-bottom: 15px; padding: 10px; background: #22c55e; color: white; border-radius: 4px; text-align: center;">
          <div style="font-size: ${formatSettings.totals_font_size}; margin-bottom: 4px;">
            VALOR DA CONTA: R$ ${periodSummary.accountValue.toFixed(2)}
          </div>
          <div style="font-size: ${formatSettings.final_total_font_size}; font-weight: bold;">
            DESCONTO: ${periodSummary.discountPercentage.toFixed(1)}%
          </div>
          <div style="font-size: ${formatSettings.table_font_size}; margin-top: 4px; opacity: 0.9;">
            ${periodSummary.discountPercentage >= 100 ? 'CONTA 100% COBERTA!' : `Economize R$ ${Math.min(periodSummary.finalValue, periodSummary.accountValue).toFixed(2)}`}
          </div>
        </div>

        <!-- Mensagem de Impacto -->
        <div style="text-align: center; margin-bottom: 15px; padding: 8px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; border-radius: 4px;">
          <div style="font-size: ${formatSettings.title_font_size}; font-weight: bold;">
            ♻️ AQUI, SUA RECICLAGEM PAGA SUA CONTA! 🌱
          </div>
        </div>

        <!-- Data e Hora -->
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-size: ${formatSettings.datetime_font_size}; color: #666;">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>

        <!-- Rodapé -->
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc;">
          <div style="font-size: ${formatSettings.quote_font_size}; color: #666;">
            Continue participando da campanha e ajudando o meio ambiente!
          </div>
          <div style="font-size: ${formatSettings.quote_font_size}; color: #666; margin-top: 4px;">
            XLata - Tecnologia Sustentável
          </div>
        </div>
      </div>
    `;
  };

  const handlePrintVoucher = async () => {
    const voucherHTML = generateVoucherHTML();
    
    try {
      // Salvar comprovante no banco
      await supabase.from('campaign_vouchers').insert({
        user_id: user!.id,
        client_id: periodSummary.client.id,
        period_id: crypto.randomUUID(), // Temporário
        voucher_data: {
          client: {
            id: periodSummary.client.id,
            name: periodSummary.client.name,
            cpf: periodSummary.client.cpf
          },
          period: {
            startDate: periodSummary.startDate,
            endDate: periodSummary.endDate
          },
          totals: {
            totalAccumulated: periodSummary.totalAccumulated,
            finalValue: periodSummary.finalValue,
            accountValue: periodSummary.accountValue,
            discountPercentage: periodSummary.discountPercentage
          },
          deliveries: periodSummary.deliveries.length
        }
      });

      await handlePrint(voucherHTML, {
        title: `Comprovante_${periodSummary.client.name}_${new Date().toISOString().split('T')[0]}`
      });

      toast({
        title: "Sucesso",
        description: "Comprovante gerado e salvo com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar comprovante:', error);
      // Continua com a impressão mesmo se não conseguir salvar
      await handlePrint(voucherHTML, {
        title: `Comprovante_${periodSummary.client.name}_${new Date().toISOString().split('T')[0]}`
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Comprovante de Desconto</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Pré-visualização do Comprovante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generateVoucherHTML()) }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <span className="text-sm font-medium">{periodSummary.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Entregas:</span>
                <Badge variant="secondary">{periodSummary.deliveries.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-medium">R$ {periodSummary.totalAccumulated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Final (80%):</span>
                <span className="text-sm font-bold text-green-600">R$ {periodSummary.finalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Desconto:</span>
                <span className="text-sm font-bold text-purple-600">{periodSummary.discountPercentage.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={handlePrintVoucher} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Comprovante
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Ocultar" : "Mostrar"} Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}