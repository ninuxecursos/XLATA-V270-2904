import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Download, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CashRegister, CashSummary } from '../types/pdv';
import { PaymentBreakdown } from '../utils/cashRegisterCalculations';

interface CashRegisterExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  cashRegister: CashRegister | null;
  cashSummary: CashSummary | null;
  pendingFinalAmount: number | null;
  purchaseBreakdown: PaymentBreakdown;
  salesBreakdown: PaymentBreakdown;
  purchaseWeight: number;
  salesWeight: number;
  salesCount: number;
  totalTransactions: number;
  totalOpening: number;
  additionsCount: number;
  realTimeDifference: number;
  userWhatsapp: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyWhatsapp?: string;
}

const CashRegisterExportModal: React.FC<CashRegisterExportModalProps> = ({
  open,
  onOpenChange,
  onComplete,
  cashRegister,
  cashSummary,
  pendingFinalAmount,
  purchaseBreakdown,
  salesBreakdown,
  purchaseWeight,
  salesWeight,
  salesCount,
  totalTransactions,
  totalOpening,
  additionsCount,
  realTimeDifference,
  userWhatsapp,
  companyName,
  companyLogo,
  companyAddress,
  companyWhatsapp
}) => {
  if (!cashRegister || !cashSummary || pendingFinalAmount === null) {
    return null;
  }

  const totalExpenses = cashSummary.expenses 
    ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) 
    : 0;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatWeight = (value: number) => `${value.toFixed(3)} kg`;
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('pt-BR');
  const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');

  const generateWhatsAppText = () => {
    const statusText = realTimeDifference === 0 
      ? '✅ CONFERE' 
      : realTimeDifference > 0 
        ? '🔵 SOBRA' 
        : '🔴 FALTA';

    const text = `
📊 *FECHAMENTO DE CAIXA*
${companyName ? `🏢 ${companyName}` : ''}
📅 Data: ${formatDate(cashRegister.openingTimestamp)}
🕐 Fechado em: ${formatDateTime(new Date())}

━━━━━━━━━━━━━━━━━━━━━

💰 *RESUMO FINANCEIRO*

📥 Abertura: ${formatCurrency(totalOpening)}${additionsCount > 0 ? ` (+${additionsCount} adições)` : ''}

💵 *Compras:*
   • Dinheiro: ${formatCurrency(purchaseBreakdown.cashAmount)}
   • PIX: ${formatCurrency(purchaseBreakdown.pixAmount)}
   
💳 *Vendas:*
   • Total: ${formatCurrency(cashSummary.totalSales)}
   • Dinheiro: ${formatCurrency(salesBreakdown.cashAmount)}
   • PIX: ${formatCurrency(salesBreakdown.pixAmount)}

📤 Despesas: ${formatCurrency(totalExpenses)}

━━━━━━━━━━━━━━━━━━━━━

⚖️ *PESO TOTAL*
   • Compras: ${formatWeight(purchaseWeight)}
   • Vendas: ${formatWeight(salesWeight)}

━━━━━━━━━━━━━━━━━━━━━

📈 *RESULTADO*

💼 Saldo Esperado: ${formatCurrency(cashSummary.expectedAmount)}
💵 Saldo Final: ${formatCurrency(pendingFinalAmount)}
${statusText} ${formatCurrency(Math.abs(realTimeDifference))}

🔢 Total de Transações: ${totalTransactions}
🛒 Vendas Realizadas: ${salesCount}

━━━━━━━━━━━━━━━━━━━━━
✨ Relatório gerado automaticamente
`.trim();

    return text;
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppText();
    const encodedText = encodeURIComponent(text);
    
    let cleanNumber = userWhatsapp.replace(/\D/g, '');
    if (cleanNumber.length >= 10 && !cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }
    
    if (!cleanNumber) {
      toast({
        title: "WhatsApp não configurado",
        description: "Configure seu número de WhatsApp nas configurações do sistema.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "O relatório foi preparado para envio.",
      duration: 2000,
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const now = new Date();
      const statusColor = realTimeDifference === 0 ? '#16a34a' : realTimeDifference > 0 ? '#2563eb' : '#dc2626';
      const statusBg = realTimeDifference === 0 ? '#f0fdf4' : realTimeDifference > 0 ? '#eff6ff' : '#fef2f2';
      const statusBorder = realTimeDifference === 0 ? '#bbf7d0' : realTimeDifference > 0 ? '#bfdbfe' : '#fecaca';
      const statusLabel = realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { margin: 0; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              color: #1e293b;
              background: #fff;
              line-height: 1.5;
            }

            /* Header with brand strip */
            .brand-strip {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 28px 40px;
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .brand-logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
              border-radius: 12px;
              background: rgba(255,255,255,0.1);
              padding: 4px;
            }
            .brand-info {
              flex: 1;
            }
            .brand-company {
              color: #fff;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: -0.3px;
              margin: 0;
            }
            .brand-address {
              color: #94a3b8;
              font-size: 12px;
              margin: 4px 0 0 0;
            }
            .brand-whatsapp {
              color: #94a3b8;
              font-size: 12px;
              margin: 2px 0 0 0;
            }
            .brand-date-block {
              text-align: right;
            }
            .brand-date-block p {
              color: #94a3b8;
              font-size: 11px;
              margin: 0;
            }
            .brand-date-block .date-value {
              color: #e2e8f0;
              font-size: 13px;
              font-weight: 600;
            }

            /* Title bar */
            .title-bar {
              background: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              padding: 14px 40px;
              text-align: center;
            }
            .title-bar h1 {
              margin: 0;
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            .content {
              padding: 28px 40px 20px;
            }

            /* Section titles */
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin: 0 0 12px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #0f172a;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-icon {
              width: 18px;
              height: 18px;
              background: #0f172a;
              color: #fff;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 800;
            }

            /* Data table */
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .data-table th {
              background: #f1f5f9;
              color: #475569;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 16px;
              text-align: left;
              border-bottom: 2px solid #e2e8f0;
            }
            .data-table th:last-child {
              text-align: right;
            }
            .data-table td {
              padding: 11px 16px;
              font-size: 14px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            .data-table td:last-child {
              text-align: right;
              font-weight: 700;
              font-size: 15px;
              color: #0f172a;
              font-variant-numeric: tabular-nums;
            }
            .data-table tr:last-child td {
              border-bottom: none;
            }
            .data-table .subtotal td {
              background: #f8fafc;
              font-weight: 700;
              border-top: 2px solid #e2e8f0;
            }

            /* Two column layout */
            .two-col {
              display: flex;
              gap: 24px;
              margin-bottom: 24px;
            }
            .two-col .col {
              flex: 1;
            }

            /* Result card */
            .result-card {
              background: ${statusBg};
              border: 2px solid ${statusBorder};
              border-radius: 12px;
              padding: 20px 28px;
              margin-bottom: 24px;
            }
            .result-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 0;
            }
            .result-label {
              font-size: 14px;
              color: #475569;
              font-weight: 500;
            }
            .result-value {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
            }
            .result-status {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 10px;
              margin-top: 12px;
              padding-top: 14px;
              border-top: 2px solid ${statusBorder};
            }
            .result-badge {
              background: ${statusColor};
              color: #fff;
              font-size: 13px;
              font-weight: 800;
              padding: 5px 16px;
              border-radius: 20px;
              letter-spacing: 1px;
            }
            .result-diff {
              font-size: 22px;
              font-weight: 800;
              color: ${statusColor};
            }

            /* Stats bar */
            .stats-bar {
              display: flex;
              gap: 16px;
              margin-bottom: 24px;
            }
            .stat-box {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 16px;
              text-align: center;
            }
            .stat-number {
              font-size: 28px;
              font-weight: 800;
              color: #0f172a;
              line-height: 1;
            }
            .stat-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 4px;
            }

            /* Footer */
            .footer {
              background: #f8fafc;
              border-top: 2px solid #e2e8f0;
              padding: 16px 40px;
              text-align: center;
            }
            .footer-brand {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .footer-credits {
              font-size: 10px;
              color: #cbd5e1;
              margin-top: 4px;
            }
            .footer-timestamp {
              font-size: 10px;
              color: #94a3b8;
              margin-top: 6px;
            }
          </style>
        </head>
        <body>
          <!-- Brand Header -->
          <div class="brand-strip">
            ${companyLogo ? `<img src="${companyLogo}" class="brand-logo" alt="Logo" />` : ''}
            <div class="brand-info">
              <p class="brand-company">${companyName || 'Minha Empresa'}</p>
              ${companyAddress ? `<p class="brand-address">📍 ${companyAddress}</p>` : ''}
              ${companyWhatsapp ? `<p class="brand-whatsapp">📞 ${companyWhatsapp}</p>` : ''}
            </div>
            <div class="brand-date-block">
              <p>Abertura</p>
              <p class="date-value">${formatDate(cashRegister.openingTimestamp)}</p>
              <p style="margin-top: 8px;">Fechamento</p>
              <p class="date-value">${formatDateTime(now)}</p>
            </div>
          </div>

          <!-- Title -->
          <div class="title-bar">
            <h1>Relatório de Fechamento de Caixa</h1>
          </div>

          <div class="content">
            <!-- Stats Overview -->
            <div class="stats-bar">
              <div class="stat-box">
                <div class="stat-number">${totalTransactions}</div>
                <div class="stat-label">Transações</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${salesCount}</div>
                <div class="stat-label">Vendas</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${formatWeight(purchaseWeight + salesWeight).replace(' kg', '')}</div>
                <div class="stat-label">Peso Total (kg)</div>
              </div>
            </div>

            <!-- Two column: Financial + Weight -->
            <div class="two-col">
              <div class="col">
                <div class="section-title">
                  <div class="section-icon">$</div>
                  Resumo Financeiro
                </div>
                <table class="data-table">
                  <thead>
                    <tr><th>Descrição</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Abertura do Caixa${additionsCount > 0 ? ` (+${additionsCount} adições)` : ''}</td><td>${formatCurrency(totalOpening)}</td></tr>
                    <tr><td>Compras – Dinheiro</td><td>${formatCurrency(purchaseBreakdown.cashAmount)}</td></tr>
                    <tr><td>Compras – PIX</td><td>${formatCurrency(purchaseBreakdown.pixAmount)}</td></tr>
                    <tr class="subtotal"><td>Total de Vendas</td><td>${formatCurrency(cashSummary.totalSales)}</td></tr>
                    <tr><td>Vendas – Dinheiro</td><td>${formatCurrency(salesBreakdown.cashAmount)}</td></tr>
                    <tr><td>Vendas – PIX</td><td>${formatCurrency(salesBreakdown.pixAmount)}</td></tr>
                    <tr><td>Total de Despesas</td><td style="color: #dc2626;">${formatCurrency(totalExpenses)}</td></tr>
                  </tbody>
                </table>
              </div>

              <div class="col">
                <div class="section-title">
                  <div class="section-icon">⚖</div>
                  Peso Movimentado
                </div>
                <table class="data-table">
                  <thead>
                    <tr><th>Tipo</th><th>Peso</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Compras</td><td>${formatWeight(purchaseWeight)}</td></tr>
                    <tr><td>Vendas</td><td>${formatWeight(salesWeight)}</td></tr>
                  </tbody>
                </table>

                <!-- Result inside right column -->
                <div class="section-title" style="margin-top: 20px;">
                  <div class="section-icon">✓</div>
                  Conferência de Caixa
                </div>
                <div class="result-card">
                  <div class="result-row">
                    <span class="result-label">Saldo Esperado</span>
                    <span class="result-value">${formatCurrency(cashSummary.expectedAmount)}</span>
                  </div>
                  <div class="result-row">
                    <span class="result-label">Saldo Final Informado</span>
                    <span class="result-value">${formatCurrency(pendingFinalAmount)}</span>
                  </div>
                  <div class="result-status">
                    <span class="result-badge">${statusLabel}</span>
                    <span class="result-diff">${formatCurrency(Math.abs(realTimeDifference))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-brand">Powered by XLATA · Gestor PDV para Ferro Velho</div>
            <div class="footer-credits">Sistema desenvolvido por XLATA Technology · xlata.com.br</div>
            <div class="footer-timestamp">Documento gerado automaticamente em ${formatDateTime(now)}</div>
          </div>
        </body>
        </html>
      `;

      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const options = {
        margin: 0,
        filename: `fechamento-caixa-${formatDate(cashRegister.openingTimestamp).replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(container).set(options).save();
      document.body.removeChild(container);

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDownloadCSV = () => {
    try {
      const csvRows = [
        ['FECHAMENTO DE CAIXA'],
        [companyName || ''],
        [`Data: ${formatDate(cashRegister.openingTimestamp)}`],
        [`Fechado em: ${formatDateTime(new Date())}`],
        [''],
        ['RESUMO FINANCEIRO'],
        ['Descrição', 'Valor'],
        ['Abertura', totalOpening.toFixed(2)],
        ['Adições de Saldo', additionsCount.toString()],
        ['Compras em Dinheiro', purchaseBreakdown.cashAmount.toFixed(2)],
        ['Compras em PIX', purchaseBreakdown.pixAmount.toFixed(2)],
        ['Total de Vendas', cashSummary.totalSales.toFixed(2)],
        ['Vendas em Dinheiro', salesBreakdown.cashAmount.toFixed(2)],
        ['Vendas em PIX', salesBreakdown.pixAmount.toFixed(2)],
        ['Total de Despesas', totalExpenses.toFixed(2)],
        [''],
        ['PESO TOTAL'],
        ['Tipo', 'Peso (kg)'],
        ['Compras', purchaseWeight.toFixed(3)],
        ['Vendas', salesWeight.toFixed(3)],
        [''],
        ['RESULTADO'],
        ['Saldo Esperado', cashSummary.expectedAmount.toFixed(2)],
        ['Saldo Final', pendingFinalAmount.toFixed(2)],
        ['Diferença', realTimeDifference.toFixed(2)],
        ['Status', realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'],
        [''],
        ['ESTATÍSTICAS'],
        ['Total de Transações', totalTransactions.toString()],
        ['Vendas Realizadas', salesCount.toString()],
      ];

      const csvContent = csvRows.map(row => row.join(';')).join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `fechamento-caixa-${formatDate(cashRegister.openingTimestamp).replace(/\//g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV gerado com sucesso",
        description: "O arquivo foi baixado.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      toast({
        title: "Erro ao gerar CSV",
        description: "Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-white text-lg">
            Exportar Relatório
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Escolha como deseja exportar o resumo do fechamento
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          <Button 
            onClick={handleSendWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar para WhatsApp
          </Button>
          
          <Button 
            onClick={handleDownloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <FileText className="h-5 w-5" />
            Baixar PDF
          </Button>
          
          <Button 
            onClick={handleDownloadCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center justify-center gap-3"
          >
            <Download className="h-5 w-5" />
            Baixar CSV
          </Button>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSkip}
            className="w-full bg-transparent hover:bg-gray-700 text-white border-gray-600"
          >
            <X className="h-4 w-4 mr-2" />
            Pular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterExportModal;
