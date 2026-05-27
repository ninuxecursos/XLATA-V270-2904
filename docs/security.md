# 🔐 Segurança & Compliance

## Autenticação

### Supabase Auth

- **Método:** Email + Senha
- **JWT:** Tokens com expiração
- **Sessão:** Persistente no localStorage
- **Timeout:** 30 minutos de inatividade

### Fluxo de Login

```
1. Usuário envia email + senha
2. Rate limit verificado (server-side)
3. Supabase Auth valida credenciais
4. JWT emitido
5. Sessão criada no cliente
```

### O Que NÃO Existe

| Funcionalidade | Status |
|----------------|--------|
| Recuperação de senha | ❌ NÃO IMPLEMENTADO |
| 2FA/MFA | ❌ NÃO IMPLEMENTADO |
| OAuth (Google, etc) | ❌ NÃO IMPLEMENTADO |
| Magic Link | ❌ NÃO IMPLEMENTADO |

---

## Autorização

### RBAC (Role-Based Access Control)

**Roles disponíveis:**
- `user` - Usuário comum
- `admin` - Administrador

### Verificação de Role

```sql
-- Function: is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND status = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: has_role(role_name)
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Rotas Protegidas

| Rota | Requer Auth | Requer Subscription | Requer Admin |
|------|-------------|---------------------|--------------|
| /landing | ❌ | ❌ | ❌ |
| /login | ❌ | ❌ | ❌ |
| /register | ❌ | ❌ | ❌ |
| / (PDV) | ✅ | ✅ | ❌ |
| /dashboard | ✅ | ✅ | ❌ |
| /materiais | ✅ | ✅ | ❌ |
| /planos | ✅ | ❌ | ❌ |
| /admin-dashboard | ✅ | ❌ | ✅ |

---

## Rate Limiting

### Implementação Server-Side

**Tabela:** `rate_limit_attempts`

```sql
CREATE TABLE rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ
);
```

**Function:** `check_rate_limit`

```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 900,
  p_block_duration_seconds INTEGER DEFAULT 1800
) RETURNS JSON AS $$
DECLARE
  v_record rate_limit_attempts%ROWTYPE;
  v_result JSON;
BEGIN
  -- Verifica se está bloqueado
  SELECT * INTO v_record
  FROM rate_limit_attempts
  WHERE identifier = p_identifier
    AND action_type = p_action_type;
    
  IF v_record.blocked_until IS NOT NULL 
     AND v_record.blocked_until > now() THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'blocked_until', v_record.blocked_until
    );
  END IF;
  
  -- Incrementa ou cria registro
  -- ... (lógica completa no arquivo)
  
  RETURN json_build_object(
    'allowed', true,
    'remaining_attempts', p_max_attempts - v_record.attempt_count
  );
END;
$$ LANGUAGE plpgsql;
```

### Limites Configurados

| Ação | Tentativas | Janela | Bloqueio |
|------|------------|--------|----------|
| login | 5 | 15 min | 30 min |

### Hook Frontend

**Arquivo:** `src/hooks/useServerRateLimit.ts`

```typescript
export function useServerRateLimit() {
  const checkRateLimit = async (
    identifier: string,
    actionType: string
  ) => {
    const response = await supabase.functions.invoke('check-rate-limit', {
      body: { identifier, action_type: actionType }
    });
    return response.data;
  };
  
  return { checkRateLimit };
}
```

---

## Proteção XSS

### DOMPurify

**Arquivo:** `src/utils/sanitization.ts`

```typescript
import DOMPurify from 'dompurify';

// HTML básico (remove tudo exceto texto)
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

// HTML rico (permite tags seguras)
export const sanitizeRichHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

// JSON-LD (para SEO)
export const sanitizeJsonLd = (data: object): string => {
  const jsonString = JSON.stringify(data);
  return jsonString
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
};
```

### Uso em Componentes

```tsx
// Correto
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeRichHtml(content) 
}} />

// JSON-LD
<script type="application/ld+json">
  {sanitizeJsonLd(schemaData)}
</script>
```

---

## Multi-Tenancy

### Isolamento de Dados

Todas as tabelas com dados de usuário possuem:

```sql
-- RLS Policy padrão
CREATE POLICY "Users own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Tabelas Protegidas

- profiles
- customers
- materials
- orders
- order_items
- cash_registers
- cash_transactions
- user_subscriptions

---

## LGPD Compliance

### Consentimentos

**Tabela:** `user_consents`

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);
```

**Tipos de Consentimento:**
- `terms_of_service` - Termos de uso
- `privacy_policy` - Política de privacidade
- `marketing_emails` - Emails de marketing
- `data_processing` - Processamento de dados

### Exportação de Dados

**Edge Function:** `export-user-data`

```typescript
// Retorna todos os dados do usuário
const userData = {
  profile: { ... },
  orders: [ ... ],
  materials: [ ... ],
  subscriptions: [ ... ],
  consents: [ ... ],
  exported_at: new Date().toISOString()
};
```

### Direitos do Titular

| Direito | Implementado |
|---------|--------------|
| Acesso aos dados | ✅ export-user-data |
| Retificação | ✅ Via UI (profile) |
| Exclusão | ⚠️ Parcial (manual) |
| Portabilidade | ✅ export-user-data |
| Oposição | ⚠️ Não automatizado |

### Retenção de Dados

| Tipo | Período | Justificativa |
|------|---------|---------------|
| Dados de usuário | Indefinido | Conta ativa |
| Logs de auditoria | 1 ano | Compliance |
| Pagamentos | 5 anos | Fiscal |
| Dados de churn | 2 anos | Reativação |

---

## Webhook Security

### Mercado Pago HMAC

```typescript
const validateWebhookSignature = (
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

---

## Payment Ledger (Imutável)

### Proteção contra Alteração

```sql
-- Trigger: prevent_ledger_update
CREATE TRIGGER prevent_ledger_update
BEFORE UPDATE ON payment_ledger
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

-- Trigger: prevent_ledger_delete
CREATE TRIGGER prevent_ledger_delete
BEFORE DELETE ON payment_ledger
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

-- Function
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Payment ledger records cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;
```

---

## Logs e Auditoria

### Sanitização de Logs

```typescript
const sanitizeForLog = (data: any): any => {
  const sensitiveFields = ['email', 'cpf', 'password', 'token'];
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    return sanitized;
  }
  return data;
};
```

### Tabela de Auditoria

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Checklist de Segurança

### Implementado ✅

- [x] Autenticação JWT
- [x] RLS em todas tabelas
- [x] Rate limiting server-side
- [x] Sanitização XSS (DOMPurify)
- [x] HMAC em webhooks
- [x] Ledger imutável
- [x] Isolamento multi-tenant
- [x] Consentimentos LGPD
- [x] Exportação de dados

### Pendente ⚠️

- [ ] Recuperação de senha
- [ ] 2FA/MFA
- [ ] Leaked password protection (Dashboard)
- [ ] Política de senha forte
- [ ] Exclusão automatizada de dados
- [ ] Logs de auditoria completos
- [ ] Criptografia de campos sensíveis
- [ ] WAF/DDoS protection
