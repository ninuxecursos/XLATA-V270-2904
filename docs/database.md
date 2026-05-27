# 🗄️ Database

## Visão Geral

- **SGBD:** PostgreSQL 15+
- **Hospedagem:** Supabase
- **Total de Tabelas:** 57
- **RLS:** Habilitado em todas as tabelas

---

## Tabelas Core

### profiles

Dados do usuário após registro.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, ref auth.users |
| name | text | Nome completo |
| email | text | Email único |
| whatsapp | text | Telefone |
| company_name | text | Nome da empresa |
| status | text | 'user' ou 'admin' |
| logo_url | text | URL do logo |
| created_at | timestamp | Data criação |
| last_login_at | timestamp | Último login |

### customers

Clientes do depósito.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| name | text | Nome do cliente |
| created_at | timestamp | Data criação |

### materials

Materiais cadastrados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| name | text | Nome do material |
| price | numeric | Preço de compra |
| sale_price | numeric | Preço de venda |
| unit | text | Unidade (kg) |

### orders

Pedidos de compra/venda.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| customer_id | uuid | FK customers |
| type | text | 'compra' ou 'venda' |
| total | numeric | Valor total |
| status | text | Status do pedido |
| payment_method | text | Forma de pagamento |
| cancelled | boolean | Se foi cancelado |
| created_at | timestamp | Data criação |

### order_items

Itens dos pedidos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| order_id | uuid | FK orders |
| material_id | uuid | FK materials |
| material_name | text | Nome (snapshot) |
| quantity | numeric | Peso em kg |
| price | numeric | Preço unitário |
| total | numeric | Subtotal |
| tara | numeric | Desconto tara |

### cash_registers

Registros de caixa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| initial_amount | numeric | Valor inicial |
| current_amount | numeric | Valor atual |
| final_amount | numeric | Valor final |
| status | text | 'open' ou 'closed' |
| opening_timestamp | timestamp | Abertura |
| closing_timestamp | timestamp | Fechamento |

### cash_transactions

Transações do caixa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| cash_register_id | uuid | FK cash_registers |
| user_id | uuid | FK profiles |
| type | text | Tipo transação |
| amount | numeric | Valor |
| description | text | Descrição |

---

## Tabelas de Assinatura

### user_subscriptions

Assinaturas dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| plan_type | text | Tipo do plano |
| is_active | boolean | Se está ativa |
| expires_at | timestamp | Data expiração |
| activated_at | timestamp | Data ativação |
| payment_id | text | ID pagamento MP |

### subscription_plans

Planos disponíveis.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome do plano |
| price | numeric | Preço |
| period_days | integer | Duração em dias |
| description | text | Descrição |
| is_popular | boolean | Destaque popular |
| is_promotional | boolean | É promocional |
| is_active | boolean | Disponível |

### mercado_pago_payments

Pagamentos PIX.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| payment_id | text | ID no Mercado Pago |
| payer_email | text | Email pagador |
| transaction_amount | numeric | Valor |
| status | text | Status |
| qr_code | text | Código PIX |
| external_reference | text | userId_planType |
| followup_1h_sent | boolean | Follow-up 1h |
| followup_24h_sent | boolean | Follow-up 24h |
| followup_48h_sent | boolean | Follow-up 48h |

### payment_ledger

Ledger imutável de pagamentos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| payment_id | text | ID pagamento |
| user_id | uuid | FK profiles |
| event_type | text | Tipo evento |
| amount | numeric | Valor |
| plan_type | text | Tipo plano |
| metadata | jsonb | Dados extras |
| created_at | timestamp | Imutável |

---

## Tabelas de Automação

### rate_limit_attempts

Tentativas de rate limit.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| identifier | text | Email/IP |
| action_type | text | Tipo ação |
| attempt_count | integer | Contagem |
| first_attempt_at | timestamp | Primeira |
| last_attempt_at | timestamp | Última |
| blocked_until | timestamp | Bloqueado até |

### user_lifecycle

Estados do ciclo de vida.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| current_stage | text | Estado atual |
| previous_stage | text | Estado anterior |
| entered_at | timestamp | Entrada no estado |

**Estados possíveis:**
- `registered` - Cadastrado
- `trial` - Em trial
- `converted` - Converteu (pagou)
- `paying` - Pagante ativo
- `at_risk` - Em risco (inativo)
- `churned` - Cancelou
- `reactivated` - Reativou

### user_consents

Consentimentos LGPD.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK profiles |
| consent_type | text | Tipo consentimento |
| granted | boolean | Concedido |
| granted_at | timestamp | Quando |
| ip_address | text | IP |
| user_agent | text | Navegador |

---

## Tabelas de Conteúdo

### blog_posts

Posts do blog.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| slug | text | URL amigável |
| title | text | Título |
| content_md | text | Conteúdo Markdown |
| content_html | text | Conteúdo HTML |
| excerpt | text | Resumo |
| status | enum | draft/published |
| seo_title | text | Título SEO |
| seo_description | text | Descrição SEO |

### help_articles

Artigos de ajuda.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| slug | text | URL amigável |
| title | text | Título |
| content_md | text | Conteúdo |
| category_id | uuid | FK help_categories |
| module | enum | Módulo do sistema |
| status | enum | draft/published |

### glossary_terms

Termos do glossário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| slug | text | URL amigável |
| term | text | Termo |
| short_definition | text | Definição curta |
| long_definition | text | Definição longa |
| status | enum | draft/published |

### pillar_pages

Páginas pilar SEO.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| slug | text | URL amigável |
| title | text | Título |
| content_html | text | Conteúdo |
| status | enum | draft/published |

---

## RLS Policies

### Padrão Multi-Tenant

```sql
-- Usuário só acessa próprios dados
CREATE POLICY "Users own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Admin Override

```sql
-- Admin acessa tudo
CREATE POLICY "Admin access"
ON table_name
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND status = 'admin'
  )
);
```

### Conteúdo Público

```sql
-- Conteúdo publicado é público
CREATE POLICY "Public content"
ON blog_posts
FOR SELECT
USING (status = 'published');
```

---

## Índices Importantes

```sql
-- Performance queries frequentes
CREATE INDEX idx_orders_user_created 
ON orders(user_id, created_at DESC);

CREATE INDEX idx_materials_user 
ON materials(user_id);

CREATE INDEX idx_subscriptions_user_active 
ON user_subscriptions(user_id, is_active);

CREATE INDEX idx_rate_limit_identifier 
ON rate_limit_attempts(identifier, action_type);
```
