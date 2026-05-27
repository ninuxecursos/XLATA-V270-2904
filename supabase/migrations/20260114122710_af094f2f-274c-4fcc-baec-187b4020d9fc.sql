-- =====================================================
-- PARTE 10: Artigos do Painel Admin - Conteúdo (6 artigos)
-- =====================================================

INSERT INTO help_articles (slug, title, content_md, excerpt, module, status, reading_time_minutes, allow_indexing, seo_title, seo_description) VALUES

('como-gerenciar-posts-blog', 'Como gerenciar posts do blog', 
'# Como gerenciar posts do blog

## Introdução
O blog é uma ferramenta poderosa para SEO e educação de clientes. Aprenda a gerenciar seus posts.

## Para que serve
- Publicar conteúdo educativo
- Melhorar SEO
- Atrair visitantes orgânicos
- Educar o mercado

## Funcionalidades

### Criar post
- Título otimizado para SEO
- Conteúdo em Markdown
- Categorias e tags
- Imagem de capa
- SEO title e description

### Gerenciar posts
- Listar todos os posts
- Filtrar por status/categoria
- Editar conteúdo
- Publicar/despublicar

## Passo a passo para criar

1. Acesse o **Painel Admin**
2. Clique em **Conteúdo** → **Blog**
3. Clique em **Novo Post**
4. Preencha título e conteúdo
5. Configure SEO
6. Escolha status (rascunho/publicado)
7. Clique em **Salvar**

## Boas práticas
- Títulos claros e objetivos
- Conteúdo de valor
- Imagens otimizadas
- Links internos

## Conclusão
Um blog bem gerenciado atrai tráfego qualificado.',
'Aprenda a gerenciar posts do blog no painel admin XLata',
'geral', 'published', 3, true,
'Como Gerenciar Posts do Blog | XLata',
'Guia para gerenciar posts do blog no painel admin XLata.'),

('como-criar-artigos-ajuda', 'Como criar artigos de ajuda', 
'# Como criar artigos de ajuda

## Introdução
Artigos de ajuda reduzem o suporte e capacitam usuários a resolverem problemas sozinhos.

## Para que serve
- Documentar funcionalidades
- Reduzir tickets de suporte
- Capacitar usuários
- Melhorar experiência

## Estrutura recomendada
1. Introdução (o que é)
2. Para que serve
3. Quem deve usar
4. Passo a passo
5. Boas práticas
6. Erros comuns
7. Conclusão

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Conteúdo** → **Artigos de Ajuda**
3. Clique em **Novo Artigo**
4. Preencha:
   - Título
   - Módulo do sistema
   - Categoria
   - Conteúdo em Markdown
5. Configure SEO
6. Publique

## Categorias disponíveis
- Primeiros passos
- Funcionalidades
- Configurações
- Solução de problemas

## Boas práticas
- Linguagem simples
- Passos numerados
- Screenshots quando necessário
- Atualização regular

## Conclusão
Boa documentação é investimento em satisfação.',
'Aprenda a criar artigos de ajuda no painel admin XLata',
'geral', 'published', 3, true,
'Como Criar Artigos de Ajuda | XLata',
'Guia para criar artigos de ajuda no painel admin XLata.'),

('como-gerenciar-glossario', 'Como gerenciar glossário', 
'# Como gerenciar glossário

## Introdução
O glossário ajuda usuários a entenderem termos técnicos do setor de reciclagem.

## Para que serve
- Explicar termos técnicos
- Educar o mercado
- Melhorar SEO
- Padronizar linguagem

## Estrutura de cada termo
- Termo
- Definição curta (1-2 frases)
- Definição completa
- Termos relacionados
- Links úteis

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Conteúdo** → **Glossário**
3. Clique em **Novo Termo**
4. Preencha:
   - Termo
   - Slug (URL)
   - Definição curta
   - Definição completa
   - Termos relacionados
5. Configure SEO
6. Publique

## Boas práticas
- Definições claras
- Exemplos práticos
- Links para conteúdo relacionado
- Atualização constante

## Conclusão
Um glossário completo agrega valor ao usuário.',
'Aprenda a gerenciar o glossário no painel admin XLata',
'geral', 'published', 2, true,
'Como Gerenciar Glossário | XLata',
'Guia para gerenciar glossário no painel admin XLata.'),

