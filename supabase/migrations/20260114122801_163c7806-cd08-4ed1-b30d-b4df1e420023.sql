-- =====================================================
-- PARTE 11: Artigos do Painel Admin - Sistema (6 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-configurar-seo-global', 'Como configurar SEO global', 
'# Como configurar SEO global

## Introdução
As configurações de SEO global afetam todas as páginas do sistema e definem padrões para buscadores.

## Para que serve
- Definir configurações padrão
- Configurar robots.txt
- Gerenciar sitemap
- Controlar indexação

## Configurações disponíveis

### Meta tags padrão
- Título padrão do site
- Descrição padrão
- Keywords globais
- Imagem padrão OG

### Robots.txt
- Regras de rastreamento
- Páginas bloqueadas
- Link do sitemap

### Sitemap
- Geração automática
- Páginas incluídas
- Frequência de atualização
- Prioridades

### Indexação
- Páginas noindex por padrão
- Controle de canonical
- Redirecionamentos

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **SEO**
3. Navegue pelas abas
4. Configure cada seção
5. Salve as alterações

## Boas práticas
- Mantenha robots.txt atualizado
- Regenere sitemap após mudanças
- Monitore indexação no Search Console

## Conclusão
SEO global bem configurado é a base para visibilidade.',
'Aprenda a configurar SEO global do sistema XLata',
'geral', 'published', 3, true,
'Como Configurar SEO Global | XLata',
'Guia para configurar SEO global no painel admin XLata.'),

('como-acessar-central-seguranca', 'Como acessar central de segurança', 
'# Como acessar central de segurança

## Introdução
A central de segurança mostra logs de acesso, atividades suspeitas e configurações de proteção.

## Para que serve
- Monitorar acessos
- Detectar atividades suspeitas
- Gerenciar bloqueios
- Auditar ações

## Funcionalidades

### Logs de acesso
- Logins bem-sucedidos
- Tentativas falhas
- IPs de acesso
- Dispositivos utilizados

### Rate limiting
- Tentativas bloqueadas
- IPs na blacklist
- Desbloqueio manual

### Auditoria
- Ações administrativas
- Alterações de dados
- Exclusões

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Segurança**
3. Navegue pelas seções:
   - Logs de acesso
   - Bloqueios ativos
   - Auditoria
4. Use filtros para análise

## Alertas de segurança
- Múltiplas tentativas falhas
- Acesso de novos dispositivos
- Ações críticas realizadas

## Conclusão
Monitore a segurança para proteger o sistema.',
'Aprenda a usar a central de segurança do XLata',
'geral', 'published', 3, true,
'Como Acessar Central de Segurança | XLata',
'Guia da central de segurança no painel admin XLata.'),

('como-configurar-sistema-admin', 'Como configurar sistema admin', 
'# Como configurar sistema admin

## Introdução
As configurações do sistema permitem personalizar comportamentos globais do XLata.

## Para que serve
- Ajustar configurações gerais
- Personalizar comportamentos
- Configurar integrações
- Definir padrões

## Configurações disponíveis

### Gerais
- Nome do sistema
- Logo
- Cores do tema
- Timezone

### Notificações
- Email de origem
- Templates de email
- Notificações automáticas

### Integrações
- Mercado Pago
- WhatsApp
- Email (SMTP)

### Limites
- Limite de tentativas de login
- Timeout de sessão
- Tamanho máximo de upload

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Sistema**
3. Navegue pelas abas de configuração
4. Faça as alterações necessárias
5. Salve

## Boas práticas
- Documente alterações
- Teste antes de aplicar em produção
- Mantenha backups

## Conclusão
Configurações bem ajustadas melhoram a experiência.',
'Aprenda a configurar o sistema no painel admin XLata',
'geral', 'published', 3, true,
'Como Configurar Sistema Admin | XLata',
'Guia de configurações do sistema no painel admin XLata.'),

