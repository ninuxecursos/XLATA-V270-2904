-- Inserir mais blog posts
INSERT INTO blog_posts (title, slug, category_id, status, excerpt, content_md, seo_title, seo_description, tags, reading_time_minutes, is_featured, published_at) VALUES
(
  'Como Usar o PDV XLata Passo a Passo',
  'como-usar-pdv-xlata-passo-passo',
  'f4aeeb60-9afe-4731-8f72-7203beaadb20',
  'published',
  'Tutorial completo para usar o PDV do XLata: da abertura do caixa até a impressão do recibo.',
  '# Como Usar o PDV XLata Passo a Passo

O PDV (Ponto de Venda) do XLata foi desenvolvido especificamente para depósitos de reciclagem. Aprenda a usar todas as funcionalidades.

## Acessando o PDV

1. Faça login no sistema
2. No menu lateral, clique em **PDV**
3. O sistema verifica o status do caixa

## Abrindo o Caixa

Antes de operar, você precisa abrir o caixa:

1. Clique em **Abrir Caixa**
2. Informe o valor inicial (fundo de caixa)
3. Confirme a abertura

**Dica:** Mantenha sempre um valor fixo como fundo de caixa (ex: R$ 300).

## Registrando uma Compra

### Passo 1: Selecione Compra

No topo do PDV, escolha a operação **Compra**.

### Passo 2: Identifique o Fornecedor

- Clique em **Cliente/Fornecedor**
- Busque pelo nome ou cadastre novo
- Ou deixe como "Avulso"

### Passo 3: Adicione Materiais

1. Clique no card do material
2. Informe o peso (ou capture da balança)
3. O valor é calculado automaticamente
4. Repita para outros materiais

### Passo 4: Finalize

1. Revise os itens
2. Clique em **Finalizar**
3. Selecione forma de pagamento
4. Confirme o valor pago
5. Imprima o recibo

## Registrando uma Venda

O processo é similar à compra:

1. Selecione **Venda**
2. Identifique o cliente (indústria)
3. Adicione os materiais vendidos
4. Finalize e gere o recibo

## Usando a Balança

Se você tem balança integrada:

1. Coloque o material na balança
2. Aguarde estabilização
3. Clique em **Capturar Peso**
4. O peso é preenchido automaticamente

### Configurando Tara

1. Coloque o recipiente vazio
2. Clique em **Tarar**
3. A balança zera
4. Adicione o material e pese

## Sangria e Suprimento

### Sangria

Para retirar dinheiro do caixa:
1. Clique em **Sangria**
2. Informe o valor e motivo
3. Confirme

### Suprimento

Para adicionar dinheiro:
1. Clique em **Suprimento**
2. Informe o valor e origem
3. Confirme

## Fechando o Caixa

Ao final do expediente:

1. Clique em **Fechar Caixa**
2. Conte o dinheiro físico
3. Informe o valor contado
4. Compare com o esperado
5. Confirme o fechamento

## Dicas de Produtividade

- Use atalhos de teclado
- Configure materiais favoritos
- Imprima recibos automaticamente
- Revise o resumo antes de finalizar

---

**Pronto para começar?** [Crie sua conta grátis](/register)',
  'Tutorial PDV XLata | Passo a Passo Completo',
  'Tutorial completo do PDV XLata para depósitos de reciclagem. Aprenda a registrar compras, vendas e controlar o caixa.',
  ARRAY['tutorial', 'PDV', 'passo a passo', 'como usar'],
  8,
  false,
  NOW()
),
(
  'Integrando Balança Digital ao Sistema XLata',
  'integrando-balanca-digital-sistema-xlata',
  'f4aeeb60-9afe-4731-8f72-7203beaadb20',
  'published',
  'Aprenda a configurar sua balança digital no XLata para pesagens automáticas e mais precisão.',
  '# Integrando Balança Digital ao Sistema XLata

A integração com balança digital é um dos recursos mais poderosos do XLata. Elimina erros e acelera o atendimento.

## Balanças Compatíveis

O XLata é compatível com balanças que usam protocolo serial:

- **Toledo** - Prix, Ohaus
- **Filizola** - Platina, CS
- **Urano** - US, UDC
- **Líder** - LD
- **Outras** - Com protocolo RS-232/USB Serial

## Requisitos

### Hardware

- Balança com saída serial (RS-232 ou USB)
- Cabo de conexão apropriado
- Computador com porta disponível

### Software

- Navegador Chrome atualizado
- Drivers da balança (se necessário)

## Passo a Passo da Configuração

### 1. Conecte a Balança

1. Ligue o cabo serial/USB da balança ao computador
2. Verifique se a balança está ligada
3. Aguarde o Windows reconhecer o dispositivo

### 2. Identifique a Porta COM

1. Abra o Gerenciador de Dispositivos
2. Procure em "Portas (COM e LPT)"
3. Anote o número da porta (ex: COM3)

### 3. Configure no XLata

1. Acesse **Configurações > Balança**
2. Selecione a porta COM identificada
3. Configure a velocidade (geralmente 9600)
4. Clique em **Testar Conexão**

### 4. Teste a Leitura

1. Coloque um peso conhecido na balança
2. Clique em **Ler Peso**
3. Verifique se o valor está correto

## Usando no PDV

Com a balança configurada:

1. Coloque o material na balança
2. Aguarde estabilização
3. Clique em **Capturar Peso** ou pressione Enter
4. O peso é preenchido automaticamente

### Captura Automática

Ative a captura automática para:
- Detectar estabilização automaticamente
- Preencher peso sem cliques
- Agilizar ainda mais o atendimento

## Configurando Tara

### Tara Manual

1. Informe o peso do recipiente
2. O sistema desconta automaticamente

### Tara Automática

1. Coloque o recipiente vazio
2. Clique em **Tarar**
3. A balança zera
4. Pese normalmente

### Tara por Cliente

Cadastre a tara de cada catador:
- Peso do carrinho
- Peso de recipientes
- Descontado automaticamente

## Solução de Problemas

### Balança não conecta

- Verifique o cabo
- Confira a porta COM
- Reinicie balança e sistema

### Peso incorreto

- Recalibre a balança
- Verifique configurações de comunicação

### Peso não estabiliza

- Verifique vibração/vento
- Limpe a plataforma
- Calibre a balança

## Benefícios da Integração

| Sem Integração | Com Integração |
|----------------|----------------|
| Digitação manual | Captura automática |
| Erros frequentes | Precisão total |
| 30s por pesagem | 5s por pesagem |
| Disputas de peso | Registro comprovado |

---

**Precisa de ajuda?** Nossa equipe oferece suporte remoto para configurar sua balança!',
  'Como Integrar Balança Digital no XLata',
  'Tutorial para integrar balança digital ao sistema XLata. Compatível com Toledo, Filizola, Urano. Pesagens automáticas!',
  ARRAY['balança', 'integração', 'tutorial', 'configuração'],
  7,
  false,
  NOW()
),
(
  'Tendências do Mercado de Reciclagem para 2025',
  'tendencias-mercado-reciclagem-2025',
  '2574e31a-60ce-4f63-8402-ab9df9e3c61f',
  'published',
  'Conheça as principais tendências do mercado de reciclagem para 2025 e como se preparar para elas.',
  '# Tendências do Mercado de Reciclagem para 2025

O mercado de reciclagem está em constante evolução. Conheça as tendências que vão impactar o setor em 2025.

## 1. Tecnologia e Digitalização

### Sistemas de Gestão

Cada vez mais depósitos estão adotando sistemas digitais:
- Controle de operações em tempo real
- Eliminação de papel e calculadora
- Relatórios automatizados
- Integração com balanças

### Rastreabilidade

A demanda por rastreabilidade do material cresce:
- Origem do material
- Cadeia de custódia
- Certificações ambientais

## 2. Economia Circular

### Conceito em Alta

A economia circular ganha força nas grandes empresas:
- Logística reversa obrigatória
- Metas de reciclagem
- Parcerias com cooperativas e depósitos

### Oportunidades

- Contratos com indústrias
- Programas de coleta seletiva
- Certificações ambientais

## 3. Valorização dos Materiais

### Demanda Crescente

Com a escassez de matéria-prima:
- Preços tendem a subir
- Qualidade será mais exigida
- Separação correta valorizada

### Novos Materiais

Materiais em alta:
- Eletrônicos (e-waste)
- Baterias de lítio
- Plásticos especiais
- Metais raros

## 4. Sustentabilidade como Diferencial

### ESG nas Empresas

Grandes empresas buscam fornecedores sustentáveis:
- Documentação em dia
- Licenciamento ambiental
- Práticas responsáveis

### Marketing Verde

Depósitos podem se posicionar como:
- Parceiros ambientais
- Facilitadores da reciclagem
- Agentes de transformação

## 5. Profissionalização do Setor

### Formalização

Tendência de maior formalização:
- Nota fiscal
- Contratos formais
- Cumprimento de normas

### Capacitação

Investimento em conhecimento:
- Treinamento de equipes
- Conhecimento técnico
- Gestão empresarial

## Como se Preparar

### 1. Digitalize sua Operação

Adote um sistema de gestão como o XLata:
- Controle profissional
- Relatórios para parceiros
- Histórico completo

### 2. Regularize seu Negócio

Mantenha documentação em dia:
- Licenças ambientais
- Alvarás
- Cadastros

### 3. Invista em Qualidade

Melhore seus processos:
- Separação adequada
- Armazenamento correto
- Equipamentos adequados

### 4. Amplie sua Rede

Conecte-se com:
- Indústrias
- Cooperativas
- Outros depósitos
- Associações do setor

## Conclusão

2025 será um ano de oportunidades para quem estiver preparado. A profissionalização e a tecnologia serão diferenciais competitivos.

---

**Prepare-se para o futuro!** [Comece a usar o XLata hoje](/register)',
  'Tendências da Reciclagem 2025 | Mercado',
  'Principais tendências do mercado de reciclagem para 2025: tecnologia, economia circular, valorização de materiais e sustentabilidade.',
  ARRAY['tendências', 'mercado', '2025', 'reciclagem'],
  9,
  true,
  NOW()
),
(
  'Legislação para Depósitos de Reciclagem no Brasil',
  'legislacao-depositos-reciclagem-brasil',
  'd11d8874-0092-4f09-9ad4-e727f86d15c8',
  'published',
  'Conheça as principais leis e normas que regulamentam os depósitos de reciclagem no Brasil.',
  '# Legislação para Depósitos de Reciclagem no Brasil

Conhecer a legislação é fundamental para operar um depósito de reciclagem de forma regular e evitar problemas.

## Principais Leis

### Política Nacional de Resíduos Sólidos (Lei 12.305/2010)

A PNRS é a principal lei sobre resíduos no Brasil:
- Define responsabilidades
- Institui logística reversa
- Estabelece hierarquia de gestão
- Cria metas de reciclagem

### Lei de Crimes Ambientais (Lei 9.605/1998)

Define crimes e penalidades ambientais:
- Multas por descumprimento
- Responsabilidade criminal
- Reparação de danos

## Licenciamento Ambiental

### Quando é Necessário

Todo depósito de reciclagem precisa de licença ambiental:
- Licença Prévia (LP)
- Licença de Instalação (LI)
- Licença de Operação (LO)

### Órgãos Responsáveis

| Porte | Órgão |
|-------|-------|
| Pequeno | Prefeitura |
| Médio | Órgão estadual |
| Grande | IBAMA |

### Documentos Necessários

1. Requerimento de licença
2. Projeto do empreendimento
3. Estudo ambiental (se exigido)
4. Comprovantes de regularidade

## Alvará de Funcionamento

### Requisitos

- CNPJ ativo
- Inscrição estadual
- Licença ambiental
- AVCB (Bombeiros)
- Contrato de aluguel/propriedade

### Renovação

Geralmente anual, verifique em sua prefeitura.

## Normas Técnicas

### ABNT

Normas técnicas relevantes:
- NBR 10004 - Classificação de resíduos
- NBR 11174 - Armazenamento de resíduos
- NBR 13221 - Transporte de resíduos

## Obrigações Trabalhistas

### EPIs Obrigatórios

- Luvas de proteção
- Botas de segurança
- Óculos de proteção
- Máscaras (quando necessário)

### Documentação

- Registro de funcionários
- Exames médicos
- Treinamentos de segurança

## Obrigações Fiscais

### Notas Fiscais

- Emita nota em todas as vendas
- Mantenha registro de compras
- Arquivo por 5 anos

### Impostos

- ICMS sobre vendas
- ISS (se aplicável)
- Imposto de renda

## Penalidades

### Multas Ambientais

| Infração | Multa |
|----------|-------|
| Sem licença | R$ 5.000 a R$ 50 milhões |
| Armazenamento irregular | R$ 5.000 a R$ 50.000 |
| Poluição | R$ 5.000 a R$ 50 milhões |

### Outras Penalidades

- Interdição do estabelecimento
- Apreensão de materiais
- Responsabilização criminal

## Como se Regularizar

1. Contrate um contador especializado
2. Consulte órgão ambiental local
3. Faça licenciamento adequado
4. Mantenha documentação em dia
5. Cumpra normas de segurança

## Dicas

- Consulte sempre um advogado/contador
- Mantenha relacionamento com órgãos fiscalizadores
- Participe de associações do setor
- Atualize-se sobre mudanças na legislação

---

**Organize sua documentação!** Use o [XLata](/register) para manter registros organizados.',
  'Legislação para Depósitos de Reciclagem | Brasil',
  'Guia completo sobre legislação para depósitos de reciclagem no Brasil: licenças, alvarás, normas e obrigações legais.',
  ARRAY['legislação', 'leis', 'licenciamento', 'regularização'],
  11,
  false,
  NOW()
);