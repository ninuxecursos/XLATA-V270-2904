# 🔌 API

## Supabase Client

**Arquivo:** `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Edge Functions Endpoints

Base URL: `https://<project>.supabase.co/functions/v1`

### Pagamentos

#### POST /create-pix-payment

Cria pagamento PIX.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
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

**Response 200:**
```json
{
  "success": true,
  "payment_id": "123456789",
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "ticket_url": "https://..."
}
```

**Response 400:**
```json
{
  "error": "Missing required fields"
}
```

---

#### POST /get-payment-status

Consulta status do pagamento.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
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

#### POST /webhook-mercado-pago

Webhook do Mercado Pago.

**Headers:**
```
x-signature: ts=...,v1=...
x-request-id: uuid
```

**Body:** Payload do Mercado Pago

**Response 200:**
```json
{
  "received": true
}
```

---

### Admin

#### GET /get-admin-payments

Lista todos pagamentos (admin).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "payments": [...],
  "subscriptions": [...],
  "stats": {
    "total": 100,
    "approved": 80,
    "pending": 15,
    "cancelled": 5
  }
}
```

---

#### GET /get-system-stats

Estatísticas do sistema.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "total_users": 500,
  "active_subscriptions": 200,
  "trial_users": 50,
  "monthly_revenue": 29580.00
}
```

---

### Rate Limiting

#### POST /check-rate-limit

Verifica rate limit.

**Body:**
```json
{
  "identifier": "email@test.com",
  "action_type": "login"
}
```

**Response (Permitido):**
```json
{
  "allowed": true,
  "remaining_attempts": 4,
  "blocked_until": null
}
```

**Response (Bloqueado):**
```json
{
  "allowed": false,
  "remaining_attempts": 0,
  "blocked_until": "2025-01-03T12:30:00Z"
}
```

---

### SEO

#### GET /generate-sitemap

Gera sitemap dinâmico.

**Response:** XML do sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://xlata.site/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  ...
</urlset>
```

---

### LGPD

#### GET /export-user-data

Exporta dados do usuário.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "profile": {...},
  "orders": [...],
  "materials": [...],
  "subscriptions": [...],
  "consents": [...],
  "exported_at": "2025-01-03T00:00:00Z"
}
```

---

## Webhook Mercado Pago

### Configuração no MP

1. URL: `https://<project>.supabase.co/functions/v1/webhook-mercado-pago`
2. Eventos: `payment`
3. Secret: Configurar `MP_WEBHOOK_SECRET`

### Validação HMAC

```typescript
const validateSignature = (
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean => {
  const parts = xSignature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');
  
  return hmac === v1;
};
```

### Payload Exemplo

```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2025-01-03T00:00:00Z",
  "id": "webhook-uuid",
  "live_mode": true,
  "type": "payment",
  "user_id": "mp-user-id"
}
```

---

## RPC Functions

### has_role

Verifica se usuário tem role.

```typescript
const { data } = await supabase.rpc('has_role', { 
  role_name: 'admin' 
});
// data: boolean
```

### validate_subscription_access

Valida acesso por assinatura.

```typescript
const { data } = await supabase.rpc('validate_subscription_access');
// data: boolean
```

### check_rate_limit

Verifica rate limit.

```typescript
const { data } = await supabase.rpc('check_rate_limit', {
  p_identifier: 'email@test.com',
  p_action_type: 'login',
  p_max_attempts: 5,
  p_window_seconds: 900,
  p_block_duration_seconds: 1800
});
// data: { allowed: boolean, remaining: number, blocked_until: timestamp }
```

---

## Ambiente

### Variáveis Necessárias

```env
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Edge Functions (secrets)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
MP_ACCESS_TOKEN=<mercado_pago_token>
MP_WEBHOOK_SECRET=<webhook_secret>
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não existe |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Error - Erro servidor |
