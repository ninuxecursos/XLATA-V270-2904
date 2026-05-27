-- Criar categorias adicionais de artigos de ajuda
INSERT INTO help_categories (id, name, slug, description, icon, sort_order) 
VALUES 
  ('b1234567-0001-4000-a000-000000000001', 'Cadastros', 'cadastros', 'Artigos sobre cadastro de materiais, clientes e funcionários', 'Users', 2),
  ('b1234567-0002-4000-a000-000000000002', 'Clientes', 'clientes', 'Gestão de clientes do depósito', 'UserPlus', 3),
  ('b1234567-0003-4000-a000-000000000003', 'Funcionários', 'funcionarios', 'Gestão de funcionários e permissões', 'UserCog', 8),
  ('b1234567-0004-4000-a000-000000000004', 'Assinaturas e Planos', 'assinaturas-planos', 'Planos, pagamentos e renovações', 'CreditCard', 9),
  ('b1234567-0005-4000-a000-000000000005', 'Indicações', 'indicacoes', 'Sistema de indicações e bônus', 'Share2', 10),
  ('b1234567-0006-4000-a000-000000000006', 'Ajuda e Suporte', 'ajuda-suporte', 'Recursos de ajuda e contato', 'HelpCircle', 11)
ON CONFLICT (slug) DO NOTHING;

-- ===== ARTIGOS: PRIMEIROS PASSOS (5 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como fazer login no XLata',
  'como-fazer-login-xlata',
  'Aprenda a acessar o sistema XLata de forma rápida e segura.',
  '# Como fazer login no XLata

## Introdução
O login é a porta de entrada para o sistema XLata. Com suas credenciais, você acessa todas as funcionalidades do seu depósito de reciclagem.

## Para que serve
Esta funcionalidade permite que você acesse sua conta no XLata usando email e senha cadastrados durante a criação da conta.

## Quem deve usar
- Administradores do depósito
- Operadores de balança
- Funcionários com acesso ao sistema

## Passo a passo

1. Acesse o site **xlata.site** no seu navegador
2. Clique no botão **Entrar** no menu superior
3. Digite seu **email** no primeiro campo
4. Digite sua **senha** no segundo campo
5. Clique no botão **Entrar**
6. Aguarde o carregamento e você será direcionado ao sistema

## Boas práticas
- Use uma senha forte com letras, números e símbolos
- Não compartilhe suas credenciais com terceiros
- Faça logout ao sair de computadores compartilhados
- Marque "Lembrar-me" apenas em dispositivos pessoais

## Erros comuns
- **Email ou senha incorretos**: Verifique se o CAPS LOCK está desativado
- **Conta não encontrada**: Confirme se o email está correto
- **Assinatura expirada**: Renove seu plano para continuar usando

## Conclusão
Com o login feito corretamente, você tem acesso completo ao XLata para gerenciar seu depósito de forma eficiente.',
  'c2919ccd-423c-4563-a300-27bd2bb80fb9',
  'geral',
  'published',
  'Como fazer login no XLata | Sistema de Gestão para Depósitos',
  'Aprenda como acessar o sistema XLata com seu email e senha. Guia passo a passo para login seguro.',
  2,
  1
),
(
  'Como configurar dados da empresa',
  'como-configurar-dados-empresa',
  'Configure o logo, WhatsApp e endereço do seu depósito.',
  '# Como configurar dados da empresa

## Introdução
Configurar os dados da sua empresa é essencial para personalizar comprovantes e facilitar o contato com clientes.

## Para que serve
Esta funcionalidade permite cadastrar informações como logotipo, WhatsApp, endereço e nome fantasia do seu depósito.

## Quem deve usar
- Administradores do sistema
- Gestores responsáveis pela configuração inicial

## Passo a passo

1. No menu lateral, clique em **Configurações**
2. Localize a seção **Dados da Empresa**
3. Clique no campo **Nome Fantasia** e digite o nome do depósito
4. Adicione o **WhatsApp** com DDD (apenas números)
5. Preencha o **Endereço** completo
6. Clique em **Upload de Logo** para adicionar sua marca
7. Clique em **Salvar** para confirmar as alterações

## Boas práticas
- Use um logo com fundo transparente (PNG)
- Mantenha o WhatsApp sempre atualizado
- Use o nome fantasia que seus clientes conhecem
- Endereço completo ajuda em comprovantes profissionais

## Erros comuns
- **Logo não aparece**: Verifique se o arquivo é PNG ou JPG (máx 2MB)
- **WhatsApp inválido**: Use apenas números, com DDD (11 dígitos)

## Conclusão
Com os dados da empresa configurados, seus comprovantes terão aparência profissional e seus clientes poderão entrar em contato facilmente.',
  'c2919ccd-423c-4563-a300-27bd2bb80fb9',
  'geral',
  'published',
  'Como configurar dados da empresa no XLata',
  'Aprenda a configurar logo, WhatsApp e endereço do seu depósito no XLata.',
  2,
  2
),
(
  'Como funciona o onboarding guiado',
  'como-funciona-onboarding-guiado',
  'Entenda o tutorial inicial que ajuda novos usuários a configurar o sistema.',
  '# Como funciona o onboarding guiado

## Introdução
O onboarding guiado é um assistente que aparece na primeira vez que você acessa o XLata, ajudando a configurar tudo corretamente.

## Para que serve
Guiar novos usuários pelas etapas essenciais de configuração: dados da empresa, materiais, clientes e primeira pesagem.

## Quem deve usar
- Novos usuários do sistema
- Qualquer pessoa que queira revisar as configurações iniciais

## Passo a passo

1. Após o primeiro login, o **assistente de onboarding** aparece automaticamente
2. Siga as etapas indicadas na ordem sugerida
3. **Etapa 1**: Configure os dados da empresa
4. **Etapa 2**: Importe os materiais padrão
5. **Etapa 3**: Cadastre seu primeiro cliente
6. **Etapa 4**: Realize uma pesagem de teste
7. Marque cada etapa como concluída ao finalizar
8. Ao completar todas as etapas, ganhe um **badge de conclusão**

## Boas práticas
- Complete todas as etapas na ordem sugerida
- Não pule etapas importantes como materiais
- Assista os vídeos tutoriais disponíveis

## Erros comuns
- **Onboarding não aparece**: Verifique se sua conta está ativa
- **Etapa não marca como concluída**: Clique no botão de confirmação

## Conclusão
O onboarding guiado garante que você configure o sistema corretamente desde o início, evitando problemas futuros.',
  'c2919ccd-423c-4563-a300-27bd2bb80fb9',
  'geral',
  'published',
  'Como funciona o onboarding guiado no XLata',
  'Conheça o assistente de configuração inicial do XLata que ajuda novos usuários.',
  2,
  3
),
(
  'Como importar materiais padrão',
  'como-importar-materiais-padrao',
  'Importe uma lista de 40 materiais pré-configurados para começar rapidamente.',
  '# Como importar materiais padrão

## Introdução
O XLata oferece uma lista de 40 materiais de reciclagem pré-configurados para você começar a usar o sistema imediatamente.

## Para que serve
Economizar tempo na configuração inicial, inserindo automaticamente os materiais mais comuns em depósitos de reciclagem.

## Quem deve usar
- Novos usuários configurando o sistema
- Administradores que querem uma base inicial de materiais

## Passo a passo

1. No menu lateral, clique em **Materiais**
2. No topo da tela, localize o botão **Materiais Padrão**
3. Clique no botão para abrir a lista de materiais disponíveis
4. Revise a lista de materiais que serão importados
5. Clique em **Importar Todos** para adicionar os materiais
6. Aguarde a confirmação de sucesso
7. Os materiais aparecerão na lista principal

## Materiais incluídos
- Alumínio (perfil, lata, panela)
- Cobre (fio, misto, limpo)
- Ferro (sucata, ferragem)
- Plásticos (PET, PP, PEAD)
- Papelão (ondulado, misto)
- E muitos outros...

## Boas práticas
- Ajuste os preços após a importação
- Exclua materiais que não trabalha
- Adicione materiais específicos que faltaram

## Erros comuns
- **Materiais duplicados**: O sistema detecta e evita duplicidades
- **Preços zerados**: Os preços padrão são sugestões, ajuste conforme seu mercado

## Conclusão
A importação de materiais padrão acelera sua configuração inicial, permitindo que você comece a trabalhar em minutos.',
  'c2919ccd-423c-4563-a300-27bd2bb80fb9',
  'geral',
  'published',
  'Como importar materiais padrão no XLata',
  'Aprenda a importar 40 materiais de reciclagem pré-configurados no XLata.',
  2,
  4
),
(
  'Como configurar o formato do comprovante',
  'como-configurar-formato-comprovante',
  'Escolha entre impressão em 50mm ou 80mm para seus comprovantes.',
  '# Como configurar o formato do comprovante

## Introdução
O XLata permite configurar o formato de impressão dos comprovantes para se adequar à sua impressora térmica.

## Para que serve
Adaptar os comprovantes de pesagem para impressoras de 50mm (bobina estreita) ou 80mm (bobina larga).

## Quem deve usar
- Administradores configurando a impressão
- Operadores que precisam ajustar o formato

## Passo a passo

1. No menu lateral, clique em **Configurações**
2. Localize a seção **Configurações de Impressão**
3. Escolha o formato: **50mm** ou **80mm**
4. Marque quais informações devem aparecer no comprovante:
   - Logo da empresa
   - Dados do cliente
   - Lista de itens
   - Forma de pagamento
   - QR Code
5. Clique em **Salvar** para aplicar as alterações
6. Faça um teste de impressão para verificar

## Boas práticas
- Verifique a largura da bobina antes de configurar
- Faça um teste após cada alteração
- 50mm é mais econômico, 80mm tem mais espaço

## Erros comuns
- **Texto cortado**: O formato está diferente da impressora
- **Logo não imprime**: Verifique se o logo foi carregado nas configurações

## Conclusão
Com o formato correto configurado, seus comprovantes saem perfeitos na impressora, com visual profissional.',
  '019b557b-e09a-4890-abb0-f9bb91f208b7',
  'geral',
  'published',
  'Como configurar formato do comprovante no XLata',
  'Aprenda a configurar impressão em 50mm ou 80mm para comprovantes no XLata.',
  2,
  5
);

