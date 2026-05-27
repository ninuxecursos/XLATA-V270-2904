-- =====================================================
-- PARTE 8: Artigos do Painel Admin - Financeiro (4 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-ver-dashboard-financeiro-admin', 'Como ver dashboard financeiro admin', 
'# Como ver dashboard financeiro admin

## Introdução
O dashboard financeiro admin mostra todas as receitas, pagamentos e métricas financeiras do sistema.

## Para que serve
- Acompanhar receita total
- Monitorar pagamentos
- Analisar crescimento financeiro
- Preparar relatórios

## Métricas disponíveis

### Receita
- Receita do mês atual
- Receita acumulada do ano
- Comparativo com mês anterior
- Projeção do mês

### Assinaturas
- Total de assinaturas ativas
- Novas assinaturas
- Cancelamentos (churn)
- Taxa de renovação

### Pagamentos
- Pagamentos recebidos
- Pagamentos pendentes
- Pagamentos em atraso
- Taxa de sucesso PIX

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Financeiro**
3. O dashboard carregará automaticamente
4. Use filtros de período
5. Exporte relatórios se necessário

## Gráficos disponíveis
- Receita ao longo do tempo
- Distribuição por plano
- Evolução de assinantes

## Conclusão
O dashboard financeiro é essencial para gestão do negócio.',
'Aprenda a usar o dashboard financeiro do painel admin XLata',
'geral', 'published', 3, true,
'Como Ver Dashboard Financeiro Admin | XLata',
'Guia do dashboard financeiro no painel admin XLata. Receitas e métricas.'),

('como-consultar-pagamentos-pix', 'Como consultar pagamentos PIX', 
'# Como consultar pagamentos PIX

## Introdução
Todos os pagamentos PIX realizados no sistema podem ser consultados e analisados no painel admin.

## Para que serve
- Verificar pagamentos recebidos
- Acompanhar pendências
- Resolver problemas de pagamento
- Gerar comprovantes

## Status de pagamentos
- **Aprovado**: Pagamento confirmado
- **Pendente**: Aguardando pagamento
- **Expirado**: QR Code vencido
- **Cancelado**: Pagamento cancelado

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Pagamentos PIX**
3. Veja a lista de todos os pagamentos
4. Use filtros:
   - Por status
   - Por período
   - Por usuário
5. Clique em um pagamento para detalhes

## Informações do pagamento
- ID do pagamento
- Usuário/email
- Valor
- Data/hora
- Status atual
- Histórico de status

## Ações disponíveis
- Ver detalhes completos
- Verificar no Mercado Pago
- Gerar comprovante
- Reenviar notificação

## Conclusão
Acompanhe todos os pagamentos PIX de forma centralizada.',
'Aprenda a consultar e gerenciar pagamentos PIX no XLata',
'geral', 'published', 3, true,
'Como Consultar Pagamentos PIX | XLata',
'Guia para consultar pagamentos PIX no painel admin XLata.'),

('como-acompanhar-receitas-sistema', 'Como acompanhar receitas do sistema', 
'# Como acompanhar receitas do sistema

## Introdução
O acompanhamento de receitas permite entender a saúde financeira do XLata e planejar o crescimento.

## Para que serve
- Monitorar faturamento
- Identificar tendências
- Planejar investimentos
- Preparar demonstrativos

## Métricas de receita

### Por período
- Receita diária
- Receita semanal
- Receita mensal
- Receita anual

### Por origem
- Assinaturas mensais
- Assinaturas trimestrais
- Assinaturas semestrais
- Assinaturas anuais

### Por status
- Receita realizada
- Receita projetada
- Receita em risco (cancelamentos)

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Financeiro** → **Receitas**
3. Selecione o período de análise
4. Explore os diferentes gráficos
5. Exporte relatórios

## Relatórios disponíveis
- Demonstrativo de receitas
- Análise de crescimento
- Previsão de receita
- Análise de churn

## Conclusão
Acompanhar receitas é fundamental para gestão do negócio.',
'Aprenda a acompanhar todas as receitas do sistema XLata',
'geral', 'published', 3, true,
'Como Acompanhar Receitas do Sistema | XLata',
'Guia para acompanhar receitas e faturamento no XLata.'),

('como-gerar-relatorios-financeiros', 'Como gerar relatórios financeiros', 
'# Como gerar relatórios financeiros

## Introdução
Relatórios financeiros consolidados ajudam na tomada de decisão e prestação de contas.

## Para que serve
- Gerar demonstrativos
- Preparar relatórios para stakeholders
- Análise de desempenho
- Planejamento estratégico

## Tipos de relatórios

### Demonstrativo de Resultados
- Receita bruta
- Deduções
- Receita líquida
- Custos operacionais
- Resultado

### Análise de Assinaturas
- Novas assinaturas
- Renovações
- Cancelamentos
- MRR (Monthly Recurring Revenue)
- Churn rate

### Relatório de Pagamentos
- Pagamentos por período
- Por método de pagamento
- Taxa de sucesso
- Valor médio

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Financeiro** → **Relatórios**
3. Selecione o tipo de relatório
4. Configure período e filtros
5. Clique em **Gerar Relatório**
6. Visualize ou exporte em PDF/Excel

## Conclusão
Relatórios financeiros são base para decisões estratégicas.',
'Aprenda a gerar relatórios financeiros completos no XLata',
'geral', 'published', 3, true,
'Como Gerar Relatórios Financeiros | XLata',
'Guia para gerar relatórios financeiros no painel admin XLata.');