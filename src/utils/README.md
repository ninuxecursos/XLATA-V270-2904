# 🛠️ Utilitários do Sistema

## Visão Geral

Esta pasta contém funções utilitárias reutilizáveis organizadas por responsabilidade. Todos os módulos são testados e otimizados para performance.

---

## 📦 Módulos

### `formatters.ts`

Formatação de dados para exibição no padrão brasileiro.

**Funções principais:**
- `currency(value: number): string` - Formata moeda brasileira (R$)
- `weight(value: number, decimals?: number): string` - Formata peso em kg
- `date(timestamp: number): string` - Formata data (DD/MM/YYYY)
- `datetime(timestamp: number): string` - Formata data e hora
- `phone(value: string): string` - Formata telefone brasileiro
- `percentage(value: number, decimals?: number): string` - Formata porcentagem
- `truncate(text: string, maxLength: number): string` - Trunca texto
- `uuid(): string` - Gera UUID v4
- `isValidUUID(uuid: string): boolean` - Valida UUID

**Exemplo:**
```typescript
import { formatters } from '@/utils/formatters';

console.log(formatters.currency(1500.50));  // "R$ 1.500,50"
console.log(formatters.weight(10.5));       // "10.500 kg"
console.log(formatters.phone('11987654321')); // "(11) 98765-4321"
```

---

### `validators.ts`

Validação de dados com regras brasileiras.

**Funções principais:**
- `uuid(value: string): boolean` - Valida UUID v4
- `email(value: string): boolean` - Valida formato de email
- `phone(value: string): boolean` - Valida telefone BR (10-11 dígitos)
- `cpf(value: string): boolean` - Valida CPF com dígitos verificadores
- `cnpj(value: string): boolean` - Valida CNPJ com dígitos verificadores
- `currency(value: any): boolean` - Valida valor monetário (>= 0)
- `weight(value: any): boolean` - Valida peso (> 0)
- `notEmpty(value: string): boolean` - Valida string não vazia
- `lengthRange(value: string, min: number, max: number): boolean` - Valida tamanho

**Exemplo:**
```typescript
import { validators } from '@/utils/validators';

if (!validators.email(email)) {
  toast.error('Email inválido');
}

if (!validators.cpf(cpf)) {
  toast.error('CPF inválido');
}
```

---

### `dateHelpers.ts`

Manipulação de datas e intervalos.

**Funções principais:**
- `isInRange(date, start, end): boolean` - Verifica se data está no intervalo
- `startOfDay(date): Date` - Início do dia (00:00:00.000)
- `endOfDay(date): Date` - Fim do dia (23:59:59.999)
- `addDays(date, days): Date` - Adiciona/remove dias
- `addMonths(date, months): Date` - Adiciona/remove meses
- `differenceInDays(date1, date2): number` - Diferença em dias
- `isToday(date): boolean` - Verifica se é hoje
- `isPast(date): boolean` - Verifica se é passado
- `isFuture(date): boolean` - Verifica se é futuro
- `toISODate(date): string` - Converte para YYYY-MM-DD
- `fromISODate(dateString): Date | null` - Parse de YYYY-MM-DD

**Exemplo:**
```typescript
import { dateHelpers } from '@/utils/dateHelpers';

const start = dateHelpers.startOfDay(new Date());
const end = dateHelpers.endOfDay(new Date());

if (dateHelpers.isInRange(orderDate, start, end)) {
  // Pedido de hoje
}

const futureDate = dateHelpers.addDays(new Date(), 30);
```

---

### `arrayHelpers.ts`

Operações avançadas com arrays.

**Funções principais:**
- `groupBy<T>(array, key): Record<string, T[]>` - Agrupa por chave
- `unique<T>(array): T[]` - Remove duplicados primitivos
- `uniqueBy<T>(array, key): T[]` - Remove duplicados por propriedade
- `sortBy<T>(array, key, order): T[]` - Ordena por propriedade
- `chunk<T>(array, size): T[][]` - Divide em pedaços
- `sumBy<T>(array, key): number` - Soma valores de propriedade
- `averageBy<T>(array, key): number` - Calcula média de propriedade
- `isEmpty<T>(array): boolean` - Verifica se vazio/null
- `take<T>(array, n): T[]` - Pega primeiros N itens
- `skip<T>(array, n): T[]` - Pula primeiros N itens
- `findFirst<T>(array, predicate): T | undefined` - Busca primeiro match
- `findLast<T>(array, predicate): T | undefined` - Busca último match

**Exemplo:**
```typescript
import { arrayHelpers } from '@/utils/arrayHelpers';

// Agrupar pedidos por cliente
const grouped = arrayHelpers.groupBy(orders, 'customerId');

// Remover materiais duplicados
const uniqueMaterials = arrayHelpers.uniqueBy(materials, 'id');

// Calcular total de vendas
const total = arrayHelpers.sumBy(sales, 'total');

// Ordenar por data
const sorted = arrayHelpers.sortBy(orders, 'created_at', 'desc');
```

---

### `queryHelpers.ts`

Helpers para queries paginadas e filtradas.

**Funções principais:**
- `getPaginationParams(searchParams): { page, pageSize }` - Extrai parâmetros
- `getPaginationOffset(page, pageSize): number` - Calcula offset
- `buildPaginatedResult<T>(data, total, page, pageSize): PaginatedResult<T>` - Monta resposta