-- ===== ARTIGOS: CADASTRO DE MATERIAIS (8 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como cadastrar novos materiais',
  'como-cadastrar-novos-materiais',
  'Aprenda a adicionar materiais de reciclagem ao sistema XLata.',
  '# Como cadastrar novos materiais

## Introdução
O cadastro de materiais é fundamental para o funcionamento do PDV. Cada material precisa estar registrado para ser pesado e comercializado.

## Para que serve
Registrar os tipos de materiais que seu depósito compra e vende, com seus respectivos preços por quilograma.

## Quem deve usar
- Administradores do sistema
- Gestores de depósito

## Passo a passo

1. No menu lateral, clique em **Materiais**
2. Clique no botão verde **Adicionar** no topo direito
3. No formulário que abre, preencha o **Nome do material** (ex: "Alumínio Perfil")
4. Digite o **Preço de Compra** (valor pago ao cliente por kg)
5. Digite o **Preço de Venda** (valor que você cobra por kg)
6. Clique em **Salvar**
7. O material aparece na lista e já está disponível no PDV

## Boas práticas
- Use nomes claros e padronizados
- Inclua variações (ex: "Cobre Misto", "Cobre Limpo")
- Atualize preços conforme o mercado
- Organize por categoria mental (metais, plásticos, papel)

## Erros comuns
- **Material duplicado**: Verifique se já existe antes de criar
- **Preço zerado**: Sem preço, as transações ficam sem valor
- **Nome muito genérico**: "Ferro" pode gerar confusão, use "Ferro Sucata"

## Conclusão
Com os materiais corretamente cadastrados, você garante precisão em todas as pesagens e controle financeiro do depósito.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como cadastrar materiais no XLata',
  'Guia completo para cadastrar materiais de reciclagem no sistema XLata.',
  3,
  10
),
(
  'Como definir preços de compra e venda',
  'como-definir-precos-compra-venda',
  'Configure os preços por kg para cada material do seu depósito.',
  '# Como definir preços de compra e venda

## Introdução
Cada material no XLata possui dois preços: o de compra (pago ao cliente) e o de venda (cobrado na revenda). Essa diferença é seu lucro.

## Para que serve
Definir quanto você paga por kg ao comprar materiais e quanto cobra ao vender, permitindo cálculo automático de lucro.

## Quem deve usar
- Administradores do sistema
- Gestores responsáveis por precificação

## Passo a passo

1. Acesse **Materiais** no menu lateral
2. Localize o material que deseja editar
3. Clique no **ícone de edição** (lápis) no card do material
4. No campo **Preço de Compra**, digite o valor por kg (ex: 5,00)
5. No campo **Preço de Venda**, digite o valor por kg (ex: 6,50)
6. Clique em **Salvar**
7. Os novos preços são aplicados imediatamente

## Boas práticas
- Atualize preços semanalmente conforme mercado
- Mantenha margem mínima de 10-20% entre compra e venda
- Considere custos operacionais na precificação
- Use vírgula para centavos (ex: 5,50)

## Erros comuns
- **Preço de venda menor que compra**: Resulta em prejuízo
- **Esquecer de atualizar**: Preços defasados geram perdas
- **Usar ponto ao invés de vírgula**: Use 5,50 e não 5.50

## Conclusão
Preços bem definidos garantem lucratividade e competitividade para seu depósito de reciclagem.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como definir preços de compra e venda no XLata',
  'Aprenda a configurar preços por kg de materiais no sistema XLata.',
  2,
  11
),
(
  'Como editar materiais existentes',
  'como-editar-materiais-existentes',
  'Atualize nome e preços de materiais já cadastrados.',
  '# Como editar materiais existentes

## Introdução
Materiais cadastrados podem ser editados a qualquer momento para atualização de preços ou correção de nomes.

## Para que serve
Modificar informações de materiais já existentes sem precisar excluir e recadastrar.

## Quem deve usar
- Administradores
- Operadores com permissão de edição

## Passo a passo

1. Acesse **Materiais** no menu lateral
2. Localize o material na lista (use a busca se necessário)
3. Clique no **card do material** para abrir as opções
4. Clique em **Editar** ou no ícone de lápis
5. Altere os campos desejados:
   - Nome do material
   - Preço de compra
   - Preço de venda
6. Clique em **Salvar**
7. As alterações são aplicadas imediatamente

## Boas práticas
- Documente mudanças significativas de preço
- Avise a equipe sobre alterações de nome
- Edite em horários de menor movimento

## Erros comuns
- **Alterar material errado**: Confirme o nome antes de editar
- **Não salvar**: Clique em Salvar, não feche a janela

## Conclusão
A edição de materiais mantém seu catálogo sempre atualizado com preços e nomes corretos.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como editar materiais existentes no XLata',
  'Aprenda a atualizar nome e preços de materiais no sistema XLata.',
  2,
  12
),
(
  'Como excluir materiais',
  'como-excluir-materiais',
  'Remova materiais que não são mais utilizados pelo depósito.',
  '# Como excluir materiais

## Introdução
Materiais que não são mais comercializados podem ser excluídos do sistema para manter a lista organizada.

## Para que serve
Remover materiais obsoletos ou cadastrados por engano, mantendo a lista de materiais limpa e atualizada.

## Quem deve usar
- Administradores do sistema

## Passo a passo

1. Acesse **Materiais** no menu lateral
2. Localize o material a ser excluído
3. Clique no **card do material**
4. Clique em **Excluir** ou no ícone de lixeira
5. Uma confirmação será solicitada
6. Confirme clicando em **Sim, excluir**
7. O material é removido da lista

## Boas práticas
- Verifique se o material não tem transações pendentes
- Considere apenas desativar ao invés de excluir
- Faça backup antes de exclusões em massa

## Erros comuns
- **Excluir material com histórico**: Transações antigas podem perder referência
- **Excluir material errado**: Não há como desfazer, terá que recadastrar

## Conclusão
A exclusão de materiais mantém seu sistema organizado, mas use com cautela para não perder histórico.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como excluir materiais no XLata',
  'Aprenda a remover materiais do sistema XLata de forma segura.',
  2,
  13
),
(
  'Como usar a busca de materiais',
  'como-usar-busca-materiais',
  'Encontre rapidamente qualquer material cadastrado no sistema.',
  '# Como usar a busca de materiais

## Introdução
Com muitos materiais cadastrados, a busca é essencial para encontrar rapidamente o que você precisa.

## Para que serve
Localizar materiais por nome de forma instantânea, tanto na tela de gerenciamento quanto no PDV.

## Quem deve usar
- Operadores de balança
- Administradores
- Qualquer usuário do sistema

## Passo a passo

1. Acesse **Materiais** no menu lateral
2. Localize o campo de **busca** no topo da lista
3. Digite parte do nome do material (ex: "alum" para alumínio)
4. A lista filtra automaticamente enquanto você digita
5. Clique no material encontrado para ver detalhes

### No PDV:
1. Na tela de pesagem, use a busca acima do grid de materiais
2. Digite o nome e o grid mostra apenas os correspondentes
3. Clique no material para adicionar à pesagem

## Boas práticas
- Use palavras-chave curtas (ex: "cobre" ao invés de "cobre misto")
- A busca não diferencia maiúsculas/minúsculas
- Limpe a busca para ver todos os materiais novamente

## Erros comuns
- **Nenhum resultado**: Verifique a ortografia
- **Material não encontrado**: Pode não estar cadastrado

## Conclusão
A busca de materiais agiliza seu trabalho, especialmente quando você tem dezenas de itens cadastrados.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como usar a busca de materiais no XLata',
  'Aprenda a encontrar materiais rapidamente no sistema XLata.',
  2,
  14
);

