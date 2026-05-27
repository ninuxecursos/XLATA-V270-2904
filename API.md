# 📚 Documentação da API - Sistema PDV

## 📖 Índice

- [Supabase Storage API](#supabase-storage-api)
- [Edge Functions](#edge-functions)
- [Database RPC Functions](#database-rpc-functions)
- [Hooks Customizados](#hooks-customizados)

---

## Supabase Storage API

### 📦 Módulo: `supabaseStorage.ts`

#### `getCustomers(): Promise<Customer[]>`

Busca todos os clientes do usuário autenticado.

**Retorno:**
- `Customer[]` - Array de clientes ordenado por nome

**Exceções:**
- Lança erro se usuário não autenticado
- Lança erro se falha na query do Supabase

**Exemplo:**
```typescript
import { getCustomers } from '@/utils/supabaseStorage';

const customers = await getCustomers();
console.log(customers); // [{ id: '...', name: 'João Silva', ... }]
```

---

#### `saveOrder(order: Order): Promise<void>`

Salva um pedido no banco de dados com transação atômica.

**Parâmetros:**
- `order: Order` - Objeto Order completo incluindo items

**Comportamento:**
1. Valida presença de `order.items`
2. Deleta order_items antigos (se edição)
3. Insere novo order na tabela `orders`
4. Insere order_items em lote na tabela `order_items`

**Exceções:**
- Lança erro se `order.items` está vazio
- Lança erro se falha em qualquer etapa da transação

**Exemplo:**
```typescript
import { saveOrder } from '@/utils/supabaseStorage';

await saveOrder({
  id: crypto.randomUUID(),
  customerId: 'customer-uuid',
  type: 'sale',
  total: 150.50,
  timestamp: Date.now(),
  items: [
    { 
      materialId: 'material-uuid', 
      materialName: 'Alumínio',
      quantity: 10.5, 
      pricePerKg: 15,
      tara: 0.5
    }
  ],
  user_id: 'user-uuid'
});
```

---

#### `getMaterials(): Promise<Material[]>`

Busca todos os materiais do usuário autenticado.

**Cache:** Não implementado  
**Paginação:** Não implementado (⚠️ pode ser lento com muitos materiais)

**Retorno:**
- `Material[]` - Array de materiais ordenado por nome

**Exemplo:**
```typescript
import { getMaterials } from '@/utils/supabaseStorage';

const materials = await getMaterials();
materials.forEach(mat => {
  console.log(`${mat.name}: R$ ${mat.price}/kg`);
});
```

---

## Edge Functions

### 🔥 `create-pix-payment`

Cria pagamento PIX via Mercado Pago.

**Endpoint:** `POST /functions/v1/create-pix-payment`

**Headers:**
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 100.00,
  "description": "Assinatura Mensal PDV",
  "payer": {
    "email": "usuario@example.com",
    "name": "João Silva"
  }
}
```

**Response (200 - Sucesso):**
```json
{
  "id": "1234567890",
  "qr_code": "00020126...string-pix",
  "qr_code_base64": "data:image/png;base64,iVBORw0KG...",
  "ticket_url": "https://mercadopago.com.br/payments/1234567890/ticket"
}
```

**Response (400/500 - Erro):**
```json
{
  "error": "Descrição detalhada do erro"
}
```

**Exemplo de Uso:**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('create-pix-payment', {
  body: {
    amount: 99.90,
    description: 'Plano Mensal',
    payer: {
      email: user.email,
      name: user.name
    }
  }
});

if (error) {
  console.error('Erro ao criar pagamento:', error);
} else {
  console.log('QR Code:', data.qr_code);
  console.log('URL do ticket:', data.ticket_url);
}
```

---

### 🔥 `get-payment-status`

Consulta status de pagamento no Mercado Pago.

**Endpoint:** `POST /functions/v1/get-payment-status`

**Body:**
```json
{
  "payment_id": "1234567890"
}
```

**Response (200):**
```json
{
  "id": "1234567890",
  "status": "approved",
  "status_detail": "accredited"
}
```

**Status Possíveis:**
- `pending` - Aguardando pagamento
- `approved` - Pagamento aprovado e creditado
- `in_process` - Pagamento em processamento
- `rejected` - Pagamento rejeitado
- `cancelled` - Pagamento cancelado

**Exemplo de Uso:**
```typescript
const { data } = await supabase.functions.invoke('get-payment-status', {
  body: { payment_id: '1234567890' }
});

if (data.status === 'approved') {
  // Ativar assinatura do usuário
}
```

---

### 🔥 `webhook-mercado-pago`

Recebe notificações de webhook do Mercado Pago.

**Endpoint:** `POST /functions/v1/webhook-mercado-pago`

**Headers:**
```
x-signature: assinatura-do-webhook
x-request-id: id-da-requisicao
```

**Body:**
```json
{
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  }
}
```

**Comportamento:**
1. Valida assinatura do webhook
2. Busca dados do pagamento no Mercado Pago
3. Atualiza status no banco de dados
4. Ativa assinatura se pagamento aprovado

⚠️ **Segurança:** Este endpoint valida a assinatura HMAC do Mercado Pago para garantir autenticidade.

---

## Database RPC Functions

### `validate_subscription_access`

Valida se usuário tem assinatura ativa e acesso a features.

```sql
validate_subscription_access(
  target_user_id uuid,
  required_feature text DEFAULT 'basic'
) RETURNS boolean
```

**Parâmetros:**
- `target_user_id: uuid` - UUID do usuário a validar
- `required_feature: text` - Feature requerida (não implementado ainda)

**Retorno:**
- `boolean` - `true` se assinatura ativa e não expirada

**Exemplo:**
```typescript
const { data: hasAccess } = await supabase.rpc('validate_subscription_access', {
  target_user_id: userId,
  required_feature: 'pdv'
});

if (!hasAccess) {
  // Redirecionar para página de planos
  navigate('/planos');
}
```

---

### `get_dashboard_summary`

Retorna resumo consolidado de dados do dashboard com métricas calculadas.

```sql
get_dashboard_summary(
  target_user_id uuid,
  filter_start timestamp DEFAULT NULL,
  filter_end timestamp DEFAULT NULL
) RETURNS jsonb
```

**Parâmetros:**
- `target_user_id: uuid` - UUID do usuário
- `filter_start: timestamp` - Data inicial do filtro (opcional)
- `filter_end: timestamp` - Data final do filtro (opcional)

**Retorno:**
```json
{
  "order_count": 150,
  "material_count": 25,
  "total_sales": 50000.00,
  "total_purchases": 30000.00,
  "net_balance": 20000.00
}
```

**Exemplo:**
```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const { data: summary } = await supabase.rpc('get_dashboard_summary', {
  target_user_id: userId,
  filter_start: startDate.toISOString(),
  filter_end: endDate.toISOString()
});

console.log(`Total de vendas: R$ ${summary.total_sales}`);
console.log(`Lucro líquido: R$ ${summary.net_balance}`);
```

---

### `get_user_referrals`

Retorna lista de usuários indicados pelo usuário.

```sql
get_user_referrals(user_uuid uuid) 
RETURNS TABLE(
  indicado_id uuid,
  indicado_name text,
  indicado_email text,
  plan_type text,
  is_active boolean,
  dias_recompensa integer,
  data_recompensa timestamp
)
```

**Exemplo:**
```typescript
const { data: referrals } = await supabase.rpc('get_user_referrals', {
  user_uuid: userId
});

referrals.forEach(ref => {
  console.log(`${ref.indicado_name} - ${ref.plan_type} - +${ref.dias_recompensa} dias`);
});
```

---

## Hooks Customizados

### `useStockCalculation`

Hook para cálculo de estoque de materiais com cache.

**Retorno:**
```typescript
{
  calculateMaterialStock: (materialId: string) => Promise<number>;
  isLoadingStock: boolean;
}
```

**Uso:**
```typescript
import { useStockCalculation } from '@/hooks/useStockCalculation';

function MaterialCard({ materialId }) {
  const { calculateMaterialStock, isLoadingStock } = useStockCalculation();
  const [stock, setStock] = useState<number>(0);

  useEffect(() => {
    calculateMaterialStock(materialId).then(setStock);
  }, [materialId]);

  return (
    <div>
      {isLoadingStock ? 'Carregando...' : `Estoque: ${stock} kg`}
    </div>
  );
}
```

---

### `useNotificationsOptimized`

Hook otimizado para gerenciar notificações com Realtime.

**Retorno:**
```typescript
{
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  isLoading: boolean;
}
```

**Uso:**
```typescript
import { useNotificationsOptimized } from '@/hooks/useNotificationsOptimized';

function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotificationsOptimized();

  return (
    <div>
      <Badge>{unreadCount}</Badge>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

---

### `useSubscriptionSync`

Hook para sincronização automática de dados de assinatura.

**Retorno:**
```typescript
{
  syncSubscriptionData: () => Promise<void>;
}
```

**Comportamento:**
- Sincroniza dados de assinatura do Supabase para localStorage
- Escuta mudanças em tempo real via Realtime
- Dispara evento customizado `subscriptionUpdate`

**Uso:**
```typescript
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';

// Hook é usado automaticamente no SubscriptionSyncProvider
// Não precisa usar diretamente nos componentes
```

---

### `useAuth`

Hook para gerenciar autenticação do usuário.

**Retorno:**
```typescript
{
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: object) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}
```

**Uso:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { signIn, loading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('Erro ao fazer login');
    }
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

---

## Tipos Principais

### `Customer`

```typescript
interface Customer {
  id: string;              // UUID único
  name: string;            // Nome ou razão social
  user_id: string;         // UUID do proprietário
  created_at: string;      // ISO 8601 timestamp
}
```

### `Order`

```typescript
interface Order {
  id: string;                    // UUID único
  customerId: string;            // UUID do cliente
  type: 'sale' | 'purchase';     // Tipo do pedido
  total: number;                 // Valor total em reais
  timestamp: number;             // Unix timestamp
  items: OrderItem[];            // Itens do pedido
  user_id: string;               // UUID do proprietário
  created_at?: string;           // ISO 8601 timestamp
  cash_register_id?: string;     // UUID do caixa (opcional)
}
```

### `OrderItem`

```typescript
interface OrderItem {
  materialId: string;      // UUID do material
  materialName: string;    // Nome do material (cache)
  quantity: number;        // Quantidade em kg
  pricePerKg: number;      // Preço por kg
  tara?: number;           // Tara em kg (opcional)
}
```

### `Material`

```typescript
interface Material {
  id: string;              // UUID único
  name: string;            // Nome do material
  price: number;           // Preço de compra por kg
  sale_price: number;      // Preço de venda por kg
  unit: string;            // Unidade (padrão: 'kg')
  user_id: string;         // UUID do proprietário
  created_at: string;      // ISO 8601 timestamp
  updated_at?: string;     // ISO 8601 timestamp
}
```

---

## Utilitários

Ver documentação completa em [`src/utils/README.md`](./src/utils/README.md)

### Formatadores

```typescript
import { formatters } from '@/utils/formatters';

formatters.currency(1500.50);     // "R$ 1.500,50"
formatters.weight(10.123);         // "10.123 kg"
formatters.date(Date.now());       // "15/01/2024"
formatters.phone('11987654321');   // "(11) 98765-4321"
```

### Validadores

```typescript
import { validators } from '@/utils/validators';

validators.uuid('550e8400...');    // true
validators.email('test@example'); // false
validators.cpf('111.444.777-35'); // true
```

### Helpers de Array

```typescript
import { arrayHelpers } from '@/utils/arrayHelpers';

arrayHelpers.groupBy(items, 'category');
arrayHelpers.sortBy(items, 'name', 'asc');
arrayHelpers.sumBy(items, 'total');
```

---

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS ativado. Políticas principais:

- **Usuários podem acessar apenas seus próprios dados**
- **Admins podem acessar todos os dados**
- **Validação de role via função `is_admin()`**

### Autenticação

- Todos os endpoints protegidos requerem `Authorization: Bearer <token>`
- Tokens são gerenciados automaticamente pelo Supabase client
- Sessões persistem via localStorage com refresh automático

---

## Performance

### Caching

- **Roles de usuário:** Cache de 5 minutos
- **Dados de assinatura:** Sincronizado via Realtime + localStorage

### Otimizações

- Índices compostos em tabelas principais (`orders`, `materials`, `order_items`)
- Limit de 50 itens em listagens de pedidos
- Virtualização de listas longas com `@tanstack/react-virtual`

---

## Versionamento

- **Versão atual:** v2.1.319
- **Data da documentação:** 2025-01-01
- **Última atualização:** Implementação FASE 4 (Qualidade)
