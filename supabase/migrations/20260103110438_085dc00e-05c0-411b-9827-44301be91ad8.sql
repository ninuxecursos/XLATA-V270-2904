-- Inserir artigos de ajuda (Financeiro e Caixa)
INSERT INTO help_articles (title, slug, category_id, module, status, excerpt, content_md, seo_title, seo_description, reading_time_minutes, sort_order) VALUES
(
  'Abertura e Fechamento de Caixa',
  'abertura-fechamento-caixa',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'caixa',
  'published',
  'Aprenda a abrir e fechar o caixa corretamente no XLata para manter o controle financeiro do seu depósito.',
  '# Abertura e Fechamento de Caixa

O controle de caixa é fundamental para a saúde financeira do seu depósito. O XLata oferece um sistema completo e fácil de usar.

## Abertura de Caixa

### Quando Abrir

- No início de cada dia de trabalho
- Quando iniciar um novo turno
- Após fechamento anterior

### Como Abrir

1. Acesse o **PDV**
2. O sistema detecta que o caixa está fechado
3. Clique em **Abrir Caixa**
4. Informe o **valor inicial** (fundo de caixa)
5. Confirme a abertura

### Valor Inicial

O valor inicial é o dinheiro que você deixa no caixa para:
- Dar troco aos clientes
- Pagar pequenas compras
- Cobrir emergências

**Sugestão:** Mantenha entre R$ 200 e R$ 500 como fundo de caixa.

## Durante o Expediente

### Operações Registradas

Com o caixa aberto, todas as operações são registradas:

| Operação | Efeito no Caixa |
|----------|-----------------|
| Compra (dinheiro) | Saída |
| Venda (dinheiro) | Entrada |
| Sangria | Saída |
| Suprimento | Entrada |
| Despesa | Saída |

### Sangria

Quando há muito dinheiro no caixa:
1. Clique em **Sangria**
2. Informe o valor a retirar
3. Descreva o motivo
4. Confirme

### Suprimento

Para adicionar dinheiro ao caixa:
1. Clique em **Suprimento**
2. Informe o valor
3. Descreva a origem
4. Confirme

## Fechamento de Caixa

### Quando Fechar

- No final do expediente
- Na troca de turno
- Quando necessário por segurança

### Como Fechar

1. No PDV, clique em **Fechar Caixa**
2. Conte o dinheiro físico no caixa
3. Informe o **valor contado**
4. O sistema compara com o valor esperado
5. Confirme o fechamento

### Conferência

O sistema mostra:
- **Valor esperado** - calculado automaticamente
- **Valor contado** - informado por você
- **Diferença** - sobra ou falta

### Tratando Diferenças

Se houver diferença:
- **Sobra:** Verifique se houve erro em algum registro
- **Falta:** Revise as operações do dia
- Registre uma observação explicando

## Relatório de Caixa

Após o fechamento, você tem acesso a:
- Resumo de entradas e saídas
- Detalhamento por tipo de operação
- Histórico completo de movimentações

## Boas Práticas

1. **Abra o caixa** sempre no início do dia
2. **Registre tudo** - não faça operações "por fora"
3. **Faça sangrias** regulares para segurança
4. **Feche o caixa** diariamente
5. **Revise diferenças** e investigue causas

---

**Dica:** O controle de caixa rigoroso evita perdas e facilita a gestão financeira!',
  'Controle de Caixa para Reciclagem | XLata',
  'Como abrir e fechar o caixa no sistema XLata. Controle financeiro completo para depósitos de reciclagem.',
  6,
  1
),
(
  'Registrando Despesas e Sangrias',
  'registrando-despesas-sangrias',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'despesas',
  'published',
  'Como registrar despesas operacionais e fazer sangrias de caixa no XLata.',
  '# Registrando Despesas e Sangrias

Além das compras e vendas, seu depósito tem outras movimentações financeiras. O XLata permite registrar tudo para um controle completo.

## Tipos de Despesas

### Despesas Operacionais

- **Combustível** - Para veículos de coleta
- **Manutenção** - Equipamentos e instalações
- **Material de escritório** - Papéis, canetas, etc
- **Limpeza** - Produtos e serviços
- **Alimentação** - Lanches e refeições

### Despesas Fixas

- **Aluguel** - Do espaço físico
- **Energia elétrica** - Consumo mensal
- **Água** - Consumo mensal
- **Internet/Telefone** - Comunicação
- **Contador** - Serviços contábeis

### Despesas com Pessoal

- **Salários** - Pagamento de funcionários
- **Vale transporte** - Benefício
- **Vale alimentação** - Benefício
- **INSS/FGTS** - Encargos

## Registrando Despesas

### Despesa do Caixa

Para despesas pagas com dinheiro do caixa:

1. No PDV, clique em **Despesa**
2. Selecione a categoria
3. Informe o valor
4. Descreva brevemente
5. Confirme

### Despesa Externa

Para despesas pagas de outra forma:

1. Acesse **Financeiro > Despesas**
2. Clique em **Nova Despesa**
3. Preencha os dados completos
4. Anexe comprovante (opcional)
5. Salve

## Sangrias de Caixa

### O que é Sangria?

Sangria é a retirada de dinheiro do caixa para:
- Depositar no banco
- Guardar em cofre
- Pagar fornecedores

### Quando Fazer

- Quando há muito dinheiro no caixa
- Por segurança (não acumular valores altos)
- Para pagamentos externos

### Como Fazer

1. No PDV, clique em **Sangria**
2. Informe o valor a retirar
3. Selecione o destino (banco, cofre, pagamento)
4. Descreva o motivo
5. Confirme com senha (se configurado)

## Suprimentos de Caixa

### O que é Suprimento?

Suprimento é a adição de dinheiro ao caixa:
- Troco adicional
- Devolução de valores
- Transferência do cofre

### Como Fazer

1. No PDV, clique em **Suprimento**
2. Informe o valor
3. Descreva a origem
4. Confirme

## Relatório de Despesas

Acompanhe suas despesas em **Relatórios > Despesas**:

- Total por categoria
- Comparativo mensal
- Gráficos de evolução
- Despesas x Receitas

## Dicas de Controle

1. **Registre imediatamente** - Não deixe para depois
2. **Categorize corretamente** - Facilita análise
3. **Guarde comprovantes** - Para conferência
4. **Revise mensalmente** - Identifique excessos

---

**Controle de despesas rigoroso é essencial para a lucratividade!**',
  'Despesas e Sangrias no Caixa | XLata',
  'Como registrar despesas e fazer sangrias no sistema XLata. Controle financeiro completo para seu depósito.',
  5,
  2
);