-- ===== ARTIGOS: CADASTRO DE CLIENTES (5 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como cadastrar clientes do depósito',
  'como-cadastrar-clientes-deposito',
  'Registre os clientes que vendem materiais no seu depósito.',
  '# Como cadastrar clientes do depósito

## Introdução
O cadastro de clientes permite manter um registro de todas as pessoas que vendem materiais no seu depósito, facilitando o histórico de transações.

## Para que serve
Registrar nome, WhatsApp e dados de clientes para acompanhamento de compras e comunicação.

## Quem deve usar
- Operadores de balança
- Administradores

## Passo a passo

1. No menu lateral, clique em **Clientes**
2. Clique no botão verde **Adicionar Cliente**
3. Preencha os dados:
   - **Nome completo** do cliente
   - **WhatsApp** com DDD (11 dígitos)
   - **CPF** (opcional, para comprovantes)
   - **Endereço** (opcional)
4. Clique em **Salvar**
5. O cliente aparece na lista e pode ser selecionado no PDV

## Boas práticas
- Sempre confirme o WhatsApp com o cliente
- CPF é importante para notas fiscais
- Use nomes completos para evitar confusão
- Atualize dados quando o cliente informar mudanças

## Erros comuns
- **WhatsApp inválido**: Use apenas números com DDD
- **Cliente duplicado**: Verifique se já existe antes de criar
- **Nome incompleto**: "José" pode haver vários, use nome completo

## Conclusão
Com clientes cadastrados, você tem histórico completo de transações e pode entrar em contato facilmente quando necessário.',
  'b1234567-0002-4000-a000-000000000002',
  'geral',
  'published',
  'Como cadastrar clientes no XLata',
  'Aprenda a registrar clientes do depósito no sistema XLata.',
  2,
  20
),
(
  'Como editar dados de clientes',
  'como-editar-dados-clientes',
  'Atualize informações de clientes já cadastrados.',
  '# Como editar dados de clientes

## Introdução
Dados de clientes podem mudar com o tempo. O XLata permite atualizar essas informações facilmente.

## Para que serve
Corrigir ou atualizar nome, WhatsApp, CPF e endereço de clientes existentes.

## Quem deve usar
- Operadores de balança
- Administradores

## Passo a passo

1. Acesse **Clientes** no menu lateral
2. Localize o cliente (use a busca se necessário)
3. Clique no botão de **Ações** do cliente
4. Selecione **Editar**
5. Altere os campos necessários
6. Clique em **Salvar**

## Boas práticas
- Atualize o WhatsApp quando o cliente trocar de número
- Corrija erros de digitação no nome
- Mantenha o CPF atualizado para comprovantes

## Erros comuns
- **Editar cliente errado**: Confirme o nome antes
- **Não salvar**: Lembre-se de clicar em Salvar

## Conclusão
Manter dados de clientes atualizados garante comunicação eficiente e comprovantes corretos.',
  'b1234567-0002-4000-a000-000000000002',
  'geral',
  'published',
  'Como editar dados de clientes no XLata',
  'Aprenda a atualizar informações de clientes no sistema XLata.',
  2,
  21
),
(
  'Como ativar ou desativar clientes',
  'como-ativar-desativar-clientes',
  'Controle quais clientes aparecem como ativos no sistema.',
  '# Como ativar ou desativar clientes

## Introdução
Clientes que não frequentam mais o depósito podem ser desativados sem precisar excluir seus dados.

## Para que serve
Manter o histórico de clientes inativos enquanto remove da lista de seleção no PDV.

## Quem deve usar
- Administradores

## Passo a passo

1. Acesse **Clientes** no menu lateral
2. Localize o cliente
3. Clique no botão de **Ações**
4. Selecione **Desativar** (ou **Ativar** se estiver inativo)
5. Confirme a ação

## O que acontece ao desativar:
- Cliente não aparece na seleção do PDV
- Histórico de transações é mantido
- Pode ser reativado a qualquer momento

## Boas práticas
- Desative ao invés de excluir para manter histórico
- Revise clientes inativos periodicamente
- Reative quando o cliente voltar a frequentar

## Conclusão
A desativação mantém seu cadastro organizado sem perder dados importantes.',
  'b1234567-0002-4000-a000-000000000002',
  'geral',
  'published',
  'Como ativar ou desativar clientes no XLata',
  'Aprenda a controlar o status de clientes no sistema XLata.',
  2,
  22
);

