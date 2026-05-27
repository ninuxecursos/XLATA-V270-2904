-- Adicionar novos valores ao enum system_module
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'campanha';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'indicacoes';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'ajuda';

-- =====================================================
-- PARTE 1: Artigos de Vendas (4 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-consultar-vendas-realizadas', 'Como consultar vendas realizadas', 
'# Como consultar vendas realizadas

## Introdução
Acompanhar suas vendas é essencial para entender o desempenho do seu depósito. O XLata oferece um painel completo para consultar todas as vendas realizadas.

## Para que serve
- Verificar histórico de vendas
- Analisar volume de vendas por período
- Identificar materiais mais vendidos
- Acompanhar faturamento

## Quem deve usar
- Proprietários de depósitos
- Gestores financeiros
- Funcionários com permissão de vendas

## Passo a passo

1. Acesse o menu lateral
2. Clique em **Vendas**
3. A lista de vendas aparecerá ordenada por data
4. Use os filtros para refinar a busca
5. Clique em uma venda para ver detalhes

## Boas práticas
- Consulte as vendas diariamente
- Compare vendas entre períodos
- Identifique tendências de compra

## Erros comuns
- **Não encontro uma venda**: Verifique se o filtro de data está correto
- **Valores zerados**: Confirme que a venda foi finalizada

## Conclusão
Consultar suas vendas regularmente ajuda a tomar decisões mais estratégicas para seu negócio.',
'Aprenda a consultar o histórico completo de vendas realizadas no seu depósito',
'venda', 'published', 3, true,
'Como Consultar Vendas Realizadas | XLata',
'Guia completo para consultar vendas realizadas no sistema XLata. Veja histórico, filtros e análises.'),

('como-filtrar-vendas-periodo', 'Como filtrar vendas por período', 
'# Como filtrar vendas por período

## Introdução
Filtrar vendas por período permite análises mais precisas do seu negócio, seja por dia, semana, mês ou intervalo personalizado.

## Para que serve
- Gerar relatórios por período específico
- Comparar vendas entre diferentes épocas
- Analisar sazonalidade

## Quem deve usar
- Gestores de depósito
- Analistas financeiros
- Proprietários

## Passo a passo

1. Acesse a página de **Vendas**
2. Localize o filtro de datas no topo
3. Selecione a data inicial
4. Selecione a data final
5. Clique em **Aplicar Filtro**
6. Os resultados serão atualizados automaticamente

## Boas práticas
- Compare o mesmo período em anos diferentes
- Use filtros semanais para acompanhamento regular
- Exporte os dados para análises externas

## Erros comuns
- **Data inicial maior que final**: Inverta as datas
- **Sem resultados**: Verifique se houve vendas no período

## Conclusão
Use filtros de período para ter insights valiosos sobre o desempenho do seu depósito.',
'Aprenda a filtrar vendas por período no XLata para análises mais precisas',
'venda', 'published', 2, true,
'Como Filtrar Vendas por Período | XLata',
'Guia para filtrar vendas por data no XLata. Análises diárias, semanais e mensais.'),

('como-calcular-lucro-vendas', 'Como calcular o lucro das vendas', 
'# Como calcular o lucro das vendas

## Introdução
Entender o lucro real das suas vendas é fundamental para a saúde financeira do seu depósito. O XLata calcula automaticamente a diferença entre preço de compra e venda.

## Para que serve
- Conhecer a margem de lucro por material
- Identificar materiais mais lucrativos
- Tomar decisões de precificação

## Quem deve usar
- Proprietários de depósitos
- Gestores financeiros

## Passo a passo

1. Configure o **preço de compra** de cada material
2. Configure o **preço de venda** de cada material
3. O sistema calculará automaticamente a margem
4. Na página de vendas, veja o lucro por transação
5. Nos relatórios, veja o lucro consolidado

## Como é calculado

```
Lucro = Preço de Venda - Preço de Compra
Margem (%) = (Lucro / Preço de Venda) × 100
```

## Boas práticas
- Mantenha preços atualizados
- Revise margens periodicamente
- Compare com a concorrência

## Erros comuns
- **Lucro zerado**: Configure os preços de compra
- **Margem negativa**: Preço de venda menor que compra

## Conclusão
Monitore seu lucro para garantir a sustentabilidade do negócio.',
'Aprenda a calcular e monitorar o lucro das suas vendas no XLata',
'venda', 'published', 3, true,
'Como Calcular Lucro das Vendas | XLata',
'Guia para calcular lucro e margem das vendas no XLata. Maximize seus ganhos.'),

