
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { closeActiveCashRegister, calculateCashSummary, getActiveCashRegister } from '../utils/localStorage';
import { scheduleUltraTask } from '../utils/ultraPerformanceUtils';
import { getOrders, getMaterials } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { Clock, Eye, EyeOff } from 'lucide-react';
import PasswordPromptModal from './PasswordPromptModal';
import CashRegisterSummaryCard from './cash-register/CashRegisterSummaryCard';
import CashRegisterStatus from './cash-register/CashRegisterStatus';
import CashRegisterFinalAmount from './cash-register/CashRegisterFinalAmount';
import CashRegisterExportModal from './CashRegisterExportModal';
import { CashRegister, CashSummary, Order, Material } from '../types/pdv';
import { 
  calculatePurchasePaymentBreakdown,
  calculateSalesPaymentBreakdown, 
  calculatePurchaseWeight,
  calculateSalesWeight,
  calculateSalesTransactionsCount,
  formatCurrencyInput, 
  parseCurrencyInput,
  PaymentBreakdown 
} from '../utils/cashRegisterCalculations';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';

const formSchema = z.object({
  finalAmount: z
    .number({ required_error: "Valor final é obrigatório" })
    .min(0, "O valor não pode ser negativo")
});

interface CashRegisterClosingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CashRegisterClosingModal: React.FC<CashRegisterClosingModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  const { user } = useAuth();
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const [realTimeDifference, setRealTimeDifference] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingFinalAmount, setPendingFinalAmount] = useState<number | null>(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [purchaseBreakdown, setPurchaseBreakdown] = useState<PaymentBreakdown>({
    cashAmount: 0,
    pixAmount: 0,
    debitAmount: 0,
    creditAmount: 0
  });
  const [salesBreakdown, setSalesBreakdown] = useState<PaymentBreakdown>({
    cashAmount: 0,
    pixAmount: 0,
    debitAmount: 0,
    creditAmount: 0
  });
  const [purchaseWeight, setPurchaseWeight] = useState(0);
  const [salesWeight, setSalesWeight] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [stockProfitProjection, setStockProfitProjection] = useState(0);
  const [totalStockWeight, setTotalStockWeight] = useState(0);
  const [showData, setShowData] = useState(false);
  const mask = (v: React.ReactNode, show: boolean) => (show ? v : '••••••');

  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalAmount: 0
    }
  });

  const finalAmountValue = form.watch('finalAmount');

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      setShowData(false);
      setShowData(false);
      setShowData(false);
      loadData();
      if (user) {
        loadSystemSettings();
      }
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      const register = await getActiveCashRegister();
      if (register) {
        setActiveCashRegister(register);
        const summary = await calculateCashSummary(register);
        setCashSummary(summary);
        
        // Calculate total relevant transactions
        const relevantTransactions = register.transactions.filter(transaction => 
          transaction.type === 'sale' || 
          transaction.type === 'purchase' || 
          transaction.type === 'expense' || 
          transaction.type === 'addition'
        );
        setTotalTransactions(relevantTransactions.length);

        // Calculate payment breakdown for both purchases and sales
        const purchaseBD = await calculatePurchasePaymentBreakdown(register, getOrders);
        setPurchaseBreakdown(purchaseBD);
        
        const salesBD = await calculateSalesPaymentBreakdown(register, getOrders);
        setSalesBreakdown(salesBD);
        
        // Calculate weights for purchases and sales
        const purchaseW = await calculatePurchaseWeight(register, getOrders);
        setPurchaseWeight(purchaseW);
        
        const salesW = await calculateSalesWeight(register, getOrders);
        setSalesWeight(salesW);
        
        // Calculate sales transactions count
        const salesC = await calculateSalesTransactionsCount(register, getOrders);
        setSalesCount(salesC);
        
        // Calculate profit metrics - using Cost of Goods Sold (COGS) methodology
        const totalExpensesValue = summary.expenses ? summary.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
        
        // Calculate Cost of Goods Sold (CMV) for sales in this cash register period
        const costOfGoodsSold = await calculateCostOfGoodsSold(register);
        
        // Lucro Bruto = Vendas - CMV (custo real dos materiais vendidos)
        const calculatedGrossProfit = summary.totalSales - costOfGoodsSold;
        
        // Lucro Líquido = Lucro Bruto - Despesas
        const calculatedNetProfit = calculatedGrossProfit - totalExpensesValue;
        
        setGrossProfit(calculatedGrossProfit);
        setNetProfit(calculatedNetProfit);
        
        console.log('Cost of Goods Sold (CMV):', costOfGoodsSold);
        console.log('Gross Profit (Lucro Bruto):', calculatedGrossProfit);
        console.log('Net Profit (Lucro Líquido):', calculatedNetProfit);
        
        // Calculate stock profit projection
        const stockData = await calculateStockProfitProjection();
        setTotalStockWeight(stockData.totalWeight);
        // Projeção considera despesas do período atual
        setStockProfitProjection(stockData.potentialProfit - totalExpensesValue);
        
        console.log('Purchase breakdown calculated:', purchaseBD);
        console.log('Sales breakdown calculated:', salesBD);
        console.log('Purchase weight calculated:', purchaseW);
        console.log('Sales weight calculated:', salesW);
        console.log('Sales count calculated:', salesC);
        console.log('Stock profit projection:', stockData.potentialProfit - totalExpensesValue);
        console.log('Gross Profit:', calculatedGrossProfit);
        console.log('Net Profit:', calculatedNetProfit);
      }
    } catch (error) {
      console.error('Error loading cash register data:', error);
    }
  };

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

  // Calculate stock profit projection based ONLY on purchases made during current cash register session
  const calculateStockProfitProjection = async () => {
    try {
      // Get active cash register to filter by session period
      const register = await getActiveCashRegister();
      if (!register) {
        return { totalWeight: 0, totalCost: 0, projectedSale: 0, potentialProfit: 0 };
      }

      const orders = await getOrders();
      const materials = await getMaterials();
      
      // Map current sale prices by material name (normalized)
      const materialPrices = new Map<string, number>();
      materials.forEach(m => {
        materialPrices.set(m.name.toLowerCase().trim(), m.salePrice);
      });
      
      // Calculate purchases made ONLY during current cash register session
      const materialData = new Map<string, {
        totalPurchaseQty: number;
        totalPurchaseCost: number;
      }>();
      
      // Filter: completed, not cancelled, purchase type, within cash register session period
      orders.filter(o => 
        o.status === 'completed' && 
        !o.cancelled && 
        o.type === 'compra' &&
        o.timestamp >= register.openingTimestamp &&
        (!register.closingTimestamp || o.timestamp <= register.closingTimestamp)
      ).forEach(order => {
        order.items.forEach(item => {
          const key = item.materialName.toLowerCase().trim();
          const current = materialData.get(key) || { 
            totalPurchaseQty: 0, 
            totalPurchaseCost: 0 
          };
          
          current.totalPurchaseQty += item.quantity;
          current.totalPurchaseCost += item.total;
          
          materialData.set(key, current);
        });
      });
      
      // Subtract sales (including vendas avulsas) from stock projection
      orders.filter(o => 
        o.status === 'completed' && 
        !o.cancelled && 
        o.type === 'venda' &&
        o.timestamp >= register.openingTimestamp &&
        (!register.closingTimestamp || o.timestamp <= register.closingTimestamp)
      ).forEach(order => {
        order.items.forEach(item => {
          // For vendas avulsas with linked material, use the linked material name and quantity
          const key = (item.linkedMaterialName || item.materialName).toLowerCase().trim();
          const soldQty = item.linkedStockQuantity ?? item.quantity;
          
          const current = materialData.get(key);
          if (current) {
            // Calculate proportional cost to subtract
            const avgCostPerUnit = current.totalPurchaseQty > 0 
              ? current.totalPurchaseCost / current.totalPurchaseQty 
              : 0;
            current.totalPurchaseQty = Math.max(0, current.totalPurchaseQty - soldQty);
            current.totalPurchaseCost = Math.max(0, current.totalPurchaseCost - (avgCostPerUnit * soldQty));
            materialData.set(key, current);
          }
        });
      });
      
      // Calculate projection: for each material remaining in stock, calculate potential profit
      let totalWeight = 0;
      let totalCost = 0;
      let totalProjectedSale = 0;
      
      materialData.forEach((data, key) => {
        const remainingQty = data.totalPurchaseQty;
        if (remainingQty > 0) {
          const salePrice = materialPrices.get(key) || 0;
          
          totalWeight += remainingQty;
          totalCost += data.totalPurchaseCost;
          totalProjectedSale += remainingQty * salePrice;
        }
      });
      
      return {
        totalWeight,
        totalCost,
        projectedSale: totalProjectedSale,
        potentialProfit: totalProjectedSale - totalCost
      };
    } catch (error) {
      console.error('Error calculating stock projection:', error);
      return { totalWeight: 0, totalCost: 0, projectedSale: 0, potentialProfit: 0 };
    }
  };

  // Calculate total opening amount (initial + additions) and fund additions count
  const getOpeningAmountAndAdditions = () => {
    if (!activeCashRegister) return { totalOpening: 0, additionsCount: 0 };
    
    const additionTransactions = activeCashRegister.transactions.filter(
      transaction => transaction.type === 'addition'
    );
    
    const totalAdditions = additionTransactions.reduce(
      (sum, transaction) => sum + transaction.amount, 0
    );
    
    return {
      totalOpening: activeCashRegister.initialAmount + totalAdditions,
      additionsCount: additionTransactions.length
    };
  };

  // Build material purchase price history (similar to SalesOrders.tsx)
  const buildMaterialPurchaseHistory = (orders: Order[]) => {
    const historyMap: Record<string, Array<{ timestamp: number; price: number }>> = {};
    
    orders.forEach(order => {
      if (order.type === 'compra' && order.status === 'completed' && !order.cancelled) {
        order.items.forEach(item => {
          const materialName = item.materialName.toLowerCase().trim();
          if (!historyMap[materialName]) {
            historyMap[materialName] = [];
          }
          historyMap[materialName].push({
            timestamp: order.timestamp,
            price: item.price
          });
        });
      }
    });
    
    // Sort by timestamp
    Object.keys(historyMap).forEach(key => {
      historyMap[key].sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return historyMap;
  };

  // Get last purchase price before a sale timestamp
  const getLastPurchasePrice = (
    materialName: string, 
    saleTimestamp: number,
    historyMap: Record<string, Array<{ timestamp: number; price: number }>>,
    materials: Material[]
  ): number => {
    const history = historyMap[materialName.toLowerCase().trim()];
    
    if (!history || history.length === 0) {
      // Fallback: use current material purchase price
      const material = materials.find(m => 
        m.name.toLowerCase().trim() === materialName.toLowerCase().trim()
      );
      return material?.price ?? 0;
    }
    
    let lastPrice: number | null = null;
    for (const purchase of history) {
      if (purchase.timestamp <= saleTimestamp) {
        lastPrice = purchase.price;
      } else {
        break;
      }
    }
    
    return lastPrice ?? history[0].price;
  };

  // Calculate Cost of Goods Sold (CMV) for sales in current cash register period
  const calculateCostOfGoodsSold = async (register: CashRegister): Promise<number> => {
    const orders = await getOrders();
    const materials = await getMaterials();
    
    const purchaseHistory = buildMaterialPurchaseHistory(orders);
    
    // Filter sales in current cash register period
    const salesInPeriod = orders.filter(order => 
      order.type === 'venda' && 
      order.status === 'completed' && 
      !order.cancelled &&
      order.timestamp >= register.openingTimestamp &&
      (!register.closingTimestamp || order.timestamp <= register.closingTimestamp)
    );
    
    let totalCOGS = 0;
    
    salesInPeriod.forEach(order => {
      order.items.forEach(item => {
        const purchasePrice = getLastPurchasePrice(
          item.materialName, 
          order.timestamp, 
          purchaseHistory,
          materials
        );
        totalCOGS += purchasePrice * item.quantity;
      });
    });
    
    return totalCOGS;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setInputValue('');
      form.setValue('finalAmount', 0);
      setRealTimeDifference(0);
    }
  }, [open, form]);

  // Update real-time difference whenever final amount changes
  useEffect(() => {
    if (cashSummary && finalAmountValue !== undefined) {
      const difference = finalAmountValue - cashSummary.expectedAmount;
      setRealTimeDifference(difference);
    }
  }, [finalAmountValue, cashSummary]);

  // Handle input change with currency formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Format the input value
    const formattedValue = formatCurrencyInput(value);
    setInputValue(formattedValue);
    
    // Parse and set the numeric value
    const numericValue = parseCurrencyInput(formattedValue);
    form.setValue('finalAmount', numericValue);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate that final amount is at least 0
    if (!inputValue || inputValue.trim() === '' || data.finalAmount < 0) {
      form.setError('finalAmount', {
        type: 'manual',
        message: 'Informe o valor final (mínimo R$ 0,00)'
      });
      return;
    }

    // Store the final amount and show print confirmation
    setPendingFinalAmount(data.finalAmount);
    setShowPrintConfirmation(true);
  };

  const handlePrintConfirmation = (shouldPrint: boolean) => {
    setShowPrintConfirmation(false);
    
    if (shouldPrint) {
      printCashRegisterSummary();
    }
    
    // Show export modal after print decision
    setShowExportModal(true);
  };

  const handleExportComplete = () => {
    setShowExportModal(false);
    // Show password modal after export modal
    setShowPasswordModal(true);
  };

  const printCashRegisterSummary = () => {
    if (!activeCashRegister || !cashSummary || pendingFinalAmount === null) return;

    const { totalOpening, additionsCount } = getOpeningAmountAndAdditions();
    const totalExpenses = cashSummary.expenses ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
    const { logo, whatsapp1, whatsapp2, address } = settings;

    // Get format settings from user's saved configuration
    const formatSettings = getCurrentFormatSettings();
    const currentFormat = getCurrentFormat();
    
    // Build format styles from user's saved settings
    const formatStyles = {
      pageSize: `${formatSettings.container_width} auto`,
      containerWidth: formatSettings.container_width,
      logoMaxWidth: formatSettings.logo_max_width,
      logoMaxHeight: formatSettings.logo_max_height,
      headerLogoWidth: currentFormat === '50mm' ? '25%' : '30%',
      headerInfoWidth: currentFormat === '50mm' ? '75%' : '70%',
      phoneFontSize: formatSettings.phone_font_size,
      addressFontSize: formatSettings.address_font_size,
      titleFontSize: formatSettings.title_font_size,
      customerFontSize: formatSettings.customer_font_size,
      tableFontSize: formatSettings.table_font_size,
      totalsFontSize: formatSettings.totals_font_size,
      finalTotalFontSize: formatSettings.final_total_font_size,
      datetimeFontSize: formatSettings.datetime_font_size,
      padding: formatSettings.padding,
      margins: formatSettings.margins
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumo do Fechamento de Caixa</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: ${formatStyles.pageSize};
            margin: 0;
            padding: 0;
          }
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${formatStyles.containerWidth};
            max-width: ${formatStyles.containerWidth};
          }
          
          @media print {
            html, body {
              min-height: auto !important;
              height: auto !important;
            }
          }
          
          body {
            font-family: 'Roboto', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            padding: ${formatStyles.padding};
            width: ${formatStyles.containerWidth};
            max-width: ${formatStyles.containerWidth};
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${formatStyles.margins};
          }
          
          .logo-container {
            width: ${formatStyles.headerLogoWidth};
            flex: 0 0 ${formatStyles.headerLogoWidth};
            margin: 0;
            padding: 0;
          }
          
          .logo-container img {
            max-width: ${formatStyles.logoMaxWidth};
            max-height: ${formatStyles.logoMaxHeight};
            margin: 0;
            padding: 0;
            filter: contrast(200%) brightness(0);
            -webkit-filter: contrast(200%) brightness(0);
          }
          
          .info-container {
            width: ${formatStyles.headerInfoWidth};
            flex: 0 0 ${formatStyles.headerInfoWidth};
            text-align: center;
          }
          
          .phone-numbers {
            font-size: ${formatStyles.phoneFontSize};
            font-weight: bold;
          }
          
          .address {
            font-size: ${formatStyles.addressFontSize};
            font-weight: bold;
            margin-top: ${formatStyles.margins};
            text-align: center;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .title {
            text-align: center;
            font-weight: bold;
            font-size: ${formatStyles.titleFontSize};
            margin-bottom: 1.05mm;
          }
          
          .customer {
            text-align: center;
            margin-bottom: 3.6mm;
            font-size: ${formatStyles.customerFontSize};
            font-weight: bold;
          }
          
          .separator {
            border-bottom: 2px solid #000;
            margin: ${formatStyles.margins};
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${formatStyles.tableFontSize};
            margin-bottom: 3mm;
            font-weight: bold;
          }
          
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 2mm 0;
            font-weight: bold;
          }
          
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: right;
          }
          
          td {
            padding: 1mm 0;
            vertical-align: top;
            font-weight: bold;
            word-wrap: break-word;
          }
          
          td:nth-child(2), td:nth-child(3), td:nth-child(4) {
            text-align: right;
          }
          
          .totals {
            display: flex;
            justify-content: space-between;
            margin: 1.4mm 0;
            font-size: ${formatStyles.totalsFontSize};
            font-weight: bold;
          }
          
          .final-total {
            text-align: right;
            font-weight: bold;
            font-size: ${formatStyles.finalTotalFontSize};
            margin: 2.16mm 0;
          }
          
          .datetime {
            text-align: center;
            font-size: ${formatStyles.datetimeFontSize};
            margin: ${formatStyles.margins};
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logo ? `
            <div class="logo-container">
              <img src="${logo}" alt="Logo" />
            </div>
          ` : `<div class="logo-container"></div>`}
          
          <div class="info-container">
            <div class="phone-numbers">
              ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
              ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
            </div>
            ${address ? `
              <div class="address">
                <div style="word-wrap: break-word; overflow-wrap: break-word;">
                  ${address}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
        
        <div class="title">
          RESUMO DO FECHAMENTO DE CAIXA
        </div>
        
        <div class="customer">
          Data: ${new Date(activeCashRegister.openingTimestamp).toLocaleDateString('pt-BR')}
        </div>
        
        <div class="separator"></div>
        
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Abertura</td>
              <td>R$ ${activeCashRegister.initialAmount.toFixed(2)}</td>
            </tr>
            
            ${additionsCount > 0 ? `
            <tr>
              <td>Adições (${additionsCount})</td>
              <td>R$ ${(totalOpening - activeCashRegister.initialAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Abertura</td>
              <td>R$ ${totalOpening.toFixed(2)}</td>
            </tr>
            ` : ''}
            
            <tr>
              <td>Total Vendas</td>
              <td>R$ ${cashSummary.totalSales.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Compras Dinheiro</td>
              <td>R$ ${purchaseBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Compras PIX</td>
              <td>R$ ${purchaseBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas Dinheiro</td>
              <td>R$ ${salesBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas PIX</td>
              <td>R$ ${salesBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Total Despesas</td>
              <td>R$ ${totalExpenses.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Total Peso Compras</td>
              <td>${purchaseWeight.toFixed(3)} kg</td>
            </tr>
            
            <tr>
              <td>Total Peso Vendas</td>
              <td>${salesWeight.toFixed(3)} kg</td>
            </tr>
            
            <tr>
              <td>Vendas Dinheiro</td>
              <td>R$ ${salesBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas PIX</td>
              <td>R$ ${salesBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Transações de Vendas</td>
              <td>${salesCount}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="separator"></div>
        
        <div class="totals">
          <span>Saldo Esperado:</span>
          <span>R$ ${cashSummary.expectedAmount.toFixed(2)}</span>
        </div>
        
        <div class="final-total">
          Saldo Final: R$ ${pendingFinalAmount.toFixed(2)}
        </div>
        
        <div class="totals">
          <span>Diferença:</span>
          <span>
            ${realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'} 
            R$ ${Math.abs(realTimeDifference).toFixed(2)}
          </span>
        </div>
        
        <div class="separator"></div>
        
        <div class="totals">
          <span>Total Transações:</span>
          <span>${totalTransactions}</span>
        </div>
        
        <div class="separator"></div>
        
        <div style="text-align: center; font-weight: bold; margin: 3mm 0 2mm;">*** CONTABILIDADE ***</div>
        
        <div class="totals">
          <span>Lucro Bruto:</span>
          <span>R$ ${grossProfit.toFixed(2)}</span>
        </div>
        
        <div class="totals">
          <span>Lucro Líquido:</span>
          <span>R$ ${netProfit.toFixed(2)}</span>
        </div>
        
        <div class="totals">
          <span>Lucro Previsto:</span>
          <span>R$ ${stockProfitProjection.toFixed(2)}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="datetime">
          *** FECHAMENTO DE CAIXA ***
        </div>
        
        <div class="datetime">
          ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handlePasswordAuthenticated = () => {
    if (pendingFinalAmount !== null) {
      executeCloseCashRegister(pendingFinalAmount);
      setPendingFinalAmount(null);
    }
  };

  const executeCloseCashRegister = async (finalAmount: number) => {
    try {
      const closedRegister = await closeActiveCashRegister(finalAmount, grossProfit, netProfit);
      
      if (closedRegister) {
        toast({
          title: "Caixa fechado com sucesso",
          description: `Saldo final: R$ ${finalAmount.toFixed(2)}`,
          duration: 3000,
        });
        onOpenChange(false);
        onComplete();
      } else {
        toast({
          title: "Erro ao fechar caixa",
          description: "Ocorreu um erro ao fechar o caixa. Tente novamente.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error closing cash register:', error);
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro ao fechar o caixa. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Handle cancel closing
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!cashSummary || !activeCashRegister) {
    return null;
  }

  // Calculate total expenses if they exist in cashSummary
  const totalExpenses = cashSummary.expenses ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
  const { totalOpening, additionsCount } = getOpeningAmountAndAdditions();

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={onOpenChange}
      >
        <DialogContent className={`!fixed !top-0 !left-0 !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none bg-gray-900 text-white border-gray-800 overflow-hidden flex flex-col`}>
          <DialogHeader className="pb-2 shrink-0">
            <DialogTitle className="text-center text-white flex items-center justify-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4" /> Fechamento de Caixa
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 text-xs">
              Resumo do dia {new Date(activeCashRegister.openingTimestamp).toLocaleDateString('pt-BR')}
            </DialogDescription>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowData(v => !v)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors shadow-sm shadow-emerald-500/10"
                aria-label={showData ? 'Esconder dados' : 'Mostrar dados'}
              >
                {showData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-xs font-semibold tracking-wider">
                  {showData ? 'ESCONDER DADOS' : 'MOSTRAR DADOS'}
                </span>
              </button>
            </div>
          </DialogHeader>

          
          {isMobileOrTablet ? (
            // Mobile/Tablet Layout - Vertical stacked cards
            <div className="flex flex-col space-y-1.5 overflow-y-auto px-2 pb-4 flex-1">
              <CashRegisterSummaryCard
                title="Valor de Abertura"
                value={`R$ ${totalOpening.toFixed(2)}`}
                subtitle={additionsCount > 0 ? `(+${additionsCount} ${additionsCount > 1 ? 'adições' : 'adição'} de saldo)` : undefined}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Vendas"
                value={`R$ ${cashSummary.totalSales.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Compras em Dinheiro"
                value={`R$ ${purchaseBreakdown.cashAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Compras em PIX"
                value={`R$ ${purchaseBreakdown.pixAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Vendas em Dinheiro"
                value={`R$ ${salesBreakdown.cashAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Vendas em PIX"
                value={`R$ ${salesBreakdown.pixAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Despesas"
                value={`R$ ${totalExpenses.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Peso"
                value={`${purchaseWeight.toFixed(3)} kg`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Saldo Esperado"
                value={`R$ ${cashSummary.expectedAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Transações"
                value={totalTransactions}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Adições de Saldo"
                value={additionsCount}
                isMobileOrTablet={isMobileOrTablet}
              />
              
              {/* Seção de Contabilidade - Mobile */}
              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="text-center text-slate-400 text-xs font-semibold mb-2">CONTABILIDADE</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
                    <div className="text-emerald-400 text-[10px] mb-1">Lucro Bruto</div>
                    <div className="text-emerald-400 font-bold text-base">R$ {grossProfit.toFixed(2)}</div>
                  </div>
                  <div className={`${netProfit >= 0 ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-rose-900/30 border-rose-500/30'} border rounded-lg p-3`}>
                    <div className={`${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-[10px] mb-1`}>Lucro Líquido</div>
                    <div className={`${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold text-base`}>R$ {netProfit.toFixed(2)}</div>
                  </div>
                  <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-3">
                    <div className="text-cyan-400 text-[10px] mb-1">Lucro Previsto</div>
                    <div className={`${stockProfitProjection >= 0 ? 'text-cyan-400' : 'text-rose-400'} font-bold text-base`}>
                      {stockProfitProjection >= 0 ? '+' : ''}R$ {stockProfitProjection.toFixed(2)}
                    </div>
                    <div className="text-cyan-400/60 text-[8px]">({totalStockWeight.toFixed(1)} kg)</div>
                  </div>
                </div>
              </div>
              
              {/* Status do Caixa */}
              <div className="bg-gray-800 px-3 py-2 rounded-sm">
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-[10px]">Status do Caixa</div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-base ${
                      realTimeDifference === 0 
                        ? "text-pdv-green" 
                        : realTimeDifference > 0 
                          ? "text-blue-400" 
                          : "text-pdv-red"
                    }`}>
                      {realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'}
                    </span>
                    <span className={`font-semibold text-sm ${
                      realTimeDifference === 0 
                        ? "text-pdv-green" 
                        : realTimeDifference > 0 
                          ? "text-blue-400" 
                          : "text-pdv-red"
                    }`}>
                      R$ {Math.abs(realTimeDifference).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Saldo Final */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="finalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="bg-gray-800 rounded-sm px-3 py-2">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-gray-300 text-[10px]">Saldo Final (R$)</div>
                          </div>
                          <div className="w-full mx-auto">
                            <CashRegisterFinalAmount
                              inputValue={inputValue}
                              onInputChange={handleInputChange}
                              autoFocus={true}
                            />
                          </div>
                        </div>
                        <FormMessage className="text-pdv-red text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3 pt-1">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancel}
                      className="bg-transparent hover:bg-gray-700 text-white border-gray-600 text-base w-full h-11"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-pdv-red hover:bg-red-700 text-base w-full h-11"
                    >
                      Fechar Caixa
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            // Desktop Layout - Redesign Equilibrado
            <div className="flex flex-col flex-1 min-h-0 gap-4 px-6 pb-4 pt-2 overflow-y-auto w-full max-w-6xl mx-auto">
              
              {/* RESUMO OPERACIONAL - 4 colunas */}
              <div className="space-y-2">
                <div className="text-center text-slate-400 text-xs font-medium tracking-wider uppercase">
                  Resumo Operacional
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Abertura</div>
                    <div className="text-white font-bold text-xl">{showData ? `R$ ${totalOpening.toFixed(2)}` : '••••••'}</div>
                    {additionsCount > 0 && showData && (
                      <div className="text-slate-500 text-[10px]">(+{additionsCount} adição)</div>
                    )}
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Transações</div>
                    <div className="text-white font-bold text-xl">{showData ? totalTransactions : '••••'}</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Peso Total</div>
                    <div className="text-white font-bold text-xl">{showData ? `${purchaseWeight.toFixed(3)} kg` : '••••••'}</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Adições</div>
                    <div className="text-white font-bold text-xl">{showData ? additionsCount : '••••'}</div>
                  </div>
                </div>
              </div>

              {/* FLUXO FINANCEIRO - Lista unificada */}
              <div className="space-y-2">
                <div className="text-center text-slate-400 text-xs font-medium tracking-wider uppercase">
                  Fluxo Financeiro
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg divide-y divide-slate-700/50">
                  {/* Compras */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <span className="text-slate-200 text-base font-medium">Compras (Saídas)</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-400 text-sm">Din: R$ {purchaseBreakdown.cashAmount.toFixed(2)} | PIX: R$ {purchaseBreakdown.pixAmount.toFixed(2)}</span>
                      <span className="font-bold text-rose-400 text-xl w-32 text-right">R$ {cashSummary.totalPurchases.toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Vendas */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-slate-200 text-base font-medium">Vendas (Entradas)</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-400 text-sm">Din: R$ {salesBreakdown.cashAmount.toFixed(2)} | PIX: R$ {salesBreakdown.pixAmount.toFixed(2)}</span>
                      <span className="font-bold text-emerald-400 text-xl w-32 text-right">R$ {cashSummary.totalSales.toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Despesas */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <span className="text-slate-200 text-base font-medium">Despesas</span>
                    </div>
                    <span className="font-bold text-amber-400 text-xl w-32 text-right">R$ {totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* RESULTADO - 3 colunas */}
              <div className="space-y-2">
                <div className="text-center text-slate-400 text-xs font-medium tracking-wider uppercase">
                  Resultado
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Lucro Bruto</div>
                    <div className="text-emerald-400 font-bold text-2xl">{showData ? `R$ ${grossProfit.toFixed(2)}` : '••••••'}</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Lucro Líquido</div>
                    <div className={`font-bold text-2xl ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {showData ? `R$ ${netProfit.toFixed(2)}` : '••••••'}
                    </div>
                  </div>
                  <div className="bg-slate-800/60 border border-cyan-500/30 px-4 py-3 rounded-lg text-center">
                    <div className="text-cyan-400 text-xs mb-1">Lucro Previsto (Estoque)</div>
                    <div className={`font-bold text-2xl ${stockProfitProjection >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {showData ? `${stockProfitProjection >= 0 ? '+' : ''}R$ ${stockProfitProjection.toFixed(2)}` : '••••••'}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      {showData ? `${totalStockWeight.toFixed(3)} kg em estoque` : '••••••'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONFERÊNCIA - 3 colunas incluindo input */}
              <div className="space-y-2">
                <div className="text-center text-slate-400 text-xs font-medium tracking-wider uppercase">
                  Conferência
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Esperado</div>
                    <div className="text-white font-bold text-xl">{showData ? `R$ ${cashSummary.expectedAmount.toFixed(2)}` : '••••••'}</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Status</div>
                    <div className={`font-bold text-xl ${
                      realTimeDifference === 0 
                        ? "text-emerald-400" 
                        : realTimeDifference > 0 
                          ? "text-blue-400" 
                          : "text-rose-400"
                    }`}>
                      {showData ? (realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA') : '••••'}
                    </div>
                    <div className={`text-sm ${
                      realTimeDifference === 0 
                        ? "text-emerald-400/80" 
                        : realTimeDifference > 0 
                          ? "text-blue-400/80" 
                          : "text-rose-400/80"
                    }`}>
                      {showData ? `R$ ${Math.abs(realTimeDifference).toFixed(2)}` : '••••••'}
                    </div>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
                      <FormField
                        control={form.control}
                        name="finalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <div className="bg-slate-700/60 border border-slate-500 rounded-lg px-4 py-3 text-center">
                              <div className="text-slate-300 text-xs mb-1">Saldo Final (R$)</div>
                              <CashRegisterFinalAmount
                                inputValue={inputValue}
                                onInputChange={handleInputChange}
                                autoFocus={true}
                              />
                            </div>
                            <FormMessage className="text-rose-400 text-xs mt-1" />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex gap-4 pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-transparent hover:bg-slate-700 text-white border-slate-600 text-base flex-1 h-12"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-base flex-1 h-12"
                >
                  Fechar Caixa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Confirmation Dialog */}
      <Dialog open={showPrintConfirmation} onOpenChange={setShowPrintConfirmation}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center text-white">Deseja imprimir resumo?</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Imprimir o resumo do fechamento de caixa antes de finalizar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 justify-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handlePrintConfirmation(false)}
              className="bg-transparent hover:bg-gray-700 text-white border-gray-600"
            >
              Não
            </Button>
            <Button 
              type="button" 
              onClick={() => handlePrintConfirmation(true)}
              className="bg-pdv-red hover:bg-red-700"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <CashRegisterExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onComplete={handleExportComplete}
        cashRegister={activeCashRegister}
        cashSummary={cashSummary}
        pendingFinalAmount={pendingFinalAmount}
        purchaseBreakdown={purchaseBreakdown}
        salesBreakdown={salesBreakdown}
        purchaseWeight={purchaseWeight}
        salesWeight={salesWeight}
        salesCount={salesCount}
        totalTransactions={totalTransactions}
        totalOpening={totalOpening}
        additionsCount={additionsCount}
        realTimeDifference={realTimeDifference}
        userWhatsapp={settings.whatsapp1}
        companyName={settings.company}
        companyLogo={settings.logo}
        companyAddress={settings.address}
        companyWhatsapp={settings.whatsapp1}
      />

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Fechamento"
        description="Digite sua senha para confirmar o fechamento do caixa"
      />
    </>
  );
};

export default CashRegisterClosingModal;