-- ===== ARTIGOS: OPERAÇÃO DO PDV (18 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como abrir o caixa no XLata',
  'como-abrir-caixa-xlata',
  'Inicie seu turno de trabalho abrindo o caixa com o valor inicial.',
  '# Como abrir o caixa no XLata

## Introdução
A abertura de caixa é o primeiro passo do dia de trabalho. Ela registra quanto dinheiro está no caixa no início do turno.

## Para que serve
Registrar o valor inicial em dinheiro para posterior conferência no fechamento e controle de entradas/saídas.

## Quem deve usar
- Operadores de balança
- Caixas

## Passo a passo

1. Ao acessar o **PDV**, o sistema verifica se há caixa aberto
2. Se não houver, aparece automaticamente o **modal de abertura**
3. Digite o **valor inicial** em dinheiro (ex: 200,00)
4. Confirme que esse é o valor que está fisicamente no caixa
5. Clique em **Abrir Caixa**
6. O PDV fica disponível para uso

## Boas práticas
- Conte o dinheiro antes de digitar o valor
- O valor deve ser exato ao que está no caixa físico
- Abra o caixa no início do expediente
- Um caixa por turno é recomendado

## Erros comuns
- **Valor incorreto**: Causará diferença no fechamento
- **Esquecer de abrir**: O sistema bloqueia transações sem caixa aberto

## Conclusão
A abertura correta do caixa é fundamental para o controle financeiro preciso do seu depósito.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'caixa',
  'published',
  'Como abrir o caixa no XLata',
  'Aprenda a iniciar o turno abrindo o caixa no sistema XLata.',
  2,
  30
),
(
  'Como fechar o caixa no XLata',
  'como-fechar-caixa-xlata',
  'Encerre o turno com a conferência completa do caixa.',
  '# Como fechar o caixa no XLata

## Introdução
O fechamento de caixa encerra o turno, confrontando o valor esperado pelo sistema com o valor real em mãos.

## Para que serve
Conferir se todas as transações foram registradas corretamente e identificar possíveis diferenças.

## Quem deve usar
- Operadores de balança
- Caixas
- Supervisores

## Passo a passo

1. No PDV, clique no **menu de opções** (ícone de engrenagem ou três pontos)
2. Selecione **Fechar Caixa**
3. O sistema mostra o **resumo do dia**:
   - Valor inicial
   - Total de entradas (vendas)
   - Total de saídas (compras + despesas)
   - Valor esperado no caixa
4. Conte o dinheiro físico
5. Digite o **valor contado** no campo indicado
6. O sistema calcula automaticamente a **diferença**
7. Adicione uma **observação** se houver diferença
8. Clique em **Fechar Caixa**
9. Um resumo pode ser impresso

## Boas práticas
- Conte o dinheiro com calma e atenção
- Anote qualquer divergência com explicação
- Feche sempre ao final do expediente
- Guarde o comprovante de fechamento

## Erros comuns
- **Não conferir dinheiro**: Fechar com valor errado
- **Esquecer despesas**: Saídas não registradas geram diferença
- **Fechar sem contar**: Impossível identificar erros

## Conclusão
O fechamento de caixa correto garante controle financeiro e identifica problemas rapidamente.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'caixa',
  'published',
  'Como fechar o caixa no XLata',
  'Aprenda a encerrar o turno fechando o caixa no sistema XLata.',
  3,
  31
),
(
  'Como usar o teclado numérico para peso',
  'como-usar-teclado-numerico-peso',
  'Digite o peso dos materiais usando o teclado virtual do PDV.',
  '# Como usar o teclado numérico para peso

## Introdução
O teclado numérico do PDV permite digitar o peso dos materiais de forma rápida e precisa.

## Para que serve
Inserir o peso em quilogramas para calcular automaticamente o valor da transação.

## Quem deve usar
- Operadores de balança

## Passo a passo

1. No PDV, olhe o visor da balança para ver o peso
2. No **teclado numérico** do XLata, digite o peso
3. Use a **vírgula** para decimais (ex: 25,5 para 25,5 kg)
4. O valor aparece no campo de peso
5. Clique no **material** correspondente no grid
6. O item é adicionado ao pedido com o peso digitado

### Teclas especiais:
- **C** ou **CE**: Limpa o valor digitado
- **⌫**: Apaga o último dígito
- **,**: Adiciona vírgula decimal

## Boas práticas
- Digite o peso antes de selecionar o material
- Confira o valor antes de confirmar
- Use decimais para precisão (25,350 kg)

## Erros comuns
- **Peso errado**: Confira o visor da balança
- **Vírgula esquecida**: 255 é diferente de 25,5

## Conclusão
O teclado numérico agiliza a digitação de pesos, tornando a operação mais rápida e eficiente.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como usar o teclado numérico para peso no XLata',
  'Aprenda a digitar pesos corretamente no PDV do XLata.',
  2,
  32
),
(
  'Como selecionar materiais na pesagem',
  'como-selecionar-materiais-pesagem',
  'Escolha o material correto no grid do PDV para registrar a pesagem.',
  '# Como selecionar materiais na pesagem

## Introdução
Após digitar o peso, você precisa selecionar qual material está sendo pesado para calcular o valor correto.

## Para que serve
Associar o peso digitado ao material correspondente, aplicando automaticamente o preço configurado.

## Quem deve usar
- Operadores de balança

## Passo a passo

1. Digite o **peso** no teclado numérico
2. No **grid de materiais**, localize o material
3. Use a **busca** se tiver muitos materiais
4. Clique no **card do material**
5. Um modal aparece confirmando:
   - Peso digitado
   - Preço por kg
   - Valor total
6. Aplique **tara** ou **desconto** se necessário
7. Clique em **Adicionar** para incluir no pedido

## Boas práticas
- Organize materiais por frequência de uso
- Use a busca para materiais menos comuns
- Confirme o material antes de adicionar

## Erros comuns
- **Material errado**: Verifique o nome no card
- **Peso zerado**: Digite o peso antes de selecionar

## Conclusão
A seleção correta de materiais garante que cada pesagem seja registrada com o preço certo.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como selecionar materiais na pesagem no XLata',
  'Aprenda a escolher materiais no PDV do sistema XLata.',
  2,
  33
),
(
  'Como alternar entre modo compra e venda',
  'como-alternar-modo-compra-venda',
  'Mude entre comprar materiais do cliente e vender para clientes.',
  '# Como alternar entre modo compra e venda

## Introdução
O XLata opera em dois modos: COMPRA (você paga ao cliente) e VENDA (o cliente paga a você). A alternância é simples e rápida.

## Para que serve
Definir se a transação é uma compra de material (mais comum em depósitos) ou uma venda.

## Quem deve usar
- Operadores de balança

## Passo a passo

1. No PDV, localize o **toggle COMPRA/VENDA** no topo
2. O modo atual está destacado em cor
3. Clique no modo desejado para alternar:
   - **COMPRA**: Você compra material do cliente (paga a ele)
   - **VENDA**: Você vende material ao cliente (recebe dele)
4. O grid de materiais mostra os preços correspondentes
5. Continue com a pesagem normalmente

## Diferenças entre os modos:

| Aspecto | COMPRA | VENDA |
|---------|--------|-------|
| Preço usado | Preço de compra | Preço de venda |
| Fluxo de caixa | Saída (você paga) | Entrada (você recebe) |
| Estoque | Aumenta | Diminui |

## Boas práticas
- Verifique o modo antes de cada transação
- COMPRA é o modo padrão (mais comum)
- Mude para VENDA apenas quando for revender

## Erros comuns
- **Modo errado**: Registrar compra como venda inverte valores
- **Esquecer de voltar**: Após venda, volte para compra

## Conclusão
A alternância correta entre modos garante que suas transações sejam registradas com os valores certos.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como alternar entre modo compra e venda no XLata',
  'Aprenda a mudar entre compra e venda no PDV do XLata.',
  2,
  34
),
(
  'Como aplicar tara no peso',
  'como-aplicar-tara-peso',
  'Desconte o peso da embalagem ou recipiente automaticamente.',
  '# Como aplicar tara no peso

## Introdução
A tara é o peso da embalagem, saco, carrinho ou recipiente que deve ser descontado do peso bruto para obter o peso líquido do material.

## Para que serve
Descontar automaticamente o peso do recipiente para calcular apenas o peso real do material.

## Quem deve usar
- Operadores de balança

## Passo a passo

1. Pese o material junto com o recipiente
2. Digite o **peso bruto** no teclado numérico
3. Clique no **material** no grid
4. No modal que abre, localize o campo **Tara**
5. Digite o peso do recipiente (ex: 2,5 kg)
6. O sistema calcula automaticamente:
   - Peso bruto: 50 kg
   - Tara: 2,5 kg
   - Peso líquido: 47,5 kg
7. O valor é calculado sobre o peso líquido
8. Clique em **Adicionar**

## Boas práticas
- Tenha uma tabela de taras comuns (big bag, carrinho, saco)
- Confira a tara de cada tipo de recipiente
- Big bags geralmente pesam entre 1-3 kg

## Erros comuns
- **Esquecer a tara**: Cliente paga pelo peso do recipiente
- **Tara errada**: Verifique o tipo de recipiente

## Conclusão
A aplicação correta de tara garante justiça na pesagem e evita pagar pelo peso de embalagens.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como aplicar tara no peso no XLata',
  'Aprenda a descontar o peso de embalagens no sistema XLata.',
  2,
  35
),
(
  'Como aplicar desconto ou acréscimo no preço',
  'como-aplicar-desconto-acrescimo-preco',
  'Ajuste o preço por kg para casos especiais.',
  '# Como aplicar desconto ou acréscimo no preço

## Introdução
Em algumas situações, você pode precisar ajustar o preço do material para cima ou para baixo, como em negociações ou materiais de qualidade diferente.

## Para que serve
Modificar temporariamente o preço por kg de um material em uma pesagem específica.

## Quem deve usar
- Operadores de balança (com permissão)
- Supervisores

## Passo a passo

1. Digite o peso e selecione o material
2. No modal de confirmação, localize o campo **Preço por kg**
3. O preço padrão está preenchido
4. **Para desconto**: Digite um valor menor (ex: de 5,00 para 4,50)
5. **Para acréscimo**: Digite um valor maior (ex: de 5,00 para 5,50)
6. O sistema recalcula automaticamente o valor total
7. Clique em **Adicionar**

## Quando usar:
- Material de qualidade inferior (desconto)
- Material premium ou limpo (acréscimo)
- Negociação com cliente frequente
- Promoções ou campanhas

## Boas práticas
- Documente o motivo do ajuste
- Mantenha ajustes dentro de limites razoáveis
- Supervisores devem aprovar descontos grandes

## Erros comuns
- **Desconto excessivo**: Pode gerar prejuízo
- **Não registrar motivo**: Dificulta auditoria

## Conclusão
Ajustes de preço permitem flexibilidade nas negociações mantendo o controle sobre margens.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como aplicar desconto ou acréscimo no preço no XLata',
  'Aprenda a ajustar preços por kg no PDV do XLata.',
  2,
  36
),
(
  'Como encerrar um pedido',
  'como-encerrar-pedido',
  'Finalize a transação e gere o comprovante para o cliente.',
  '# Como encerrar um pedido

## Introdução
Após adicionar todos os itens ao pedido, você precisa encerrá-lo para processar o pagamento e gerar o comprovante.

## Para que serve
Finalizar a transação, registrar a forma de pagamento e gerar comprovante para o cliente.

## Quem deve usar
- Operadores de balança

## Passo a passo

1. Verifique se todos os itens estão no pedido
2. Confira o **valor total** no resumo
3. Clique no botão **Encerrar Pedido** ou **Finalizar**
4. No modal de encerramento:
   - Confirme o **cliente** selecionado
   - Escolha a **forma de pagamento**:
     - Dinheiro
     - PIX
     - Transferência
     - Cartão
   - Adicione **observações** se necessário
5. Clique em **Confirmar**
6. O comprovante é gerado automaticamente
7. Escolha se deseja **imprimir** o comprovante

## Boas práticas
- Revise os itens antes de encerrar
- Confirme a forma de pagamento com o cliente
- Sempre ofereça o comprovante

## Erros comuns
- **Item esquecido**: Revise a lista antes de encerrar
- **Forma de pagamento errada**: Causa problemas no fechamento

## Conclusão
O encerramento correto do pedido garante registro preciso e comprovante para o cliente.',
  '683e5a12-4a3a-4ece-92e8-8e9fb217382b',
  'compra',
  'published',
  'Como encerrar um pedido no XLata',
  'Aprenda a finalizar transações no PDV do sistema XLata.',
  3,
  37
);

