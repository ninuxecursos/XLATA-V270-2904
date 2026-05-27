-- =====================================================
-- PARTE 12: Artigos Complementares (8 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-usar-sistema-celular', 'Como usar o sistema no celular', 
'# Como usar o sistema no celular

## Introdução
O XLata é totalmente responsivo e funciona perfeitamente em smartphones e tablets.

## Para que serve
- Trabalhar em mobilidade
- Atender clientes em campo
- Consultar informações rapidamente
- Registrar operações na hora

## Compatibilidade
- iOS (Safari)
- Android (Chrome)
- Tablets
- Qualquer navegador moderno

## Como acessar

### Pelo navegador
1. Abra o navegador do celular
2. Acesse xlata.site
3. Faça login normalmente
4. Use como aplicativo

### Instalar como app (PWA)
1. Acesse xlata.site no navegador
2. Clique no menu (três pontos)
3. Selecione "Adicionar à tela inicial"
4. O ícone aparecerá como app

## Funcionalidades no mobile
- Todas as funcionalidades do desktop
- Interface adaptada
- Teclado numérico otimizado
- Navegação por gestos

## Dicas de uso
- Mantenha o navegador atualizado
- Use WiFi para uploads grandes
- Ative notificações do navegador
- Salve como app para acesso rápido

## Conclusão
Use o XLata de qualquer lugar com seu celular.',
'Aprenda a usar o XLata no celular com interface otimizada',
'geral', 'published', 3, true,
'Como Usar Sistema no Celular | XLata',
'Guia para usar o XLata no celular. Interface responsiva e PWA.'),

('como-imprimir-resumo-caixa', 'Como imprimir resumo do caixa', 
'# Como imprimir resumo do caixa

## Introdução
Imprima o resumo do caixa para conferência, arquivo ou prestação de contas.

## Para que serve
- Conferir movimentação
- Arquivar para auditoria
- Prestar contas
- Documentar operações

## Conteúdo do resumo
- Data e hora
- Operador responsável
- Valor inicial
- Total de entradas
- Total de saídas
- Valor final
- Diferença (se houver)

## Passo a passo

1. Acesse a página de **Transações**
2. Localize o caixa desejado
3. Clique em **Imprimir Resumo**
4. Escolha:
   - Impressora padrão
   - Salvar como PDF
5. Configure orientação (paisagem recomendado)
6. Clique em **Imprimir**

## Formatos disponíveis
- PDF para arquivo digital
- Impressão direta
- Comprovante térmico (58mm/80mm)

## Boas práticas
- Imprima ao fechar o caixa
- Guarde por no mínimo 5 anos
- Assine para validação

## Conclusão
Mantenha seus resumos de caixa organizados.',
'Aprenda a imprimir o resumo do caixa no XLata',
'caixa', 'published', 2, true,
'Como Imprimir Resumo do Caixa | XLata',
'Guia para imprimir resumo do caixa no XLata.'),

('como-adicionar-saldo-caixa', 'Como adicionar saldo ao caixa', 
'# Como adicionar saldo ao caixa

## Introdução
Às vezes é necessário adicionar dinheiro ao caixa durante o expediente. Aprenda como fazer isso corretamente.

## Para que serve
- Repor troco
- Registrar entrada de valores
- Cobrir diferenças
- Adicionar capital de giro

## Quando usar
- Falta de troco para clientes
- Reposição programada
- Transferência entre caixas
- Início de novo turno (sem fechar)

## Passo a passo

1. Na tela principal, localize o **Caixa**
2. Clique em **Adicionar Saldo**
3. Informe:
   - Valor a adicionar
   - Motivo/descrição
4. Confirme a operação
5. O saldo será atualizado

## Registro da operação
Toda adição é registrada com:
- Data e hora
- Valor adicionado
- Responsável
- Motivo informado

## Boas práticas
- Documente sempre o motivo
- Use valores exatos
- Confira o saldo após adição
- Mantenha comprovantes

## Conclusão
Adicione saldo quando necessário, sempre documentando.',
'Aprenda a adicionar saldo ao caixa durante o expediente no XLata',
'caixa', 'published', 2, true,
'Como Adicionar Saldo ao Caixa | XLata',
'Guia para adicionar saldo ao caixa no XLata.'),

('como-usar-calculadora-pdv', 'Como usar a calculadora do PDV', 
'# Como usar a calculadora do PDV

## Introdução
A calculadora integrada ao PDV facilita cálculos rápidos durante as operações.

## Para que serve
- Calcular valores durante pesagem
- Somar múltiplos itens
- Calcular trocos
- Fazer conversões

## Como acessar
1. No PDV, clique no ícone de calculadora
2. Ou use o atalho de teclado (geralmente Ctrl+K)
3. A calculadora abrirá em modal

## Funcionalidades
- Operações básicas (+, -, ×, ÷)
- Porcentagem (%)
- Memória (M+, M-, MR, MC)
- Histórico de cálculos

## Operações comuns

### Calcular troco
1. Digite o valor total
2. Clique em "-"
3. Digite o valor pago
4. Veja o troco

### Calcular desconto
1. Digite o valor original
2. Clique em "× %"
3. Digite a porcentagem
4. Veja o desconto

## Dicas
- Resultados podem ser usados no PDV
- Histórico fica disponível na sessão
- Funciona com teclado numérico

## Conclusão
Use a calculadora para agilizar operações.',
'Aprenda a usar a calculadora integrada ao PDV do XLata',
'compra', 'published', 2, true,
'Como Usar Calculadora do PDV | XLata',
'Guia da calculadora integrada ao PDV do XLata.'),

