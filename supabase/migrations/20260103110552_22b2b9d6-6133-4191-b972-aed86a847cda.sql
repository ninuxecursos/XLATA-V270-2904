-- Inserir artigos de ajuda (Relatórios, Configurações, Problemas)
INSERT INTO help_articles (title, slug, category_id, module, status, excerpt, content_md, seo_title, seo_description, reading_time_minutes, sort_order) VALUES
(
  'Relatório de Transações',
  'relatorio-transacoes',
  'a1484afa-b757-47ca-8a97-7e891f0fb969',
  'transacoes',
  'published',
  'Como acessar e interpretar o relatório de transações do XLata para análise de compras e vendas.',
  '# Relatório de Transações

O relatório de transações é uma das ferramentas mais poderosas do XLata. Permite analisar todas as operações do seu depósito.

## Acessando o Relatório

1. Menu lateral > **Transações**
2. Ou acesse **Relatórios > Transações**

## Filtros Disponíveis

### Por Período

- Hoje
- Últimos 7 dias
- Este mês
- Mês anterior
- Período personalizado

### Por Tipo

- Todas as transações
- Apenas compras
- Apenas vendas

### Por Material

- Todos os materiais
- Material específico
- Categoria de material

### Por Cliente/Fornecedor

- Todos
- Cliente específico
- Fornecedor específico

## Informações do Relatório

Cada transação mostra:

| Campo | Descrição |
|-------|-----------|
| Data/Hora | Quando ocorreu |
| Tipo | Compra ou Venda |
| Material | O que foi negociado |
| Quantidade | Peso em kg |
| Valor Unitário | Preço por kg |
| Valor Total | Quantidade x Preço |
| Cliente/Fornecedor | Com quem negociou |

## Totalizadores

No final do relatório:
- **Total de operações** no período
- **Quantidade total** de material
- **Valor total** movimentado
- **Média por operação**

## Exportação

Você pode exportar o relatório em:
- **PDF** - Para impressão
- **Excel** - Para análise detalhada
- **CSV** - Para outros sistemas

## Análises Úteis

### Compras x Vendas

Compare volumes e valores para identificar:
- Estoque acumulando
- Giro rápido de material
- Oportunidades de venda

### Sazonalidade

Analise períodos para identificar:
- Meses de maior movimento
- Dias da semana mais fortes
- Horários de pico

### Fornecedores Top

Identifique seus melhores fornecedores:
- Maior volume
- Melhor qualidade
- Mais frequentes

## Dicas de Uso

1. **Revise diariamente** as transações
2. **Compare períodos** para identificar tendências
3. **Exporte mensalmente** para backup
4. **Compartilhe com contador** para contabilidade

---

**Dados são o combustível da boa gestão!**',
  'Relatório de Transações | XLata Sistema',
  'Como usar o relatório de transações do XLata. Analise compras e vendas do seu depósito de reciclagem.',
  5,
  1
),
(
  'Análise de Fluxo Diário',
  'analise-fluxo-diario',
  'a1484afa-b757-47ca-8a97-7e891f0fb969',
  'relatorios',
  'published',
  'Entenda o fluxo de caixa diário do seu depósito com os relatórios do XLata.',
  '# Análise de Fluxo Diário

O fluxo de caixa diário mostra a "saúde" financeira do seu depósito em tempo real. Acompanhe entradas e saídas para tomar decisões informadas.

## O que é Fluxo de Caixa

É o movimento de dinheiro:
- **Entradas** - Vendas, suprimentos, recebimentos
- **Saídas** - Compras, despesas, sangrias

### Fórmula

```
Saldo = Entradas - Saídas
```

## Acessando o Fluxo Diário

1. Menu > **Dashboard** ou **Fluxo Diário**
2. Visualize o resumo do dia atual
3. Navegue entre datas

## Informações Exibidas

### Resumo do Dia

- Saldo inicial (abertura do caixa)
- Total de entradas
- Total de saídas
- Saldo atual/final

### Detalhamento

- Lista de todas as movimentações
- Hora de cada operação
- Tipo e valor
- Descrição/observação

## Gráficos

### Evolução Diária

Gráfico de linha mostrando:
- Saldo ao longo do dia
- Picos de entrada
- Momentos de saída

### Composição

Gráfico de pizza mostrando:
- Proporção de entradas por tipo
- Proporção de saídas por categoria

## Análise Semanal

Compare os dias da semana:
- Qual dia tem mais movimento
- Qual dia é mais lucrativo
- Padrões de comportamento

## Indicadores Importantes

### Ticket Médio

Valor médio por transação:
```
Ticket Médio = Total / Número de Operações
```

### Margem Operacional

Lucro sobre o faturamento:
```
Margem = (Vendas - Compras) / Vendas x 100
```

## Alertas

Configure alertas para:
- Caixa abaixo de valor mínimo
- Muitas operações sem fechamento
- Diferenças no fechamento

## Boas Práticas

1. **Confira o fluxo** ao final de cada dia
2. **Compare com expectativas** de movimento
3. **Investigue anomalias** imediatamente
4. **Use para planejamento** de compras e vendas

---

**Conhecer seu fluxo de caixa é essencial para a sobrevivência do negócio!**',
  'Fluxo de Caixa Diário para Reciclagem | XLata',
  'Analise o fluxo de caixa diário do seu depósito de reciclagem. Relatórios completos no sistema XLata.',
  5,
  2
),
(
  'Personalizando Recibos',
  'personalizando-recibos',
  '019b557b-e09a-4890-abb0-f9bb91f208b7',
  'geral',
  'published',
  'Como personalizar os recibos de compra e venda no XLata com sua logo e informações.',
  '# Personalizando Recibos

O recibo é a identidade visual do seu depósito. O XLata permite personalização completa para impressionar seus clientes.

## Acessando Configurações

1. Menu > **Configurações**
2. Clique em **Recibos**

## Elementos Personalizáveis

### Logo da Empresa

1. Clique em **Alterar Logo**
2. Faça upload da imagem (PNG ou JPG)
3. Ajuste o tamanho se necessário
4. Salve

**Dica:** Use imagem com fundo transparente para melhor resultado.

### Informações do Cabeçalho

- Nome da empresa
- CNPJ/CPF
- Endereço completo
- Telefones de contato
- Email e site

### Informações do Rodapé

- Mensagem personalizada
- Horário de funcionamento
- Redes sociais
- Aviso legal

## Formato do Recibo

### Tamanho do Papel

- 80mm (padrão para impressoras térmicas)
- 58mm (impressoras compactas)
- A4 (impressora comum)

### Layout

Escolha entre:
- Compacto - Essencial apenas
- Padrão - Informações completas
- Detalhado - Com observações extras

## Informações na Transação

Configure o que aparece:

- [x] Número do recibo
- [x] Data e hora
- [x] Nome do cliente/fornecedor
- [x] Lista de materiais
- [x] Peso e valor de cada item
- [x] Total da operação
- [x] Forma de pagamento
- [ ] Assinatura (opcional)

## Impressão Automática

Configure a impressão automática:
- Imprimir ao finalizar compra
- Imprimir ao finalizar venda
- Perguntar antes de imprimir
- Número de vias

## Modelo de Recibo

### Recibo de Compra

```
╔══════════════════════════════╗
║      SEU DEPÓSITO LTDA       ║
║   CNPJ: 00.000.000/0001-00   ║
║    Rua das Flores, 123       ║
║    Tel: (11) 99999-9999      ║
╠══════════════════════════════╣
║ RECIBO DE COMPRA Nº 001234   ║
║ Data: 03/01/2026 14:30       ║
╠══════════════════════════════╣
║ Material        Kg     Valor ║
║ Alumínio     50,00   250,00  ║
║ Ferro       200,00   100,00  ║
╠══════════════════════════════╣
║ TOTAL:              R$350,00 ║
║ Pagamento: Dinheiro          ║
╚══════════════════════════════╝
```

## Envio Digital

Além de imprimir, você pode:
- **WhatsApp** - Enviar como imagem
- **Email** - Enviar como PDF
- **SMS** - Enviar link

---

**Um recibo profissional transmite credibilidade!**',
  'Personalizar Recibos de Reciclagem | XLata',
  'Como personalizar recibos no sistema XLata. Adicione sua logo e informações nos comprovantes.',
  4,
  1
),
(
  'Perguntas Frequentes (FAQ)',
  'perguntas-frequentes-faq',
  '0dfa2187-951c-4670-ac01-5ae00eaf8716',
  'geral',
  'published',
  'Respostas para as dúvidas mais comuns sobre o sistema XLata para depósitos de reciclagem.',
  '# Perguntas Frequentes (FAQ)

Encontre respostas rápidas para as dúvidas mais comuns sobre o XLata.

## Geral

### O que é o XLata?

O XLata é um sistema completo de gestão para depósitos de reciclagem e ferro velhos. Permite controlar compras, vendas, estoque, caixa e muito mais.

### Preciso instalar algum programa?

Não! O XLata funciona 100% online, direto no navegador. Acesse de qualquer computador, tablet ou celular.

### O sistema funciona offline?

O XLata precisa de internet para funcionar. Recomendamos uma conexão estável para melhor experiência.

### Meus dados estão seguros?

Sim! Usamos criptografia de ponta e servidores seguros. Seus dados são protegidos e fazemos backup automático.

## Conta e Acesso

### Como criar uma conta?

Acesse [xlata.site/register](/register), preencha seus dados e comece a usar imediatamente.

### Esqueci minha senha, o que fazer?

Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas por email.

### Posso ter mais de um usuário?

Sim! Você pode adicionar funcionários com diferentes níveis de permissão.

## Pagamento e Planos

### O XLata é gratuito?

Oferecemos 7 dias de teste grátis. Após, escolha o plano que melhor atende seu depósito.

### Quais formas de pagamento aceitas?

Aceitamos PIX, cartão de crédito e boleto bancário.

### Posso cancelar a qualquer momento?

Sim, você pode cancelar quando quiser, sem multas ou taxas adicionais.

## Funcionalidades

### O sistema emite nota fiscal?

O XLata emite recibos de compra e venda. Para notas fiscais, recomendamos integração com seu contador.

### Funciona com minha balança?

Sim! O XLata é compatível com as principais marcas de balanças: Toledo, Filizola, Urano e outras com protocolo serial.

### Posso acessar do celular?

Sim! O sistema é responsivo e funciona perfeitamente em smartphones e tablets.

### Como faço backup dos meus dados?

O backup é automático e diário. Você também pode exportar relatórios a qualquer momento.

## Suporte

### Como entrar em contato com o suporte?

Pelo WhatsApp através do botão de suporte no sistema, ou por email.

### O suporte é gratuito?

Sim! O suporte está incluso em todos os planos.

### Vocês oferecem treinamento?

Sim! Temos vídeos tutoriais, guias escritos e oferecemos treinamento remoto quando necessário.

## Problemas Técnicos

### O sistema está lento, o que fazer?

1. Verifique sua conexão de internet
2. Limpe o cache do navegador
3. Tente outro navegador
4. Contate o suporte se persistir

### Não consigo imprimir recibos

1. Verifique se a impressora está ligada
2. Confira se está selecionada como padrão
3. Teste impressão de outra aplicação
4. Contate o suporte para ajuda

### A balança não conecta

1. Verifique o cabo de conexão
2. Confira a porta COM configurada
3. Reinicie a balança e o sistema
4. Veja o guia de [configuração de balança](/ajuda/artigo/usando-balanca-integrada)

---

**Não encontrou sua dúvida?** Entre em contato com nosso suporte!',
  'FAQ XLata - Perguntas Frequentes',
  'Perguntas frequentes sobre o sistema XLata. Tire suas dúvidas sobre o sistema para depósitos de reciclagem.',
  8,
  1
);