-- ===== ARTIGOS: CONTROLE DE ESTOQUE (7 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como consultar o estoque atual',
  'como-consultar-estoque-atual',
  'Veja a quantidade e valor de cada material em estoque.',
  '# Como consultar o estoque atual

## Introdução
O controle de estoque mostra em tempo real quanto de cada material você tem no depósito e qual o valor total.

## Para que serve
Visualizar a quantidade em kg e o valor monetário de todos os materiais em estoque.

## Quem deve usar
- Gestores
- Administradores

## Passo a passo

1. No menu lateral, clique em **Estoque**
2. A tela mostra uma lista de todos os materiais com estoque
3. Para cada material você vê:
   - Nome do material
   - Quantidade em kg
   - Valor de custo (preço de compra x quantidade)
   - Valor de venda (preço de venda x quantidade)
4. No topo, veja os **totais gerais**:
   - Peso total em estoque
   - Valor total de custo
   - Valor total de venda
   - Lucro projetado

## Boas práticas
- Verifique o estoque diariamente
- Compare com estoque físico periodicamente
- Identifique materiais parados há muito tempo

## Erros comuns
- **Estoque negativo**: Indica vendas sem compras correspondentes
- **Divergência com físico**: Pode indicar erros de registro

## Conclusão
O controle de estoque preciso é essencial para saber quanto capital você tem investido em materiais.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como consultar o estoque atual no XLata',
  'Aprenda a visualizar seu estoque de materiais no sistema XLata.',
  2,
  40
),
(
  'Como entender o valor do estoque',
  'como-entender-valor-estoque',
  'Aprenda a interpretar os valores de custo e venda do seu estoque.',
  '# Como entender o valor do estoque

## Introdução
O XLata calcula automaticamente o valor do seu estoque baseado nos preços de compra e venda de cada material.

## Para que serve
Saber quanto você investiu (custo) e quanto pode faturar (venda) com o estoque atual.

## Quem deve usar
- Gestores
- Administradores

## Como funciona

O sistema calcula três valores principais:

### 1. Valor de Custo
- Fórmula: Quantidade × Preço de Compra
- Representa quanto você gastou para adquirir
- Exemplo: 500 kg × R$ 5,00 = R$ 2.500,00

### 2. Valor de Venda
- Fórmula: Quantidade × Preço de Venda
- Representa quanto você pode receber ao vender
- Exemplo: 500 kg × R$ 6,50 = R$ 3.250,00

### 3. Lucro Projetado
- Fórmula: Valor de Venda - Valor de Custo
- Representa seu ganho potencial
- Exemplo: R$ 3.250 - R$ 2.500 = R$ 750,00

## Boas práticas
- Acompanhe a evolução do valor mensalmente
- Identifique materiais com maior margem
- Evite estoque parado (capital imobilizado)

## Conclusão
Entender o valor do estoque ajuda a tomar decisões sobre compras, vendas e gestão de capital.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como entender o valor do estoque no XLata',
  'Aprenda a interpretar os valores de custo, venda e lucro do seu estoque.',
  2,
  41
),
(
  'Como ver a projeção de lucro do estoque',
  'como-ver-projecao-lucro-estoque',
  'Calcule automaticamente o lucro potencial do seu estoque.',
  '# Como ver a projeção de lucro do estoque

## Introdução
A projeção de lucro mostra quanto você pode ganhar se vender todo o estoque atual pelos preços configurados.

## Para que serve
Estimar o ganho financeiro potencial baseado na diferença entre preços de compra e venda.

## Quem deve usar
- Gestores
- Administradores

## Passo a passo

1. Acesse **Estoque** no menu lateral
2. No topo da tela, localize o card **Lucro Projetado**
3. O valor exibido é a soma de:
   - (Preço de Venda - Preço de Compra) × Quantidade
   - Calculado para cada material

### Exemplo prático:

| Material | Qtd (kg) | Custo | Venda | Lucro |
|----------|----------|-------|-------|-------|
| Alumínio | 100 | R$ 500 | R$ 650 | R$ 150 |
| Cobre | 50 | R$ 1.500 | R$ 1.750 | R$ 250 |
| **Total** | **150** | **R$ 2.000** | **R$ 2.400** | **R$ 400** |

## Boas práticas
- Use a projeção para planejar vendas
- Priorize vender materiais com maior margem
- Atualize preços para manter projeções realistas

## Conclusão
A projeção de lucro ajuda a visualizar o potencial financeiro do seu estoque e planejar vendas.',
  '112b6199-9223-4ae5-8392-bd06b9380954',
  'estoque',
  'published',
  'Como ver projeção de lucro do estoque no XLata',
  'Aprenda a calcular o lucro potencial do seu estoque no XLata.',
  2,
  42
);