('como-escolher-forma-pagamento', 'Como escolher forma de pagamento', 
'# Como escolher forma de pagamento

## Introdução
O XLata suporta múltiplas formas de pagamento. Aprenda a selecionar a correta para cada transação.

## Formas disponíveis
- Dinheiro
- PIX
- Cartão de débito
- Cartão de crédito
- Fiado/Crediário
- Transferência

## Passo a passo

1. Finalize a pesagem dos materiais
2. Clique em **Finalizar Compra**
3. Na tela de pagamento, veja as opções
4. Clique na forma de pagamento desejada
5. Confirme o valor
6. Finalize a operação

## Particularidades por forma

### Dinheiro
- Informe valor recebido
- Sistema calcula troco

### PIX
- Gera QR Code
- Confirma automaticamente

### Cartão
- Registra bandeira
- Opção de parcelamento (crédito)

### Fiado
- Vincula ao cliente
- Registra débito

## Boas práticas
- Confirme antes de finalizar
- Mantenha comprovantes
- Reconcilie diariamente

## Conclusão
Escolha a forma de pagamento correta para cada situação.',
'Aprenda a escolher formas de pagamento no PDV do XLata',
'compra', 'published', 2, true,
'Como Escolher Forma de Pagamento | XLata',
'Guia para escolher formas de pagamento no PDV XLata.'),

('como-imprimir-comprovante-pesagem', 'Como imprimir comprovante de pesagem', 
'# Como imprimir comprovante de pesagem

## Introdução
O comprovante de pesagem documenta a transação para o cliente e para seu controle.

## Para que serve
- Entregar ao cliente
- Documentar a transação
- Conferência posterior
- Requisito legal em alguns casos

## Conteúdo do comprovante
- Data e hora
- Nome do depósito
- Dados do cliente (opcional)
- Materiais pesados
- Peso por material
- Valor por material
- Descontos (tara, umidade)
- Total pago
- Forma de pagamento

## Passo a passo

### Durante a compra
1. Finalize a pesagem
2. Escolha a forma de pagamento
3. Marque "Imprimir comprovante"
4. Confirme a operação
5. O comprovante será impresso

### Após a compra (reimpressão)
1. Acesse **Transações**
2. Encontre a transação
3. Clique em **Reimprimir**
4. Escolha formato e impressora

## Formatos de impressão
- Cupom térmico (58mm/80mm)
- A4 completo
- PDF para email

## Conclusão
Sempre forneça comprovante ao cliente.',
'Aprenda a imprimir comprovantes de pesagem no XLata',
'compra', 'published', 2, true,
'Como Imprimir Comprovante de Pesagem | XLata',
'Guia para imprimir comprovantes de pesagem no XLata.'),

('como-consultar-despesas', 'Como consultar despesas', 
'# Como consultar despesas

## Introdução
Mantenha controle das despesas do seu depósito consultando o histórico completo.

## Para que serve
- Ver gastos por período
- Analisar categorias de despesa
- Controlar orçamento
- Preparar relatórios

## Passo a passo

1. Acesse o menu **Despesas**
2. A lista de despesas aparecerá
3. Use filtros disponíveis:
   - Por período
   - Por categoria
   - Por valor
4. Clique em uma despesa para detalhes

## Informações disponíveis
- Data da despesa
- Categoria
- Descrição
- Valor
- Forma de pagamento
- Anexos (comprovantes)

## Análises possíveis
- Total por categoria
- Comparativo mensal
- Tendências de gastos
- Despesas recorrentes

## Boas práticas
- Revise despesas semanalmente
- Categorize corretamente
- Anexe comprovantes
- Compare com orçamento

## Conclusão
Controle de despesas é essencial para saúde financeira.',
'Aprenda a consultar e analisar despesas no XLata',
'despesas', 'published', 2, true,
'Como Consultar Despesas | XLata',
'Guia para consultar despesas no XLata.'),

('como-consultar-adicoes-saldo', 'Como consultar adições de saldo', 
'# Como consultar adições de saldo

## Introdução
Todas as adições de saldo ao caixa ficam registradas e podem ser consultadas a qualquer momento.

## Para que serve
- Verificar histórico de adições
- Auditar movimentações
- Conferir responsáveis
- Rastrear valores

## Passo a passo

1. Acesse o menu **Transações**
2. Clique na aba **Adições de Saldo**
3. Veja a lista completa
4. Use filtros:
   - Por período
   - Por operador
   - Por valor
5. Clique em um registro para detalhes

## Informações de cada adição
- Data e hora
- Valor adicionado
- Operador responsável
- Motivo/descrição
- Caixa associado

## Relatórios disponíveis
- Total de adições por período
- Por operador
- Motivos mais frequentes
- Comparativo mensal

## Boas práticas
- Revise periodicamente
- Investigue adições frequentes
- Mantenha documentação
- Use para reconciliação

## Conclusão
Acompanhe todas as adições para controle total.',
'Aprenda a consultar histórico de adições de saldo no XLata',
'caixa', 'published', 2, true,
'Como Consultar Adições de Saldo | XLata',
'Guia para consultar adições de saldo no XLata.');