('como-ver-peso-total-vendido', 'Como ver peso total vendido', 
'# Como ver peso total vendido

## Introdução
Acompanhar o peso total vendido ajuda a entender o volume de operação do seu depósito e planejar a capacidade de trabalho.

## Para que serve
- Medir volume de operação
- Planejar logística
- Comparar períodos de alta e baixa

## Quem deve usar
- Proprietários de depósitos
- Gestores de operação
- Funcionários de logística

## Passo a passo

1. Acesse a página de **Vendas**
2. No topo, veja o resumo com peso total
3. Use filtros de período para análises específicas
4. O total é atualizado automaticamente

## Onde visualizar
- **Dashboard**: Resumo geral do dia
- **Vendas**: Total do período filtrado
- **Relatórios**: Análise detalhada por material

## Boas práticas
- Compare peso vendido vs comprado
- Monitore variações sazonais
- Use para prever demanda

## Erros comuns
- **Total zerado**: Verifique se há vendas no período
- **Valores muito altos**: Confirme a unidade de medida

## Conclusão
O peso total vendido é um indicador chave do desempenho do seu depósito.',
'Aprenda a visualizar o peso total vendido no seu depósito com o XLata',
'venda', 'published', 2, true,
'Como Ver Peso Total Vendido | XLata',
'Guia para acompanhar o peso total vendido no XLata. Métricas de volume.'),

-- =====================================================
-- PARTE 2: Artigos de Assinatura (3 artigos)
-- =====================================================

('como-consultar-historico-renovacoes', 'Como consultar histórico de renovações', 
'# Como consultar histórico de renovações

## Introdução
Acompanhar seu histórico de renovações ajuda a entender seus pagamentos passados e planejar os próximos.

## Para que serve
- Ver todas as renovações realizadas
- Conferir valores pagos
- Verificar datas de cada período

## Quem deve usar
- Proprietários de depósitos
- Gestores financeiros

## Passo a passo

1. Acesse o menu **Configurações**
2. Vá na seção **Assinatura**
3. Clique em **Histórico de Renovações**
4. Veja a lista completa de pagamentos
5. Cada item mostra data, valor e período

## Informações disponíveis
- Data do pagamento
- Valor pago
- Período contratado
- Método de pagamento
- Status da transação

## Boas práticas
- Guarde comprovantes de pagamento
- Verifique se todas as renovações estão registradas
- Use como referência para declarações fiscais

## Conclusão
Mantenha seu histórico organizado para melhor controle financeiro.',
'Aprenda a consultar o histórico completo de renovações da sua assinatura XLata',
'assinatura', 'published', 2, true,
'Como Consultar Histórico de Renovações | XLata',
'Guia para ver histórico de renovações e pagamentos da assinatura XLata.'),

('como-renovar-assinatura', 'Como renovar a assinatura', 
'# Como renovar a assinatura

## Introdução
Renovar sua assinatura garante acesso contínuo ao sistema XLata e todos os seus recursos.

## Para que serve
- Manter o acesso ao sistema
- Continuar usando todas as funcionalidades
- Evitar interrupções no trabalho

## Quando renovar
- Antes da data de vencimento (recomendado)
- Até 3 dias após o vencimento (período de carência)

## Passo a passo

1. Acesse o menu **Configurações**
2. Vá na seção **Assinatura**
3. Clique em **Renovar Agora**
4. Escolha o período desejado
5. Selecione o método de pagamento (PIX)
6. Escaneie o QR Code
7. Aguarde a confirmação

## Métodos de pagamento
- **PIX**: Confirmação instantânea
- **Cartão**: Em breve

## Boas práticas
- Renove com antecedência
- Escolha períodos maiores para economizar
- Guarde o comprovante de pagamento

## Erros comuns
- **PIX expirado**: Gere um novo QR Code
- **Pagamento não confirmado**: Aguarde alguns minutos

## Conclusão
Renove sua assinatura em dia e nunca perca acesso ao sistema.',
'Aprenda a renovar sua assinatura do XLata de forma rápida e segura',
'assinatura', 'published', 3, true,
'Como Renovar Assinatura | XLata',
'Guia completo para renovar sua assinatura XLata via PIX. Processo simples e rápido.'),