-- ===== ARTIGOS: CONTROLE FINANCEIRO (10 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como usar o dashboard financeiro',
  'como-usar-dashboard-financeiro',
  'Tenha uma visão geral das finanças do seu depósito.',
  '# Como usar o dashboard financeiro

## Introdução
O dashboard financeiro oferece uma visão consolidada das finanças do seu depósito: compras, vendas, estoque e lucratividade.

## Para que serve
Visualizar rapidamente os principais indicadores financeiros do negócio em uma única tela.

## Quem deve usar
- Gestores
- Administradores

## Passo a passo

1. No menu lateral, clique em **Dashboard**
2. A tela exibe cards com métricas principais:
   - **Total de Compras**: Quanto gastou comprando materiais
   - **Total de Vendas**: Quanto faturou vendendo
   - **Valor em Estoque**: Capital investido em materiais
   - **Lucro do Período**: Diferença entre vendas e compras
3. Use o **filtro de período** para analisar intervalos específicos:
   - Hoje
   - Esta semana
   - Este mês
   - Período personalizado
4. Veja os **gráficos** de evolução ao longo do tempo

## Indicadores disponíveis:
- Evolução de compras (gráfico de linha)
- Evolução de vendas (gráfico de linha)
- Materiais mais comprados (gráfico de barras)
- Materiais mais vendidos (gráfico de barras)

## Boas práticas
- Verifique o dashboard diariamente
- Compare períodos para identificar tendências
- Use para planejar compras e vendas

## Conclusão
O dashboard financeiro é sua central de comando para decisões estratégicas do depósito.',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'relatorios',
  'published',
  'Como usar o dashboard financeiro no XLata',
  'Aprenda a visualizar as finanças do seu depósito no XLata.',
  3,
  50
),
(
  'Como consultar todas as transações',
  'como-consultar-todas-transacoes',
  'Veja o histórico completo de compras e vendas.',
  '# Como consultar todas as transações

## Introdução
A tela de transações mostra todo o histórico de operações realizadas no sistema, permitindo consultas e reimpressões.

## Para que serve
Consultar, revisar e reimprimir transações passadas para controle e atendimento ao cliente.

## Quem deve usar
- Operadores
- Gestores
- Administradores

## Passo a passo

1. No menu lateral, clique em **Transações**
2. A lista mostra todas as transações recentes
3. Para cada transação você vê:
   - Data e hora
   - Cliente
   - Tipo (Compra ou Venda)
   - Valor total
   - Forma de pagamento
4. Use os **filtros** para refinar:
   - Por período
   - Por tipo (compra/venda)
   - Por cliente
5. Clique em uma transação para ver **detalhes**

## Informações detalhadas:
- Lista de todos os itens
- Peso e valor de cada item
- Taras aplicadas
- Descontos concedidos
- Forma de pagamento

## Boas práticas
- Revise transações diariamente
- Use para resolver dúvidas de clientes
- Identifique transações com problemas

## Conclusão
O histórico de transações é essencial para controle e atendimento ao cliente.',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'transacoes',
  'published',
  'Como consultar transações no XLata',
  'Aprenda a ver o histórico de compras e vendas no sistema XLata.',
  2,
  51
),
(
  'Como reimprimir um comprovante antigo',
  'como-reimprimir-comprovante-antigo',
  'Gere novamente o comprovante de uma transação passada.',
  '# Como reimprimir um comprovante antigo

## Introdução
Clientes podem precisar de segunda via de comprovantes. O XLata permite reimprimir qualquer transação registrada.

## Para que serve
Gerar segunda via de comprovante para clientes ou para arquivamento.

## Quem deve usar
- Operadores
- Atendentes

## Passo a passo

1. Acesse **Transações** no menu lateral
2. Localize a transação desejada (use filtros se necessário)
3. Clique na transação para abrir os detalhes
4. Clique no botão **Reimprimir** ou ícone de impressora
5. O comprovante é gerado com os mesmos dados originais
6. Escolha **Imprimir** para enviar à impressora

## O comprovante inclui:
- Dados da empresa
- Data e hora da transação
- Nome do cliente
- Lista de itens com peso e valor
- Valor total
- Forma de pagamento
- Indicação "2ª Via" (quando aplicável)

## Boas práticas
- Mantenha impressora configurada
- Informe que é segunda via se o cliente perguntar
- Use para documentação quando necessário

## Conclusão
A reimpressão de comprovantes garante que clientes sempre tenham seus registros quando precisarem.',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'transacoes',
  'published',
  'Como reimprimir comprovante no XLata',
  'Aprenda a gerar segunda via de comprovantes no sistema XLata.',
  2,
  52
),
(
  'Como consultar o fluxo de caixa diário',
  'como-consultar-fluxo-caixa-diario',
  'Veja o resumo de cada abertura e fechamento de caixa.',
  '# Como consultar o fluxo de caixa diário

## Introdução
O fluxo de caixa diário mostra um resumo de cada turno de trabalho: quanto entrou, quanto saiu e o resultado final.

## Para que serve
Acompanhar o desempenho financeiro de cada dia e identificar tendências ou problemas.

## Quem deve usar
- Gestores
- Administradores

## Passo a passo

1. No menu lateral, clique em **Fluxo de Caixa**
2. A lista mostra todos os caixas fechados
3. Para cada caixa você vê:
   - Data
   - Operador responsável
   - Valor inicial
   - Total de entradas
   - Total de saídas
   - Valor final
   - Diferença (se houver)
4. Clique em um registro para ver **detalhes**

## Informações detalhadas:
- Hora de abertura e fechamento
- Lista de todas as transações
- Despesas registradas
- Adições de saldo
- Observações do fechamento

## Boas práticas
- Revise o fluxo semanalmente
- Investigue diferenças acima de R$ 20
- Compare resultados entre operadores

## Conclusão
O fluxo de caixa diário é fundamental para gestão financeira e identificação de problemas.',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'caixa',
  'published',
  'Como consultar fluxo de caixa diário no XLata',
  'Aprenda a acompanhar o fluxo de caixa do seu depósito no XLata.',
  2,
  53
),
(
  'Como registrar despesas no caixa',
  'como-registrar-despesas-caixa',
  'Lance saídas de dinheiro como combustível, alimentação e outros gastos.',
  '# Como registrar despesas no caixa

## Introdução
Despesas são saídas de dinheiro do caixa que não são compras de materiais, como combustível, alimentação, material de escritório, etc.

## Para que serve
Registrar todas as saídas de dinheiro para manter o controle preciso do caixa.

## Quem deve usar
- Operadores
- Caixas

## Passo a passo

1. No PDV, clique no **menu de opções**
2. Selecione **Registrar Despesa**
3. Preencha o formulário:
   - **Descrição**: O que foi a despesa (ex: "Gasolina para caminhão")
   - **Valor**: Quanto foi gasto (ex: 150,00)
   - **Categoria**: Selecione se disponível (combustível, alimentação, etc.)
4. Clique em **Confirmar**
5. O valor é descontado do saldo do caixa

## Tipos comuns de despesas:
- Combustível
- Alimentação da equipe
- Material de escritório
- Pequenos reparos
- Frete
- Outras saídas

## Boas práticas
- Registre toda saída imediatamente
- Seja específico na descrição
- Guarde notas fiscais/recibos
- Evite despesas em dinheiro quando possível

## Erros comuns
- **Esquecer de registrar**: Causa diferença no fechamento
- **Descrição vaga**: "Outros" não ajuda na análise

## Conclusão
Registrar despesas mantém seu caixa controlado e facilita a análise de custos operacionais.',
  '2b8bac57-c7c9-4d80-8d8b-cce6598024b7',
  'despesas',
  'published',
  'Como registrar despesas no caixa no XLata',
  'Aprenda a lançar despesas e saídas de dinheiro no sistema XLata.',
  2,
  54
);

