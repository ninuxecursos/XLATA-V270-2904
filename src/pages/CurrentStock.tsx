import React, { useState, useMemo, useEffect } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Archive, Search, X, Trash2, Package, TrendingUp, DollarSign, Scale, AlertTriangle } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials, saveMaterial, saveCustomer, saveOrder, removeMaterial, getCashRegisters } from '@/utils/supabaseStorage';
import { getOrdersForUser, getMaterialsForUser, getCashRegistersForUser } from '@/utils/adminDataAccess';
import { useStockCalculation } from '@/hooks/useStockCalculation';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import ClearStockModal from '@/components/ClearStockModal';

import MaterialDetailsView from '@/components/MaterialDetailsView';
import OrphanMaterialsModal from '@/components/OrphanMaterialsModal';
import MaterialPriceEditModal from '@/components/MaterialPriceEditModal';
import SellAllStockModal, { SaleResult } from '@/components/SellAllStockModal';
import ReceiptPrintModal from '@/components/ReceiptPrintModal';
import { Order, Customer, CashRegister } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Label } from '@/components/ui/label';
import { getOrphanMaterials, OrphanMaterial } from '@/utils/orphanMaterials';
import { toast } from '@/hooks/use-toast';
import { useDepotClients } from '@/hooks/useDepotClients';
import { AdminViewBanner } from '@/components/admin/AdminViewBanner';
interface MaterialStock {
  materialName: string;
  currentStock: number;
  purchasePrice: number; // Preço atual do cadastro (referência)
  salePrice: number; // Preço de venda atual do cadastro
  totalValue: number; // Custo real do estoque (baseado em preços históricos)
  profitProjection: number; // Projeção de lucro (valor venda - custo real)
  totalPurchases: number; // Valor total das compras
  totalSales: number; // Valor total das vendas
  // Novos campos para cálculo com preços históricos
  totalPurchaseCost: number; // Soma real dos valores pagos nas compras
  totalPurchaseQuantity: number; // Quantidade total comprada
  avgPurchasePrice: number; // Preço médio ponderado de compra
  // Campos de ajuste de preço acumulado
  totalPurchaseDiscount: number; // Total de descontos nas compras (valores negativos)
  totalPurchaseSurcharge: number; // Total de acréscimos nas compras (valores positivos)
  totalSaleDiscount: number; // Total de descontos nas vendas (valores negativos)
  totalSaleSurcharge: number; // Total de acréscimos nas vendas (valores positivos)
  transactions: Array<{
    date: number;
    type: 'compra' | 'venda';
    quantity: number;
    price: number;
    total: number;
    priceAdjustment?: number;
    tara?: number;
  }>;
}