('como-fazer-upgrade-plano', 'Como fazer upgrade de plano', 
'# Como fazer upgrade de plano

## Introdução
Conforme seu depósito cresce, você pode precisar de mais recursos. O upgrade de plano libera funcionalidades adicionais.

## Para que serve
- Acessar recursos avançados
- Aumentar limites de uso
- Desbloquear funcionalidades premium

## Planos disponíveis
- **Básico**: Funcionalidades essenciais
- **Profissional**: Recursos avançados
- **Enterprise**: Personalizado para grandes operações

## Passo a passo

1. Acesse o menu **Configurações**
2. Vá na seção **Assinatura**
3. Clique em **Upgrade de Plano**
4. Compare os planos disponíveis
5. Selecione o novo plano
6. Pague a diferença proporcional
7. Recursos liberados imediatamente

## Cálculo proporcional
O sistema calcula automaticamente o valor proporcional restante do seu plano atual e desconta do novo plano.

## Boas práticas
- Avalie suas necessidades antes do upgrade
- Compare funcionalidades de cada plano
- Considere o crescimento futuro

## Conclusão
Faça upgrade quando precisar de mais recursos para seu negócio crescer.',
'Aprenda a fazer upgrade do seu plano XLata para acessar mais recursos',
'assinatura', 'published', 3, true,
'Como Fazer Upgrade de Plano | XLata',
'Guia para fazer upgrade de plano no XLata. Compare planos e libere novos recursos.'),

-- =====================================================
-- PARTE 3: Artigos de Transações (3 artigos)
-- =====================================================

('como-ver-detalhes-transacao', 'Como ver detalhes de uma transação', 
'# Como ver detalhes de uma transação

## Introdução
Cada transação no XLata possui informações detalhadas que podem ser consultadas a qualquer momento.

## Para que serve
- Verificar dados de uma compra ou venda
- Conferir valores e pesos
- Analisar histórico de um cliente

## Quem deve usar
- Proprietários de depósitos
- Funcionários do caixa
- Gestores financeiros

## Passo a passo

1. Acesse a página de **Transações**
2. Localize a transação desejada
3. Clique no ícone de detalhes (olho)
4. O modal com todas as informações será exibido

## Informações disponíveis
- Data e hora da transação
- Tipo (compra ou venda)
- Cliente associado
- Materiais com pesos e valores
- Forma de pagamento
- Valor total
- Funcionário responsável

## Boas práticas
- Use a busca para encontrar transações específicas
- Exporte dados para análises
- Verifique detalhes antes de reembolsos

## Conclusão
Os detalhes completos de cada transação garantem transparência e controle.',
'Aprenda a consultar todos os detalhes de uma transação no XLata',
'transacoes', 'published', 2, true,
'Como Ver Detalhes de Transação | XLata',
'Guia para consultar detalhes completos de transações no XLata.'),

('como-excluir-transacao', 'Como excluir uma transação', 
'# Como excluir uma transação

## Introdução
Em alguns casos, pode ser necessário excluir uma transação registrada incorretamente. Saiba como fazer isso de forma segura.

## Para que serve
- Corrigir erros de registro
- Remover transações duplicadas
- Limpar dados incorretos

## Quem deve usar
- Proprietários de depósitos
- Funcionários com permissão de exclusão

## ⚠️ Atenção
A exclusão de transações é uma ação **irreversível**. O sistema registra o log da exclusão para auditoria.

## Passo a passo

1. Acesse a página de **Transações**
2. Localize a transação a ser excluída
3. Clique no ícone de lixeira
4. Confirme a exclusão no modal
5. A transação será removida

## Impactos da exclusão
- O caixa será ajustado automaticamente
- O estoque será recalculado
- O histórico do cliente será atualizado

## Boas práticas
- Verifique duas vezes antes de excluir
- Prefira cancelar em vez de excluir quando possível
- Documente o motivo da exclusão

## Erros comuns
- **Não consigo excluir**: Verifique suas permissões
- **Caixa não atualizado**: Aguarde alguns segundos

## Conclusão
Use a exclusão apenas quando realmente necessário e sempre com cautela.',
'Aprenda a excluir transações incorretas no XLata de forma segura',
'transacoes', 'published', 3, true,
'Como Excluir Transação | XLata',
'Guia para excluir transações no XLata. Ação irreversível com impacto no caixa e estoque.'),

('como-consultar-historico-caixas', 'Como consultar histórico de caixas', 
'# Como consultar histórico de caixas

## Introdução
O histórico de caixas permite ver todos os períodos de abertura e fechamento do caixa do seu depósito.

## Para que serve
- Ver caixas anteriores
- Conferir valores de fechamento
- Analisar movimentações passadas

## Quem deve usar
- Proprietários de depósitos
- Gestores financeiros
- Auditores

## Passo a passo

1. Acesse o menu **Transações**
2. Clique na aba **Histórico de Caixas**
3. Veja a lista de todos os caixas
4. Clique em um caixa para ver detalhes

## Informações de cada caixa
- Data de abertura e fechamento
- Valor inicial e final
- Total de entradas e saídas
- Diferença (se houver)
- Funcionário responsável

## Boas práticas
- Revise caixas diariamente
- Investigue diferenças significativas
- Use para reconciliação contábil

## Conclusão
O histórico de caixas garante rastreabilidade completa das suas operações.',
'Aprenda a consultar o histórico completo de caixas no XLata',
'transacoes', 'published', 2, true,
'Como Consultar Histórico de Caixas | XLata',
'Guia para ver histórico de abertura e fechamento de caixas no XLata.'),