-- ===== ARTIGOS: GESTÃO DE FUNCIONÁRIOS (6 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como cadastrar funcionários',
  'como-cadastrar-funcionarios',
  'Crie contas para operadores e funcionários do depósito.',
  '# Como cadastrar funcionários

## Introdução
O cadastro de funcionários permite que sua equipe tenha acesso ao sistema com suas próprias credenciais e permissões.

## Para que serve
Criar contas de acesso para operadores, caixas, supervisores e outros funcionários do depósito.

## Quem deve usar
- Administradores

## Passo a passo

1. No menu lateral, clique em **Funcionários**
2. Clique no botão **Adicionar Funcionário**
3. Preencha os dados:
   - **Nome completo**
   - **Email** (será usado para login)
   - **Telefone** (opcional)
   - **Cargo**: Operador, Caixa, Supervisor ou Gerente
4. Clique em **Salvar**
5. O sistema gera uma **senha provisória**
6. Envie as credenciais ao funcionário
7. Na primeira vez, ele deve trocar a senha

## Níveis de cargo:
- **Operador**: Acesso básico ao PDV
- **Caixa**: PDV + abertura/fechamento de caixa
- **Supervisor**: Caixa + relatórios básicos
- **Gerente**: Acesso quase completo (exceto configurações avançadas)

## Boas práticas
- Use email profissional quando possível
- Defina cargo adequado às responsabilidades
- Oriente sobre troca de senha na primeira vez

## Conclusão
Funcionários cadastrados corretamente têm acesso controlado ao sistema.',
  'b1234567-0003-4000-a000-000000000003',
  'geral',
  'published',
  'Como cadastrar funcionários no XLata',
  'Aprenda a criar contas para funcionários no sistema XLata.',
  2,
  60
),
(
  'Como gerenciar permissões de funcionários',
  'como-gerenciar-permissoes-funcionarios',
  'Configure o que cada funcionário pode acessar no sistema.',
  '# Como gerenciar permissões de funcionários

## Introdução
Cada funcionário pode ter permissões personalizadas, definindo exatamente o que pode ou não acessar no sistema.

## Para que serve
Controlar o acesso de cada funcionário a funcionalidades específicas do XLata.

## Quem deve usar
- Administradores

## Passo a passo

1. Acesse **Funcionários** no menu lateral
2. Localize o funcionário desejado
3. Clique em **Ações** > **Gerenciar Permissões**
4. O modal mostra todas as permissões disponíveis
5. Marque ou desmarque cada permissão:
   - ✅ PDV (Acesso à tela de pesagem)
   - ✅ Clientes (Cadastro e edição)
   - ✅ Materiais (Cadastro e edição)
   - ✅ Transações (Visualização)
   - ✅ Relatórios (Acesso a relatórios)
   - ✅ Configurações (Configurações do sistema)
6. Clique em **Salvar**

## Permissões disponíveis:
| Permissão | Descrição |
|-----------|-----------|
| PDV | Usar o ponto de venda |
| Caixa | Abrir/fechar caixa |
| Clientes | Gerenciar clientes |
| Materiais | Gerenciar materiais |
| Transações | Ver histórico |
| Relatórios | Acessar relatórios |
| Funcionários | Gerenciar equipe |
| Configurações | Configurar sistema |

## Boas práticas
- Dê apenas permissões necessárias
- Revise permissões periodicamente
- Documente o motivo de permissões especiais

## Conclusão
Permissões bem configuradas garantem segurança e controle sobre quem acessa cada funcionalidade.',
  'b1234567-0003-4000-a000-000000000003',
  'geral',
  'published',
  'Como gerenciar permissões de funcionários no XLata',
  'Aprenda a controlar o acesso de funcionários no sistema XLata.',
  3,
  61
);

-- ===== ARTIGOS: ASSINATURAS E PLANOS (6 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como ver os planos disponíveis',
  'como-ver-planos-disponiveis',
  'Conheça as opções de assinatura do XLata.',
  '# Como ver os planos disponíveis

## Introdução
O XLata oferece diferentes planos de assinatura para atender às necessidades de cada depósito.

## Para que serve
Conhecer as opções de planos, preços e benefícios para escolher o melhor para seu negócio.

## Quem deve usar
- Todos os usuários
- Administradores decidindo sobre renovação

## Passo a passo

1. No menu lateral, clique em **Planos**
2. A tela exibe todos os planos disponíveis:
   - **Trial**: 7 dias grátis para testar
   - **Mensal**: Pagamento mês a mês
   - **Trimestral**: 3 meses com desconto
   - **Semestral**: 6 meses com desconto maior
   - **Anual**: 12 meses com melhor custo-benefício
3. Compare os benefícios de cada plano
4. Veja o preço e economia de cada opção

## Benefícios por plano:
Todos os planos incluem:
- Acesso completo ao PDV
- Cadastro ilimitado de materiais
- Cadastro ilimitado de clientes
- Relatórios e dashboard
- Suporte via WhatsApp

## Boas práticas
- Comece com o trial para testar
- Planos maiores têm melhor custo por dia
- Renove antes do vencimento para não perder acesso

## Conclusão
Compare os planos e escolha o que melhor se adapta ao volume e orçamento do seu depósito.',
  'b1234567-0004-4000-a000-000000000004',
  'assinatura',
  'published',
  'Planos disponíveis no XLata',
  'Conheça os planos de assinatura do sistema XLata para depósitos.',
  2,
  70
),
(
  'Como assinar um plano via PIX',
  'como-assinar-plano-via-pix',
  'Faça o pagamento da sua assinatura com PIX.',
  '# Como assinar um plano via PIX

## Introdução
O pagamento via PIX é a forma mais rápida de ativar ou renovar sua assinatura do XLata.

## Para que serve
Contratar ou renovar seu plano de forma instantânea usando PIX.

## Quem deve usar
- Administradores
- Responsáveis pelo pagamento

## Passo a passo

1. Acesse **Planos** no menu lateral
2. Escolha o plano desejado
3. Clique em **Assinar** ou **Contratar**
4. Preencha seus dados:
   - Nome completo
   - CPF
   - Email
   - WhatsApp
5. Clique em **Gerar PIX**
6. Um **QR Code** aparece na tela
7. Abra o app do seu banco
8. Escaneie o QR Code ou copie o código
9. Confirme o pagamento no banco
10. Aguarde a confirmação (geralmente instantânea)
11. Sua assinatura é ativada automaticamente

## Boas práticas
- Use o app do banco para escanear o QR Code
- O código expira em 30 minutos
- Guarde o comprovante do banco
- A ativação é automática após pagamento

## Erros comuns
- **PIX expirado**: Gere um novo código
- **Não ativou**: Aguarde alguns minutos e atualize a página
- **Erro no pagamento**: Entre em contato com o suporte

## Conclusão
O pagamento via PIX é instantâneo e sua assinatura é ativada automaticamente após confirmação.',
  'b1234567-0004-4000-a000-000000000004',
  'assinatura',
  'published',
  'Como assinar um plano via PIX no XLata',
  'Aprenda a pagar sua assinatura do XLata usando PIX.',
  2,
  71
),
(
  'Como verificar o status da assinatura',
  'como-verificar-status-assinatura',
  'Confira a validade e tipo do seu plano atual.',
  '# Como verificar o status da assinatura

## Introdução
É importante acompanhar o status da sua assinatura para evitar interrupções no uso do sistema.

## Para que serve
Consultar informações sobre seu plano atual: tipo, validade e status.

## Quem deve usar
- Administradores
- Gestores

## Passo a passo

1. Acesse **Configurações** no menu lateral
2. Localize a seção **Assinatura** ou **Plano Atual**
3. Veja as informações:
   - **Tipo do plano**: Mensal, Trimestral, etc.
   - **Status**: Ativo ou Expirado
   - **Data de expiração**: Quando vence
   - **Dias restantes**: Quantos dias faltam

### Indicadores visuais:
- 🟢 **Verde**: Mais de 30 dias restantes
- 🟡 **Amarelo**: Entre 7 e 30 dias restantes
- 🔴 **Vermelho**: Menos de 7 dias ou expirado

## Boas práticas
- Verifique a validade mensalmente
- Renove com antecedência
- Configure lembretes no calendário

## Conclusão
Acompanhar o status da assinatura evita surpresas e interrupções no uso do sistema.',
  'b1234567-0004-4000-a000-000000000004',
  'assinatura',
  'published',
  'Como verificar status da assinatura no XLata',
  'Aprenda a consultar a validade do seu plano no sistema XLata.',
  2,
  72
);

