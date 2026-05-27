# 🔧 Backend

## Edge Functions

### create-pix-payment

**Arquivo:** `supabase/functions/create-pix-payment/index.ts`

**Propósito:** Criar pagamento PIX no Mercado Pago

**Autenticação:** JWT Bearer Token

**Request:**
```json
{
  "planId": "uuid",
  "planName": "Mensal",
  "planPrice": 147.90,
  "planType": "mensal",
  "payerEmail": "user@email.com",
  "payerName": "Nome Completo",
  "payerCpf": "12345678900"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": "123456789",
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "ticket_url": "https://...",
  "external_reference": "userId_planType_timestamp"
}
```

---

### webhook-mercado-pago

**Arquivo:** `supabase/functions/webhook-mercado-pago/index.ts`

**Propósito:** Receber notificações do Mercado Pago

**Autenticação:** HMAC SHA256 (x-signature header)

**Eventos Processados:**
- `payment.created`
- `payment.updated`

**Ações:**
1. Valida assinatura HMAC
2. Busca detalhes do pagamento na API MP
3. Atualiza `mercado_pago_payments`
4. Se aprovado → cria/atualiza `user_subscriptions`
5. Registra no `payment_ledger`

---

### get-payment-status

**Arquivo:** `supabase/functions/get-payment-status/index.ts`

**Propósito:** Verificar status de pagamento

**Autenticação:** JWT Bearer Token

**Request:**
```json
{
  "payment_id": "123456789"
}
```

**Response:**
```json
{
  "status": "approved",
  "is_activated": true,
  "plan_type": "mensal",
  "expires_at": "2025-02-03T00:00:00Z"
}
```

---

### check-rate-limit

**Arquivo:** `supabase/functions/check-rate-limit/index.ts`

**Propósito:** Verificar rate limiting server-side

**Autenticação:** Não requer

**Request:**
```json
{
  "identifier": "email@test.com",
  "action_type": "login"
}
```

**Response:**
```json
{
  "allowed": true,
  "remaining_attempts": 4,
  "blocked_until": null
}
```

**Limites:**
- 5 tentativas por 15 minutos
- Bloqueio de 30 minutos após exceder

---

### generate-sitemap

**Arquivo:** `supabase/functions/generate-sitemap/index.ts`

**Propósito:** Gerar sitemap dinâmico

**Autenticação:** Não requer

**Inclui:**
- Páginas estáticas
- Blog posts publicados
- Artigos de ajuda
- Páginas pilar
- Termos do glossário

---

### export-user-data

**Arquivo:** `supabase/functions/export-user-data/index.ts`

**Propósito:** Exportar dados do usuário (LGPD)

**Autenticação:** JWT Bearer Token

**Response:** JSON com todos os dados do usuário:
- Profile
- Orders
- Materials
- Subscriptions
- Consents

---

### follow-up-pending-pix

**Arquivo:** `supabase/functions/follow-up-pending-pix/index.ts`

**Propósito:** Enviar follow-ups para PIX pendentes

**Autenticação:** Não requer (cron job)

**Intervalos:**
- 1 hora: Primeira lembrança
- 24 horas: Segunda lembrança
- 48 horas: Última chamada

---

## Regras de Negócio

### Trial

| Regra | Valor |
|-------|-------|
| Duração | 7 dias |
| Ativação | Primeiro login |
| Funcionalidades | Todas |
| Limite registros | Nenhum |
| Renovação | Não permitida |

### Assinaturas

| Tipo | Duração | Preço |
|------|---------|-------|
| Promocional | 30 dias | R$ 97,90 |
| Mensal | 30 dias | R$ 147,90 |
| Trimestral | 90 dias | R$ 387,90 |
| Trienal | 1095 dias | R$ 4.497,90 |

### Renovação

- **NÃO é automática**
- Pagamento manual
- Dias restantes NÃO acumulam
- Novo período inicia imediatamente

### Bloqueio

- Após `expires_at`
- Tolerância: 0 dias
- Bloqueia todas rotas exceto:
  - `/planos`
  - `/configuracoes`
  - `/login`
  - `/landing`

### Cálculos

**Total do Pedido:**
```
total = Σ (quantidade × preço_unitário)
```

**Estoque:**
```
estoque[material] = Σ(compras) - Σ(vendas)
```

**Lucro:**
```
lucro = total_vendas - total_compras - despesas
```

### Sistema de Indicações

| Plano Ativado | Bônus |
|---------------|-------|
| Mensal | +7 dias |
| Trimestral | +14 dias |
| Anual | +30 dias |

---

## Triggers SQL

| Trigger | Tabela | Evento | Ação |
|---------|--------|--------|------|
| on_auth_user_created | auth.users | INSERT | Cria profile |
| handle_new_user_role | profiles | INSERT | Adiciona role 'user' |
| aplicar_recompensa_indicacao | user_subscriptions | UPDATE | Aplica bônus |
| prevent_ledger_update | payment_ledger | UPDATE | Bloqueia |
| prevent_ledger_delete | payment_ledger | DELETE | Bloqueia |

---

## Functions SQL

| Function | Propósito |
|----------|-----------|
| is_admin() | Verifica se usuário é admin |
| has_role(role) | Verifica role específica |
| check_rate_limit() | Rate limiting server-side |
| cleanup_expired_rate_limits() | Limpa tentativas expiradas |
| validate_subscription_access() | Valida acesso por assinatura |