const CurrentStock = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const materialFromUrl = searchParams.get('material');
  
  // Admin view state
  const adminViewingUser = location.state?.adminViewingUser;
  const adminViewingUserName = location.state?.adminViewingUserName;
  const isAdminView = !!adminViewingUser;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearStockModal, setShowClearStockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStock | null>(null);
  const [showMaterialDetails, setShowMaterialDetails] = useState(false);
  
  // Orphan materials state
  const [orphanMaterials, setOrphanMaterials] = useState<OrphanMaterial[]>([]);
  const [showOrphanModal, setShowOrphanModal] = useState(false);

  // Price edit modal state
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [editingMaterialName, setEditingMaterialName] = useState('');
  const [editingMaterialPrices, setEditingMaterialPrices] = useState({ purchase: 0, sale: 0 });

  // Sell stock modal state
  const [showSellStockModal, setShowSellStockModal] = useState(false);
  const [materialToSell, setMaterialToSell] = useState<MaterialStock | null>(null);

  // Receipt print modal state (for stock sales)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [saleReceiptData, setSaleReceiptData] = useState<SaleResult | null>(null);

  // Depot clients for sale identification
  const { clients: depotClients } = useDepotClients();
  
  // Stock calculation hook for cache invalidation
  const { clearCache } = useStockCalculation();

  const loadOrphans = async () => {
    try {
      const orphans = await getOrphanMaterials();
      setOrphanMaterials(orphans);
    } catch (error) {
      console.error('Error loading orphan materials:', error);
    }
  };

  const loadData = async () => {
    try {
      let ordersData, materialsData, cashRegistersData;
      
      if (isAdminView && adminViewingUser) {
        // Load data for the specific user being viewed by admin
        [ordersData, materialsData, cashRegistersData] = await Promise.all([
          getOrdersForUser(adminViewingUser),
          getMaterialsForUser(adminViewingUser),
          getCashRegistersForUser(adminViewingUser)
        ]);
      } else {
        // Load data for the current user
        [ordersData, materialsData, cashRegistersData] = await Promise.all([
          getOrders(),
          getMaterials(),
          getCashRegisters()
        ]);
      }
      
      setOrders(ordersData);
      setMaterials(materialsData);
      setCashRegisters(cashRegistersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStockRequest = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    setShowClearStockModal(true);
  };

  const handleStockCleared = () => {
    loadData();
    loadOrphans();
  };

  const handleOrphanDataChanged = () => {
    loadData();
    loadOrphans();
  };

  const handleExitAdminView = () => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {}
    });
  };

  useEffect(() => {
    loadData();
    loadOrphans();
  }, [isAdminView, adminViewingUser]);
  const uniqueMaterials = useMemo(() => {
    return materials
      .map(m => m.name)
      .filter(Boolean)
      .sort();
  }, [materials]);

  // Calcular despesas totais de todo o histórico
  const totalExpensesAll = useMemo(() => {
    let total = 0;
    cashRegisters.forEach(register => {
      register.transactions?.forEach(transaction => {
        if (transaction.type === 'expense') {
          total += transaction.amount;
        }
      });
    });
    return total;
  }, [cashRegisters]);

  const { filteredStockData, totalStockData, filteredTotals } = useMemo(() => {
    const materialStocks: { [key: string]: MaterialStock } = {};

    orders.forEach(order => {
      if (order.status === 'completed' && !order.cancelled) {
        order.items.forEach(item => {
          // Use normalized key (lowercase) to consolidate materials with different casing
          const normalizedKey = item.materialName.toLowerCase().trim();
          
          if (!materialStocks[normalizedKey]) {
            // Find material using case-insensitive match
            const material = materials.find(m => m.name.toLowerCase().trim() === normalizedKey);
            materialStocks[normalizedKey] = {
              materialName: item.materialName, // Keep original display name (first found)
              currentStock: 0,
              purchasePrice: material?.price || 0, // Preço atual (referência)
              salePrice: material?.salePrice || 0, // Preço de venda atual
              totalValue: 0,
              profitProjection: 0,
              totalPurchases: 0,
              totalSales: 0,
              // Novos campos para cálculo histórico
              totalPurchaseCost: 0,
              totalPurchaseQuantity: 0,
              avgPurchasePrice: 0,
              // Campos de ajuste acumulado
              totalPurchaseDiscount: 0,
              totalPurchaseSurcharge: 0,
              totalSaleDiscount: 0,
              totalSaleSurcharge: 0,
              transactions: []
            };
          }

          // Calcular ajuste de preço total (ajuste por kg * quantidade)
          const priceAdjustment = item.priceAdjustment || 0;
          const totalAdjustment = priceAdjustment * item.quantity;

          // Registrar transação SEMPRE (independente de filtros)
          materialStocks[normalizedKey].transactions.push({
            date: order.timestamp,
            type: order.type,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            priceAdjustment: priceAdjustment,
            tara: item.tara || 0
          });

          if (order.type === 'compra') {
            materialStocks[normalizedKey].currentStock += item.quantity;
            materialStocks[normalizedKey].totalPurchases += item.total;
            // Acumular custo real e quantidade das compras
            materialStocks[normalizedKey].totalPurchaseCost += item.total;
            materialStocks[normalizedKey].totalPurchaseQuantity += item.quantity;
            // Acumular ajustes de compra
            if (totalAdjustment < 0) {
              materialStocks[normalizedKey].totalPurchaseDiscount += totalAdjustment;
            } else if (totalAdjustment > 0) {
              materialStocks[normalizedKey].totalPurchaseSurcharge += totalAdjustment;
            }
          } else if (order.type === 'venda') {
            materialStocks[normalizedKey].currentStock -= item.quantity;
            materialStocks[normalizedKey].totalSales += item.total;
            // Acumular ajustes de venda
            if (totalAdjustment < 0) {
              materialStocks[normalizedKey].totalSaleDiscount += totalAdjustment;
            } else if (totalAdjustment > 0) {
              materialStocks[normalizedKey].totalSaleSurcharge += totalAdjustment;
            }
          }
        });
      }
    });

    const hasActiveFilters = (selectedPeriod && selectedPeriod !== 'all') || (selectedPeriod === 'custom' && filterStartDate && filterEndDate) || selectedMaterials.length > 0;

    const now = new Date();
    let periodStart: Date | null = null;
    let periodEnd: Date = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      periodStart = new Date(filterStartDate + 'T00:00:00');
      periodEnd = new Date(filterEndDate + 'T23:59:59.999');
    } else if (selectedPeriod && selectedPeriod !== 'all') {
      switch (selectedPeriod) {
        case 'daily':
          periodStart = new Date(now);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(now);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'last30':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 30);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last60':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 60);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last90':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 90);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last365':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 365);
          periodStart.setHours(0, 0, 0, 0);
          break;
      }
    }

    // Calcular totais do período filtrado - separando compras e vendas
    const filteredPeriodTotals: { [key: string]: { weight: number; purchases: number; sales: number; purchaseQuantity: number } } = {};

    if (hasActiveFilters && periodStart) {
      orders.forEach(order => {
        if (order.status !== 'completed' || order.cancelled) return;
        
        const orderDate = new Date(order.timestamp);
        // Verificar se a ordem está dentro do período filtrado
        if (orderDate >= periodStart && orderDate <= periodEnd) {
          order.items.forEach(item => {
            const normalizedKey = item.materialName.toLowerCase().trim();
            
            // Só contabilizar se o material existe no estoque
            if (materialStocks[normalizedKey]) {
              if (!filteredPeriodTotals[normalizedKey]) {
                filteredPeriodTotals[normalizedKey] = { weight: 0, purchases: 0, sales: 0, purchaseQuantity: 0 };
              }

              if (order.type === 'compra') {
                filteredPeriodTotals[normalizedKey].weight += item.quantity;
                filteredPeriodTotals[normalizedKey].purchases += item.total;
                filteredPeriodTotals[normalizedKey].purchaseQuantity += item.quantity;
              } else if (order.type === 'venda') {
                filteredPeriodTotals[normalizedKey].weight -= item.quantity;
                filteredPeriodTotals[normalizedKey].sales += item.total;
              }
            }
          });
        }
      });
    }

    // Calcular despesas do período filtrado
    let periodExpenses = 0;
    if (hasActiveFilters && periodStart) {
      cashRegisters.forEach(register => {
        const registerDate = new Date(register.openingTimestamp);
        if (registerDate >= periodStart! && registerDate <= periodEnd) {
          register.transactions?.forEach(transaction => {
            if (transaction.type === 'expense') {
              periodExpenses += transaction.amount;
            }
          });
        }
      });
    }

    Object.values(materialStocks).forEach(stock => {
      // Calcular preço médio ponderado de compra (CMP)
      if (stock.totalPurchaseQuantity > 0) {
        stock.avgPurchasePrice = stock.totalPurchaseCost / stock.totalPurchaseQuantity;
      }
      
      // Clamp: estoque nunca fica negativo (consistente com useStockCalculation)
      stock.currentStock = Math.max(0, stock.currentStock);
      
      if (stock.currentStock > 0) {
        // Custo real do estoque = estoque atual × preço médio de compra
        stock.totalValue = stock.currentStock * stock.avgPurchasePrice;
        // Projeção de lucro = (preço venda atual × estoque) - custo real
        const projectedSaleValue = stock.salePrice * stock.currentStock;
        stock.profitProjection = projectedSaleValue - stock.totalValue;
      }
      stock.transactions.sort((a, b) => b.date - a.date);
    });

    // Filter out materials with ZERO stock only - show positive AND negative stock
    // Negative stock indicates data inconsistency the user should see and fix
    const totalStockData = Object.values(materialStocks).filter(stock => stock.currentStock !== 0);
    
    let filteredStockData = Object.values(materialStocks).filter(stock => stock.currentStock !== 0);
    
    if (selectedMaterials.length > 0) {
      // Use exact match (case-insensitive) for selected materials filter
      filteredStockData = filteredStockData.filter(stock => 
        stock.materialName && selectedMaterials.some(selectedMaterial => 
          selectedMaterial && stock.materialName.toLowerCase().trim() === selectedMaterial.toLowerCase().trim()
        )
      );
    }

    // Calcular totais filtrados considerando a chave normalizada
    const filteredEntries = Object.entries(filteredPeriodTotals);
    
    // Filtrar entradas com base nos materiais selecionados
    const matchingEntries = filteredEntries.filter(([normalizedKey]) => {
      return selectedMaterials.length === 0 || selectedMaterials.some(selected => 
        selected && normalizedKey === selected.toLowerCase().trim()
      );
    });
    
    // Calcular totais de compras e vendas do período
    const totalPurchasesFiltered = matchingEntries.reduce((sum, [, totals]) => sum + totals.purchases, 0);
    const totalSalesFiltered = matchingEntries.reduce((sum, [, totals]) => sum + totals.sales, 0);
    
    // Calcular projeção de venda baseada no preço de venda dos materiais comprados no período
    let projectedSaleValueFiltered = 0;
    matchingEntries.forEach(([normalizedKey, totals]) => {
      // Buscar o preço de venda atual do material
      const materialData = Object.values(materialStocks).find(
        s => s.materialName.toLowerCase().trim() === normalizedKey
      );
      if (materialData && totals.purchaseQuantity > 0) {
        projectedSaleValueFiltered += materialData.salePrice * totals.purchaseQuantity;
      }
    });
    
    // Lucro Bruto = Projeção de Venda - Compras (não "vendas realizadas - compras")
    const grossProfit = projectedSaleValueFiltered - totalPurchasesFiltered;
    
    // Lucro Líquido = Lucro Bruto - Despesas
    const periodProfit = grossProfit - periodExpenses;
    
    const filteredTotals = hasActiveFilters ? {
      totalWeight: matchingEntries.reduce((sum, [, totals]) => sum + totals.weight, 0),
      
      materialsCount: matchingEntries.filter(([, totals]) => totals.weight !== 0).length,
        
      totalValue: totalPurchasesFiltered, // Valor de compras do período (para exibição)
      
      totalPurchases: totalPurchasesFiltered,
      totalSales: totalSalesFiltered,
      
      totalProfitProjection: 0,
      
      // Campos para despesas e lucro do período
      periodExpenses: periodExpenses,
      grossProfit: grossProfit,    // Vendas - Compras
      netProfit: periodProfit      // Lucro Bruto - Despesas
    } : {
      totalWeight: 0,
      materialsCount: 0,
      totalValue: 0,
      totalPurchases: 0,
      totalSales: 0,
      totalProfitProjection: 0,
      periodExpenses: 0,
      grossProfit: 0,
      netProfit: 0
    };

    return {
      filteredStockData: filteredStockData.sort((a, b) => b.currentStock - a.currentStock),
      totalStockData: totalStockData,
      filteredTotals
    };
  }, [orders, materials, selectedPeriod, filterStartDate, filterEndDate, selectedMaterials, cashRegisters]);

  // Apply material filter from URL param AND auto-open details
  useEffect(() => {
    if (materialFromUrl && !loading && !selectedMaterial) {
      // Search in total stock data to find the material
      const materialInStock = totalStockData.find(
        stock => stock.materialName.toLowerCase() === materialFromUrl.toLowerCase()
      );
      
      if (materialInStock) {
        // Found in stock - auto-open details view
        setSelectedMaterial(materialInStock);
        setShowMaterialDetails(true);
      } else {
        // Not in stock - just apply filter
        setSelectedMaterials([materialFromUrl]);
      }
    }
  }, [materialFromUrl, loading, totalStockData, selectedMaterial]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const clearFilters = () => {
    setSelectedPeriod('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedMaterials([]);
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  const handleMaterialClick = (material: MaterialStock) => {
    setSelectedMaterial(material);
    setShowMaterialDetails(true);
  };

  const stockInPositive = totalStockData.filter(stock => stock.currentStock > 0);

  const totalStockValue = stockInPositive.reduce((sum, stock) => sum + stock.totalValue, 0);

  const totalSaleValue = stockInPositive.reduce((sum, stock) => sum + (stock.currentStock * stock.salePrice), 0);

  // Projeção de lucro bruto: quanto lucraria vendendo o estoque atual pelos preços atuais
  const totalProfitProjection = stockInPositive.reduce((sum, stock) => sum + stock.profitProjection, 0);
  
  // Projeção de lucro líquido: lucro bruto - todas as despesas do histórico
  const netProfitProjection = totalProfitProjection - totalExpensesAll;

  const totalWeight = stockInPositive.reduce((sum, stock) => sum + stock.currentStock, 0);

  const materialsInStock = stockInPositive.length;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Estoque Atual</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  // Handler para editar material a partir do estoque - abre modal diretamente
  const handleEditMaterialFromStock = (materialName: string) => {
    const material = materials.find(m => m.name.toLowerCase() === materialName.toLowerCase());
    if (material) {
      setEditingMaterialName(material.name);
      setEditingMaterialPrices({
        purchase: material.price || 0,
        sale: material.salePrice || 0
      });
      setShowPriceEditModal(true);
    }
  };

  // Handler para salvar os preços editados
  const handleSaveMaterialPrices = async (purchasePrice: number, salePrice: number) => {
    const material = materials.find(m => m.name === editingMaterialName);
    if (!material) return;
    
    const updatedMaterial = {
      ...material,
      price: purchasePrice,
      salePrice: salePrice
    };
    
    await saveMaterial(updatedMaterial);
    
    // Recarregar dados para atualizar a view
    await loadData();
    
    // Atualizar o selectedMaterial com os novos preços se estiver visualizando
    if (selectedMaterial?.materialName === editingMaterialName) {
      setSelectedMaterial({
        ...selectedMaterial,
        purchasePrice,
        salePrice
      });
    }
  };

  // Handler para iniciar venda do estoque
  const handleSellStock = (material: MaterialStock) => {
    setMaterialToSell(material);
    setShowSellStockModal(true);
  };

  // Executa a venda do estoque completo do material - retorna dados para impressão
  const executeSale = async (clientName: string, clientId?: string): Promise<SaleResult> => {
    if (!materialToSell) {
      throw new Error('Material not selected');
    }

    try {
      // Buscar material do banco para obter ID
      const dbMaterial = materials.find(m => m.name === materialToSell.materialName);
      
      // Gerar IDs únicos ou usar ID do cliente cadastrado
      const orderId = crypto.randomUUID();
      const customerId = clientId || crypto.randomUUID();
      const customerName = clientName.trim() || 'Venda Direta (Estoque)';
      
      // Criar ordem de venda
      const order: Order = {
        id: orderId,
        customerId: customerId,
        items: [{
          materialId: dbMaterial?.id || '',
          materialName: materialToSell.materialName,
          quantity: materialToSell.currentStock,
          price: materialToSell.salePrice,
          total: materialToSell.currentStock * materialToSell.salePrice,
          tara: 0
        }],
        total: materialToSell.currentStock * materialToSell.salePrice,
        timestamp: Date.now(),
        status: 'completed',
        type: 'venda'
      };

      // Criar objeto Customer para o comprovante
      const customer: Customer = {
        id: customerId,
        name: customerName,
        orders: [order]
      };
      
      // Se for cliente avulso (não cadastrado), criar registro
      if (!clientId) {
        const customerToSave: Omit<Customer, 'orders'> = {
          id: customerId,
          name: customerName
        };
        await saveCustomer(customerToSave);
      }
      
      // Salvar ordem (atualiza caixa automaticamente)
      await saveOrder(order);
      
      // Invalidar cache de estoque para refletir a venda imediatamente
      clearCache();
      
      // Recarregar dados
      await loadData();
      
      // Limpar seleção e voltar para lista
      setMaterialToSell(null);
      setSelectedMaterial(null);
      setShowMaterialDetails(false);
      
      // Retornar dados para impressão
      return { order, customer };
      
    } catch (error) {
      console.error('Error executing sale:', error);
      toast({
        title: "Erro ao processar venda",
        description: "Verifique se o caixa está aberto e tente novamente.",
        variant: "destructive",
        duration: 4000,
      });
      throw error; // Re-throw para o modal tratar
    }
  };

  // Handler para abrir modal de impressão
  const handlePrintReceipt = (data: SaleResult) => {
    setSaleReceiptData(data);
    setShowReceiptModal(true);
  };

  // Handler para excluir material após venda do estoque
  const handleDeleteMaterialAfterSale = async (materialName: string) => {
    try {
      const material = materials.find(m => m.name === materialName);
      if (material) {
        await removeMaterial(material.id);
        toast({
          title: "Material excluído",
          description: `${materialName} foi removido do cadastro.`,
          duration: 3000,
        });
        // Recarregar dados
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Erro ao excluir material",
        description: "Não foi possível remover o material do cadastro.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Renderização condicional: Detalhes do Material OU Lista
  if (selectedMaterial) {
    return (
      <>
        <MaterialDetailsView
          material={selectedMaterial}
          totalWeight={totalWeight}
          onBack={() => {
            setSelectedMaterial(null);
            setShowMaterialDetails(false);
            // Limpar URL param para evitar reabrir via useEffect
            if (searchParams.has('material')) {
              setSearchParams({}, { replace: true });
            }
          }}
          onEditMaterial={handleEditMaterialFromStock}
          onSellStock={handleSellStock}
        />
        
        {/* Modals ainda disponíveis */}
        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          onAuthenticated={handlePasswordAuthenticated}
          title="Zerar Estoque"
          description="Digite a senha para confirmar a limpeza do estoque."
        />

        <ClearStockModal
          open={showClearStockModal}
          onOpenChange={setShowClearStockModal}
          onStockCleared={handleStockCleared}
        />

        <MaterialPriceEditModal
          open={showPriceEditModal}
          onOpenChange={setShowPriceEditModal}
          materialName={editingMaterialName}
          currentPurchasePrice={editingMaterialPrices.purchase}
          currentSalePrice={editingMaterialPrices.sale}
          onSave={handleSaveMaterialPrices}
        />

        <SellAllStockModal
          open={showSellStockModal}
          onOpenChange={setShowSellStockModal}
          material={materialToSell}
          clients={depotClients}
          onConfirm={executeSale}
          onPrintReceipt={handlePrintReceipt}
          onDeleteMaterial={handleDeleteMaterialAfterSale}
        />

        <ReceiptPrintModal
          open={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSaleReceiptData(null);
          }}
          customer={saleReceiptData?.customer || null}
          order={saleReceiptData?.order || null}
          formatPeso={(v) => `${Number(v).toFixed(2)}`}
          isSaleMode={true}
        />
      </>
    );
  }

  return (
    <FeatureGuard feature={FEATURE_KEYS.STOCK_CONTROL}>
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Archive className="h-5 w-5 text-emerald-500" />
              Estoque Atual
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {orphanMaterials.length > 0 && (
              <Button
                onClick={() => setShowOrphanModal(true)}
                size="sm"
                variant="outline"
                className="bg-yellow-900/20 border-yellow-600 text-yellow-400 hover:bg-yellow-900/40 text-xs px-2"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {orphanMaterials.length} órfão{orphanMaterials.length > 1 ? 's' : ''}
              </Button>
            )}
            <ContextualHelpButton module="estoque" />
            <Button
              onClick={handleClearStockRequest}
              size="sm"
              variant="outline"
              className="bg-rose-900/20 border-rose-600 text-rose-400 hover:bg-rose-900/40 text-xs px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Zerar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Seleção de Materiais */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          showAllOption={true}
          extraFilters={
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-slate-300 text-sm mb-1 block">Filtrar Material</Label>
                <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-slate-800 border-slate-600 text-white hover:bg-slate-700 h-10"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {selectedMaterials.length > 0 
                        ? `${selectedMaterials.length} selecionado(s)`
                        : "Selecionar"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-slate-800 border-slate-600">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar..." 
                        value={materialSearchValue}
                        onValueChange={setMaterialSearchValue}
                        className="text-white"
                      />
                      <CommandList>
                        <CommandEmpty className="text-slate-400 text-sm p-2">Nenhum.</CommandEmpty>
                        <CommandGroup>
                          {uniqueMaterials
                            .filter(material => 
                              material && material.toLowerCase().includes((materialSearchValue || '').toLowerCase())
                            )
                            .slice(0, 10)
                            .map((material) => (
                              <CommandItem
                                key={material}
                                value={material}
                                onSelect={() => {
                                  if (!selectedMaterials.includes(material)) {
                                    setSelectedMaterials(prev => [...prev, material]);
                                  }
                                  setMaterialSearchValue('');
                                  setMaterialSearchOpen(false);
                                }}
                                className="text-white hover:bg-slate-700"
                              >
                                {material}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {selectedMaterials.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedMaterials.map((material) => (
                    <span
                      key={material}
                      className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {material.substring(0, 15)}
                      <button onClick={() => removeMaterial(material)} className="hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          }
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          <MetricCard
            icon={Scale}
            iconColor="text-slate-400"
            label="Peso Total"
            value={formatWeight(totalWeight)}
            compact
          />
          <MetricCard
            icon={Package}
            iconColor="text-slate-400"
            label="Materiais"
            value={materialsInStock}
            compact
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-yellow-500"
            label="Valor Compra"
            value={formatCurrency(totalStockValue)}
            compact
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-blue-500"
            label="Valor Venda"
            value={formatCurrency(totalSaleValue)}
            compact
          />
          <MetricCard
            icon={TrendingUp}
            iconColor={netProfitProjection >= 0 ? "text-emerald-500" : "text-rose-500"}
            label="Projeção Lucro"
            value={formatCurrency(netProfitProjection)}
            subValue={totalExpensesAll > 0 ? `(-${formatCurrency(totalExpensesAll)} despesas)` : undefined}
            compact
          />
        </div>

        {/* Período Filtrado */}
        {(selectedPeriod && selectedPeriod !== 'all') && (
          <Card className="bg-slate-700/50 border-slate-600 mb-3">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-white text-sm">Totais do Período Filtrado</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                <div>
                  <div className="text-slate-400 text-xs">Peso</div>
                  <div className="text-white font-semibold">{formatWeight(filteredTotals.totalWeight)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Materiais</div>
                  <div className="text-white font-semibold">{filteredTotals.materialsCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Valor Compra</div>
                  <div className="text-blue-400 font-semibold">{formatCurrency(filteredTotals.totalPurchases)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Valor Venda</div>
                  <div className="text-emerald-400 font-semibold">{formatCurrency(filteredTotals.totalSales)}</div>
                </div>
                <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                  <div className="text-slate-400 text-xs">Lucro Bruto</div>
                  <div className={`font-semibold ${filteredTotals.grossProfit >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {formatCurrency(filteredTotals.grossProfit)}
                  </div>
                  {filteredTotals.netProfit !== filteredTotals.grossProfit && (
                    <div className={`text-[10px] ${filteredTotals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {filteredTotals.netProfit >= 0 ? '+' : ''}{formatCurrency(filteredTotals.netProfit)} líquido
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Materiais */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Materiais em Estoque</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {filteredStockData.filter(stock => stock.currentStock > 0).length > 0 ? (
              <div className="space-y-2">
                {filteredStockData.filter(stock => stock.currentStock > 0).map((stock) => (
                  <Card 
                    key={stock.materialName} 
                    className="bg-slate-800 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleMaterialClick(stock)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium truncate">{stock.materialName}</div>
                          <div className="text-sm text-slate-400">
                            {formatWeight(stock.currentStock)} em estoque
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{formatCurrency(stock.totalValue)}</div>
                          <div className={`text-sm ${stock.profitProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Lucro: {formatCurrency(stock.profitProjection)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                Nenhum material em estoque.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materiais com estoque zerado ou negativo */}
        {filteredStockData.filter(stock => stock.currentStock <= 0).length > 0 && (
          <Card className="bg-slate-700 border-slate-600 mt-3">
            <CardHeader className="p-3">
              <CardTitle className="text-slate-400 text-base">Materiais Esgotados</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-3">
              <div className="space-y-2">
                {filteredStockData.filter(stock => stock.currentStock <= 0).map((stock) => (
                  <Card 
                    key={stock.materialName} 
                    className="bg-slate-800/50 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleMaterialClick(stock)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-slate-400 font-medium truncate">{stock.materialName}</div>
                          <div className="text-sm text-slate-500">
                            {formatWeight(stock.currentStock)} em estoque
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500 font-semibold">R$ 0,00</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modals */}
      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Zerar Estoque"
        description="Digite a senha para confirmar a limpeza do estoque."
      />

      <ClearStockModal
        open={showClearStockModal}
        onOpenChange={setShowClearStockModal}
        onStockCleared={handleStockCleared}
      />

      <OrphanMaterialsModal
        open={showOrphanModal}
        onOpenChange={setShowOrphanModal}
        onDataChanged={handleOrphanDataChanged}
        registeredMaterials={materials.map(m => ({ id: m.id, name: m.name, category_id: m.category_id }))}
      />

      <MaterialPriceEditModal
        open={showPriceEditModal}
        onOpenChange={setShowPriceEditModal}
        materialName={editingMaterialName}
        currentPurchasePrice={editingMaterialPrices.purchase}
        currentSalePrice={editingMaterialPrices.sale}
        onSave={handleSaveMaterialPrices}
      />

      <SellAllStockModal
        open={showSellStockModal}
        onOpenChange={setShowSellStockModal}
        material={materialToSell}
        clients={depotClients}
        onConfirm={executeSale}
        onPrintReceipt={handlePrintReceipt}
        onDeleteMaterial={handleDeleteMaterialAfterSale}
      />

      <ReceiptPrintModal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSaleReceiptData(null);
        }}
        customer={saleReceiptData?.customer || null}
        order={saleReceiptData?.order || null}
        formatPeso={(v) => `${Number(v).toFixed(2)}`}
        isSaleMode={true}
      />
    </div>
    </FeatureGuard>
  );
};

export default CurrentStock;