-- =====================================================
-- PARTE 4: Artigos de Indicações (3 artigos)
-- =====================================================

('como-acompanhar-indicados', 'Como acompanhar seus indicados', 
'# Como acompanhar seus indicados

## Introdução
O programa de indicações do XLata permite que você acompanhe todas as pessoas que indicou e o status de cada indicação.

## Para que serve
- Ver quem você indicou
- Acompanhar status das indicações
- Verificar bônus acumulados

## Passo a passo

1. Acesse o menu **Indicações**
2. Veja a lista de todos os indicados
3. Cada indicação mostra o status atual
4. Clique em uma indicação para mais detalhes

## Status possíveis
- **Pendente**: Indicado ainda não se cadastrou
- **Cadastrado**: Indicado criou a conta
- **Ativo**: Indicado está usando o sistema
- **Convertido**: Indicado assinou um plano (bônus liberado)

## Informações disponíveis
- Nome do indicado
- Data da indicação
- Status atual
- Valor do bônus (se aplicável)

## Boas práticas
- Compartilhe seu link regularmente
- Acompanhe o progresso dos indicados
- Entre em contato para ajudar na conversão

## Conclusão
Acompanhe seus indicados e maximize seus bônus.',
'Aprenda a acompanhar todas as suas indicações no programa de indicações XLata',
'geral', 'published', 2, true,
'Como Acompanhar Indicados | XLata',
'Guia para acompanhar indicações e bônus no programa de indicações XLata.'),

('como-funcionam-bonus-indicacao', 'Como funcionam os bônus por indicação', 
'# Como funcionam os bônus por indicação

## Introdução
O XLata oferece bônus para quem indica novos usuários. Entenda como funciona o sistema de recompensas.

## Para que serve
- Entender as regras do programa
- Saber quanto pode ganhar
- Planejar suas indicações

## Como funciona

1. Você compartilha seu link de indicação
2. Alguém se cadastra usando seu link
3. Quando essa pessoa assina um plano, você recebe o bônus
4. O bônus é creditado automaticamente

## Tipos de bônus
- **Bônus por assinatura**: Receba quando o indicado assina
- **Bônus recorrente**: Receba a cada renovação (alguns planos)
- **Bônus de milestone**: Atinja metas para bônus extras

## Valores
| Plano do Indicado | Seu Bônus |
|-------------------|-----------|
| Mensal | R$ 10,00 |
| Trimestral | R$ 25,00 |
| Semestral | R$ 40,00 |
| Anual | R$ 70,00 |

## Boas práticas
- Indique para pessoas que realmente precisam
- Ajude seus indicados a terem sucesso
- Quanto mais ativos, mais bônus recorrentes

## Conclusão
Indique amigos e ganhe bônus enquanto ajuda outros depósitos.',
'Entenda como funcionam os bônus do programa de indicações XLata',
'geral', 'published', 3, true,
'Como Funcionam Bônus por Indicação | XLata',
'Guia completo sobre bônus do programa de indicações XLata. Valores e regras.'),

('como-maximizar-indicacoes', 'Como maximizar suas indicações', 
'# Como maximizar suas indicações

## Introdução
Com algumas estratégias simples, você pode aumentar significativamente o número de indicações convertidas.

## Para que serve
- Aumentar suas conversões
- Ganhar mais bônus
- Ajudar mais depósitos

## Estratégias eficazes

### 1. Compartilhe nos lugares certos
- Grupos de WhatsApp de reciclagem
- Redes sociais profissionais
- Eventos do setor

### 2. Mostre os benefícios
- Demonstre o sistema funcionando
- Compartilhe seus resultados
- Destaque a economia de tempo

### 3. Ofereça suporte
- Ajude nos primeiros passos
- Tire dúvidas do indicado
- Compartilhe dicas de uso

### 4. Use o momento certo
- Quando alguém reclama de organização
- Quando falam sobre perdas financeiras
- Em conversas sobre tecnologia

## Métricas para acompanhar
- Taxa de cadastro (cliques → cadastros)
- Taxa de conversão (cadastros → assinaturas)
- Tempo médio de conversão

## Boas práticas
- Seja genuíno nas indicações
- Não faça spam
- Foque em qualidade, não quantidade

## Conclusão
Indicações bem feitas geram mais conversões e relacionamentos duradouros.',
'Aprenda estratégias para maximizar suas indicações no XLata',
'geral', 'published', 4, true,
'Como Maximizar Indicações | XLata',
'Estratégias para aumentar conversões no programa de indicações XLata.');