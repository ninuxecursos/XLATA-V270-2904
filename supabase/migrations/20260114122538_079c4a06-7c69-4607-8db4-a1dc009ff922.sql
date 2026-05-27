-- =====================================================
-- PARTE 7: Artigos do Painel Admin - Gestão de Usuários (6 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-gerenciar-usuarios-sistema', 'Como gerenciar usuários do sistema', 
'# Como gerenciar usuários do sistema

## Introdução
A gestão de usuários permite controlar todos os cadastros, acessos e permissões do sistema XLata.

## Para que serve
- Ver todos os usuários cadastrados
- Editar informações de usuários
- Gerenciar acessos e permissões
- Resolver problemas de conta

## Funcionalidades

### Lista de usuários
- Busca por nome ou email
- Filtros por status
- Ordenação personalizada
- Exportação de dados

### Ações disponíveis
- Ver detalhes do usuário
- Editar informações
- Resetar senha
- Enviar mensagem
- Suspender/ativar conta

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Usuários**
3. Use a busca para encontrar usuários
4. Clique em um usuário para ações

## Boas práticas
- Mantenha dados atualizados
- Revise acessos periodicamente
- Documente alterações importantes

## Conclusão
Uma boa gestão de usuários garante segurança e organização.',
'Aprenda a gerenciar todos os usuários do sistema XLata',
'geral', 'published', 3, true,
'Como Gerenciar Usuários do Sistema | XLata',
'Guia completo de gestão de usuários no XLata. Controle total de acessos.'),

('como-ver-detalhes-usuario', 'Como ver detalhes de um usuário', 
'# Como ver detalhes de um usuário

## Introdução
A página de detalhes do usuário mostra todas as informações e histórico de atividades.

## Para que serve
- Conhecer o perfil do usuário
- Ver histórico de atividades
- Diagnosticar problemas
- Planejar suporte

## Informações disponíveis

### Dados cadastrais
- Nome completo
- Email
- Telefone/WhatsApp
- Data de cadastro
- Último acesso

### Assinatura
- Plano atual
- Data de vencimento
- Histórico de pagamentos
- Status de renovação

### Atividades
- Últimas ações no sistema
- Compras e vendas
- Erros reportados
- Mensagens enviadas

## Passo a passo

1. Acesse **Usuários** no painel admin
2. Encontre o usuário desejado
3. Clique no nome ou no ícone de detalhes
4. Navegue pelas abas de informações

## Conclusão
Detalhes completos ajudam a oferecer suporte personalizado.',
'Aprenda a ver todos os detalhes de um usuário no XLata',
'geral', 'published', 2, true,
'Como Ver Detalhes de Usuário | XLata',
'Guia para acessar detalhes completos de usuários no XLata.'),

('como-resetar-senha-usuario', 'Como resetar senha de usuário', 
'# Como resetar senha de usuário

## Introdução
Quando um usuário não consegue acessar sua conta, você pode resetar a senha pelo painel admin.

## Para que serve
- Ajudar usuários com problemas de acesso
- Restaurar contas bloqueadas
- Resolver esquecimentos de senha

## Quando usar
- Usuário esqueceu a senha
- Email de recuperação não funciona
- Conta bloqueada por tentativas

## Passo a passo

1. Acesse **Usuários** no painel admin
2. Encontre o usuário
3. Clique em **Ações** → **Resetar Senha**
4. Confirme a ação
5. Uma nova senha será gerada
6. Envie a senha por canal seguro

## Segurança
- A senha gerada é temporária
- Usuário deve trocar no primeiro acesso
- Ação registrada em log de auditoria

## Boas práticas
- Confirme a identidade do usuário
- Use canais seguros para enviar a senha
- Oriente a trocar imediatamente

## Erros comuns
- **Usuário não recebeu**: Verifique o canal de envio
- **Senha não funciona**: Verifique se foi digitada corretamente

## Conclusão
Reset de senha é uma ferramenta importante de suporte.',
'Aprenda a resetar senhas de usuários no XLata',
'geral', 'published', 2, true,
'Como Resetar Senha de Usuário | XLata',
'Guia para resetar senhas de usuários no painel admin XLata.'),

