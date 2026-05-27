export interface Customer {
  id: string;
  name: string;
  orders: Order[];
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  timestamp: number;
  status: 'open' | 'completed';
  type: 'compra' | 'venda';
  cancelled?: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  refund_amount?: number;
}

export interface OrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  price: number;
  total: number;
  tara?: number;
  // Campos para rastrear ajustes de preço (desconto/acréscimo)
  originalPrice?: number;      // Preço original do cadastro no momento da transação
  priceAdjustment?: number;    // Ajuste por kg: negativo = desconto, positivo = acréscimo
  costPrice?: number;          // Preço de custo (usado em vendas avulsas)
  // Campos para venda avulsa com material vinculado
  linkedStockQuantity?: number;  // Peso do material a subtrair do estoque (separado da qty do produto)
  linkedMaterialName?: string;   // Nome real do material no estoque (diferente do nome do produto)
}

export interface Material {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  unit: string;
  user_id: string;
  category_id?: string | null;
  is_default?: boolean;
  previousPrice?: number | null;
  previousSalePrice?: number | null;
}

export interface MaterialPriceHistory {
  id: string;
  user_id: string;
  material_id: string;
  material_name: string;
  old_price: number | null;
  old_sale_price: number | null;
  new_price: number;
  new_sale_price: number;
  changed_at: string;
  change_type: string;
}

export interface MaterialCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  hex_color?: string | null;
  display_order: number;
  is_system?: boolean;
  is_required?: boolean;
  is_active?: boolean;
  system_key?: string | null;
}

export interface UserMaterialSettings {
  id: string;
  user_id: string;
  use_categories: boolean;
}

export interface CashRegister {
  id: string;
  initialAmount: number;
  currentAmount: number;
  transactions: CashTransaction[];
  openingTimestamp: number;
  closingTimestamp?: number;
  status: 'open' | 'closed';
  finalAmount?: number;
  userName?: string;
  userEmail?: string;
  grossProfit?: number;
  netProfit?: number;
}

export interface CashTransaction {
  id: string;
  type: 'opening' | 'closing' | 'sale' | 'purchase' | 'addition' | 'expense' | 'refund';
  amount: number;
  timestamp: number;
  description: string;
  orderId?: string;
}

export interface CashSummary {
  openingAmount: number;
  currentAmount: number;
  totalSales: number;
  totalPurchases: number; // Add this field
  totalWeight: number;
  expectedAmount: number;
  finalAmount?: number;
  expenses: {
    id: string;
    amount: number;
    description: string;
    timestamp: number;
  }[];
}
