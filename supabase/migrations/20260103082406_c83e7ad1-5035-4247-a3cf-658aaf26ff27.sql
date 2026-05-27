-- Inserir categorias de blog
INSERT INTO blog_categories (name, slug, description, icon, sort_order, is_featured) VALUES
('Dicas', 'dicas', 'Dicas práticas para otimizar seu negócio de reciclagem', 'Lightbulb', 1, true),
('Guias', 'guias', 'Guias completos e detalhados sobre reciclagem', 'BookOpen', 2, true),
('Tutoriais', 'tutoriais', 'Tutoriais passo a passo do sistema XLata', 'GraduationCap', 3, false),
('Notícias', 'noticias', 'Novidades do mercado de reciclagem', 'Newspaper', 4, false)
ON CONFLICT (slug) DO NOTHING;

-- Inserir posts de blog de exemplo
INSERT INTO blog_posts (title, slug, excerpt, content_md, status, is_featured, category_id, tags, reading_time_minutes, seo_title, seo_description, og_image, published_at) VALUES
(
  'Como Organizar Seu Depósito de Reciclagem em 7 Passos',
  'como-organizar-deposito-reciclagem',
  'Aprenda a organizar seu depósito de forma eficiente para aumentar a produtividade e maximizar seus lucros.',
  '## Introdução

Organizar um depósito de reciclagem pode parecer desafiador, mas com as estratégias certas, você pode transformar seu espaço em uma operação eficiente e lucrativa.

## 1. Mapeie Seu Espaço

Antes de qualquer mudança, faça um levantamento completo do seu espaço disponível. Identifique:
- Áreas de recebimento
- Zonas de separação
- Local de armazenamento
- Área de expedição

## 2. Separe por Tipo de Material

Crie setores específicos para cada tipo de material:
- **Metais ferrosos**: ferro, aço
- **Metais não-ferrosos**: alumínio, cobre, latão
- **Plásticos**: PET, PEAD, PP
- **Papéis**: papelão, papel branco, jornal

## 3. Invista em Sinalização

Use placas coloridas e claras para identificar cada setor. Isso facilita o trabalho da equipe e evita erros de classificação.

## 4. Organize o Fluxo de Trabalho

Crie um fluxo lógico: entrada → pesagem → separação → armazenamento → venda.

## 5. Use Prateleiras e Containers

Maximize o espaço vertical com prateleiras industriais. Use containers padronizados para facilitar a movimentação.

## 6. Implemente um Sistema de Controle

Use o sistema XLata para:
- Registrar entradas e saídas
- Controlar estoque por material
- Acompanhar preços de mercado

## 7. Mantenha a Limpeza

Um depósito limpo é mais seguro e eficiente. Estabeleça rotinas de limpeza diárias.

## Conclusão

Com organização e as ferramentas certas, seu depósito pode se tornar muito mais produtivo e lucrativo!',
  'published',
  true,
  (SELECT id FROM blog_categories WHERE slug = 'guias'),
  ARRAY['organização', 'depósito', 'reciclagem', 'produtividade'],
  8,
  'Como Organizar Seu Depósito de Reciclagem | XLata Blog',
  'Guia completo com 7 passos para organizar seu depósito de reciclagem e aumentar a produtividade.',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200',
  NOW()
),
(
  '5 Dicas Para Aumentar Seu Lucro com Reciclagem',
  '5-dicas-aumentar-lucro-reciclagem',
  'Descubra estratégias comprovadas para maximizar seus ganhos no mercado de reciclagem.',
  '## Maximize Seus Lucros

O mercado de reciclagem oferece grandes oportunidades para quem sabe aproveitá-las. Confira nossas dicas:

## 1. Conheça os Preços de Mercado

Acompanhe diariamente as cotações de:
- Alumínio
- Cobre
- Ferro
- Plásticos

Use o módulo de preços do XLata para manter-se atualizado.

## 2. Negocie em Volume

Acumule materiais até atingir quantidades que justifiquem melhores preços. Compradores pagam mais por lotes maiores.

## 3. Melhore a Separação

Material bem separado vale mais! Invista tempo na classificação correta.

## 4. Reduza Custos Operacionais

- Otimize rotas de coleta
- Negocie fretes
- Controle despesas fixas

## 5. Use Tecnologia

O sistema XLata ajuda você a:
- Controlar margens de lucro
- Identificar materiais mais rentáveis
- Tomar decisões baseadas em dados

## Bônus: Fidelize Fornecedores

Crie relacionamentos duradouros com catadores e fornecedores. Pagamentos em dia garantem materiais de qualidade constante.',
  'published',
  true,
  (SELECT id FROM blog_categories WHERE slug = 'dicas'),
  ARRAY['lucro', 'negócios', 'estratégia', 'reciclagem'],
  5,
  '5 Dicas Para Aumentar Lucro com Reciclagem | XLata',
  'Estratégias práticas para maximizar seus ganhos no mercado de reciclagem.',
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200',
  NOW()
),
(
  'Controle de Caixa: Por que é Essencial para Seu Negócio',
  'controle-caixa-essencial-negocio',
  'Entenda a importância do controle de caixa e como implementá-lo corretamente no seu depósito.',
  '## A Base do Sucesso

Muitos depósitos de reciclagem falham por falta de controle financeiro. Veja por que o controle de caixa é fundamental:

## O que é Controle de Caixa?

É o registro sistemático de todas as entradas e saídas de dinheiro do seu negócio.

## Por que é Importante?

### 1. Visibilidade Financeira
Saiba exatamente quanto tem em caixa a qualquer momento.

### 2. Tomada de Decisões
Com dados precisos, você decide melhor sobre:
- Compras de materiais
- Investimentos
- Pagamentos

### 3. Identificação de Problemas
Detecte vazamentos de dinheiro e despesas desnecessárias.

### 4. Planejamento
Projete receitas e despesas futuras com base em histórico real.

## Como Implementar com o XLata

1. **Abertura de Caixa**: Registre o valor inicial
2. **Registro de Compras**: Cada entrada de material
3. **Registro de Vendas**: Cada saída de material
4. **Despesas**: Combustível, alimentação, etc.
5. **Fechamento**: Confira o saldo final

## Dica Extra

Faça o fechamento diário! Isso facilita identificar erros e manter o controle.',
  'published',
  false,
  (SELECT id FROM blog_categories WHERE slug = 'tutoriais'),
  ARRAY['caixa', 'financeiro', 'controle', 'gestão'],
  6,
  'Controle de Caixa para Depósitos de Reciclagem | XLata',
  'Aprenda a implementar controle de caixa eficiente no seu depósito de reciclagem.',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200',
  NOW()
),
(
  'Como Calcular o Preço de Compra por KG Corretamente',
  'como-calcular-preco-compra-kg',
  'Aprenda a calcular preços justos para compra de materiais e garantir margens de lucro saudáveis.',
  '## Calculando Preços Corretamente

Um dos maiores desafios de quem trabalha com reciclagem é definir o preço de compra. Veja como fazer isso de forma profissional.

## A Fórmula Básica

```
Preço de Compra = Preço de Venda - Margem de Lucro - Custos Operacionais
```

## Entendendo Cada Componente

### Preço de Venda
É quanto você consegue vender o material para indústrias ou atravessadores.

### Margem de Lucro
Recomendamos trabalhar com margens entre 15% e 30%, dependendo do material.

### Custos Operacionais
Inclua:
- Frete/transporte
- Mão de obra
- Aluguel
- Energia
- Impostos

## Exemplo Prático

**Alumínio:**
- Preço de venda: R$ 8,00/kg
- Margem desejada: 20% = R$ 1,60
- Custos por kg: R$ 0,50

Preço máximo de compra: R$ 8,00 - R$ 1,60 - R$ 0,50 = **R$ 5,90/kg**

## Use o XLata

O sistema calcula automaticamente:
- Margens por material
- Histórico de preços
- Alertas de variação

## Dicas Importantes

1. **Atualize preços semanalmente**
2. **Negocie melhores preços de venda**
3. **Reduza custos operacionais**
4. **Conheça a concorrência**',
  'published',
  false,
  (SELECT id FROM blog_categories WHERE slug = 'guias'),
  ARRAY['preços', 'cálculo', 'compra', 'margem'],
  7,
  'Como Calcular Preço de Compra por KG | XLata Blog',
  'Guia completo para calcular preços de compra de materiais recicláveis.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
  NOW()
),
(
  'Novidades do Mercado de Reciclagem em 2024',
  'novidades-mercado-reciclagem-2024',
  'Confira as principais tendências e mudanças no setor de reciclagem para este ano.',
  '## O Mercado em Transformação

O setor de reciclagem está em constante evolução. Veja o que esperar em 2024:

## Tendências Principais

### 1. Digitalização
Mais depósitos estão adotando sistemas digitais como o XLata para gestão do negócio.

### 2. Sustentabilidade ESG
Empresas buscam fornecedores certificados e com práticas sustentáveis.

### 3. Economia Circular
Cresce a demanda por materiais reciclados de qualidade.

### 4. Novos Materiais
- Baterias de lítio
- Componentes eletrônicos
- Plásticos especiais

## Desafios do Setor

- Volatilidade de preços
- Concorrência crescente
- Exigências de qualidade maiores

## Oportunidades

1. **Especialização**: Focar em materiais específicos de alto valor
2. **Parcerias**: Contratos com indústrias
3. **Tecnologia**: Automatização de processos

## Como se Preparar

- Invista em capacitação
- Modernize seu depósito
- Use ferramentas de gestão profissionais

O futuro é promissor para quem se adapta!',
  'published',
  true,
  (SELECT id FROM blog_categories WHERE slug = 'noticias'),
  ARRAY['mercado', 'tendências', '2024', 'novidades'],
  4,
  'Novidades do Mercado de Reciclagem 2024 | XLata',
  'Principais tendências e mudanças no setor de reciclagem para 2024.',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;