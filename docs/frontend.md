# 🖥️ Frontend

## Páginas Públicas

### Landing Page (`/landing`, `/`)

**Arquivo:** `src/pages/Landing.tsx`

#### Estrutura Visual

| Seção | Componente | Objetivo |
|-------|------------|----------|
| Header | ResponsiveNavigation | Navegação + CTAs |
| Hero | Customizado | Proposta de valor |
| Pain Points | 6 cards | Mostrar problemas/custos |
| Benefícios | 3 cards | Soluções oferecidas |
| Features | 4 cards | Funcionalidades |
| Testemunhos | 6 cards | Prova social |
| Planos | Dinâmico | Preços e conversão |
| Footer | Customizado | Links e contato |

#### SEO

```html
<title>Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site</title>
<meta name="description" content="Sistema online para depósito de reciclagem...">
<link rel="canonical" href="https://xlata.site">
```

### Login (`/login`)

**Arquivo:** `src/pages/Login.tsx`

- Email + senha
- Rate limiting (5 tentativas/15min)
- Link para registro
- **NÃO TEM:** Recuperação de senha

### Registro (`/register`)

**Arquivo:** `src/pages/Register.tsx`

**Campos:**
- Nome (obrigatório)
- WhatsApp (opcional)
- Email (obrigatório)
- Senha (min 6 chars)
- Confirmar senha
- Aceite de termos (obrigatório)

**Após registro:**
- Modal de confirmação de email
- Evento Google Ads disparado

---

## Páginas Protegidas (Requerem Auth)

### PDV Principal (`/`)

**Arquivo:** `src/pages/Index.tsx`

**Estados:**
- `showWelcomeScreen`: Caixa fechado
- PDV ativo: Caixa aberto

**Componentes:**

| Componente | Função |
|------------|--------|
| WelcomeScreen | Tela inicial caixa fechado |
| MaterialGrid | Grade de materiais clicáveis |
| NumberPad | Teclado numérico para peso |
| OrderList | Pedidos ativos por cliente |
| OrderDetails | Detalhes do pedido atual |
| Footer | Ações e navegação |

**Fluxo de Uso:**
1. Abrir caixa → informar valor inicial
2. Criar/selecionar cliente
3. Digitar peso → clicar material
4. Repetir para múltiplos itens
5. Finalizar → escolher tipo (compra/venda)
6. Imprimir comprovante (opcional)

### Dashboard (`/dashboard`)

**Arquivo:** `src/pages/Dashboard.tsx`

**Métricas:**
- Total de Compras
- Peso Bruto (estoque)
- Total de Vendas
- Total de Transações
- Total de Despesas
- Adições de Caixa

**Gráficos:**
- BarChart: Vendas vs Compras por dia
- PieChart: Top 5 materiais

**Filtros:**
- Período: Diário, Semanal, Mensal, Anual, Custom

### Materiais (`/materiais`)

**Arquivo:** `src/pages/Materials.tsx`

**Funcionalidades:**
- CRUD de materiais
- Busca por nome
- Inserir 40 materiais padrão

**Campos do Material:**
- Nome
- Preço de compra (R$)
- Preço de venda (R$)
- Unidade (kg padrão)

### Configurações (`/configuracoes`)

**Arquivo:** `src/pages/Settings.tsx`

**Opções:**
- Logo da empresa (upload)
- WhatsApp 1 e 2
- Endereço
- Formato comprovante (50mm/80mm)
- Configurações avançadas de fonte

### Planos (`/planos`)

**Arquivo:** `src/pages/Planos.tsx`

**Exibe:**
- Planos disponíveis (da DB)
- Assinatura atual
- Dias restantes
- Histórico de renovações

**Ações:**
- Selecionar plano → checkout
- Renovar plano atual

---

## Outras Páginas

| Rota | Arquivo | Função |
|------|---------|--------|
| `/transacoes` | Transactions.tsx | Todos os pedidos |
| `/purchase-orders` | PurchaseOrders.tsx | Pedidos de compra |
| `/sales-orders` | SalesOrders.tsx | Pedidos de venda |
| `/current-stock` | CurrentStock.tsx | Estoque atual |
| `/daily-flow` | DailyFlow.tsx | Resumo do dia |
| `/expenses` | Expenses.tsx | Despesas |
| `/cash-additions` | CashAdditions.tsx | Adições ao caixa |
| `/guia-completo` | GuiaCompleto.tsx | Vídeos tutoriais |
| `/indicacoes` | ReferralSystem.tsx | Sistema de indicações |
| `/relatar-erro` | ErrorReport.tsx | Bug reports |

---

## Portal de Conteúdo

| Rota | Arquivo | Função |
|------|---------|--------|
| `/blog` | portal/Blog.tsx | Lista de posts |
| `/blog/:slug` | portal/BlogPost.tsx | Post individual |
| `/ajuda` | portal/HelpCenter.tsx | Central de ajuda |
| `/ajuda/artigo/:slug` | portal/HelpArticle.tsx | Artigo de ajuda |
| `/solucoes` | portal/Solutions.tsx | Páginas pilar |
| `/solucoes/:slug` | portal/Solution.tsx | Página pilar |
| `/glossario` | portal/Glossary.tsx | Termos |
| `/glossario/:slug` | portal/GlossaryTerm.tsx | Termo individual |

---

## Área Admin (`/admin-dashboard`)

**Arquivo:** `src/pages/AdminDashboard.tsx`

**Tabs:**
1. Dashboard - Métricas gerais
2. Usuários - Gestão de usuários
3. Planos - Gestão de planos
4. Vídeos - Gestão de tutoriais
5. Conteúdo - Blog/Help/Glossário
6. Configurações - Sistema

---

## Componentes Principais

### UI Base (shadcn/ui)

- Button, Card, Dialog, Input, Label
- Select, Switch, Tabs, Toast
- Alert, Badge, Checkbox
- Dropdown, Popover, Sheet
- Table, Accordion, Avatar

### Modais Importantes

| Modal | Uso |
|-------|-----|
| CashRegisterOpeningModal | Abrir caixa |
| CashRegisterClosingModal | Fechar caixa |
| OrderCompletionModal | Finalizar pedido |
| ReceiptPrintModal | Imprimir comprovante |
| CheckoutPage | Checkout PIX |
| PaymentSuccessModal | Confirmação pagamento |
| FirstLoginModal | Ativação trial |
| NoSubscriptionBlocker | Bloqueio sem assinatura |

---

## Hooks Customizados

| Hook | Função |
|------|--------|
| useAuth | Autenticação/sessão |
| useSubscriptionOptimized | Status da assinatura |
| useServerRateLimit | Rate limiting |
| useNotifications | Notificações |
| useMercadoPago | SDK Mercado Pago |
| useMobilePrint | Impressão mobile |
| useSystemConfig | Configurações |
| useSystemLogo | Logo dinâmico |

---

## Estados de UI

### Loading States
- Skeleton em cards
- Spinner centralizado
- Overlay com blur

### Error States
- Toast de erro
- Card de erro com retry
- ErrorBoundary global

### Empty States
- Mensagem + ação sugerida
- Ilustração quando aplicável

### Success States
- Toast de sucesso
- Modal de confirmação
- Redirect automático