('como-gerenciar-feature-flags', 'Como gerenciar feature flags', 
'# Como gerenciar feature flags

## Introdução
Feature flags permitem ativar ou desativar funcionalidades sem deploy de código.

## Para que serve
- Lançar features gradualmente
- Fazer rollback rápido
- Testar com grupos específicos
- Controlar acesso a funcionalidades

## Tipos de flags

### Boolean
- Ativado/desativado
- Para funcionalidades simples

### Percentage
- Libera para X% dos usuários
- Para lançamentos graduais

### User List
- Libera para usuários específicos
- Para beta testers

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Sistema** → **Feature Flags**
3. Veja a lista de flags
4. Clique em uma flag para editar
5. Configure o tipo e valor
6. Salve

## Flags disponíveis
- Novas funcionalidades
- Melhorias de UI
- Integrações experimentais
- Recursos premium

## Boas práticas
- Nomeie flags claramente
- Documente o propósito
- Limpe flags antigas
- Monitore impacto

## Conclusão
Feature flags dão controle sobre lançamentos.',
'Aprenda a gerenciar feature flags no XLata',
'geral', 'published', 3, true,
'Como Gerenciar Feature Flags | XLata',
'Guia para gerenciar feature flags no painel admin XLata.'),

('como-usar-modo-manutencao', 'Como usar modo manutenção', 
'# Como usar modo manutenção

## Introdução
O modo manutenção permite colocar o sistema offline temporariamente para atualizações ou correções.

## Para que serve
- Realizar manutenções programadas
- Corrigir problemas críticos
- Atualizar o sistema
- Prevenir perda de dados

## Como funciona
- Usuários veem página de manutenção
- Admins continuam com acesso
- Todas as operações são pausadas
- Dados são preservados

## Passo a passo para ativar

1. Acesse o **Painel Admin**
2. Clique em **Sistema** → **Manutenção**
3. Configure:
   - Mensagem personalizada
   - Previsão de retorno
   - Contato alternativo
4. Clique em **Ativar Manutenção**
5. Confirme a ação

## Para desativar

1. Acesse o painel (admins têm acesso)
2. Clique em **Desativar Manutenção**
3. Sistema volta ao normal

## Boas práticas
- Avise usuários com antecedência
- Faça em horários de baixo uso
- Tenha plano de contingência
- Teste antes de desativar

## Conclusão
Use o modo manutenção para operações seguras.',
'Aprenda a usar o modo manutenção no XLata',
'geral', 'published', 2, true,
'Como Usar Modo Manutenção | XLata',
'Guia do modo manutenção no painel admin XLata.'),

('como-enviar-notificacoes-broadcast', 'Como enviar notificações broadcast', 
'# Como enviar notificações broadcast

## Introdução
Notificações broadcast são mensagens enviadas para todos os usuários do sistema de uma vez.

## Para que serve
- Comunicar novidades
- Avisar sobre manutenções
- Anunciar promoções
- Alertar sobre mudanças

## Tipos de notificação

### Sistema
- Aparece dentro do XLata
- Todos os usuários ativos veem
- Pode ser dispensada

### Email
- Enviado para todos os emails cadastrados
- Pode segmentar por plano
- Inclui opt-out

### Push (em breve)
- Notificação no dispositivo
- Mesmo com app fechado

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Comunicação** → **Broadcast**
3. Escolha o tipo de notificação
4. Preencha:
   - Título
   - Mensagem
   - Segmentação (opcional)
   - Agendamento (opcional)
5. Visualize preview
6. Clique em **Enviar**

## Boas práticas
- Mensagens concisas
- Frequência moderada
- Segmente quando relevante
- Monitore taxa de leitura

## Conclusão
Use broadcasts para comunicação efetiva.',
'Aprenda a enviar notificações broadcast no XLata',
'geral', 'published', 3, true,
'Como Enviar Notificações Broadcast | XLata',
'Guia para enviar notificações broadcast no painel admin XLata.');