# 🏗️ Arquitetura do Sistema

## Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Landing   │  │    Auth     │  │     PDV     │  │   Portal    │ │
│  │   Pages     │  │   Pages     │  │   (Core)    │  │   Conteúdo  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┴────────────────┴────────────────┴────────────────┴─────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Edge Functions (9)                          ││
│  │  create-pix-payment │ webhook-mercado-pago │ check-rate-limit   ││
│  │  get-payment-status │ get-admin-payments   │ get-system-stats   ││
│  │  generate-sitemap   │ export-user-data     │ follow-up-pending  ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                  PostgreSQL (57 tabelas + RLS)                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Auth (JWT + RBAC)                           ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVIÇOS EXTERNOS                               │
│  Mercado Pago (PIX)  │  Google Analytics/Ads                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3.1 | Framework UI |
| Vite | latest | Build tool |
| TypeScript | latest | Tipagem |
| Tailwind CSS | latest | Estilos |
| Radix UI | latest | Componentes base |
| shadcn/ui | latest | Design system |
| TanStack Query | 5.56.2 | Cache/fetching |
| React Router | 6.26.2 | Roteamento |
| Recharts | 2.12.7 | Gráficos |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Supabase Auth | Autenticação JWT |
| Supabase Database | PostgreSQL 15+ |
| Supabase Edge Functions | Serverless Deno |
| Supabase Storage | Arquivos/imagens |
| Supabase Realtime | Websockets |

### Integrações

| Serviço | Uso |
|---------|-----|
| Mercado Pago | Pagamentos PIX |
| Google Ads | Conversão |
| QZ Tray | Impressão térmica |

---

## Estrutura de Pastas

```
src/
├── components/          # Componentes React
│   ├── ui/             # shadcn/ui base
│   ├── admin/          # Componentes admin
│   ├── campaign/       # Módulo campanha
│   ├── cash-register/  # Caixa registradora
│   ├── checkout/       # Checkout pagamento
│   ├── portal/         # Portal de conteúdo
│   └── icons.tsx       # Ícones customizados
├── contexts/           # React Contexts
├── hooks/              # Custom hooks
├── integrations/       # Supabase client
├── pages/              # Páginas/rotas
│   └── portal/         # Páginas do portal
├── types/              # TypeScript types
├── utils/              # Funções utilitárias
├── App.tsx             # Router principal
├── main.tsx            # Entry point
└── index.css           # Estilos globais

supabase/
├── config.toml         # Configuração Supabase
├── functions/          # Edge Functions
│   ├── create-pix-payment/
│   ├── webhook-mercado-pago/
│   ├── check-rate-limit/
│   ├── get-payment-status/
│   ├── get-admin-payments/
│   ├── get-system-stats/
│   ├── generate-sitemap/
│   ├── export-user-data/
│   └── follow-up-pending-pix/
└── migrations/         # Migrações SQL

public/
├── lovable-uploads/    # Imagens estáticas
├── sitemap.xml         # Sitemap SEO
├── robots.txt          # Robots SEO
└── site.webmanifest    # PWA manifest

docs/                   # Documentação
```

---

## Padrões de Código

### Componentes React

```tsx
// Padrão: Componente funcional com TypeScript
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export function Component({ prop1, prop2 = 0 }: ComponentProps) {
  return <div>{prop1}</div>;
}
```

### Hooks Customizados

```tsx
// Padrão: use[Nome] retornando objeto
export function useCustomHook() {
  const [state, setState] = useState();
  
  const action = useCallback(() => {}, []);
  
  return { state, action };
}
```

### Edge Functions

```typescript
// Padrão: Deno com CORS e tratamento de erros
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Lógica
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
```

---

## Dependências Críticas

| Serviço | Impacto se Falhar |
|---------|-------------------|
| Supabase Auth | Login impossível |
| Supabase DB | Sistema inoperante |
| Mercado Pago | Pagamentos impossíveis |
| Vercel | Frontend inacessível |

---

## Pontos de Falha Únicos

1. **Supabase** - Todo backend depende dele
2. **Mercado Pago** - Único gateway de pagamento
3. **Webhook MP** - Se falhar, assinaturas não ativam automaticamente
