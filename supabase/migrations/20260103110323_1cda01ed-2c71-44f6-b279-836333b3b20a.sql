-- Inserir artigos de ajuda (PDV e Vendas)
INSERT INTO help_articles (title, slug, category_id, module, status, excerpt, content_md, seo_title, seo_description, reading_time_minutes, sort_order) VALUES
(
  'Como Registrar Compras de Materiais',
  'como-registrar-compras-materiais',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Aprenda a registrar compras de materiais recicláveis no PDV do XLata de forma rápida e organizada.',
  '# Como Registrar Compras de Materiais

O registro de compras é a operação mais comum em depósitos de reciclagem. O XLata torna esse processo rápido e organizado.

## Acessando o PDV

1. Faça login no sistema
2. Clique em **PDV** no menu lateral
3. Certifique-se que o caixa está aberto

## Passo a Passo da Compra

### 1. Selecione o Tipo de Operação

No PDV, escolha **Compra** para registrar a entrada de material.

### 2. Identifique o Fornecedor (Opcional)

Você pode:
- Deixar como cliente avulso
- Cadastrar o fornecedor/catador
- Selecionar um fornecedor já cadastrado

### 3. Adicione os Materiais

Para cada material que está comprando:

1. Clique no card do material ou busque pelo nome
2. Informe o peso (manual ou via balança)
3. O preço é calculado automaticamente
4. Repita para outros materiais

### 4. Revise o Pedido

Antes de finalizar, confira:
- Materiais e quantidades
- Preços aplicados
- Valor total da compra

### 5. Finalize a Compra

1. Clique em **Finalizar**
2. Selecione a forma de pagamento (Dinheiro/PIX)
3. Confirme o pagamento
4. Imprima ou envie o recibo por WhatsApp

## Usando a Balança Integrada

Se você tem balança digital conectada:

1. Coloque o material na balança
2. O peso aparece automaticamente no sistema
3. Confirme e adicione ao pedido

**Vantagem:** Elimina erros de digitação e acelera o atendimento.

## Tara Automática

O sistema permite configurar tara para descontar o peso de:
- Carrinhos de catador
- Caixas e recipientes
- Veículos (para pesagem em balança rodoviária)

## Dicas para Agilizar

- **Favoritos:** Materiais mais comprados aparecem primeiro
- **Atalhos:** Use o teclado numérico para quantidades
- **Histórico:** Consulte compras anteriores do mesmo fornecedor

## Relatório de Compras

Acompanhe suas compras em **Relatórios > Compras**:
- Total comprado por período
- Materiais mais comprados
- Gastos por fornecedor

---

**Próximo:** [Realizando vendas no PDV](/ajuda/artigo/realizando-vendas-pdv)',
  'Como Registrar Compras de Materiais | XLata PDV',
  'Guia completo para registrar compras de materiais recicláveis no sistema XLata. Passo a passo do PDV para depósitos de reciclagem.',
  6,
  1
),
(
  'Realizando Vendas no PDV',
  'realizando-vendas-pdv',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'venda',
  'published',
  'Como vender materiais para indústrias e sucateiros usando o PDV do XLata.',
  '# Realizando Vendas no PDV

Quando você acumula material suficiente, é hora de vender para indústrias ou sucateiros maiores. O XLata facilita esse processo.

## Quando Vender

A decisão de vender depende de vários fatores:
- **Volume acumulado** - quanto mais, melhor preço
- **Cotação do mercado** - acompanhe os preços
- **Fluxo de caixa** - necessidade de capital

## Registrando uma Venda

### 1. Acesse o PDV

1. Menu lateral > **PDV**
2. Selecione **Venda** como tipo de operação

### 2. Identifique o Comprador

Cadastre ou selecione a indústria/sucateiro:
- Nome da empresa
- CNPJ
- Contato

### 3. Adicione os Materiais

1. Selecione o material vendido
2. Informe a quantidade (peso)
3. O preço de venda é aplicado automaticamente
4. Adicione outros materiais se necessário

### 4. Negocie o Preço (Opcional)

Se o comprador negociou um preço diferente:
1. Clique no item
2. Altere o valor unitário
3. O total é recalculado

### 5. Finalize a Venda

1. Revise todos os itens
2. Confirme o total
3. Selecione forma de recebimento
4. Gere a nota/recibo

## Formas de Recebimento

O XLata suporta:
- **Dinheiro** - entra direto no caixa
- **PIX** - registrado como entrada
- **Transferência** - para controle bancário
- **A prazo** - para vendas parceladas

## Controle de Estoque

Ao registrar uma venda:
- O estoque é atualizado automaticamente
- O material sai do seu inventário
- Relatórios refletem a movimentação

## Margem de Lucro

O sistema calcula automaticamente:
- **Custo médio** do material (baseado nas compras)
- **Valor de venda** registrado
- **Margem bruta** da operação

## Relatório de Vendas

Acesse **Relatórios > Vendas** para ver:
- Faturamento por período
- Materiais mais vendidos
- Clientes com maior volume
- Comparativo compra x venda

---

**Dica:** Mantenha um relacionamento com múltiplos compradores para conseguir melhores preços!',
  'Como Vender Materiais no PDV | XLata Sistema',
  'Aprenda a registrar vendas de materiais recicláveis para indústrias. Controle completo de vendas no sistema XLata.',
  5,
  2
),
(
  'Usando a Balança Integrada',
  'usando-balanca-integrada',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Configure e use sua balança digital integrada ao XLata para pesagens automáticas e precisas.',
  '# Usando a Balança Integrada

A integração com balança digital é um dos recursos mais poderosos do XLata. Elimina erros de digitação e acelera significativamente o atendimento.

## Balanças Compatíveis

O XLata é compatível com balanças que usam protocolo serial:
- **Toledo**
- **Filizola**
- **Urano**
- **Líder**
- E outras com comunicação RS-232 ou USB Serial

## Configuração Inicial

### 1. Conecte a Balança

1. Ligue o cabo serial/USB da balança ao computador
2. Instale drivers se necessário (Windows geralmente detecta automaticamente)
3. Anote a porta COM atribuída (ex: COM3)

### 2. Configure no XLata

1. Acesse **Configurações > Balança**
2. Selecione a porta COM
3. Configure a velocidade (baud rate) - geralmente 9600
4. Clique em **Testar Conexão**

### 3. Teste a Leitura

1. Coloque um peso conhecido na balança
2. Clique em **Ler Peso**
3. Verifique se o valor está correto

## Usando no PDV

Com a balança configurada, o fluxo de trabalho fica assim:

1. Coloque o material na balança
2. Aguarde estabilização
3. Clique em **Capturar Peso** ou pressione Enter
4. O peso é preenchido automaticamente
5. Continue com a operação

### Captura Automática

Você pode ativar a captura automática:
- O sistema detecta quando o peso estabiliza
- Preenche automaticamente sem clicar
- Ideal para alto volume de pesagens

## Configurando Tara

### O que é Tara?

Tara é o peso do recipiente/veículo que deve ser descontado.

### Tipos de Tara no XLata

1. **Tara Manual** - você informa o valor
2. **Tara Automática** - zera a balança com o recipiente
3. **Tara por Cliente** - salva a tara do carrinho de cada catador

### Como Usar

1. Coloque o recipiente vazio na balança
2. Clique em **Tarar** ou pressione T
3. O display zera
4. Adicione o material e pese

## Solução de Problemas

### Balança não conecta

- Verifique se o cabo está bem conectado
- Confira a porta COM correta
- Reinicie a balança e o sistema

### Peso não estabiliza

- Verifique se não há vento/vibração
- Calibre a balança
- Limpe a plataforma

### Valores incorretos

- Recalibre a balança com peso padrão
- Verifique configurações de comunicação

## Benefícios da Integração

| Sem Balança Integrada | Com Balança Integrada |
|----------------------|----------------------|
| Digitação manual | Captura automática |
| Erros frequentes | Precisão total |
| 30s por pesagem | 5s por pesagem |
| Disputas de peso | Registro comprovado |

---

**Precisa de ajuda com a configuração?** Nossa equipe oferece suporte remoto para configurar sua balança!',
  'Balança Digital Integrada ao Sistema | XLata',
  'Configure sua balança digital no XLata para pesagens automáticas. Compatível com Toledo, Filizola, Urano e outras marcas.',
  8,
  3
);