**Tipos:**
```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Exemplo:**
```typescript
import { getPaginationParams, buildPaginatedResult } from '@/utils/queryHelpers';

const { page, pageSize } = getPaginationParams(searchParams);

const { data, count } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1);

const result = buildPaginatedResult(data, count, page, pageSize);
// { data: [...], total: 100, page: 1, pageSize: 50, totalPages: 2 }
```

---

### `logger.ts` / `safeLogger.ts`

Sistema de logging otimizado e seguro.

**Uso:**
```typescript
import { createLogger } from '@/utils/logger';
import { safeLogger } from '@/utils/safeLogger';

// Logger com prefixo
const logger = createLogger('[PDV]');
logger.debug('Pedido criado', order);  // Apenas em dev
logger.error('Erro ao salvar', error); // Sempre visível

// Logger global seguro
safeLogger.info('Operação concluída');
safeLogger.warn('Dados incompletos', data);
safeLogger.error('Falha crítica', error);
```

**Características:**
- `debug()` - Apenas em ambiente de desenvolvimento
- `info/warn/error()` - Sempre visíveis
- Proteção contra objetos circulares
- Prefixos customizados por módulo

---

### `supabaseStorage.ts`

Interface principal com Supabase para operações de dados.

**⚠️ IMPORTANTE:** Todas as funções requerem autenticação.

**Funções principais:**
- `getCustomers(): Promise<Customer[]>` - Busca clientes do usuário
- `saveCustomer(customer): Promise<void>` - Salva/atualiza cliente
- `getMaterials(): Promise<Material[]>` - Busca materiais do usuário
- `saveMaterial(material): Promise<void>` - Salva/atualiza material
- `getOrders(filters): Promise<Order[]>` - Busca pedidos com filtros
- `saveOrder(order): Promise<void>` - Salva pedido com items (transação)
- `deleteOrder(orderId): Promise<void>` - Deleta pedido e items

Ver documentação completa em [`API.md`](../../API.md)

---

### `optimizedImports.ts`

Importações lazy de bibliotecas pesadas.

**Módulos:**
- `recharts` - Gráficos (lazy load)
- `date-fns` - Manipulação de datas (tree-shakeable)
- `html2pdf.js` - Geração de PDF (lazy load)
- `dompurify` - Sanitização HTML (lazy load)

**Uso:**
```typescript
import { lazyLoadPDF, lazyLoadDOMPurify } from '@/utils/optimizedImports';

// Carregar apenas quando necessário
const pdf = await lazyLoadPDF();
await pdf.from(element).save();

const DOMPurify = await lazyLoadDOMPurify();
const clean = DOMPurify.sanitize(dirtyHTML);
```

---

## 🧪 Testes

Todos os utilitários possuem testes unitários com alta cobertura:

```bash
npm run test                  # Roda todos os testes
npm run test:ui               # Interface visual dos testes
npm run test:coverage         # Gera relatório de cobertura
```

**Cobertura atual:**
- `formatters.ts`: 95%+
- `validators.ts`: 90%+
- `queryHelpers.ts`: 100%
- `arrayHelpers.ts`: 95%+
- `dateHelpers.ts`: 90%+

---

## 📝 Convenções

### Nomenclatura

- **Funções:** camelCase (`formatCurrency`, `validateEmail`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_LOCALE`)
- **Tipos:** PascalCase (`PaginatedResult`, `ValidationResult`)

### Organização

- Um arquivo = uma responsabilidade
- Funções puras sempre que possível
- Exportar como objeto agrupado (`formatters`, `validators`)
- Documentar com JSDoc

### Imports

```typescript
// ✅ Correto - Import específico
import { formatters } from '@/utils/formatters';
import { validators } from '@/utils/validators';

// ❌ Evitar - Import genérico
import * as utils from '@/utils';
```

---

## 🔒 Segurança

### Sanitização

- **Nunca confie em input do usuário**
- Use `validators` antes de processar dados
- Sanitize HTML com `DOMPurify` antes de renderizar

### SQL Injection

- **NUNCA concatene SQL manualmente**
- Use sempre query builders do Supabase
- Valide UUIDs antes de queries

---

## ⚡ Performance

### Otimizações Implementadas

- **Memoization:** Cálculos pesados são cacheados
- **Lazy Loading:** Bibliotecas pesadas carregam sob demanda
- **Tree Shaking:** Importações específicas para reduzir bundle
- **Pure Functions:** Facilitam otimização do compilador

### Boas Práticas

```typescript
// ✅ Bom - Função pura
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.pricePerKg, 0);
}

// ❌ Evitar - Side effects
function calculateTotal(items: OrderItem[]): number {
  console.log('Calculando...'); // Side effect
  localStorage.setItem('lastCalc', Date.now()); // Side effect
  return items.reduce((sum, item) => sum + item.quantity * item.pricePerKg, 0);
}
```

---

## 🚀 Contribuindo

Ao adicionar novos utilitários:

1. **Criar arquivo dedicado** (`myHelper.ts`)
2. **Adicionar testes** (`myHelper.test.ts`)
3. **Documentar funções** (JSDoc completo)
4. **Atualizar este README**
5. **Garantir cobertura** (mínimo 80%)

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