('como-enviar-mensagem-usuario', 'Como enviar mensagem para usuário', 
'# Como enviar mensagem para usuário

## Introdução
O sistema permite enviar mensagens diretas para usuários, que aparecem como notificações no sistema.

## Para que serve
- Comunicar informações importantes
- Avisar sobre manutenções
- Oferecer suporte proativo
- Enviar promoções

## Tipos de mensagem
- **Informativa**: Avisos gerais
- **Alerta**: Ações necessárias
- **Promoção**: Ofertas especiais
- **Suporte**: Respostas a dúvidas

## Passo a passo

1. Acesse **Usuários** no painel admin
2. Encontre o usuário
3. Clique em **Ações** → **Enviar Mensagem**
4. Escolha o tipo de mensagem
5. Escreva o título e conteúdo
6. Clique em **Enviar**

## Opções de envio
- **Imediato**: Aparece na próxima ação do usuário
- **Email**: Envia também por email
- **Push**: Notificação no dispositivo (em breve)

## Boas práticas
- Seja claro e objetivo
- Use o tipo correto de mensagem
- Não envie spam

## Conclusão
Mensagens diretas melhoram a comunicação com usuários.',
'Aprenda a enviar mensagens diretas para usuários no XLata',
'geral', 'published', 2, true,
'Como Enviar Mensagem para Usuário | XLata',
'Guia para enviar mensagens diretas a usuários no XLata.'),

('como-ver-clientes-depositos', 'Como ver clientes dos depósitos', 
'# Como ver clientes dos depósitos

## Introdução
O painel admin permite visualizar os clientes cadastrados em cada depósito do sistema.

## Para que serve
- Analisar base de clientes
- Identificar padrões
- Verificar dados cadastrais

## Informações disponíveis
- Nome do cliente
- Depósito associado
- Data de cadastro
- Total de transações
- Valor acumulado

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Clientes dos Depósitos**
3. Use filtros para buscar:
   - Por depósito específico
   - Por período de cadastro
   - Por volume de transações
4. Exporte dados se necessário

## Análises possíveis
- Depósitos com mais clientes
- Clientes mais frequentes
- Distribuição geográfica
- Valor médio por cliente

## Boas práticas
- Use para entender o mercado
- Identifique oportunidades
- Respeite a privacidade dos dados

## Conclusão
Conhecer a base de clientes ajuda a melhorar o serviço.',
'Aprenda a visualizar clientes dos depósitos no painel admin XLata',
'geral', 'published', 2, true,
'Como Ver Clientes dos Depósitos | XLata',
'Guia para visualizar clientes dos depósitos no XLata.'),

('como-ver-funcionarios-depositos', 'Como ver funcionários dos depósitos', 
'# Como ver funcionários dos depósitos

## Introdução
Visualize todos os funcionários cadastrados nos depósitos para análise e suporte.

## Para que serve
- Ver estrutura de cada depósito
- Identificar responsáveis
- Analisar uso do sistema

## Informações disponíveis
- Nome do funcionário
- Depósito associado
- Cargo/função
- Permissões
- Último acesso

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Funcionários dos Depósitos**
3. Use filtros para buscar:
   - Por depósito
   - Por permissão
   - Por atividade
4. Clique em um funcionário para detalhes

## Métricas de funcionários
- Total de funcionários por depósito
- Funcionários ativos vs inativos
- Distribuição de permissões
- Frequência de uso

## Boas práticas
- Identifique funcionários sem atividade
- Verifique permissões adequadas
- Use para direcionamentos de treinamento

## Conclusão
Conhecer a estrutura de funcionários ajuda no suporte.',
'Aprenda a ver funcionários dos depósitos no painel admin XLata',
'geral', 'published', 2, true,
'Como Ver Funcionários dos Depósitos | XLata',
'Guia para visualizar funcionários dos depósitos no XLata.');