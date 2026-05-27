-- Inserir artigos de ajuda (Estoque e Materiais)
INSERT INTO help_articles (title, slug, category_id, module, status, excerpt, content_md, seo_title, seo_description, reading_time_minutes, sort_order) VALUES
(
  'Gerenciando Materiais e Categorias',
  'gerenciando-materiais-categorias',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como cadastrar, organizar e gerenciar os materiais do seu depósito de reciclagem no XLata.',
  '# Gerenciando Materiais e Categorias

O cadastro correto de materiais é fundamental para a operação do seu depósito. O XLata permite organizar tudo de forma simples e eficiente.

## Acessando o Cadastro

1. Menu lateral > **Materiais**
2. Visualize todos os materiais cadastrados
3. Use a busca para encontrar rapidamente

## Cadastrando Novo Material

### Informações Básicas

Clique em **Adicionar Material** e preencha:

- **Nome** - Como o material é conhecido (ex: "Alumínio Latinha")
- **Preço de Compra** - Valor pago por kg ao fornecedor
- **Preço de Venda** - Valor cobrado por kg do cliente

### Dicas de Nomenclatura

Use nomes claros e padronizados:

| ❌ Evite | ✅ Prefira |
|---------|-----------|
| AL | Alumínio Latinha |
| Ferro 1 | Ferro Misto |
| Papel | Papelão Ondulado |

## Organizando por Categorias

### Categorias Sugeridas

- **Metais Ferrosos** - Ferro, aço, sucata mista
- **Metais Não-Ferrosos** - Alumínio, cobre, bronze, latão
- **Papéis** - Papelão, papel branco, jornal
- **Plásticos** - PET, PEAD, PP, PVC
- **Outros** - Vidro, eletrônicos, baterias

### Benefícios da Organização

- Relatórios mais detalhados
- Facilidade na busca
- Análise por categoria

## Atualizando Preços

Os preços de materiais flutuam constantemente. Para atualizar:

1. Clique no material
2. Edite o preço de compra e/ou venda
3. Salve as alterações

**Importante:** O histórico de preços é mantido. Transações antigas preservam o preço da época.

## Preços Diferenciados

Você pode ter preços diferentes para:

- **Volume** - Preço melhor para grandes quantidades
- **Cliente** - Preço especial para clientes frequentes
- **Qualidade** - Preço diferente por pureza do material

## Materiais Inativos

Se você parou de trabalhar com algum material:

1. Acesse o material
2. Marque como **Inativo**
3. Ele não aparece mais no PDV, mas o histórico é preservado

## Importação em Massa

Para cadastrar muitos materiais de uma vez:

1. Baixe a planilha modelo
2. Preencha os dados
3. Importe pelo sistema

## Relatórios de Materiais

Acompanhe o desempenho de cada material:

- **Quantidade comprada** no período
- **Quantidade vendida** no período
- **Estoque atual** (se controlar)
- **Margem de lucro** por material

---

**Dica:** Revise seus preços semanalmente para acompanhar o mercado!',
  'Cadastro de Materiais Recicláveis | XLata',
  'Como cadastrar e gerenciar materiais no sistema XLata. Organize seu depósito com categorias e controle de preços.',
  6,
  1
),
(
  'Definindo Preços de Compra e Venda',
  'definindo-precos-compra-venda',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Estratégias para definir preços competitivos de compra e venda de materiais recicláveis.',
  '# Definindo Preços de Compra e Venda

A precificação correta é essencial para a lucratividade do seu depósito. Veja como definir preços competitivos no XLata.

## Entendendo a Margem

### Fórmula Básica

```
Lucro = Preço de Venda - Preço de Compra - Custos Operacionais
```

### Margem Típica por Material

| Material | Margem Média |
|----------|-------------|
| Ferro | 30-50% |
| Alumínio | 20-40% |
| Cobre | 15-25% |
| Papelão | 40-60% |
| Plástico | 30-50% |

## Fatores que Influenciam o Preço

### Preço de Compra

- **Cotação do mercado** - Acompanhe diariamente
- **Volume** - Compras maiores justificam preço melhor
- **Qualidade** - Material limpo vale mais
- **Concorrência** - Preço dos depósitos vizinhos

### Preço de Venda

- **Cotação das indústrias** - Negocie regularmente
- **Quantidade acumulada** - Vendas maiores = melhor preço
- **Relacionamento** - Clientes fiéis pagam melhor
- **Prazo de pagamento** - À vista ou a prazo

## Configurando no XLata

### Preço Padrão

1. Acesse **Materiais**
2. Selecione o material
3. Defina preço de compra e venda
4. Salve

### Atualização Rápida

Para atualizar vários materiais:
1. Use a listagem de materiais
2. Clique em **Atualizar Preços**
3. Ajuste percentualmente ou por valor

## Estratégias de Precificação

### 1. Acompanhe o Mercado

- Consulte cotações online
- Converse com outros depósitos
- Acompanhe preços das indústrias

### 2. Considere seus Custos

Inclua na conta:
- Aluguel do espaço
- Funcionários
- Transporte
- Energia elétrica
- Manutenção de equipamentos

### 3. Mantenha Competitividade

- Preço muito baixo = prejuízo
- Preço muito alto = perde fornecedores
- Encontre o equilíbrio

## Histórico de Preços

O XLata mantém histórico de todos os preços praticados:

- Consulte preços anteriores
- Analise a evolução
- Identifique tendências

## Alertas de Margem

Configure alertas para:
- Margem abaixo do mínimo
- Preço de compra acima do mercado
- Variações bruscas

---

**Lembre-se:** Revisar preços regularmente é fundamental para manter a competitividade e a lucratividade!',
  'Como Definir Preços de Materiais Recicláveis',
  'Estratégias para precificar materiais recicláveis. Defina margens competitivas e aumente a lucratividade do seu depósito.',
  7,
  2
);