-- ===== ARTIGOS: SISTEMA DE INDICAÇÕES (4 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como funciona o sistema de indicações',
  'como-funciona-sistema-indicacoes',
  'Entenda como ganhar bônus indicando amigos para o XLata.',
  '# Como funciona o sistema de indicações

## Introdução
O programa de indicações permite que você ganhe dias extras de assinatura ao indicar outros depósitos para usar o XLata.

## Para que serve
Recompensar usuários que ajudam a divulgar o sistema, oferecendo dias adicionais de uso.

## Quem deve usar
- Todos os usuários com assinatura ativa

## Como funciona

1. **Você indica**: Compartilha seu link exclusivo com outros depósitos
2. **Eles se cadastram**: Quando usam seu link para criar conta
3. **Eles assinam**: Quando contratam qualquer plano pago
4. **Você ganha**: Recebe dias extras na sua assinatura

### Recompensas:
- **Cadastro**: +3 dias quando alguém se cadastra pelo seu link
- **Primeira assinatura**: +7 dias quando o indicado contrata um plano
- **Renovações**: +3 dias em cada renovação do indicado

## Boas práticas
- Compartilhe com donos de depósitos que você conhece
- Explique os benefícios do sistema
- Use grupos de WhatsApp do setor

## Conclusão
O programa de indicações beneficia todos: você ganha dias extras e seus colegas conhecem uma ferramenta útil.',
  'b1234567-0005-4000-a000-000000000005',
  'geral',
  'published',
  'Sistema de indicações do XLata',
  'Aprenda como ganhar dias extras indicando o XLata para outros depósitos.',
  2,
  80
),
(
  'Como gerar seu link de indicação',
  'como-gerar-link-indicacao',
  'Obtenha seu link exclusivo para indicar novos usuários.',
  '# Como gerar seu link de indicação

## Introdução
Cada usuário tem um link exclusivo de indicação que identifica você como origem do cadastro.

## Para que serve
Ter um link único para compartilhar e receber crédito quando indicados se cadastrarem.

## Quem deve usar
- Usuários com assinatura ativa

## Passo a passo

1. No menu lateral, clique em **Indicações**
2. Localize a seção **Seu Link de Indicação**
3. Seu link exclusivo é exibido:
   - `xlata.site/r/SEU_CODIGO`
4. Clique em **Copiar Link** para copiar
5. Compartilhe via WhatsApp, email ou redes sociais

### Opções de compartilhamento:
- 📱 **WhatsApp**: Clique no ícone para enviar diretamente
- 📧 **Email**: Copie e cole em sua mensagem
- 📋 **Copiar**: Copie para usar onde preferir

## Boas práticas
- Seu link é permanente, não muda
- Pode compartilhar quantas vezes quiser
- Funciona mesmo depois de muito tempo

## Conclusão
Com seu link exclusivo, você pode indicar quantos depósitos quiser e ganhar dias extras.',
  'b1234567-0005-4000-a000-000000000005',
  'geral',
  'published',
  'Como gerar link de indicação no XLata',
  'Aprenda a obter seu link exclusivo de indicação no XLata.',
  2,
  81
);

-- ===== ARTIGOS: AJUDA E SUPORTE (5 artigos) =====

INSERT INTO help_articles (title, slug, excerpt, content_md, category_id, module, status, seo_title, seo_description, reading_time_minutes, sort_order)
VALUES 
(
  'Como acessar o guia em vídeo',
  'como-acessar-guia-video',
  'Assista tutoriais em vídeo para aprender a usar o sistema.',
  '# Como acessar o guia em vídeo

## Introdução
O XLata oferece uma série de vídeos tutoriais que ensinam passo a passo como usar cada funcionalidade.

## Para que serve
Aprender visualmente como usar o sistema através de vídeos explicativos.

## Quem deve usar
- Novos usuários
- Usuários que querem aprofundar conhecimento
- Equipe em treinamento

## Passo a passo

1. No menu lateral, clique em **Ajuda & Guia**
2. A tela mostra os vídeos disponíveis organizados por categoria:
   - Primeiros Passos
   - Cadastros
   - PDV e Pesagem
   - Relatórios
   - Configurações
3. Clique em um vídeo para assistir
4. Os vídeos são curtos e objetivos (2-5 minutos cada)
5. Marque vídeos assistidos para acompanhar seu progresso

## Categorias de vídeos:
- **Iniciante**: Configuração inicial e conceitos básicos
- **Intermediário**: Funcionalidades do dia a dia
- **Avançado**: Relatórios e configurações avançadas

## Boas práticas
- Assista os vídeos de iniciante primeiro
- Pause e pratique no sistema
- Reveja vídeos quando tiver dúvidas

## Conclusão
Os vídeos tutoriais são a forma mais rápida de dominar o XLata e aproveitar todos os recursos.',
  'b1234567-0006-4000-a000-000000000006',
  'geral',
  'published',
  'Como acessar o guia em vídeo do XLata',
  'Aprenda a usar os tutoriais em vídeo do sistema XLata.',
  2,
  90
),
(
  'Como relatar um erro ou problema',
  'como-relatar-erro-problema',
  'Reporte bugs ou dificuldades para a equipe de suporte.',
  '# Como relatar um erro ou problema

## Introdução
Encontrou um erro ou comportamento inesperado? O XLata tem um sistema simples para você reportar problemas.

## Para que serve
Comunicar erros, bugs ou dificuldades diretamente para a equipe de desenvolvimento.

## Quem deve usar
- Qualquer usuário que encontre problemas

## Passo a passo

1. No menu lateral, clique em **Relatar Erro**
2. Preencha o formulário:
   - **Título do erro**: Resumo curto do problema
   - **Tipo**: Bug, Sugestão, Dúvida, etc.
   - **Descrição**: Explique o que aconteceu
   - **Passos para reproduzir**: Como chegar no erro
   - **Seu WhatsApp**: Para retorno (opcional)
3. Clique em **Enviar Relatório**
4. Você receberá confirmação de envio
5. A equipe analisará e poderá entrar em contato

## O que incluir no relatório:
- O que você estava fazendo
- O que esperava acontecer
- O que aconteceu de errado
- Mensagens de erro exibidas
- Navegador e dispositivo usado

## Boas práticas
- Seja específico e claro
- Inclua passos para reproduzir
- Anexe screenshots se possível

## Conclusão
Reportar erros ajuda a melhorar o sistema para todos os usuários.',
  'b1234567-0006-4000-a000-000000000006',
  'geral',
  'published',
  'Como relatar erro no XLata',
  'Aprenda a reportar problemas e bugs no sistema XLata.',
  2,
  91
),
(
  'Como entrar em contato com o suporte',
  'como-entrar-contato-suporte',
  'Fale diretamente com nossa equipe via WhatsApp.',
  '# Como entrar em contato com o suporte

## Introdução
Nossa equipe de suporte está disponível via WhatsApp para ajudar com dúvidas, problemas ou sugestões.

## Para que serve
Obter ajuda humana rápida para questões que não foram resolvidas pelos tutoriais.

## Quem deve usar
- Qualquer usuário com dúvidas ou problemas

## Passo a passo

1. Localize o **botão de WhatsApp** no canto inferior direito da tela
2. Clique no botão verde com ícone de WhatsApp
3. Você será direcionado para uma conversa
4. Envie sua mensagem explicando a situação
5. Aguarde o retorno da equipe

### Horários de atendimento:
- Segunda a sexta: 8h às 18h
- Sábados: 8h às 12h
- Fora do horário: deixe mensagem, responderemos no próximo dia útil

## O que informar no contato:
- Seu nome e email de cadastro
- Descrição clara do problema ou dúvida
- Screenshots se relevante
- Urgência da situação

## Boas práticas
- Consulte os tutoriais antes de contatar
- Seja claro e objetivo
- Tenha paciência para resposta

## Conclusão
Nossa equipe está pronta para ajudar você a usar o XLata da melhor forma.',
  'b1234567-0006-4000-a000-000000000006',
  'geral',
  'published',
  'Como contatar suporte do XLata',
  'Aprenda a falar com nossa equipe de suporte via WhatsApp.',
  2,
  92
);