('como-criar-paginas-solucoes', 'Como criar páginas de soluções', 
'# Como criar páginas de soluções

## Introdução
Páginas de soluções (pillar pages) são conteúdos completos sobre temas específicos para SEO.

## Para que serve
- Ranquear para termos importantes
- Educar sobre soluções
- Gerar leads qualificados
- Construir autoridade

## Estrutura recomendada
1. Introdução ao problema
2. Por que é importante
3. Nossa solução
4. Como funciona
5. Benefícios
6. Casos de uso
7. FAQ
8. Call to action

## Passo a passo

1. Acesse o **Painel Admin**
2. Clique em **Conteúdo** → **Soluções**
3. Clique em **Nova Página**
4. Preencha:
   - Título
   - Conteúdo em HTML
   - Imagem de capa
   - SEO completo
5. Publique

## Boas práticas
- Conteúdo extenso (2000+ palavras)
- Links para artigos relacionados
- CTAs ao longo do texto
- Atualização regular

## Conclusão
Pillar pages são fundamentais para estratégia de SEO.',
'Aprenda a criar páginas de soluções no painel admin XLata',
'geral', 'published', 3, true,
'Como Criar Páginas de Soluções | XLata',
'Guia para criar páginas de soluções no painel admin XLata.'),

('como-usar-editor-conteudo', 'Como usar o editor de conteúdo', 
'# Como usar o editor de conteúdo

## Introdução
O editor de conteúdo do XLata suporta Markdown para formatação rica e fácil.

## Para que serve
- Formatar textos
- Adicionar imagens
- Criar listas
- Inserir links

## Markdown básico

### Títulos
```markdown
# Título 1
## Título 2
### Título 3
```

### Formatação
```markdown
**negrito**
*itálico*
~~riscado~~
```

### Listas
```markdown
- Item 1
- Item 2

1. Primeiro
2. Segundo
```

### Links e imagens
```markdown
[texto do link](url)
![alt da imagem](url-da-imagem)
```

### Tabelas
```markdown
| Coluna 1 | Coluna 2 |
|----------|----------|
| Dado 1   | Dado 2   |
```

## Dicas do editor
- Preview em tempo real
- Atalhos de teclado
- Upload de imagens
- Histórico de alterações

## Conclusão
Domine o Markdown para criar conteúdo rico.',
'Aprenda a usar o editor de conteúdo Markdown no XLata',
'geral', 'published', 4, true,
'Como Usar Editor de Conteúdo | XLata',
'Guia do editor de conteúdo Markdown no painel admin XLata.'),

('como-configurar-seo-paginas', 'Como configurar SEO das páginas', 
'# Como configurar SEO das páginas

## Introdução
Cada página de conteúdo pode ter configurações de SEO personalizadas para melhor ranqueamento.

## Para que serve
- Otimizar para buscadores
- Controlar exibição nos resultados
- Configurar compartilhamento social
- Melhorar CTR

## Campos de SEO

### Meta tags básicas
- **SEO Title**: Título para buscadores (até 60 caracteres)
- **Meta Description**: Descrição (até 160 caracteres)
- **Keywords**: Palavras-chave (opcional)

### Open Graph (redes sociais)
- **OG Title**: Título para compartilhamento
- **OG Description**: Descrição para compartilhamento
- **OG Image**: Imagem para compartilhamento

### Avançado
- **Canonical URL**: URL canônica
- **Indexação**: Permitir ou bloquear
- **Sitemap**: Incluir ou excluir

## Passo a passo

1. Edite qualquer conteúdo
2. Vá até a seção **SEO**
3. Preencha os campos
4. Use o contador de caracteres
5. Salve

## Boas práticas
- Títulos únicos por página
- Descrições que geram cliques
- Imagens no tamanho correto (1200x630)

## Conclusão
SEO bem configurado aumenta tráfego orgânico.',
'Aprenda a configurar SEO de cada página no XLata',
'geral', 'published', 3, true,
'Como Configurar SEO das Páginas | XLata',
'Guia para configurar SEO de páginas no painel admin XLata.');